import { useAppStore } from '../store';
import { ImageIcon, Calendar, Loader2, CheckCircle, Clock, AlertCircle, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduledService } from '../services/scheduledService';
import { festivalService } from '../services/festivalService';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';

export const HomePage = () => {
  const user = useAppStore((s) => s.user);
  const subscription = useAppStore((s) => s.subscription);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const navigate = useNavigate();
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

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
        if (status.subscription.isActive) {
          hasActiveSubscription = true;
          setSubscription({
            durationMonths: status.durationMonths || 12,
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
        scheduledService.getScheduledPosts(),
        festivalService.getAllFestivals()
      ]);
      
      setScheduledPosts(postsData.posts || []);
      setFestivals(festivalsData.festivals || []);
      
      // Auto-posting is just a local toggle for now
      // In production, this would be stored in user profile
      setAutoPostEnabled(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  };

  const handleToggleAutoPost = async () => {
    setToggleLoading(true);
    try {
      // TODO: Update this to save to backend when autoPostEnabled is added to user model
      // await userService.updateProfile({ autoPostEnabled: !autoPostEnabled });
      
      // For now, just toggle local state
      setAutoPostEnabled(!autoPostEnabled);
      
      // Show success message
      setTimeout(() => {
        // Success feedback handled by state change
      }, 300);
    } catch (error) {
      console.error('Failed to toggle auto post:', error);
      setError('Failed to update auto-posting setting');
      setTimeout(() => setError(null), 3000);
    } finally {
      setToggleLoading(false);
    }
  };

  const postedFestivals = scheduledPosts.filter(post => post?.status === 'completed' || post?.postedAt);
  const upcomingFestivals = festivals.filter(festival => {
    if (!festival?.date) return false;
    const festivalDate = new Date(festival.date);
    const today = new Date();
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
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                >
                  {post?.composedImageUrl && (
                    <img
                      src={post.composedImageUrl}
                      alt="Posted"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#003049] m-0">
                      {post?.festival?.name || 'Festival'}
                    </p>
                    <p className="text-xs text-green-600 m-0">
                      Posted {post?.postedAt || post?.scheduledAt ? new Date(post.postedAt || post.scheduledAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
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



