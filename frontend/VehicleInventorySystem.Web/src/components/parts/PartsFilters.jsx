import React from 'react';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Low Stock', value: 'low-stock' },
];

export default function PartsFilters({
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
          placeholder="Search by part name, code, vendor, or description..."
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

      <div className="vendor-status-group" role="tablist" aria-label="Parts status filter">
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
