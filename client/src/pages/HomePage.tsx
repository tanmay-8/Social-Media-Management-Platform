import { useAppStore } from '../store';
import { Calendar, Loader2, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { festivalService } from '../services/festivalService';
import { subscriptionService } from '../services/subscriptionService';

export const HomePage = () => {
  const user = useAppStore((s) => s.user);
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const navigate = useNavigate();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserSetup();
  }, []);

  const checkUserSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, fetch subscription status from backend
      let hasActiveSubscription = false;
      try {
        const status = await subscriptionService.getStatus();
        console.log('Subscription status:', status);
        if (status.isActive) {
          hasActiveSubscription = true;
          setSubscription({
            plan: status.plan || 'unknown',
            active: true
          });
        } else {
          setSubscription(null);
        }
      } catch (subError) {
        console.error('Failed to fetch subscription:', subError);
        setSubscription(null);
      }

      // Check if user has Facebook connected
      if (!user?.facebookId) {
        setError('Please connect your Facebook account to use automatic posting.');
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
        return;
      }

      // Check if user has active subscription
      if (!hasActiveSubscription) {
        setError('Please purchase a subscription to enable automatic posting.');
        setTimeout(() => {
          navigate('/subscription');
        }, 3000);
        return;
      }

      // Fetch data
      await fetchData();
    } catch (error) {
      console.error('Setup check failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to load';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const festivalsData = await festivalService.getAllFestivals();
      setFestivals(festivalsData.festivals || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  };

  const upcomingFestivals = festivals.filter(festival => {
    if (!festival?.date) return false;
    const festivalDate = new Date(festival.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    festivalDate.setHours(0, 0, 0, 0);
    return festivalDate >= today;
  }).sort((a, b) => {
    if (!a?.date || !b?.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#669bbc] mx-auto mb-4" />
          <p className="text-[#003049]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {error.includes('connect') || error.includes('subscription') ? 'Setup Required' : 'Error'}
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            {!user?.facebookId && error.includes('connect') && (
              <p className="text-xs text-red-600 mt-2">Redirecting to profile page...</p>
            )}
            {user?.facebookId && !subscription?.active && error.includes('subscription') && (
              <p className="text-xs text-red-600 mt-2">Redirecting to subscription page...</p>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#003049] md:text-4xl">
            Festival Automation
          </h1>
          <p className="text-base leading-relaxed text-[#669bbc]">
            Automatically post festival greetings to your Facebook page
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Next Festival - Prominent Section */}
        {upcomingFestivals.length > 0 && upcomingFestivals[0] && (
          <section className="rounded-3xl border-2 border-[#669bbc] bg-gradient-to-br from-white via-[#fffaf0] to-[#fdf0d5] p-8 shadow-2xl animate-in fade-in slide-in-from-top duration-700">
            <div className="flex items-start gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#669bbc] to-[#003049] text-white shadow-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#003049] mb-1">Next Festival</h2>
                <p className="text-sm text-[#669bbc]">
                  {upcomingFestivals[0].date && (() => {
                    const festivalDate = new Date(upcomingFestivals[0].date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    festivalDate.setHours(0, 0, 0, 0);
                    const daysUntil = Math.max(0, Math.ceil((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                    return daysUntil === 0 ? 'Happening Today' : `In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
                  })()}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-[auto_1fr] gap-6">
              {/* Festival Image */}
              {upcomingFestivals[0].baseImage?.url && (
                <div className="flex justify-center md:justify-start">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#669bbc] to-[#003049] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <img
                      src={upcomingFestivals[0].baseImage.url}
                      alt={upcomingFestivals[0].name || 'Festival'}
                      className="relative h-48 w-48 rounded-2xl object-cover shadow-xl"
                    />
                  </div>
                </div>
              )}

              {/* Festival Details */}
              <div className="flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-[#003049] tracking-tight">
                    {upcomingFestivals[0].name || 'Untitled Festival'}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[#669bbc]">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {upcomingFestivals[0].date ? new Date(upcomingFestivals[0].date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Date TBD'}
                    </span>
                  </div>

                  {upcomingFestivals[0].description && (
                    <p className="text-sm text-[#7f7270] leading-relaxed">
                      {upcomingFestivals[0].description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {user?.facebookId && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-blue-700 border border-blue-200">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                      </span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Upcoming Festivals */}
        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#669bbc] to-[#003049] text-white shadow-md">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Upcoming Festivals</h3>
              <p className="m-0 text-xs text-gray-500">{upcomingFestivals.length} scheduled</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingFestivals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming festivals</p>
              </div>
            ) : (
              upcomingFestivals.map((festival) => {
                const daysUntil = festival?.date ? Math.max(0, Math.ceil((new Date(festival.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                const isToday = daysUntil === 0;
                
                return (
                  <div
                    key={festival?._id || Math.random()}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-3 transition-all hover:shadow-md"
                  >
                    {festival?.baseImage?.url && (
                      <img
                        src={festival.baseImage.url}
                        alt={festival?.name || 'Festival'}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#003049] m-0">{festival?.name || 'Untitled Festival'}</p>
                      <p className="text-xs text-[#669bbc] m-0">
                        {festival?.date ? new Date(festival.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Date TBD'}
                      </p>
                    </div>
                    {festival?.date && (
                      <span className={`rounded-full px-2 py-1 text-xs font-mediu${
                        isToday ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isToday ? 'Today' : `${daysUntil} days`}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {!user?.facebookId && (
        <div className="mt-6 rounded-xl bg-yellow-50 border-2 border-yellow-200 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-yellow-900 mb-2">Facebook Connection Required</h3>
          <p className="text-sm text-yellow-800 mb-4">
            Connect your Facebook account to enable automatic festival posting
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-2 text-white font-medium transition-all hover:bg-yellow-700"
          >
            Go to Profile
          </button>
        </div>
      )}

      {user?.facebookId && !subscription?.active && (
        <div className="mt-6 rounded-xl bg-orange-50 border-2 border-orange-200 p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-orange-900 mb-2">Subscription Required</h3>
          <p className="text-sm text-orange-800 mb-4">
            Purchase a subscription to unlock automatic festival posting and all premium features
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2 text-white font-medium transition-all hover:bg-orange-700"
          >
            View Subscription Plans
          </button>
        </div>
      )}
    </div>
  );
};
