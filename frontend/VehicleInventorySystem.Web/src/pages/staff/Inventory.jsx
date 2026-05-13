import React, { useState, useEffect } from 'react';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Inventory = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchParts();
  }, [pagination.pageNumber]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/parts?pageNumber=${pagination.pageNumber}&pageSize=${pagination.pageSize}`);
      
      if (data && data.items) {
        setParts(data.items.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stockLevel,
          price: p.price,
          vendorName: p.vendorName,
          partCode: p.partCode
        })));
        setPagination({
          ...pagination,
          totalItems: data.totalItems,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPreviousPage: data.hasPreviousPage
        });
      } else {
        setParts((data || []).map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stockLevel,
          price: p.price,
          vendorName: p.vendorName,
          partCode: p.partCode
        })));
        setPagination({ totalItems: (data || []).length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
      }
    } catch (err) {
      showToast('error', 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  const filtered = parts.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.partCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = parts.filter(p => p.stock < 10).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-section-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div>
            <h2>Parts Inventory</h2>
            <p>{pagination.totalItems} parts in catalogue</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'Total Parts', value: pagination.totalItems },
              { label: 'Low Stock', value: lowStockCount },
              { label: 'Stock Value', value: `Rs. ${(totalValue / 1000).toFixed(1)}k` },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 16px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-card">
        <div className="staff-card-header">
          <span className="staff-card-title">All Parts</span>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search part or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input-field"
              style={{ paddingLeft: '32px', width: '220px' }}
            />
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          {loading && (
             <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
                <div className="spinner" />
             </div>
          )}
          <table className="staff-table">
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Code</th>
                <th>Vendor</th>
                <th>Stock Level</th>
                <th>Unit Price</th>
                <th>Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><code style={{ fontSize: '11px', color: '#666' }}>{p.partCode || `P-${p.id}`}</code></td>
                  <td>{p.vendorName || p.vendor || 'Unknown Vendor'}</td>
                  <td>
                    <span className="badge-pill" style={{ background: p.stock < 10 ? '#FCEBEB' : '#EAF3DE', color: p.stock < 10 ? '#A32D2D' : '#3B6D11' }}>
                      {p.stock} units
                    </span>
                  </td>
                  <td>Rs. {p.price?.toFixed(2)}</td>
                  <td>Rs. {(p.price * p.stock).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan="6">
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h4>No Parts Found</h4>
                    <p>No parts match your search or inventory is empty.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid #E8ECF0', background: '#F8FAFC' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Page {pagination.pageNumber} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="staff-tab-btn"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
                style={{ padding: '6px 12px', opacity: pagination.hasPreviousPage ? 1 : 0.5 }}
              >
                <ChevronLeft size={14} style={{ marginRight: '4px' }} /> Previous
              </button>
              <button
                className="staff-tab-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.pageNumber + 1)}
                style={{ padding: '6px 12px', opacity: pagination.hasNextPage ? 1 : 0.5 }}
              >
                Next <ChevronRight size={14} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
