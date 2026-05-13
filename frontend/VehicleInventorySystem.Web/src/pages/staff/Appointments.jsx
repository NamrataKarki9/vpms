import React from 'react';

const Appointments = ({ appointments }) => {
  return (
    <div className="staff-card">
      <div className="staff-card-header">
        <h3 className="staff-card-title">Service Appointments</h3>
      </div>
      <div className="staff-card-body">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Service</th>
              <th>Vehicle</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td><strong>{a.customer?.name}</strong></td>
                <td>{a.serviceType}</td>
                <td>{a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : 'N/A'}</td>
                <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                <td><strong>{a.appointmentTime}</strong></td>
                <td>
                  <span className="badge-pill" style={{ background: '#E6F1FB', color: '#185FA5' }}>
                    {a.status === 0 ? 'Pending' : (a.status === 1 ? 'Confirmed' : 'Completed')}
                  </span>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No appointments scheduled.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;
