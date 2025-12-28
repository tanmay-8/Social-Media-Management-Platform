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

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-[rgba(0,48,73,0.18)] bg-[#fffaf0] p-6 shadow-[0_14px_40px_rgba(0,48,73,0.14)]">
          <h3 className="mb-2 mt-0 text-[#003049]">Plans</h3>
          <div className="mt-3 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[1, 3, 6, 12].map((duration) => {
              const d = duration as Duration;
              return (
                <button
                  key={d}
                  type="button"
                  className={
                    'flex cursor-pointer flex-col gap-1 rounded-2xl border bg-[#fffaf0] px-3.5 py-3.5 transition-all ' +
                    (selected === d 
                      ? 'border-[#c1121f] shadow-[0_14px_38px_rgba(193,18,31,0.25)]' 
                      : 'border-[rgba(0,48,73,0.25)] hover:border-[rgba(0,48,73,0.4)]')
                  }
                  onClick={() => setSelected(d)}
                >
                  <div className="font-semibold text-[#003049]">
                    {d} month{d > 1 ? 's' : ''}
                  </div>
                  <div className="text-[0.9rem] text-[#003049]">
                    ₹{PLAN_PRICES[d].toLocaleString('en-IN')}
                  </div>
                  {d === 3 && <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(193,18,31,0.13)] px-2.5 py-1 text-xs text-[#780000]">Popular</div>}
                  {d === 12 && (
                    <div className="text-xs text-[#7f7270]">Best value for agencies</div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="mt-4 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-gradient-to-br from-[#780000] to-[#c1121f] px-4 py-2.5 text-[0.9rem] text-[#fdf0d5] shadow-[0_14px_35px_rgba(120,0,0,0.45)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(120,0,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-[0_14px_35px_rgba(120,0,0,0.45)]"
            type="button"
            onClick={startCheckout}
            disabled={isPaying || !user}
          >
            {isPaying ? 'Opening Razorpay…' : 'Pay with Razorpay'}
          </button>

          <p className="mt-2 text-xs text-[#7f7270]">
            This is a frontend-only integration. Connect it to your backend to
            create real Razorpay orders and verify payments.
          </p>
        </section>

        <aside className="rounded-2xl border border-[rgba(0,48,73,0.18)] bg-[#fffaf0] p-6 shadow-[0_14px_40px_rgba(0,48,73,0.14)]">
          <h3 className="mb-2 mt-0 text-[#003049]">
            Current subscription
          </h3>
          {subscription ? (
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[rgba(102,155,188,0.2)] px-2.5 py-1 text-xs text-[#003049]">
                Active · {subscription.durationMonths} month
                {subscription.durationMonths > 1 ? 's' : ''}
              </span>
              <p className="text-[0.8rem] text-[#7f7270]">
                After payment verification in your backend, you can mark
                subscriptions active and set an expiry date.
              </p>
            </div>
          ) : (
            <p className="text-[0.8rem] text-[#7f7270]">
              No active subscription. Select a plan and complete payment to
              activate.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};


