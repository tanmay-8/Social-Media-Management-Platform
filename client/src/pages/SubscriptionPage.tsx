import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlan, useAppStore } from '../store';
import { subscriptionService } from '../services/subscriptionService';
import { CheckCircle, Sparkles } from 'lucide-react';

// Single plan pricing
const PLAN_PRICE = 1999;
const PLAN_DURATION = 12;

declare global {
  interface Window {
    Razorpay?: new (options: any) => any;
  }
}

export const SubscriptionPage = () => {
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const user = useAppStore((s) => s.user);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const navigate = useNavigate();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const status = await subscriptionService.getStatus();
      if (status.isActive) {
        const plan: SubscriptionPlan = {
          durationMonths: status.durationMonths || 3,
          active: true
        };
        setSubscription(plan);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const startCheckout = async () => {
    if (!user) return;
    setIsPaying(true);
    setError(null);
    
    try {
      // Create order on backend
      const orderData = await subscriptionService.createOrder({
        durationMonths: PLAN_DURATION,
        amount: PLAN_PRICE * 100 // Convert to paise
      });

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Social Media Automation',
        description: `Annual Subscription - ${PLAN_DURATION} months`,
        order_id: orderData.orderId,
        prefill: {
          name: user.name,
          email: user.email,
          contact: '9999999999'
        },
        theme: {
          color: '#c1121f'
        },
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const result = await subscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              durationMonths: PLAN_DURATION
            });

            if (result.success) {
              const plan: SubscriptionPlan = {
                durationMonths: PLAN_DURATION,
                active: true
              };
              setSubscription(plan);
              setError(null);
              // Navigate to home after successful payment
              setTimeout(() => {
                navigate('/');
              }, 1500);
            } else {
              setError(result.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            const message = error instanceof Error ? error.message : 'Payment verification failed. Please contact support.';
            setError(message);
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          }
        }
      };

      if (!window.Razorpay) {
        setError('Razorpay script not loaded. Please refresh the page.');
        setIsPaying(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Failed to create order:', error);
      const message = error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.';
      setError(message);
      setIsPaying(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[rgba(0,48,73,0.25)] bg-[#fdf0d5] px-3 py-2.5 text-[0.9rem] text-[#003049] transition-all duration-150 hover:border-[#669bbc] hover:bg-[#fffaf0]"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <div className="text-[1.3rem] font-semibold text-[#003049]">Subscription</div>
        </div>
        <p className="text-[0.85rem] text-[#7f7270]">
          Choose a plan and pay securely with Razorpay to unlock automated
          festival creatives.
        </p>
      </div>

      <div className="flex w-full justify-center">
        {error && (
          <div className="mb-4 w-full max-w-4xl rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-sm">✕</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full justify-center">
        <div className="w-full max-w-4xl grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Plan Card */}
          <section className="rounded-3xl border-2 border-[#c1121f] bg-gradient-to-br from-[#fffaf0] to-white p-8 shadow-[0_20px_50px_rgba(193,18,31,0.15)] relative overflow-hidden">
            {loadingStatus ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#669bbc] border-t-transparent"></div>
                <span className="ml-3 text-[#003049]">Checking subscription...</span>
              </div>
            ) : (
              <>
                <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#c1121f] to-[#780000] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  ANNUAL PLAN
                </div>

                <div className="mt-8 mb-6">
                  <h2 className="text-3xl font-bold text-[#003049] mb-2">
                    Festival Automation Pro
                  </h2>
                  <p className="text-[#7f7270] text-sm">
                    Everything you need for automated festival marketing
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-[#c1121f]">₹{PLAN_PRICE.toLocaleString('en-IN')}</span>
                    <span className="text-[#7f7270]">/ year</span>
                  </div>
                  <p className="text-sm text-[#669bbc] mt-2">
                    Just ₹{Math.round(PLAN_PRICE / 12).toLocaleString('en-IN')}/month
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    'Automatic festival post generation',
                    'AI-powered image composition',
                    'Facebook & Instagram integration',
                    'Schedule unlimited posts',
                    'Party logo customization',
                    'Priority support',
                    'All future updates included'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[#003049] text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-r from-[#780000] via-[#c1121f] to-[#780000] px-6 py-4 text-base font-bold text-[#fdf0d5] shadow-[0_14px_35px_rgba(120,0,0,0.45)] transition-all duration-150 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(120,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  type="button"
                  onClick={startCheckout}
                  disabled={isPaying || !user || subscription?.active}
                >
                  {isPaying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#fdf0d5] border-t-transparent"></div>
                      Processing Payment...
                    </>
                  ) : subscription?.active ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Subscription Active
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>

                <p className="mt-4 text-center text-xs text-[#7f7270]">
                  🔒 Secure payment powered by Razorpay
                </p>
              </>
            )}
          </section>

          {/* Status Card */}
          <aside className="rounded-3xl border border-[rgba(0,48,73,0.18)] bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-[#003049]">
              Subscription Status
            </h3>
            {subscription?.active ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-green-50 border-2 border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Active</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your annual subscription is active
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7f7270]">Plan</span>
                    <span className="font-semibold text-[#003049]">Annual Pro</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7f7270]">Duration</span>
                    <span className="font-semibold text-[#003049]">{subscription.durationMonths} months</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-[#7f7270]">
                    Your subscription will automatically renew. You can manage your billing in settings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-yellow-50 border-2 border-yellow-200 p-4">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    No Active Subscription
                  </p>
                  <p className="text-xs text-yellow-700">
                    Subscribe now to unlock automatic festival posting and all premium features.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-semibold text-[#003049]">What you'll get:</h4>
                  <ul className="space-y-2 text-xs text-[#7f7270]">
                    <li>• Unlimited automated posts</li>
                    <li>• All festivals covered</li>
                    <li>• Custom branding</li>
                    <li>• 24/7 support</li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};


