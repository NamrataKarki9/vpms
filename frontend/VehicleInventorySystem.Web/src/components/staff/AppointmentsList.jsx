import React from 'react';

const AppointmentsList = ({ appointments }) => {
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <div className="card-title">Today's Appointments</div>
      </div>
      <div className="card-body">
        {appointments.map((appt) => (
          <div key={appt.id} className="list-row">
            <div className="row-left">
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{appt.customer?.name || 'Unknown'}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {appt.vehicle ? `${appt.vehicle.make} ${appt.vehicle.model}` : 'General Service'}
              </span>
            </div>
            <div className="row-right">
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{appt.appointmentTime}</div>
              <span className="badge badge-loyalty" style={{ fontSize: '10px' }}>{appt.serviceType}</span>
            </div>
          </div>
        ))}
        {appointments.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
            No appointments scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;
