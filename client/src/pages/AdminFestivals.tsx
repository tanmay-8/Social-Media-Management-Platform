import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  Save,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FileDown,
  Star,
} from 'lucide-react';
import { festivalService } from '../services/festivalService';
import type { Festival } from '../types';

type FestivalCategory = 'all' | 'hindu' | 'muslim';

type EditableFestival = {
  _id: string;
  name: string;
  category: FestivalCategory;
  description: string;
  yearDates: Array<{ year: number; date: string }>;
  existingImages: Array<{ _id?: string; url: string; public_id: string }>;
  defaultBaseImageId?: string;
};

function toInputDate(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function toEditableFestival(festival?: Festival | null): EditableFestival {
  if (!festival) {
    return {
      _id: '',
      name: '',
      category: 'all',
      description: '',
      yearDates: [],
      existingImages: [],
      defaultBaseImageId: undefined,
    };
  }

  const yearDates = Array.isArray(festival.yearDates) && festival.yearDates.length > 0
    ? festival.yearDates.map((entry) => ({ year: Number(entry.year), date: toInputDate(entry.date) }))
    : festival.date
      ? [{ year: Number(festival.year || new Date(festival.date).getFullYear()), date: toInputDate(festival.date) }]
      : [];

  const existingImages = Array.isArray(festival.baseImages) && festival.baseImages.length > 0
    ? festival.baseImages.map((img) => ({ _id: img._id, url: img.url, public_id: img.public_id }))
    : festival.baseImage?.url
      ? [{ _id: undefined, url: festival.baseImage.url, public_id: festival.baseImage.public_id }]
      : [];

  return {
    _id: festival._id,
    name: festival.name,
    category: festival.category,
    description: festival.description || '',
    yearDates,
    existingImages,
    defaultBaseImageId: festival.defaultBaseImageId || existingImages[0]?._id,
  };
}

function getDisplayDate(festival: Festival) {
  if (festival.date) return festival.date;
  if (festival.yearDates && festival.yearDates.length > 0) {
    return festival.yearDates[0].date;
  }
  return '';
}

function getDisplayImage(festival: Festival) {
  if (festival.baseImage?.url) return festival.baseImage.url;
  if (festival.baseImages && festival.baseImages.length > 0) {
    return festival.baseImages[0].url;
  }
  return '';
}

export default function AdminFestivals() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFestival, setEditingFestival] = useState<EditableFestival | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null);
  const [removeBaseImageIds, setRemoveBaseImageIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFestivals();
  }, []);

  useEffect(() => {
    if (newImageFiles.length === 0) {
      setNewImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(newImageFiles[0]);
    setNewImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [newImageFiles]);

  const fetchFestivals = async () => {
    try {
      setError(null);
      const data = await festivalService.getAllFestivalsAdmin();
      setFestivals(data.festivals || []);
    } catch (err: any) {
      console.error('Failed to fetch festivals:', err);
      setError('Failed to load festivals. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const normalizedYearDates = useMemo(() => {
    if (!editingFestival) return [];
    return editingFestival.yearDates
      .filter((entry: { year: number; date: string }) => entry.date)
      .map((entry: { year: number; date: string }) => {
        const date = new Date(entry.date);
        return {
          year: Number.isFinite(entry.year) ? Number(entry.year) : date.getFullYear(),
          date: date.toISOString(),
        };
      })
      .filter((entry: { year: number; date: string }) => Number.isFinite(entry.year) && !Number.isNaN(new Date(entry.date).getTime()));
  }, [editingFestival]);

  const selectedDefaultFromExisting = useMemo(() => {
    if (!editingFestival?.defaultBaseImageId) return undefined;
    if (removeBaseImageIds.includes(editingFestival.defaultBaseImageId)) return undefined;
    return editingFestival.defaultBaseImageId;
  }, [editingFestival, removeBaseImageIds]);

  const effectiveDefaultPreview = useMemo(() => {
    if (!editingFestival) {
      return null;
    }

    const activeExistingImages = editingFestival.existingImages.filter((image) => {
      if (!image._id) {
        return true;
      }
      return !removeBaseImageIds.includes(image._id);
    });

    if (selectedDefaultFromExisting) {
      const selected = activeExistingImages.find((image) => image._id === selectedDefaultFromExisting);
      if (selected) {
        return {
          url: selected.url,
          source: 'Selected existing default image',
        };
      }
    }

    if (activeExistingImages.length > 0) {
      return {
        url: activeExistingImages[0].url,
        source: 'First remaining existing image (fallback)',
      };
    }

    if (newImagePreviewUrl) {
      return {
        url: newImagePreviewUrl,
        source: 'First newly uploaded image (fallback)',
      };
    }

    return null;
  }, [editingFestival, newImagePreviewUrl, removeBaseImageIds, selectedDefaultFromExisting]);

  const validateBeforeSave = () => {
    if (!editingFestival) return false;
    if (!editingFestival.name.trim()) {
      setError('Festival name is required');
      return false;
    }

    if (normalizedYearDates.length > 0) {
      const years = normalizedYearDates.map((entry: { year: number; date: string }) => entry.year);
      const unique = new Set(years);
      if (unique.size !== years.length) {
        setError('Year values in festival dates must be unique');
        return false;
      }
    }

    return true;
  };

  const handleCreateFestival = async () => {
    if (!editingFestival || !creatingNew) return;
    if (!validateBeforeSave()) return;

    setSaving(true);
    setError(null);

    try {
      await festivalService.createFestival({
        name: editingFestival.name,
        category: editingFestival.category,
        description: editingFestival.description || undefined,
        yearDates: normalizedYearDates,
        baseImages: newImageFiles,
      });

      setSuccess('Festival created successfully');
      await fetchFestivals();
      setEditingFestival(null);
      setCreatingNew(false);
      setNewImageFiles([]);
      setRemoveBaseImageIds([]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to create festival:', err);
      setError(err?.message || 'Failed to create festival');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFestival = async () => {
    if (!editingFestival || creatingNew) return;
    if (!validateBeforeSave()) return;

    setSaving(true);
    setError(null);

    try {
      await festivalService.updateFestival(editingFestival._id, {
        name: editingFestival.name,
        category: editingFestival.category,
        description: editingFestival.description || undefined,
        yearDates: normalizedYearDates,
        baseImages: newImageFiles,
        removeBaseImageIds,
        defaultBaseImageId: selectedDefaultFromExisting,
      });

      setSuccess('Festival updated successfully');
      await fetchFestivals();
      setEditingFestival(null);
      setNewImageFiles([]);
      setRemoveBaseImageIds([]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update festival:', err);
      setError(err?.message || 'Failed to update festival');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFestival = async (festivalId: string) => {
    setSaving(true);
    setError(null);

    try {
      await festivalService.deleteFestival(festivalId);
      setSuccess('Festival deleted successfully');
      await fetchFestivals();
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete festival:', err);
      setError(err?.message || 'Failed to delete festival');
    } finally {
      setSaving(false);
    }
  };

  const handleImportJSON = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await festivalService.importFestivals(file);
      setSuccess(`Imported ${result.count} festivals successfully`);
      await fetchFestivals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to import festivals:', err);
      setError(err?.message || 'Failed to import JSON');
    } finally {
      setImporting(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const addYearDateRow = () => {
    if (!editingFestival) return;
    const currentYear = new Date().getFullYear();
    setEditingFestival({
      ...editingFestival,
      yearDates: [...editingFestival.yearDates, { year: currentYear, date: '' }],
    });
  };

  const updateYearDateRow = (index: number, partial: Partial<{ year: number; date: string }>) => {
    if (!editingFestival) return;
    const next = [...editingFestival.yearDates];
    next[index] = { ...next[index], ...partial };
    setEditingFestival({ ...editingFestival, yearDates: next });
  };

  const removeYearDateRow = (index: number) => {
    if (!editingFestival) return;
    const next = editingFestival.yearDates.filter((_: { year: number; date: string }, rowIndex: number) => rowIndex !== index);
    setEditingFestival({ ...editingFestival, yearDates: next });
  };

  const closeModal = () => {
    setEditingFestival(null);
    setCreatingNew(false);
    setNewImageFiles([]);
    setRemoveBaseImageIds([]);
    setError(null);
  };

  const openCreateModal = () => {
    setCreatingNew(true);
    setError(null);
    setNewImageFiles([]);
    setRemoveBaseImageIds([]);
    setEditingFestival(toEditableFestival(null));
  };

  const openEditModal = (festival: Festival) => {
    setCreatingNew(false);
    setError(null);
    setNewImageFiles([]);
    setRemoveBaseImageIds([]);
    setEditingFestival(toEditableFestival(festival));
  };

  const filteredFestivals = festivals.filter((festival: Festival) =>
    festival.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-purple-600" />
            Festivals Management
          </h1>
          <p className="text-slate-600 mt-1">Create festival templates and manage yearly dates and base images</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <FileDown className="w-5 h-5" />
            {importing ? 'Importing...' : 'Import JSON'}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Add Festival
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search festivals by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFestivals.map((festival) => {
          const image = getDisplayImage(festival);
          const displayDate = getDisplayDate(festival);
          const datesCount = festival.yearDates?.length || (festival.date ? 1 : 0);
          const imagesCount = festival.baseImages?.length || (festival.baseImage?.url ? 1 : 0);

          return (
            <div
              key={festival._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {image ? (
                <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                  <img src={image} alt={festival.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-purple-300" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{festival.name}</h3>
                  <span
                    className={`
                      px-2 py-1 rounded text-xs font-semibold
                      ${festival.category === 'hindu' ? 'bg-orange-100 text-orange-700' :
                        festival.category === 'muslim' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'}
                    `}
                  >
                    {festival.category}
                  </span>
                </div>

                <p className="text-sm text-slate-600 mb-1">
                  {displayDate
                    ? new Date(displayDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No date configured yet'}
                </p>

                <p className="text-xs text-slate-500 mb-3">{datesCount} date(s) • {imagesCount} image(s)</p>

                {festival.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{festival.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(festival)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(festival._id)}
                    className="px-3 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFestivals.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No festivals found</p>
        </div>
      )}

      {editingFestival && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {creatingNew ? 'Create Festival' : 'Edit Festival'}
              </h2>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Festival Name</label>
                  <input
                    type="text"
                    value={editingFestival.name}
                    onChange={(e) => setEditingFestival({ ...editingFestival, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="e.g., Diwali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={editingFestival.category}
                    onChange={(e) => setEditingFestival({ ...editingFestival, category: e.target.value as FestivalCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    <option value="all">All</option>
                    <option value="hindu">Hindu</option>
                    <option value="muslim">Muslim</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editingFestival.description || ''}
                  onChange={(e) => setEditingFestival({ ...editingFestival, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                  rows={3}
                  placeholder="Festival details"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Festival Dates by Year</label>
                  <button
                    type="button"
                    onClick={addYearDateRow}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Date
                  </button>
                </div>

                {editingFestival.yearDates.length === 0 && (
                  <p className="text-xs text-slate-500">No dates yet. Add one or more dates for specific years.</p>
                )}

                <div className="space-y-2">
                  {editingFestival.yearDates.map((entry, index) => (
                    <div key={`${entry.year}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="number"
                        value={entry.year}
                        onChange={(e) => updateYearDateRow(index, { year: Number(e.target.value) })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        min={1900}
                        max={2200}
                        placeholder="Year"
                      />
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateYearDateRow(index, { date: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeYearDateRow(index)}
                        className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Base Images</label>

                {editingFestival.existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {editingFestival.existingImages.map((image) => {
                      const imageId = image._id || image.public_id;
                      const markedForRemoval = !!image._id && removeBaseImageIds.includes(image._id);
                      const isDefault = image._id && selectedDefaultFromExisting === image._id;

                      return (
                        <div key={imageId} className={`border rounded-lg p-2 ${markedForRemoval ? 'opacity-40 border-red-200' : 'border-slate-200'}`}>
                          <img src={image.url} alt="Festival" className="w-full h-24 object-cover rounded" />
                          <div className="mt-2 space-y-2">
                            {image._id && !markedForRemoval && (
                              <button
                                type="button"
                                onClick={() => setEditingFestival({ ...editingFestival, defaultBaseImageId: image._id })}
                                className={`w-full text-xs px-2 py-1 rounded border ${isDefault ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >
                                <span className="inline-flex items-center gap-1 justify-center">
                                  <Star className="w-3 h-3" />
                                  {isDefault ? 'Default' : 'Set Default'}
                                </span>
                              </button>
                            )}

                            {image._id && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (removeBaseImageIds.includes(image._id!)) {
                                    setRemoveBaseImageIds(removeBaseImageIds.filter((id) => id !== image._id));
                                  } else {
                                    setRemoveBaseImageIds([...removeBaseImageIds, image._id!]);
                                  }
                                }}
                                className="w-full text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                              >
                                {markedForRemoval ? 'Undo Remove' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImageFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="festival-image"
                    multiple
                  />
                  <label htmlFor="festival-image" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {newImageFiles.length > 0
                        ? `${newImageFiles.length} new image(s) selected`
                        : 'Upload one or more base images'}
                    </span>
                  </label>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Effective Default Image Preview</p>
                  {effectiveDefaultPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={effectiveDefaultPreview.url}
                        alt="Effective default"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      <div>
                        <p className="text-sm text-slate-800">This image will be used when a user does not select an image.</p>
                        <p className="text-xs text-slate-500">{effectiveDefaultPreview.source}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-700">No default can be resolved yet. Upload at least one image.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={creatingNew ? handleCreateFestival : handleUpdateFestival}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{creatingNew ? 'Creating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {creatingNew ? 'Create' : 'Save Changes'}
                    </>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Delete Festival</h2>
                <p className="text-slate-600 mt-1">Are you sure you want to delete this festival? This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteFestival(deleteConfirm)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
