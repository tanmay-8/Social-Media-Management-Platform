import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlan, useAppStore } from '../store';

type Duration = 1 | 3 | 6 | 12;

const PLAN_PRICES: Record<Duration, number> = {
  1: 299,
  3: 699,
  6: 1199,
  12: 1999
};

declare global {
  interface Window {
    Razorpay?: new (options: any) => any;
  }
}

export const SubscriptionPage = () => {
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const user = useAppStore((s) => s.user);
  const [selected, setSelected] = useState<Duration>(subscription?.durationMonths ?? 3);
  const [isPaying, setIsPaying] = useState(false);
  const navigate = useNavigate();

  const startCheckout = async () => {
    if (!user) return;
    setIsPaying(true);
    try {
      // In production, create an order on your backend and pass order_id here.
      // This is frontend-only stub config.
      const amount = PLAN_PRICES[selected] * 100; // paise
      const options = {
        key: 'RAZORPAY_KEY_HERE', // TODO: replace with env-configured key
        amount,
        currency: 'INR',
        name: 'Social Media Automation',
        description: `${selected} month plan`,
        // order_id: 'order_DBJOWzybf0sJbb', // from backend
        prefill: {
          name: user.name,
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#22c55e'
        },
        handler: (response: unknown) => {
          console.log('Razorpay success', response);
          const plan: SubscriptionPlan = {
            durationMonths: selected,
            active: true
          };
          setSubscription(plan);
        }
      };

      if (!window.Razorpay) {
        // eslint-disable-next-line no-alert
        alert(
          'Razorpay script not loaded. Include the Razorpay checkout.js script in index.html.'
        );
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn ghost"
            style={{ paddingInline: '0.75rem' }}
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <div className="page-title">Subscription</div>
        </div>
        <p className="subtle">
          Choose a plan and pay securely with Razorpay to unlock automated
          festival creatives.
        </p>
      </div>

      <div className="two-col">
        <section className="card">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Plans</h3>
          <div className="plans-grid">
            {[1, 3, 6, 12].map((duration) => {
              const d = duration as Duration;
              return (
                <button
                  key={d}
                  type="button"
                  className={
                    'plan-card ' + (selected === d ? 'selected' : '')
                  }
                  onClick={() => setSelected(d)}
                >
                  <div className="plan-duration">
                    {d} month{d > 1 ? 's' : ''}
                  </div>
                  <div className="plan-price">
                    ₹{PLAN_PRICES[d].toLocaleString('en-IN')}
                  </div>
                  {d === 3 && <div className="badge secondary">Popular</div>}
                  {d === 12 && (
                    <div className="plan-note">Best value for agencies</div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="btn primary"
            type="button"
            onClick={startCheckout}
            disabled={isPaying || !user}
            style={{ marginTop: '1rem' }}
          >
            {isPaying ? 'Opening Razorpay…' : 'Pay with Razorpay'}
          </button>

          <p className="razorpay-note">
            This is a frontend-only integration. Connect it to your backend to
            create real Razorpay orders and verify payments.
          </p>
        </section>

        <aside className="card">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
            Current subscription
          </h3>
          {subscription ? (
            <div className="sub-status">
              <span className="badge">
                Active · {subscription.durationMonths} month
                {subscription.durationMonths > 1 ? 's' : ''}
              </span>
              <p className="small muted">
                After payment verification in your backend, you can mark
                subscriptions active and set an expiry date.
              </p>
            </div>
          ) : (
            <p className="small muted">
              No active subscription. Select a plan and complete payment to
              activate.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};


