import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';
import { useToast } from '../context/ToastContext';

export function CustomerHistory({ user, onBack }) {
  const showToast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [selectedPurchaseVehicleId, setSelectedPurchaseVehicleId] = useState('all');
  const [selectedServiceVehicleId, setSelectedServiceVehicleId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load vehicles
      const vehiclesData = await apiFetch(`/customer/${user.id}/vehicles`);
      if (vehiclesData) setVehicles(vehiclesData);

      // Load purchase history
      const purchaseData = await apiFetch(`/customer/${user.id}/purchase-history`);
      if (purchaseData) setPurchaseHistory(purchaseData);

      // Load service history
      const serviceData = await apiFetch(`/customer/${user.id}/service-history`);
      if (serviceData) setServiceHistory(serviceData);
    } catch (error) {
      console.error('Error loading history data:', error);
      showToast('error', 'Failed to load history data');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredPurchaseHistory = () => {
    if (selectedPurchaseVehicleId === 'all') {
      return purchaseHistory;
    }
    return purchaseHistory.filter(x => x.vehicleId === parseInt(selectedPurchaseVehicleId));
  };

  const getFilteredServiceHistory = () => {
    if (selectedServiceVehicleId === 'all') {
      return serviceHistory;
    }
    return serviceHistory.filter(x => x.vehicleId === parseInt(selectedServiceVehicleId));
  };

  const filteredPurchaseHistory = getFilteredPurchaseHistory();
  const filteredServiceHistory = getFilteredServiceHistory();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {onBack && (
        <button onClick={onBack} className="btn-small" style={{ marginBottom: '1rem', background: '#cbd5e1', width: 'fit-content' }}>← Back</button>
      )}

      {/* Purchase History Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Purchase History</h2>
        </div>

        {/* Vehicle Filter Dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Filter by Vehicle:</label>
          <select
            value={selectedPurchaseVehicleId}
            onChange={(e) => setSelectedPurchaseVehicleId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.plateNumber} - {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        {/* Purchase History Table */}
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading purchase history...</p>
        ) : filteredPurchaseHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Invoice Number</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Purchase Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Purchased Parts</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Amount Paid | Total Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchaseHistory.map(purchase => {
                  // Calculate amount paid based on payment status
                  const totalAmount = purchase.totalAmount;
                  let amountPaid = totalAmount;
                  if (purchase.paymentStatus === 'half-payment') {
                    amountPaid = totalAmount * 0.5;
                  } else if (purchase.paymentStatus === 'partial-payment') {
                    amountPaid = totalAmount * 0.1;
                  }
                  
                  return (
                  <tr key={purchase.id} style={{ borderBottom: '1px solid #e2e8f0', hoverBackground: '#f8fafc' }}>
                    <td style={{ padding: '1rem' }}>{purchase.invoiceNumber}</td>
                    <td style={{ padding: '1rem' }}>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{purchase.vehicleNumber} - {purchase.vehicleModel}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{purchase.purchasedParts || '-'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>
                      Rs. {amountPaid.toFixed(2)} | Rs. {totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        background: purchase.paymentStatus?.toLowerCase().includes('paid') ? '#d1fae5' : '#fef3c7',
                        color: purchase.paymentStatus?.toLowerCase().includes('paid') ? '#065f46' : '#92400e'
                      }}>
                        {purchase.paymentStatus}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No purchase history found.</p>
        )}
      </div>

      {/* Service History Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Service History</h2>
        </div>

        {/* Vehicle Filter Dropdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Filter by Vehicle:</label>
          <select
            value={selectedServiceVehicleId}
            onChange={(e) => setSelectedServiceVehicleId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '1rem',
              fontFamily: 'inherit'
            }}
          >
            <option value="all">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.plateNumber} - {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        {/* Service History Table */}
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading service history...</p>
        ) : filteredServiceHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Service Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Service Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredServiceHistory.map(service => (
                  <tr key={service.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>{new Date(service.serviceDate).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>{service.vehicleNumber} - {service.vehicleModel}</td>
                    <td style={{ padding: '1rem' }}>{service.serviceType}</td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{service.description || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        background: '#d1fae5',
                        color: '#065f46'
                      }}>
                        {service.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Rs. {service.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No completed service history found.</p>
        )}
      </div>
    </div>
  );
}
