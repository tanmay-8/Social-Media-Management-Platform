import { useEffect, useState, useRef } from 'react';
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
  FileDown
} from 'lucide-react';
import { festivalService } from '../services/festivalService';
import type { Festival } from '../types';

export default function AdminFestivals() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    try {
      const data = await festivalService.getAllFestivals();
      setFestivals(data.festivals || []);
    } catch (error) {
      console.error('Failed to fetch festivals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFestival = async () => {
    if (!creatingNew || !editingFestival) return;

    try {
      await festivalService.createFestival({
        name: editingFestival.name,
        date: editingFestival.date,
        category: editingFestival.category,
        description: editingFestival.description,
        baseImage: imageFile || undefined,
      });

      await fetchFestivals();
      setCreatingNew(false);
      setEditingFestival(null);
      setImageFile(null);
    } catch (error) {
      console.error('Failed to create festival:', error);
    }
  };

  const handleUpdateFestival = async () => {
    if (!editingFestival || creatingNew) return;

    try {
      await festivalService.updateFestival(editingFestival._id, {
        name: editingFestival.name,
        date: editingFestival.date,
        category: editingFestival.category,
        description: editingFestival.description,
        baseImage: imageFile || undefined,
      });

      await fetchFestivals();
      setEditingFestival(null);
      setImageFile(null);
    } catch (error) {
      console.error('Failed to update festival:', error);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Please upload a JSON file');
      return;
    }

    setImporting(true);
    try {
      const result = await festivalService.importFestivals(file);
      alert(`Successfully imported ${result.count} festivals`);
      await fetchFestivals();
    } catch (error) {
      console.error('Failed to import festivals:', error);
      alert('Failed to import JSON. Please check the format.');
    } finally {
      setImporting(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFestival = async (festivalId: string) => {
    try {
      await festivalService.deleteFestival(festivalId);
      await fetchFestivals();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete festival:', error);
    }
  };

  const openCreateModal = () => {
    setCreatingNew(true);
    setEditingFestival({
      _id: '',
      name: '',
      date: new Date().toISOString().split('T')[0],
      category: 'all',
      description: '',
    });
  };

  const filteredFestivals = festivals.filter((festival) =>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-purple-600" />
            Festivals Management
          </h1>
          <p className="text-slate-600 mt-1">Manage festival dates and templates</p>
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
            onChange={handleImportCSV}
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

      {/* Search */}
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

      {/* Festivals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFestivals.map((festival) => (
          <div
            key={festival._id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {festival.baseImage?.url && (
              <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                <img
                  src={festival.baseImage.url}
                  alt={festival.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {!festival.baseImage?.url && (
              <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-purple-300" />
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-lg">{festival.name}</h3>
                <span className={`
                  px-2 py-1 rounded text-xs font-semibold
                  ${festival.category === 'hindu' ? 'bg-orange-100 text-orange-700' :
                    festival.category === 'muslim' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'}
                `}>
                  {festival.category}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 mb-3">
                {new Date(festival.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              
              {festival.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{festival.description}</p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingFestival(festival)}
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
        ))}
      </div>

      {filteredFestivals.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No festivals found</p>
        </div>
      )}

      {/* Create/Edit Festival Modal */}
      {editingFestival && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {creatingNew ? 'Create Festival' : 'Edit Festival'}
              </h2>
              <button
                onClick={() => {
                  setEditingFestival(null);
                  setCreatingNew(false);
                  setImageFile(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editingFestival.date}
                  onChange={(e) => setEditingFestival({ ...editingFestival, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={editingFestival.category}
                  onChange={(e) => setEditingFestival({ ...editingFestival, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                >
                  <option value="all">All</option>
                  <option value="hindu">Hindu</option>
                  <option value="muslim">Muslim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={editingFestival.description || ''}
                  onChange={(e) => setEditingFestival({ ...editingFestival, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {creatingNew ? 'Base Image (Required)' : 'Update Base Image (Optional)'}
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="festival-image"
                  />
                  <label
                    htmlFor="festival-image"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {!creatingNew && editingFestival?.baseImage && !imageFile && (
                      <img 
                        src={editingFestival.baseImage.url} 
                        alt="Current" 
                        className="w-20 h-20 object-cover rounded-lg mb-2"
                      />
                    )}
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {imageFile ? imageFile.name : creatingNew ? 'Click to upload image' : 'Click to change image'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={creatingNew ? handleCreateFestival : handleUpdateFestival}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
                >
                  <Save className="w-4 h-4" />
                  {creatingNew ? 'Create' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditingFestival(null);
                    setCreatingNew(false);
                    setImageFile(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
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
