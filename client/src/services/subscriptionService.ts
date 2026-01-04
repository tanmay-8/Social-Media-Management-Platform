import { api } from './api';

export interface SubscriptionOrder {
  plan: '3months' | '6months' | '12months';
}

export interface VerifyPayment {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const subscriptionService = {
  // Create Razorpay order
  async createOrder(plan: '3months' | '6months' | '12months') {
    return api.post<{ orderId: string; amount: number; currency: string; key: string }>(
      '/api/subscriptions/create-order',
      { plan }
    );
  },

  // Verify payment
  async verifyPayment(data: VerifyPayment) {
    return api.post('/api/subscriptions/verify-payment', data);
  },

  // Get subscription status
  async getStatus() {
    return api.get('/api/subscriptions/status');
  },
};
