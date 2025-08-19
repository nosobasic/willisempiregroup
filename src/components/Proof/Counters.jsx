import React from 'react';

export default function ProofCounters({ incidentsResolvedWeek = 128, mentionsCapturedWeek = 312 }) {
  const item = (label, value) => (
    <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value.toLocaleString()}</div>
      <div style={{ color: '#94A3B8' }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      {item('Incidents resolved this week', incidentsResolvedWeek)}
      {item('Mentions captured this week', mentionsCapturedWeek)}
      {item('Avg. setup time', '30 min')}
    </div>
  );
}


