import { useAppStore, type AppState } from '../store';
import { Calendar, Loader2, Clock, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { festivalService } from '../services/festivalService';
import { scheduledService, type PostedPost } from '../services/scheduledService';
import { subscriptionService } from '../services/subscriptionService';
import { composeService } from '../services/composeService';
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
  const [selectedFestivalId, setSelectedFestivalId] = useState<string>('');
  const [selectedFestivalDate, setSelectedFestivalDate] = useState<string>('');
  const [selectedBaseImageId, setSelectedBaseImageId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    checkUserSetup();
  }, []);

  const checkUserSetup = async () => {
    setLoading(true);
    setError(null);
    setSetupMessage(null);

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
      const [festivalsData, postedPostsData] = await Promise.all([
        festivalService.getAllFestivals(),
        scheduledService.getPostedPosts(),
      ]);

      setFestivals(festivalsData.festivals || []);
      setPostedPosts(postedPostsData.posts || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
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
    } catch (downloadError) {
      console.error('Failed to download posted image:', downloadError);
      window.open(post.imageUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloadingPostId(null);
    }
  };

  const upcomingFestivals = festivals.filter((festival: Festival) => {
    if (!festival?.date) return false;
    const festivalDate = new Date(festival.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    festivalDate.setHours(0, 0, 0, 0);
    return festivalDate >= today;
  }).sort((a: Festival, b: Festival) => {
    if (!a?.date || !b?.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const selectedFestival = festivals.find((festival: Festival) => festival._id === selectedFestivalId) || null;
  const selectedFestivalDates = selectedFestival?.yearDates?.length
    ? selectedFestival.yearDates
    : selectedFestival?.date
      ? [{ year: selectedFestival.year || new Date(selectedFestival.date).getFullYear(), date: selectedFestival.date }]
      : [];

  const selectedFestivalImages = selectedFestival?.baseImages?.length
    ? selectedFestival.baseImages
    : selectedFestival?.baseImage?.url
      ? [{ _id: selectedFestival.defaultBaseImageId, url: selectedFestival.baseImage.url, public_id: selectedFestival.baseImage.public_id }]
      : [];

  const resolvedImagePreview = selectedFestivalImages.find((image: { _id?: string; url: string; public_id: string }) => String(image._id || '') === selectedBaseImageId)
    || selectedFestivalImages.find((image: { _id?: string; url: string; public_id: string }) => String(image._id || '') === String(selectedFestival?.defaultBaseImageId || ''))
    || selectedFestivalImages[0]
    || null;

  const handleFestivalChange = (festivalId: string) => {
    setSelectedFestivalId(festivalId);
    setActionMessage(null);
    const festival = festivals.find((f: Festival) => f._id === festivalId);
    if (!festival) {
      setSelectedFestivalDate('');
      setSelectedBaseImageId('');
      return;
    }

    const firstDate = festival.yearDates?.[0]?.date || festival.date || '';
    setSelectedFestivalDate(firstDate);

    const defaultImageId = String(festival.defaultBaseImageId || '');
    if (defaultImageId) {
      setSelectedBaseImageId(defaultImageId);
    } else {
      const firstImage = festival.baseImages?.[0]?._id;
      setSelectedBaseImageId(firstImage ? String(firstImage) : '');
    }
  };

  const handlePostNow = async () => {
    if (!selectedFestivalId) {
      setError('Please select a festival first');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionMessage(null);

    try {
      await composeService.postNow({
        festivalId: selectedFestivalId,
        selectedBaseImageId: selectedBaseImageId || undefined,
      });

      setActionMessage('Festival posted successfully');
      await fetchData();
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : 'Failed to post now';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedFestivalId) {
      setError('Please select a festival first');
      return;
    }

    setActionLoading(true);
    setError(null);
    setActionMessage(null);

    try {
      const schedulePayload = {
        festivalId: selectedFestivalId,
        festivalDate: selectedFestivalDate || undefined,
        selectedBaseImageId: selectedBaseImageId || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        message: '',
      };

      await scheduledService.createScheduledPost(schedulePayload);
      setActionMessage('Post scheduled successfully');
      setScheduledAt('');
    } catch (scheduleError) {
      const message = scheduleError instanceof Error ? scheduleError.message : 'Failed to schedule post';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

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
              Error
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {setupMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">Setup Required</p>
            <p className="mt-1 text-sm text-amber-800">{setupMessage}</p>
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
        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c1121f] to-[#780000] text-white shadow-md">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Manual Compose And Post</h3>
              <p className="m-0 text-xs text-gray-500">Select festival, date, and base image</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#003049]">Festival</label>
              <select
                value={selectedFestivalId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFestivalChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/30"
              >
                <option value="">Select festival</option>
                {festivals.map((festival) => (
                  <option key={festival._id} value={festival._id}>
                    {festival.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003049]">Festival Date</label>
              <select
                value={selectedFestivalDate}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedFestivalDate(e.target.value)}
                disabled={!selectedFestival}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/30 disabled:bg-gray-100"
              >
                <option value="">Select date</option>
                {selectedFestivalDates.map((entry) => (
                  <option key={`${entry.year}-${entry.date}`} value={entry.date}>
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#003049]">Base Image (optional)</label>
              {selectedFestivalImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {selectedFestivalImages.map((image) => {
                    const imageId = String(image._id || '');
                    const isSelected = selectedBaseImageId === imageId;
                    return (
                      <button
                        key={`${image.public_id}-${imageId}`}
                        type="button"
                        onClick={() => setSelectedBaseImageId(imageId)}
                        className={`overflow-hidden rounded-xl border text-left transition ${
                          isSelected ? 'border-[#003049] ring-2 ring-[#669bbc]/40' : 'border-slate-200 hover:border-[#669bbc]'
                        }`}
                      >
                        <img src={image.url} alt="Festival template" className="h-24 w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No base images configured for this festival yet.</p>
              )}
            </div>

            {resolvedImagePreview?.url && (
              <div className="md:col-span-2 rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-xs font-medium text-[#003049]">Resolved image preview (selected/default)</p>
                <img src={resolvedImagePreview.url} alt="Resolved festival image" className="h-36 w-full rounded-lg object-cover md:h-48" />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003049]">Schedule At (optional)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#669bbc] focus:outline-none focus:ring-2 focus:ring-[#669bbc]/30"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handlePostNow}
                disabled={actionLoading || !selectedFestivalId}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#003049] px-4 py-2 text-sm font-medium text-white hover:bg-[#00243a] disabled:opacity-60"
              >
                {actionLoading ? 'Working...' : 'Post Now'}
              </button>
              <button
                type="button"
                onClick={handleSchedulePost}
                disabled={actionLoading || !selectedFestivalId}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#669bbc] px-4 py-2 text-sm font-medium text-white hover:bg-[#4f89aa] disabled:opacity-60"
              >
                {actionLoading ? 'Working...' : 'Schedule'}
              </button>
            </div>
          </div>

          {actionMessage && <p className="mt-3 text-sm text-green-700">{actionMessage}</p>}
        </section>

        <section className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#003049] to-[#669bbc] text-white shadow-md">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="m-0 text-xl font-bold text-[#003049]">Posted Posts</h3>
              <p className="m-0 text-xs text-gray-500">{postedPosts.length} posted for this account</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
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
                ].filter(Boolean).join(' • ');

                return (
                  <article
                    key={post._id}
                    className="grid gap-4 rounded-2xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-4 md:grid-cols-[160px_1fr_auto] md:items-center"
                  >
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-100 shadow-sm">
                      <img
                        src={post.imageUrl}
                        alt={post.festival?.name || 'Posted festival'}
                        className="h-40 w-full object-cover md:h-28"
                      />
                    </div>

                    <div className="min-w-0 space-y-2">
                      <h4 className="truncate text-lg font-semibold text-[#003049]">
                        {post.festival?.name || 'Posted festival image'}
                      </h4>
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
                      {postedPlatforms && (
                        <p className="text-xs font-medium text-green-700">Published on {postedPlatforms}</p>
                      )}
                    </div>

                    <div className="flex md:justify-end">
                      <button
                        type="button"
                        onClick={() => handleDownloadPostedImage(post)}
                        disabled={downloadingPostId === post._id}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#003049] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#00243a] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {downloadingPostId === post._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download Image
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

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
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
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
