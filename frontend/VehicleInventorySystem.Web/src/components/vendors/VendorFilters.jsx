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
  onInputSearch,
  onClear,
  canClearFilters,
}) {
  return (
    <form className="vendor-toolbar card" onSubmit={onSearch}>
      <div className="vendor-search-wrap">
        <input
          type="search"
          placeholder="Search by vendor name, email, phone, or contact person..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          onSearch={onInputSearch}
          className="vendor-search"
        />
        <button type="submit" className="vendor-search-button vendor-search-button-search">
          Search
        </button>
        <button
          type="button"
          className="vendor-search-button vendor-search-button-clear"
          onClick={onClear}
          disabled={!canClearFilters}
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
    </form>
  );
}
