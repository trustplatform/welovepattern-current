import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Search,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Filter,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  RefreshCw,
  FileSpreadsheet,
  Tag,
  Inbox
} from 'lucide-react';

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  status: 'new' | 'processed';
  source: string;
}

export const MailListAdmin: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'processed'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'single' | 'bulk';
    targetId?: string;
    targetEmail?: string;
  }>({ isOpen: false, mode: 'single' });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Status Action Loading
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Helper for admin headers
  const getAdminHeaders = (contentType = 'application/json') => {
    const headers: Record<string, string> = {};
    if (contentType) headers['Content-Type'] = contentType;
    return headers;
  };

  // Fetch subscribers from server
  const fetchSubscribers = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/admin/subscribers', {
        credentials: 'include',
        headers: getAdminHeaders(''),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        setError('Unauthorized access. Please log in again.');
        return;
      }

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.subscribers)) {
        const seen = new Set<string>();
        const sanitized: Subscriber[] = [];
        for (let i = 0; i < data.subscribers.length; i++) {
          const item = data.subscribers[i];
          if (item && item.email) {
            const id = typeof item.id === 'string' && item.id.trim()
              ? item.id.trim()
              : `sub_${i}_${Math.random().toString(36).substring(2, 6)}`;
            if (!seen.has(id)) {
              seen.add(id);
              sanitized.push({
                id,
                email: String(item.email).trim().toLowerCase(),
                createdAt: item.createdAt || new Date().toISOString(),
                status: item.status === 'processed' ? 'processed' : 'new',
                source: item.source || 'Homepage Newsletter'
              });
            }
          }
        }
        setSubscribers(sanitized);
      } else {
        setSubscribers([]);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error loading subscribers:', err);
      if (err.name === 'AbortError') {
        setError('Unable to load subscribers. Request timed out. Please try again.');
      } else {
        setError('Unable to load subscribers. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  // Filtered & Sorted Subscribers
  const filteredSubscribers = useMemo(() => {
    if (!Array.isArray(subscribers)) return [];

    return subscribers
      .filter((sub) => {
        if (!sub || !sub.email) return false;
        // Status filter
        if (statusFilter !== 'all' && sub.status !== statusFilter) {
          return false;
        }
        // Search term
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const matchEmail = (sub.email || '').toLowerCase().includes(query);
          const matchSource = (sub.source || '').toLowerCase().includes(query);
          return matchEmail || matchSource;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [subscribers, statusFilter, searchTerm, sortOrder]);

  // Statistics
  const totalCount = Array.isArray(subscribers) ? subscribers.length : 0;
  const newCount = Array.isArray(subscribers) ? subscribers.filter((s) => s.status === 'new').length : 0;
  const processedCount = Array.isArray(subscribers) ? subscribers.filter((s) => s.status === 'processed').length : 0;

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedSubscribers = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredSubscribers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSubscribers, validCurrentPage, itemsPerPage]);

  // Selection Logic
  const isAllOnPageSelected =
    paginatedSubscribers.length > 0 &&
    paginatedSubscribers.every((sub) => selectedIds.has(sub.id));

  const handleToggleSelectAllPage = () => {
    const next = new Set(selectedIds);
    if (isAllOnPageSelected) {
      paginatedSubscribers.forEach((sub) => next.delete(sub.id));
    } else {
      paginatedSubscribers.forEach((sub) => next.add(sub.id));
    }
    setSelectedIds(next);
  };

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Toggle Status
  const handleToggleStatus = async (sub: Subscriber) => {
    const newStatus = sub.status === 'new' ? 'processed' : 'new';
    setUpdatingId(sub.id);

    try {
      const res = await fetch(`/api/admin/subscribers/${sub.id}/status`, {
        method: 'PATCH',
        headers: getAdminHeaders('application/json'),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setSubscribers((prev) =>
          prev.map((s) => (s.id === sub.id ? { ...s, status: newStatus } : s))
        );
      } else {
        alert('Failed to update subscriber status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk Status Update
  const handleBulkSetStatus = async (targetStatus: 'new' | 'processed') => {
    if (selectedIds.size === 0) return;
    const idsToUpdate = Array.from(selectedIds);

    for (const id of idsToUpdate) {
      try {
        await fetch(`/api/admin/subscribers/${id}/status`, {
          method: 'PATCH',
          headers: getAdminHeaders('application/json'),
          credentials: 'include',
          body: JSON.stringify({ status: targetStatus })
        });
      } catch (e) {
        console.error(`Failed to update ${id}:`, e);
      }
    }

    setSubscribers((prev) =>
      prev.map((s) => (selectedIds.has(s.id) ? { ...s, status: targetStatus } : s))
    );
  };

  // Delete Action Handlers
  const handleOpenSingleDelete = (sub: Subscriber) => {
    setDeleteModal({
      isOpen: true,
      mode: 'single',
      targetId: sub.id,
      targetEmail: sub.email
    });
  };

  const handleOpenBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      mode: 'bulk'
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      if (deleteModal.mode === 'single' && deleteModal.targetId) {
        const res = await fetch(`/api/admin/subscribers/${deleteModal.targetId}`, {
          method: 'DELETE',
          headers: getAdminHeaders(''),
          credentials: 'include'
        });

        if (res.ok) {
          setSubscribers((prev) => prev.filter((s) => s.id !== deleteModal.targetId));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(deleteModal.targetId!);
            return next;
          });
        } else {
          alert('Failed to delete subscriber');
        }
      } else if (deleteModal.mode === 'bulk') {
        const idsArray = Array.from(selectedIds);
        const res = await fetch('/api/admin/subscribers/delete', {
          method: 'POST',
          headers: getAdminHeaders('application/json'),
          credentials: 'include',
          body: JSON.stringify({ ids: idsArray })
        });

        if (res.ok) {
          setSubscribers((prev) => prev.filter((s) => !selectedIds.has(s.id)));
          setSelectedIds(new Set());
        } else {
          alert('Failed to bulk delete subscribers');
        }
      }
    } catch (err) {
      console.error('Error deleting subscriber(s):', err);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, mode: 'single' });
    }
  };

  // CSV Export
  const handleExportCsv = (mode: 'all' | 'selected') => {
    let url = '/api/admin/subscribers/export';
    if (mode === 'selected' && selectedIds.size > 0) {
      url += `?ids=${Array.from(selectedIds).join(',')}`;
    }
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', mode === 'selected' ? 'selected_subscribers.csv' : 'all_subscribers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Subscribers Metric */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Mail List</span>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{totalCount}</p>
            <p className="text-xs text-slate-500">Active email subscribers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-900 flex items-center justify-center text-[#E96BA8]">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        {/* New Subscribers Metric */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Unprocessed</span>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{newCount}</p>
              {newCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                  NEW
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Awaiting review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        {/* Processed Metric & Export Quick Button */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processed Subscribers</span>
            <p className="text-3xl font-black text-slate-700 dark:text-slate-300">{processedCount}</p>
            <button
              onClick={() => handleExportCsv('all')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E96BA8] hover:underline cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Full List (CSV)</span>
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Control Bar: Search, Status Filter, Sort, Refresh */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[22px] border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Mail ({totalCount})
            </button>
            <button
              onClick={() => { setStatusFilter('new'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'new'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>New Mail ({newCount})</span>
            </button>
            <button
              onClick={() => { setStatusFilter('processed'); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'processed'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Processed ({processedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subscribers by email or source..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#E96BA8]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Refresh */}
          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>

            <button
              onClick={() => fetchSubscribers(true)}
              disabled={refreshing}
              title="Refresh Subscriber List"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#E96BA8]' : ''}`} />
            </button>
          </div>

        </div>

        {/* Selection Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E96BA8]">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.size} subscriber(s) selected</span>
              <button
                onClick={handleClearSelection}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline font-normal ml-2 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSetStatus('processed')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark as Processed</span>
              </button>

              <button
                onClick={() => handleExportCsv('selected')}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#E96BA8]" />
                <span>Export Selected</span>
              </button>

              <button
                onClick={handleOpenBulkDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-[22px] border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E96BA8] animate-spin" />
            <p className="text-xs font-bold text-slate-400">Loading subscriber database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              onClick={() => fetchSubscribers()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
              No subscribers found
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search terms or status filters.'
                : 'No email subscriptions recorded yet. Visitors can subscribe on the homepage newsletter box.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <button
                      onClick={handleToggleSelectAllPage}
                      title={isAllOnPageSelected ? 'Deselect Page' : 'Select Page'}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {isAllOnPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#E96BA8]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Date Subscribed</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
                {paginatedSubscribers.map((sub, idx) => {
                  const isSelected = selectedIds.has(sub.id);
                  const isUpdating = updatingId === sub.id;
                  const dateObj = new Date(sub.createdAt);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={sub.id || `sub-row-${idx}`}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-pink-50/50 dark:bg-pink-950/20'
                          : sub.status === 'new'
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleSelectOne(sub.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#E96BA8]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{sub.email}</span>
                          {sub.status === 'new' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          disabled={isUpdating}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform active:scale-95 cursor-pointer ${
                            sub.status === 'new'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : sub.status === 'new' ? (
                            <Inbox className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          )}
                          <span className="capitalize">{sub.status}</span>
                        </button>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{sub.source || 'Homepage Newsletter'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          title={sub.status === 'new' ? 'Mark as Processed' : 'Mark as New'}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className={`w-4 h-4 ${sub.status === 'new' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </button>

                        <button
                          onClick={() => handleOpenSingleDelete(sub)}
                          title="Delete Subscriber"
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Pagination Bar */}
        {!loading && !error && filteredSubscribers.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(validCurrentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(validCurrentPage * itemsPerPage, filteredSubscribers.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSubscribers.length}</span> subscribers
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-500">
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="px-3 font-bold text-slate-700 dark:text-slate-300">
                  {validCurrentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Confirmation Modal for Deleting */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {deleteModal.mode === 'single' ? 'Delete Subscriber?' : 'Delete Selected Subscribers?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {deleteModal.mode === 'single' ? (
                  <>
                    Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deleteModal.targetEmail}</strong> from your mail list? This action cannot be undone.
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete <strong className="text-slate-800 dark:text-slate-200">{selectedIds.size} subscriber(s)</strong>? This action cannot be undone.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, mode: 'single' })}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
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
