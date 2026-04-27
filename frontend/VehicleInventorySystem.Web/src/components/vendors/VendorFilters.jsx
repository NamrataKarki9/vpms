import React from 'react';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export default function VendorFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onSearch,
  onClear,
  canClear,
  appliedSearchTerm,
  appliedStatusFilter,
}) {
  const showSearchBadge = Boolean(appliedSearchTerm?.trim());
  const showStatusBadge = appliedStatusFilter && appliedStatusFilter !== 'all';

  return (
    <form className="vendor-toolbar card" onSubmit={onSearch}>
      <div className="vendor-search-wrap">
        <input
          type="search"
          placeholder="Search by vendor name, email, phone, or contact person..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="vendor-search"
        />
        <button type="submit" className="vendor-search-button vendor-search-button-search">
          Search
        </button>
        <button
          type="button"
          className="vendor-search-button vendor-search-button-clear"
          onClick={onClear}
          disabled={!canClear}
        >
          Clear
        </button>
      </div>

      <div className="vendor-status-group" role="tablist" aria-label="Vendor status filter">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`vendor-status-chip${statusFilter === option.value ? ' is-active' : ''}`}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {(showSearchBadge || showStatusBadge) && (
        <div className="vendor-filter-badges" aria-live="polite">
          {showSearchBadge && (
            <span className="vendor-filter-badge">Search applied: {appliedSearchTerm}</span>
          )}
          {showStatusBadge && (
            <span className="vendor-filter-badge">Filter applied: {appliedStatusFilter}</span>
          )}
        </div>
      )}

    </form>
  );
}
