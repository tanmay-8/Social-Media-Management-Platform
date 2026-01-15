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
      const [postsData, festivalsData] = await Promise.all([
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
            <p className="text-sm font-medium text-red-800">Setup Required</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            {!user?.facebookId && (
              <p className="text-xs text-red-600 mt-2">Redirecting to profile page...</p>
            )}
            {user?.facebookId && !subscription?.active && (
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
        
        {user?.facebookId && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-[rgba(0,48,73,0.15)] bg-white p-4 shadow-sm">
            <div className="text-right">
              <p className="text-xs text-[#7f7270]">Auto-Posting</p>
              <p className="text-sm font-semibold text-[#003049]">
                {autoPostEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <button
              onClick={handleToggleAutoPost}
              disabled={toggleLoading}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#669bbc] focus:ring-offset-2 disabled:opacity-50 ${
                autoPostEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                  autoPostEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              >
                {toggleLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#669bbc] m-auto mt-1" />
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
        {/* Upcoming Festivals */}
        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
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

        {/* Posted Festivals */}
        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Posted Festivals</h3>
              <p className="m-0 text-xs text-gray-500">{postedFestivals.length} completed</p>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {postedFestivals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No festivals posted yet</p>
                <p className="text-xs mt-1">Enable auto-posting to start</p>
              </div>
            ) : (
              postedFestivals.map((post) => (
                <div
                  key={post?._id || Math.random()}
                  className="flex items-center gap-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-white p-3"
            )}
          </div>
        </section>
      </div>

      {!user?.facebookId && (
        </div>
      )}
    </div>
  );
};



