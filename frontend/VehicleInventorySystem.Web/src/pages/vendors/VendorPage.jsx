import React, { useEffect, useMemo, useState } from 'react';
import { vendorService } from '../../services/vendorService';
import VendorFilters from '../../components/vendors/VendorFilters';
import VendorStatsCards from '../../components/vendors/VendorStatsCards';
import VendorTable from '../../components/vendors/VendorTable';
import VendorFormModal from '../../components/vendors/VendorFormModal';

const EMPTY_VENDORS = [];

function normalizeVendor(vendor) {
  return {
    ...vendor,
    name: vendor.name ?? '',
    contactPerson: vendor.contactPerson ?? '',
    phoneNumber: vendor.phoneNumber ?? vendor.phone ?? '',
    emailAddress: vendor.emailAddress ?? vendor.email ?? '',
    address: vendor.address ?? '',
    isActive: Boolean(vendor.isActive),
  };
}

export default function VendorPage() {
  const [vendors, setVendors] = useState(EMPTY_VENDORS);
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [statusVendor, setStatusVendor] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toast, setToast] = useState(null);
  const hasActiveFilters = Boolean(submittedSearchTerm.trim()) || appliedStatusFilter !== 'all';

  const loadVendors = async (targetPage = pageNumber) => {
    setIsLoading(true);

    try {
      const response = await vendorService.getVendors({
        pageNumber: targetPage,
        pageSize,
        searchTerm: submittedSearchTerm,
        status: appliedStatusFilter,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      const normalized = items.map(normalizeVendor);
      setVendors(normalized);
      setTotalItems(response?.totalItems ?? items.length);
      setTotalPages(response?.totalPages ?? 1);
      setHasNextPage(Boolean(response?.hasNextPage));
      setHasPreviousPage(Boolean(response?.hasPreviousPage));
      setPageNumber(response?.pageNumber ?? targetPage);
      setPageSize(response?.pageSize ?? pageSize);
      return { items: normalized, pageNumber: response?.pageNumber ?? targetPage };
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to load vendors.' });
      return { items: [], pageNumber: targetPage };
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadVendors();
  }, [pageNumber, pageSize, submittedSearchTerm, appliedStatusFilter]);

  const stats = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.isActive).length;
    return {
      total: vendors.length,
      active,
      inactive: vendors.length - active,
    };
  }, [vendors]);

  const openAddModal = () => {
    setEditingVendor(null);
    setSelectedVendor(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (id) => {
    setToast(null);
    setIsSaving(true);

    try {
      const response = await vendorService.getVendorById(id);
      const normalized = normalizeVendor(response);
      setEditingVendor(normalized);
      setSelectedVendor(normalized);
      setIsModalOpen(true);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to open vendor details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (payload) => {
    setIsSaving(true);
    setToast(null);

    try {
      if (editingVendor) {
        await vendorService.updateVendor(editingVendor.id, payload);
      } else {
        await vendorService.createVendor(payload);
      }

      await loadVendors(pageNumber);
      setIsModalOpen(false);
      setEditingVendor(null);
      setSelectedVendor(null);
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to save vendor.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openStatusModal = (vendor) => {
    setStatusVendor(vendor);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusVendor(null);
    setIsStatusModalOpen(false);
  };

  const confirmStatusChange = async () => {
    if (!statusVendor) {
      return;
    }

    setIsUpdatingStatus(true);
    setToast(null);

    try {
      const updatedVendor = await vendorService.toggleVendorStatus(statusVendor.id);
      setVendors((current) => current.map((item) => (item.id === updatedVendor.id ? normalizeVendor(updatedVendor) : item)));
      showToast(
        'success',
        updatedVendor.isActive
          ? 'Vendor reactivated successfully.'
          : 'Vendor deactivated successfully.'
      );
      closeStatusModal();
      const response = await loadVendors(pageNumber);
      if (response.items.length === 0 && pageNumber > 1) {
        setPageNumber(pageNumber - 1);
      }
    } catch (error) {
      showToast('error', 'Unable to update vendor status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setSelectedVendor(null);
    setToast(null);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const nextSearchTerm = searchInput.trim();
    const nextStatusFilter = draftStatusFilter;

    if (pageNumber === 1 && submittedSearchTerm === nextSearchTerm && appliedStatusFilter === nextStatusFilter) {
      loadVendors(1);
      return;
    }

    setSubmittedSearchTerm(nextSearchTerm);
    setAppliedStatusFilter(nextStatusFilter);
    setPageNumber(1);
  };

  const handleClearFilters = (event) => {
    event.preventDefault();
    setSearchInput('');
    setDraftStatusFilter('all');
    setSubmittedSearchTerm('');
    setAppliedStatusFilter('all');
    setPageNumber(1);
  };

  return (
    <div className="vendor-page">
      <header className="vendor-page-hero card">
        <div className="vendor-hero-copy">
          <h1>Vendor Management</h1>
          <p>Oversee global supply chain partners and fulfillment metrics.</p>
        </div>
        <button type="button" className="vendor-hero-action" onClick={openAddModal}>
          + Add Vendor
        </button>
      </header>

      <VendorFilters
        searchTerm={searchInput}
        onSearchChange={setSearchInput}
        statusFilter={draftStatusFilter}
        onStatusChange={setDraftStatusFilter}
        onSearch={handleSearch}
        onClear={handleClearFilters}
        canClear={hasActiveFilters || Boolean(searchInput.trim()) || draftStatusFilter !== 'all'}
        appliedSearchTerm={submittedSearchTerm}
        appliedStatusFilter={appliedStatusFilter}
      />

      {toast && (
        <div className={`vendor-toast vendor-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      )}

      <VendorStatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

      <div className="vendor-section-header">
        <div>
          <h2>Vendor Directory</h2>
          <p>{isLoading ? 'Loading vendors...' : `Showing ${vendors.length} of ${totalItems} vendor${totalItems === 1 ? '' : 's'}.`}</p>
        </div>
        <div className="vendor-page-size">
          <label htmlFor="vendor-page-size">Page size</label>
          <select
            id="vendor-page-size"
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
        <div className="card vendor-loading">Loading vendor records...</div>
      ) : (
        <VendorTable
          vendors={vendors}
          onEdit={openEditModal}
          onToggleStatus={openStatusModal}
        />
      )}

      {!isLoading && (
        <div className="vendor-pagination">
          <div className="vendor-pagination-meta">
            <span className="vendor-pagination-count">Total vendors: {totalItems}</span>
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

      <VendorFormModal
        isOpen={isModalOpen}
        isEditing={Boolean(editingVendor)}
        initialVendor={selectedVendor}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSaving={isSaving}
      />

      {isStatusModalOpen && statusVendor && (
        <div className="vendor-status-overlay" role="presentation" onClick={closeStatusModal}>
          <div
            className="vendor-status-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-status-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vendor-status-header">
              <h3 id="vendor-status-title">
                {statusVendor.isActive ? 'Deactivate Vendor' : 'Reactivate Vendor'}
              </h3>
              <p>
                {statusVendor.isActive
                  ? `Are you sure you want to deactivate ${statusVendor.name}? This will keep the record but mark it inactive.`
                  : `Are you sure you want to reactivate ${statusVendor.name}?`}
              </p>
            </div>
            <div className="vendor-status-actions">
              <button type="button" className="btn-secondary" onClick={closeStatusModal} disabled={isUpdatingStatus}>
                Cancel
              </button>
              <button
                type="button"
                className={statusVendor.isActive ? 'btn-danger' : 'btn-success'}
                onClick={confirmStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus
                  ? 'Updating...'
                  : statusVendor.isActive
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
