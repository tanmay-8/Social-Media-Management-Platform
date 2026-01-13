import { api } from "./api";

export interface CreateOrderRequest {
    durationMonths: number;
    amount: number;
}

export interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    key: string;
}

export interface VerifyPaymentRequest {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    durationMonths: number;
}

export interface VerifyPaymentResponse {
    success: boolean;
    message: string;
    subscription?: any;
}

export interface SubscriptionStatusResponse {
    isActive: boolean;
    plan?: string;
    durationMonths?: number;
    startDate?: string;
    endDate?: string;
}

export const subscriptionService = {
    // Create Razorpay order
    async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
        return api.post<CreateOrderResponse>(
            "/api/subscriptions/create-order",
            data
        );
    },

    // Verify payment
    async verifyPayment(
        data: VerifyPaymentRequest
    ): Promise<VerifyPaymentResponse> {
        return api.post<VerifyPaymentResponse>(
            "/api/subscriptions/verify-payment",
            data
        );
    },

    // Get subscription status
    async getStatus(): Promise<SubscriptionStatusResponse> {
        const response = await api.get<any>("/api/subscriptions/status");
        return {
            isActive: response.subscription?.isActive || false,
            plan: response.subscription?.plan,
            durationMonths: response.subscription?.durationMonths,
            startDate: response.subscription?.startDate,
            endDate: response.subscription?.endDate,
        };
    },
};
