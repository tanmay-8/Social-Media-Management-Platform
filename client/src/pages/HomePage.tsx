import { useAppStore, type AppState } from '../store';
import { Calendar, Loader2, Clock, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { festivalService } from '../services/festivalService';
import { scheduledService, type PostedPost } from '../services/scheduledService';
import { subscriptionService } from '../services/subscriptionService';
import type { Festival } from '../types';

export const HomePage = () => {
  const user = useAppStore((s: AppState) => s.user);
  const subscription = useAppStore((s: AppState) => s.subscription);
  const setSubscription = useAppStore((s: AppState & { setSubscription: (subscription: AppState['subscription']) => void }) => s.setSubscription);
  const navigate = useNavigate();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [postedPosts, setPostedPosts] = useState<PostedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  useEffect(() => {
    checkUserSetup();
  }, []);

  const checkUserSetup = async () => {
    setLoading(true);
    setError(null);
    setSetupMessage(null);

    try {
      let hasActiveSubscription = false;
      try {
        const status = await subscriptionService.getStatus();
        if (status.isActive) {
          hasActiveSubscription = true;
          setSubscription({
            plan: status.plan || 'unknown',
            active: true,
          });
        } else {
          setSubscription(null);
        }
      } catch {
        setSubscription(null);
      }

      const setupIssues: string[] = [];
      if (!user?.facebookId) {
        setupIssues.push('Connect your Facebook account to enable automatic posting.');
      }
      if (!hasActiveSubscription) {
        setupIssues.push('Purchase a subscription to enable automatic posting.');
      }
      if (setupIssues.length > 0) {
        setSetupMessage(setupIssues.join(' '));
      }

      await fetchData();
    } catch (setupError) {
      const message = setupError instanceof Error ? setupError.message : 'Failed to load';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const [festivalsData, postedPostsData] = await Promise.all([
      festivalService.getAllFestivals(),
      scheduledService.getPostedPosts(),
    ]);

    setFestivals(festivalsData.festivals || []);
    setPostedPosts(postedPostsData.posts || []);
  };

  const handleDownloadPostedImage = async (post: PostedPost) => {
    if (!post.imageUrl) return;

    setDownloadingPostId(post._id);

    try {
      const response = await fetch(post.imageUrl);
      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeFestivalName = (post.festival?.name || 'posted-image')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      link.href = objectUrl;
      link.download = `${safeFestivalName || 'posted-image'}-${post._id}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(post.imageUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingPostId(null);
    }
  };

  const upcomingFestivals = festivals
    .filter((festival: Festival) => {
      if (!festival?.date) return false;
      const festivalDate = new Date(festival.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      festivalDate.setHours(0, 0, 0, 0);
      return festivalDate >= today;
    })
    .sort((a: Festival, b: Festival) => {
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
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {setupMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Setup Required</p>
            <p className="mt-1 text-sm text-amber-800">{setupMessage}</p>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between animate-in fade-in slide-in-from-top duration-500">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#003049] md:text-4xl">Festival Automation</h1>
          <p className="text-base leading-relaxed text-[#669bbc]">Upcoming festivals are listed below. Click any card to choose base image.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#669bbc] to-[#003049] text-white shadow-md">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Upcoming Festivals</h3>
              <p className="m-0 text-xs text-gray-500">{upcomingFestivals.length} upcoming</p>
            </div>
          </div>

          {upcomingFestivals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No upcoming festivals</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcomingFestivals.map((festival) => {
                const daysUntil = festival?.date
                  ? Math.max(0, Math.ceil((new Date(festival.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : 0;
                const isToday = daysUntil === 0;
                const previewImage = festival.baseImage?.url || festival.baseImages?.[0]?.url;

                return (
                  <article
                    key={festival._id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-r from-white to-gray-50 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/festival/${festival._id}`)}
                      className="w-full text-left"
                    >
                      {previewImage ? (
                        <img src={previewImage} alt={festival.name} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                      )}

                      <div className="p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="text-lg font-semibold text-[#003049] line-clamp-1">{festival.name}</h4>
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${isToday ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isToday ? 'Today' : `${daysUntil} days`}
                          </span>
                        </div>

                        <p className="text-xs text-[#669bbc]">
                          {festival.date
                            ? new Date(festival.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Date TBD'}
                        </p>

                        {festival.description && (
                          <p className="mt-2 text-sm text-[#7f7270] line-clamp-2">{festival.description}</p>
                        )}

                        <div className="mt-3 inline-flex items-center rounded-lg bg-[#003049] px-3 py-1.5 text-xs font-medium text-white">
                          Select Base Image
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#003049] to-[#669bbc] text-white shadow-md">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Posted Posts</h3>
              <p className="m-0 text-xs text-gray-500">{postedPosts.length} posted for this account</p>
            </div>
          </div>

          <div className="space-y-4 max-h-128 overflow-y-auto pr-1">
            {postedPosts.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                <p className="text-sm">No posted images yet</p>
              </div>
            ) : (
              postedPosts.map((post) => {
                const postedDate = post.postedAt || post.scheduledAt || post.createdAt;
                const postedPlatforms = [
                  post.platforms?.facebook?.status === 'posted' ? 'Facebook' : null,
                  post.platforms?.instagram?.status === 'posted' ? 'Instagram' : null,
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <article
                    key={post._id}
                    className="grid gap-4 rounded-2xl border border-gray-200 bg-linear-to-r from-white to-gray-50 p-4 md:grid-cols-[160px_1fr_auto] md:items-center"
                  >
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm">
                      <img src={post.imageUrl} alt={post.festival?.name || 'Posted festival'} className="h-40 w-full object-cover md:h-28" />
                    </div>

                    <div className="min-w-0 space-y-2">
                      <h4 className="truncate text-lg font-semibold text-[#003049]">{post.festival?.name || 'Posted festival image'}</h4>
                      <p className="text-sm text-[#669bbc]">
                        Posted on{' '}
                        {new Date(postedDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {post.festival?.date && (
                        <p className="text-xs text-gray-500">
                          Festival date:{' '}
                          {new Date(post.festival.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                      {postedPlatforms && <p className="text-xs font-medium text-green-700">Published on {postedPlatforms}</p>}
                    </div>

                    <div className="flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => handleDownloadPostedImage(post)}
                        disabled={downloadingPostId === post._id}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#003049] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#00243a] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {downloadingPostId === post._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download Image
                      </button>
                    </div>
                  </article>
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
          <p className="text-sm text-yellow-800 mb-4">Connect your Facebook account to enable automatic festival posting</p>
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
          <p className="text-sm text-orange-800 mb-4">Purchase a subscription to unlock automatic festival posting and all premium features</p>
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
