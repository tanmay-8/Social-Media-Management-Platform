import { useAppStore } from '../store';
import { Calendar, Loader2, Clock, AlertCircle, Send } from 'lucide-react';
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
  const [postingId, setPostingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const handlePostNow = async (festivalId: string, festivalName: string) => {
    if (!window.confirm(`Post "${festivalName}" to Facebook now?`)) {
      return;
    }

    setPostingId(festivalId);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await festivalService.postNow(festivalId);
      setSuccessMessage(`✓ Posted "${result.festivalName}" successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Post now failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to post';
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setPostingId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col">
      {successMessage && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 flex-shrink-0 mt-0.5">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

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
      )}iv className="flex min-h-[calc(100vh-120px)] items-center justify-center">
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
            <p className="text-sm font-medium text-red-800">Setup Required</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            ) : (
              upcomingFestivals.map((festival) => {
                const isPosting = postingId === festival?._id;
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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        isToday ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isToday ? 'Today' : `${daysUntil} days`}
                      </span>
                    )}
                    <button
                      onClick={() => handlePostNow(festival?._id, festival?.name)}
                      disabled={isPosting || !user?.facebookId || !subscription?.active}
                      className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#669bbc] to-[#003049] px-3 py-2 text-xs font-medium text-white transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title={!user?.facebookId ? 'Connect Facebook first' : !subscription?.active ? 'Subscription required' : 'Post now to Facebook'}
                    >
                      {isPosting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          <span>Post Now</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}<p className="m-0 text-xs text-gray-500">{upcomingFestivals.length} scheduled</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {upcomingFestivals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming festivals</p>
              </div>
            ) : (
              upcomingFestivals.map((festival) => (
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
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {Math.max(0, Math.ceil((new Date(festival.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </span>
                  )}
                </div>
              ))
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



