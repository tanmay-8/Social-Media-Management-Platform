const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Initialize Razorpay (only if credentials are provided)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// Plan durations in months
const PLAN_DURATIONS = {
    '3months': 3,
    '6months': 6,
    '12months': 12
};

// Plan prices (in INR) - Update these with your actual prices
const PLAN_PRICES = {
    '3months': 99900,  // ₹999.00 (in paise)
    '6months': 179900, // ₹1799.00
    '12months': 299900 // ₹2999.00
};

// @route   POST /api/subscriptions/create-order
// @desc    Create Razorpay order for subscription
// @access  Private
router.post('/create-order', auth, async (req, res) => {
    try {
        if (!razorpay) {
            console.error('❌ Razorpay not configured - missing credentials');
            return res.status(503).json({ message: 'Payment gateway not configured. Please contact administrator.' });
        }

        const { durationMonths, amount } = req.body;

        if (!durationMonths || !amount) {
            console.error('❌ Missing required fields:', { durationMonths, amount });
            return res.status(400).json({ message: 'Duration and amount are required' });
        }

        console.log('📝 Creating Razorpay order:', { 
            userId: req.user._id, 
            durationMonths, 
            amount: `₹${amount / 100}` 
        });

        // Amount should already be in paise from frontend
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `receipt_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                durationMonths: durationMonths
            }
        };

        const order = await razorpay.orders.create(options);
        console.log('✅ Razorpay order created:', order.id);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('❌ Create order error:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});

// @route   POST /api/subscriptions/verify-payment
// @desc    Verify Razorpay payment and activate subscription
// @access  Private
router.post('/verify-payment', auth, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, durationMonths } = req.body;

        console.log('🔍 Verifying payment:', { 
            orderId: razorpay_order_id, 
            paymentId: razorpay_payment_id,
            userId: req.user._id 
        });

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !durationMonths) {
            console.error('❌ Missing payment details:', { 
                hasOrderId: !!razorpay_order_id,
                hasPaymentId: !!razorpay_payment_id,
                hasSignature: !!razorpay_signature,
                hasDuration: !!durationMonths
            });
            return res.status(400).json({ 
                success: false,
                message: 'Missing payment details' 
            });
        }

        // Verify payment signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('❌ Invalid payment signature');
            return res.status(400).json({ 
                success: false,
                message: 'Invalid payment signature' 
            });
        }

        console.log('✅ Payment signature verified');

        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

        // Determine plan based on duration
        let plan = '12months';
        if (durationMonths === 3) plan = '3months';
        else if (durationMonths === 6) plan = '6months';

        console.log('📅 Subscription dates:', { 
            plan, 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
        });

        // Update user subscription
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'subscription.plan': plan,
                    'subscription.startDate': startDate,
                    'subscription.endDate': endDate,
                    'subscription.razorpayOrderId': razorpay_order_id,
                    'subscription.razorpayPaymentId': razorpay_payment_id,
                    'subscription.razorpaySignature': razorpay_signature,
                    'subscription.isActive': true,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        console.log('✅ User subscription updated');

        // Create scheduled posts for festivals within subscription period matching user's category
        try {
            const Festival = require('../models/Festival');
            const ScheduledPost = require('../models/ScheduledPost');

            const userCategory = user.profile?.festivalCategory || 'all';
            console.log('🎉 Creating scheduled posts for category:', userCategory);
            
            const festivals = await Festival.find({
                date: { $gte: startDate, $lte: endDate },
                ...(userCategory !== 'all' ? { category: userCategory } : {})
            });

            console.log(`📅 Found ${festivals.length} festivals in subscription period`);

            const scheduledDocs = festivals.map(f => ({
                user: user._id,
                festival: f._id,
                scheduledAt: f.date,
                status: 'pending'
            }));

            if (scheduledDocs.length) {
                await ScheduledPost.insertMany(scheduledDocs);
                console.log(`✅ Created ${scheduledDocs.length} scheduled posts`);
            }
        } catch (err) {
            console.error('⚠️ Error creating scheduled posts after subscription:', err);
        }

        res.json({
            success: true,
            message: 'Subscription activated successfully',
            subscription: user.subscription
        });
    } catch (error) {
        console.error('❌ Verify payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error verifying payment' 
        });
    }
});

// @route   GET /api/subscriptions/status
// @desc    Get user subscription status
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('subscription');
        
        // Check if subscription is still active
        if (user.subscription.isActive && user.subscription.endDate) {
            const now = new Date();
            if (now > user.subscription.endDate) {
                // Subscription expired
                user.subscription.isActive = false;
                await user.save();
            }
        }

        // Calculate duration in months from plan
        let durationMonths = 0;
        if (user.subscription.plan && PLAN_DURATIONS[user.subscription.plan]) {
            durationMonths = PLAN_DURATIONS[user.subscription.plan];
        }

        res.json({
            subscription: {
                ...user.subscription.toObject(),
                durationMonths // Add calculated durationMonths field
            },
            plans: {
                '3months': { price: PLAN_PRICES['3months'] / 100, duration: PLAN_DURATIONS['3months'] },
                '6months': { price: PLAN_PRICES['6months'] / 100, duration: PLAN_DURATIONS['6months'] },
                '12months': { price: PLAN_PRICES['12months'] / 100, duration: PLAN_DURATIONS['12months'] }
            }
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

