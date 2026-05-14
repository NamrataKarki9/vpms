import React, { useEffect, useMemo, useState } from 'react';
import { partsService } from '../../services/partsService';
import { extractVendorItems, vendorService } from '../../services/vendorService';
import PartsFilters from '../../components/parts/PartsFilters';
import PartsStatsCards from '../../components/parts/PartsStatsCards';
import PartsTable from '../../components/parts/PartsTable';
import PartFormModal from '../../components/parts/PartFormModal';
import { Plus } from 'lucide-react';

const EMPTY_PARTS = [];
const EMPTY_VENDORS = [];
const LOW_STOCK_THRESHOLD = 5;

function normalizePart(part) {
  if (!part) {
    return {
      id: 0,
      name: '',
      partCode: '',
      description: '',
      price: 0,
      stockLevel: 0,
      vendorId: 0,
      vendorName: '',
      isActive: false,
    };
  }

  return {
    id: part.id ?? part.Id,
    name: part.name ?? part.Name ?? '',
    partCode: part.partCode ?? part.PartCode ?? '',
    description: part.description ?? part.Description ?? '',
    price: Number(part.price ?? part.Price ?? 0),
    stockLevel: Number(part.stockLevel ?? part.StockLevel ?? 0),
    vendorId: part.vendorId ?? part.VendorId ?? 0,
    vendorName: part.vendorName ?? part.VendorName ?? part.vendor?.name ?? part.vendor?.Name ?? '',
    isActive: Boolean(part.isActive ?? part.IsActive ?? false),
  };
}

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.title ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

export default function PartsPage() {
  const [parts, setParts] = useState(EMPTY_PARTS);
  const [vendors, setVendors] = useState(EMPTY_VENDORS);
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [statusPart, setStatusPart] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadParts = async () => {
    setIsLoading(true);
    try {
      const response = await partsService.getParts();
      const items = Array.isArray(response) ? response : response?.items || [];
      setParts(items.map(normalizePart));
    } catch (error) {
      showToast('error', extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await vendorService.getVendors({ pageNumber: 1, pageSize: 200, status: 'all' });
      const loadedVendors = extractVendorItems(response);
      setVendors(loadedVendors);
    } catch (error) {
      showToast('error', extractErrorMessage(error));
    }
  };

  const clearPartFilters = () => {
    setSearchInput('');
    setDraftStatusFilter('all');
    setSubmittedSearchTerm('');
    setAppliedStatusFilter('all');
    setPageNumber(1);
  };

  useEffect(() => {
    loadParts();
    loadVendors();
  }, []);

  useEffect(() => {
    if (searchInput.trim() === '') {
      clearPartFilters();
    }
  }, [searchInput]);

  const filteredParts = useMemo(() => {
    let result = [...parts];
    const term = submittedSearchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter((part) => {
        const searchable = [
          part.name,
          part.partCode,
          part.vendorName,
          part.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchable.includes(term);
      });
    }

    if (appliedStatusFilter === 'active') {
      result = result.filter((part) => part.isActive);
    } else if (appliedStatusFilter === 'inactive') {
      result = result.filter((part) => !part.isActive);
    } else if (appliedStatusFilter === 'low-stock') {
      result = result.filter((part) => Number(part.stockLevel) <= LOW_STOCK_THRESHOLD);
    }

    return result;
  }, [parts, submittedSearchTerm, appliedStatusFilter]);

  const totalItems = filteredParts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedParts = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredParts.slice(start, start + pageSize);
  }, [filteredParts, pageNumber, pageSize]);

  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const stats = useMemo(() => {
    const active = parts.filter((part) => part.isActive).length;
    const lowStock = parts.filter((part) => Number(part.stockLevel) <= LOW_STOCK_THRESHOLD).length;
    return {
      total: parts.length,
      active,
      inactive: parts.length - active,
      lowStock,
    };
  }, [parts]);

  const openAddModal = () => {
    setEditingPart(null);
    setSelectedPart(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setToast(null);
    setIsSaving(true);

    try {
      const response = await partsService.getPartById(id);
      const normalized = normalizePart(response);
      setEditingPart(normalized);
      setSelectedPart(normalized);
      setIsModalOpen(true);
    } catch (error) {
      showToast('error', extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (payload) => {
    setIsSaving(true);
    setToast(null);

    try {
      if (editingPart) {
        await partsService.updatePart(editingPart.id, { ...payload, isActive: editingPart.isActive });
        showToast('success', 'Part updated successfully.');
      } else {
        await partsService.createPart(payload);
        showToast('success', 'Part created successfully.');
      }

      await loadParts();
      setIsModalOpen(false);
      setEditingPart(null);
      setSelectedPart(null);
    } catch (error) {
      showToast('error', extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusModal = (part) => {
    setStatusPart(part);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusPart(null);
    setIsStatusModalOpen(false);
  };

  const confirmStatusChange = async () => {
    if (!statusPart) {
      return;
    }

    setIsUpdatingStatus(true);
    setToast(null);

    try {
      const updatedPart = await partsService.togglePartStatus(statusPart.id);
      setParts((current) => current.map((item) => (item.id === updatedPart.id ? normalizePart(updatedPart) : item)));
      showToast(
        'success',
        updatedPart.isActive
          ? 'Part reactivated successfully.'
          : 'Part deactivated successfully.'
      );
      closeStatusModal();
      await loadParts();
    } catch (error) {
      showToast('error', extractErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPart(null);
    setSelectedPart(null);
    setToast(null);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearchTerm = searchInput.trim();
    const nextStatusFilter = draftStatusFilter;

    setSubmittedSearchTerm(nextSearchTerm);
    setAppliedStatusFilter(nextStatusFilter);
    setPageNumber(1);
  };

  const handleClearFilters = (event) => {
    event.preventDefault();
    clearPartFilters();
  };

  const handleSearchInputClear = (event) => {
    if (event.target.value === '') {
      clearPartFilters();
    }
  };

  const canClearFilters = Boolean(
    searchInput.trim() || submittedSearchTerm || appliedStatusFilter !== 'all' || draftStatusFilter !== 'all'
  );

  return (
    <div className="vendor-page parts-page">
      <header className="page-section-header vendor-page-hero">
        <div className="vendor-hero-copy">
          <h2>Parts Management</h2>
          <p>Track parts catalog, stock levels, and vendor assignments in one place.</p>
        </div>
        <button type="button" className="btn-sale-primary vendor-hero-action" onClick={openAddModal}>
          <Plus size={15} /> Add Part
        </button>
      </header>

      <PartsFilters
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={draftStatusFilter}
        onStatusChange={setDraftStatusFilter}
        onSearch={handleSearch}
        onInputSearch={handleSearchInputClear}
        onClear={handleClearFilters}
        canClearFilters={canClearFilters}
      />

      {toast && (
        <div
          className={`vendor-toast vendor-toast-${toast.type}`}
          role="status"
          style={{ left: 'auto', right: '1.5rem', top: '5rem', transform: 'none' }}
        >
          <span className="vendor-toast-icon" aria-hidden="true">
            {toast.type === 'success' ? (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.22a.75.75 0 00-1.06-1.06L9 11.44 7.28 9.72a.75.75 0 10-1.06 1.06l2.25 2.25c.29.3.77.3 1.06 0l3.25-3.25z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 8.5a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          {toast.message}
        </div>
      )}

      <PartsStatsCards
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        lowStock={stats.lowStock}
      />

      <div className="vendor-section-header">
        <div>
          <h2>Parts Directory</h2>
          <p>{isLoading ? 'Loading parts...' : `Showing ${pagedParts.length} of ${totalItems} part${totalItems === 1 ? '' : 's'}.`}</p>
        </div>
        <div className="vendor-page-size">
          <label htmlFor="part-page-size">Page size</label>
          <select
            id="part-page-size"
            className="search-input-field"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageNumber(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="staff-card vendor-loading">Loading part records...</div>
      ) : (
        <PartsTable
          parts={pagedParts}
          onEdit={openEditModal}
          onToggleStatus={openStatusModal}
        />
      )}

      {!isLoading && (
        <div className="vendor-pagination">
          <div className="vendor-pagination-meta">
            <span className="vendor-pagination-count">Total parts: {totalItems}</span>
            <span className="vendor-pagination-summary">Page {pageNumber} of {totalPages}</span>
          </div>
          <div className="vendor-pagination-actions">
            <button
              type="button"
              className="btn-secondary vendor-pagination-button vendor-pagination-button-previous"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={!hasPreviousPage}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary vendor-pagination-button vendor-pagination-button-next"
              onClick={() => setPageNumber((current) => current + 1)}
              disabled={!hasNextPage}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <PartFormModal
        isOpen={isModalOpen}
        isEditing={Boolean(editingPart)}
        initialPart={selectedPart}
        vendors={vendors}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      {isStatusModalOpen && statusPart && (
        <div className="vendor-status-overlay" role="presentation" onClick={closeStatusModal}>
          <div
            className="vendor-status-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="part-status-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vendor-status-header">
              <h3 id="part-status-title">
                {statusPart.isActive ? 'Deactivate Part' : 'Reactivate Part'}
              </h3>
              <p>
                {statusPart.isActive
                  ? `Are you sure you want to deactivate ${statusPart.name}? This will keep the record but mark it inactive.`
                  : `Are you sure you want to reactivate ${statusPart.name}?`}
              </p>
            </div>
            <div className="vendor-status-actions">
              <button type="button" className="btn-view-customer" onClick={closeStatusModal} disabled={isUpdatingStatus}>
                Cancel
              </button>
              <button
                type="button"
                className={statusPart.isActive ? 'btn-danger' : 'btn-success'}
                onClick={confirmStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus
                  ? 'Updating...'
                  : statusPart.isActive
                    ? 'Deactivate'
                    : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
