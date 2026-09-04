import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Category } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Folder, 
  Layers, 
  Tag, 
  RefreshCw, 
  Loader2, 
  X,
  Check,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface CategoryAdminProps {
  onCategoriesUpdated?: (categories: Category[]) => void;
}

export const CategoryAdmin: React.FC<CategoryAdminProps> = ({ onCategoriesUpdated }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isFreeBadge: false,
    displayOrder: 10,
    isActive: true
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; targetCategory: Category | null }>({
    isOpen: false,
    targetCategory: null
  });
  const [deleting, setDeleting] = useState(false);

  // Helper to compress image client-side via canvas before uploading/saving
  const compressImage = (file: File, maxWidth = 800, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Helper for admin headers
  const getAdminHeaders = (contentType = 'application/json') => {
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;
    return headers;
  };

  // Load categories from Admin API
  const fetchAdminCategories = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/categories', {
        credentials: 'include',
        headers: getAdminHeaders('')
      });

      if (res.status === 401 || res.status === 403) {
        setError('Unauthorized access. Please log in again.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load categories (Status ${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
        if (onCategoriesUpdated) {
          onCategoriesUpdated(data.categories.filter((c: Category) => c.isActive !== false));
        }
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error('Error fetching admin categories:', err);
      setError('Unable to load category management list. Please check server connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminCategories();
  }, []);

  // Flash message timeout
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Handle Name change with auto-slugification
  const handleNameChange = (nameVal: string) => {
    const updatedForm = { ...formData, name: nameVal };
    if (autoSlug && modalMode === 'add') {
      updatedForm.slug = nameVal
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    setFormData(updatedForm);
  };

  // Handle uploading image file from PC or Phone
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    const isImage = file.type.startsWith('image/') || allowedTypes.includes(file.type.toLowerCase());

    if (!isImage) {
      setFormError('Please select a valid image file (JPG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError('Image file size exceeds maximum 8MB limit.');
      return;
    }

    setUploadingImage(true);
    setFormError(null);

    try {
      let fileDataBase64 = '';

      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        fileDataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.onerror = () => reject(new Error('Failed to read image file.'));
          reader.readAsDataURL(file);
        });
      } else {
        fileDataBase64 = await compressImage(file, 800, 0.85);
      }

      if (!fileDataBase64) {
        throw new Error('Failed to process image file.');
      }

      const res = await fetch('/api/admin/categories/upload', {
        method: 'POST',
        headers: getAdminHeaders('application/json'),
        credentials: 'include',
        body: JSON.stringify({
          fileData: fileDataBase64,
          fileName: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
        setFormError(null);
      } else {
        setFormError(data.error || 'Failed to upload category image.');
      }
    } catch (err: any) {
      console.error('Category image upload error:', err);
      setFormError(err.message || 'An unexpected error occurred during image upload.');
    } finally {
      setUploadingImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    const nextOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.displayOrder || 0)) + 10 
      : 10;

    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isFreeBadge: false,
      displayOrder: nextOrder,
      isActive: true
    });
    setAutoSlug(true);
    setFormError(null);
    setModalMode('add');
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cat: Category) => {
    setFormData({
      name: cat.name || '',
      slug: cat.slug || cat.id || '',
      description: cat.description || '',
      image: cat.image || '',
      isFreeBadge: !!cat.isFreeBadge,
      displayOrder: cat.displayOrder ?? 10,
      isActive: cat.isActive !== false
    });
    setAutoSlug(false);
    setFormError(null);
    setModalMode('edit');
    setEditingId(cat.id || cat.slug);
    setIsModalOpen(true);
  };

  // Save Category (Add or Edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (uploadingImage) {
      setFormError('Please wait until the category image finishes uploading.');
      return;
    }

    const nameTrimmed = formData.name.trim();
    let slugTrimmed = formData.slug.trim().toLowerCase();

    if (!nameTrimmed) {
      setFormError('Category name is required.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!slugTrimmed) {
      slugTrimmed = nameTrimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    if (!slugTrimmed) {
      setFormError('A valid slug is required.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: nameTrimmed,
        slug: slugTrimmed,
        description: formData.description.trim(),
        image: formData.image.trim(),
        isFreeBadge: formData.isFreeBadge,
        displayOrder: Number(formData.displayOrder) || 10,
        isActive: formData.isActive
      };

      let url = '/api/admin/categories';
      let method = 'POST';

      if (modalMode === 'edit' && editingId) {
        url = `/api/admin/categories/${encodeURIComponent(editingId)}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: getAdminHeaders('application/json'),
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to save category.');
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      setSuccessMsg(modalMode === 'add' ? `Category "${nameTrimmed}" added successfully!` : `Category "${nameTrimmed}" updated successfully!`);
      await fetchAdminCategories(true);
    } catch (err: any) {
      console.error('Save category error:', err);
      setFormError('An unexpected server error occurred. Please try again.');
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Hidden Status
  const handleToggleStatus = async (cat: Category) => {
    const newStatus = !cat.isActive;
    try {
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(cat.id || cat.slug)}/status`, {
        method: 'PATCH',
        headers: getAdminHeaders('application/json'),
        body: JSON.stringify({ isActive: newStatus }),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update category status.');
        return;
      }

      setSuccessMsg(`Category "${cat.name}" is now ${newStatus ? 'Active (Public)' : 'Hidden (Private)'}.`);
      await fetchAdminCategories(true);
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Failed to update status.');
    }
  };

  // Reorder Category (Move Up / Move Down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredCategories.length) return;

    const listCopy = [...categories];
    const item1 = filteredCategories[index];
    const item2 = filteredCategories[targetIndex];

    const idx1 = listCopy.findIndex(c => c.id === item1.id);
    const idx2 = listCopy.findIndex(c => c.id === item2.id);

    if (idx1 === -1 || idx2 === -1) return;

    // Swap displayOrder values
    const tempOrder = listCopy[idx1].displayOrder ?? 10;
    listCopy[idx1].displayOrder = listCopy[idx2].displayOrder ?? 20;
    listCopy[idx2].displayOrder = tempOrder;

    // Prepare batch reorder API payload
    const ordersPayload = listCopy.map(c => ({
      id: c.id || c.slug,
      displayOrder: c.displayOrder
    }));

    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'PATCH',
        headers: getAdminHeaders('application/json'),
        body: JSON.stringify({ orders: ordersPayload }),
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Reorder failed');
      }

      await fetchAdminCategories(true);
    } catch (err) {
      console.error('Reorder error:', err);
      setError('Failed to save category order.');
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deleteModal.targetCategory) return;
    setDeleting(true);

    try {
      const catId = deleteModal.targetCategory.id || deleteModal.targetCategory.slug;
      const res = await fetch(`/api/admin/categories/${encodeURIComponent(catId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(''),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete category.');
        setDeleting(false);
        setDeleteModal({ isOpen: false, targetCategory: null });
        return;
      }

      setSuccessMsg(`Category "${deleteModal.targetCategory.name}" was deleted safely.`);
      setDeleteModal({ isOpen: false, targetCategory: null });
      await fetchAdminCategories(true);
    } catch (err) {
      console.error('Delete category error:', err);
      setError('An error occurred while deleting category.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Search Logic
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        // Status filter
        if (statusFilter === 'active' && cat.isActive === false) return false;
        if (statusFilter === 'hidden' && cat.isActive !== false) return false;

        // Search term
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const matchName = (cat.name || '').toLowerCase().includes(query);
          const matchSlug = (cat.slug || cat.id || '').toLowerCase().includes(query);
          const matchDesc = (cat.description || '').toLowerCase().includes(query);
          return matchName || matchSlug || matchDesc;
        }

        return true;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [categories, statusFilter, searchTerm]);

  // Statistics
  const totalCount = categories.length;
  const activeCount = categories.filter(c => c.isActive !== false).length;
  const hiddenCount = categories.filter(c => c.isActive === false).length;

  return (
    <div className="space-y-6">
      
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-[#E96BA8] shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Recommended Category Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage circular homepage category cards, display order, badges, and active visibility.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => fetchAdminCategories(true)}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            title="Refresh category list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#E96BA8] hover:bg-pink-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Categories</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active (Public)</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hidden (Private)</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{hiddenCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category name, slug, description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('hidden')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'hidden'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Hidden ({hiddenCount})
          </button>
        </div>
      </div>

      {/* Main Category List Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#E96BA8] mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading recommended categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Folder className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No categories found
            </p>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search filters.' : 'Click "Add Category" to create your first category.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 w-24">Order</th>
                  <th className="py-3.5 px-4 w-16 text-center">Visual</th>
                  <th className="py-3.5 px-4">Category Details</th>
                  <th className="py-3.5 px-4 w-32 text-center">Status</th>
                  <th className="py-3.5 px-4 w-36 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredCategories.map((cat, index) => {
                  const isFirst = index === 0;
                  const isLast = index === filteredCategories.length - 1;

                  return (
                    <tr 
                      key={cat.id || cat.slug || `cat-${index}`}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                        cat.isActive === false ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''
                      }`}
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="w-6 text-center font-mono text-xs font-bold text-slate-500">
                            {cat.displayOrder ?? index * 10}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveOrder(index, 'up')}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveOrder(index, 'down')}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Icon / Image Circle Preview */}
                      <td className="py-3 px-4 text-center">
                        <div className="relative w-10 h-10 mx-auto rounded-full bg-pink-50 dark:bg-slate-900 border border-amber-400 dark:border-amber-500 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {cat.image && typeof cat.image === 'string' && cat.image.trim().length > 0 ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <Tag className="w-5 h-5 text-[#E96BA8]" />
                          )}
                        </div>
                      </td>

                      {/* Name, Slug, Description */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300">
                              /category/{cat.slug || cat.id}
                            </span>
                            {cat.count !== undefined && (
                              <span>&bull; {cat.count} patterns</span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Active / Hidden Status Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            cat.isActive !== false
                              ? 'bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-200'
                          }`}
                          title={cat.isActive !== false ? 'Click to Hide from public homepage' : 'Click to Make Active on public homepage'}
                        >
                          {cat.isActive !== false ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-pink-50 hover:text-[#E96BA8] dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteModal({ isOpen: true, targetCategory: cat })}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950/80 text-[#E96BA8]">
                  <Folder className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {modalMode === 'add' ? 'Add New Category' : `Edit Category: ${formData.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form ref={formRef} onSubmit={handleSaveCategory} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Crochet Blankets, Amigurumi Plushies"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Slug / URL Identifier <span className="text-rose-500">*</span>
                  </label>
                  {modalMode === 'add' && (
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoSlug}
                        onChange={(e) => setAutoSlug(e.target.checked)}
                        className="rounded text-[#E96BA8] focus:ring-[#E96BA8]"
                      />
                      <span>Auto-generate from name</span>
                    </label>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                    }}
                    placeholder="crochet-blankets"
                    className="w-full pl-24 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary for SEO breadcrumbs and tooltips..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              {/* Icon / Image Upload & URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category Image / Icon
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP or SVG</span>
                </div>

                {/* Upload & Preview Container */}
                <div className="space-y-2">
                  {uploadingImage ? (
                    <div className="p-3 bg-pink-50/80 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 rounded-2xl flex items-center gap-3 text-xs font-bold text-[#E96BA8]">
                      <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#E96BA8]" />
                      <span>Uploading & optimizing photo...</span>
                    </div>
                  ) : formData.image ? (
                    <div className="relative p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            Image Loaded
                          </p>
                          <p className="text-[10px] text-slate-400 truncate font-mono">
                            {formData.image.startsWith('data:') ? 'Local uploaded file' : formData.image}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <label className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-xl cursor-pointer transition-colors shadow-2xs">
                          Change
                          <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 rounded-xl transition-colors cursor-pointer"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="flex-1 px-3.5 py-2.5 bg-pink-50/80 dark:bg-pink-950/30 border border-dashed border-[#E96BA8]/40 hover:border-[#E96BA8] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#E96BA8] cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 shrink-0" />
                        <span>Upload Image from PC / Phone</span>
                        <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}

                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Or paste image web URL (https://...)"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Upload an image from your computer or smartphone camera roll, paste an external URL, or leave blank to use built-in line-art icon.
                </p>
              </div>

              {/* Display Order */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Display Order Number
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E96BA8]"
                />
              </div>

              {/* Toggles: Active Visibility */}
              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      Active / Visible Publicly
                    </span>
                    <p className="text-[11px] text-slate-500">
                      When enabled, this category appears on the public homepage.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Form Error right above submit buttons */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#E96BA8] hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Photo...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{modalMode === 'add' ? 'Create Category' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && deleteModal.targetCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete Category
                </h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Are you sure you want to delete this category?
              </p>
              <p className="text-slate-600 dark:text-slate-400 font-bold">
                "{deleteModal.targetCategory.name}" ({deleteModal.targetCategory.slug})
              </p>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                Note: Associated patterns will not be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, targetCategory: null })}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Category</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
