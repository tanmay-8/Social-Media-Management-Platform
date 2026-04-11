import { ArrowLeft, Calendar, CheckCircle2, Image as ImageIcon, Loader2, Check, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { festivalService } from '../services/festivalService';
import { scheduledService } from '../services/scheduledService';
import type { Festival } from '../types';

export const FestivalBaseImagePage = () => {
  const navigate = useNavigate();
  const { festivalId } = useParams<{ festivalId: string }>();
  const [festival, setFestival] = useState<Festival | null>(null);
  const [selectedBaseImageId, setSelectedBaseImageId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadFestival = async () => {
      if (!festivalId) {
        setError('Festival ID is missing');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await festivalService.getAllFestivals();
        const found = (response.festivals || []).find((item) => item._id === festivalId) || null;
        if (!found) {
          setError('Festival not found');
          setFestival(null);
          setLoading(false);
          return;
        }

        setFestival(found);
        if (found.defaultBaseImageId) {
          setSelectedBaseImageId(String(found.defaultBaseImageId));
        } else if (found.baseImages?.[0]?._id) {
          setSelectedBaseImageId(String(found.baseImages[0]._id));
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load festival';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadFestival();
  }, [festivalId]);

  const availableImages = useMemo(() => {
    if (!festival) return [] as Array<{ _id?: string; url: string; public_id: string }>;
    if (festival.baseImages && festival.baseImages.length > 0) {
      return festival.baseImages;
    }
    if (festival.baseImage?.url) {
      return [
        {
          _id: festival.defaultBaseImageId,
          url: festival.baseImage.url,
          public_id: festival.baseImage.public_id,
        },
      ];
    }
    return [] as Array<{ _id?: string; url: string; public_id: string }>;
  }, [festival]);

  const selectedImage = useMemo(() => {
    if (!selectedBaseImageId) return availableImages[0] || null;
    return availableImages.find((image) => String(image._id || image.public_id) === selectedBaseImageId) || availableImages[0] || null;
  }, [availableImages, selectedBaseImageId]);

  const handleUseSelectedImage = async () => {
    if (!festival) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await scheduledService.createScheduledPost({
        festivalId: festival._id,
        festivalDate: festival.date,
        selectedBaseImageId: selectedBaseImageId || undefined,
        scheduledAt: festival.date ? new Date(festival.date).toISOString() : undefined,
        message: '',
      });

      setSuccess('Base image selected and festival post scheduled successfully.');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to schedule with selected image';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#669bbc]" />
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{error || 'Festival not found'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg bg-[#003049] px-4 py-2 text-sm font-medium text-white"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,48,73,0.25)] bg-[#fdf0d5] px-4 py-2 text-sm text-[#003049] hover:border-[#669bbc]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="rounded-3xl border border-white/40 bg-white/90 p-6 shadow-elegant backdrop-blur-sm">
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#003049]">{festival.name}</h1>
            <p className="mt-1 text-sm text-[#669bbc]">Select a base image and we will use it for the scheduled festival post.</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Calendar className="h-3 w-3" />
            {festival.date
              ? new Date(festival.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Date TBD'}
          </div>
        </div>

        {festival.description && <p className="mb-5 text-sm text-[#7f7270]">{festival.description}</p>}

        {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {success && <p className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</p>}

        {availableImages.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
            <ImageIcon className="mx-auto mb-2 h-10 w-10" />
            <p>No base image configured for this festival yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-[#f8fbff] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#669bbc]">Selected Preview</p>
              {selectedImage ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img src={selectedImage.url} alt={`${festival.name} selected base`} className="h-64 w-full object-cover md:h-80" />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400 md:h-80">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="rounded-full bg-[#003049]/10 px-2.5 py-1 font-medium text-[#003049]">{availableImages.length} options available</span>
                <span className="text-[#7f7270]">{festival.defaultBaseImageId ? 'Default image set by admin' : 'Default uses first image'}</span>
              </div>
            </section>

            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#669bbc]">Choose Base Image</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2">
                {availableImages.map((image) => {
                  const imageId = String(image._id || image.public_id);
                  const isSelected = selectedBaseImageId === imageId;
                  const isDefault = festival.defaultBaseImageId && String(festival.defaultBaseImageId) === imageId;

                  return (
                    <button
                      key={`${image.public_id}-${imageId}`}
                      type="button"
                      onClick={() => setSelectedBaseImageId(imageId)}
                      className={`group relative overflow-hidden rounded-xl border transition ${
                        isSelected ? 'border-[#003049] ring-2 ring-[#669bbc]/45' : 'border-slate-200 hover:border-[#669bbc]'
                      }`}
                    >
                      <img src={image.url} alt="Festival base" className="h-28 w-full object-cover" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      {isDefault && (
                        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#003049]">
                          Default
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#003049] text-white shadow">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-[#669bbc]/25 bg-[#f6fbff] p-3 text-xs text-[#335d74]">
                <p className="m-0">Tip: this selection is used for the scheduled post image composition for this festival date.</p>
              </div>
            </section>

            <div className="lg:col-span-2 mt-1 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleUseSelectedImage}
                disabled={saving || !selectedImage}
                className="inline-flex items-center gap-2 rounded-lg bg-[#003049] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#00243a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? 'Scheduling...' : 'Use This Image'}
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c1121f]/10 px-3 py-1 text-xs font-medium text-[#780000]">
                <Sparkles className="h-3.5 w-3.5" />
                Final post can be viewed later in Posted Posts
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
