import React from 'react';

export default function ChecklistPreview() {
  const bullets = [
    'Connect your existing tools',
    'Enable AI visibility monitors',
    'Import your growth assets',
    'Review auto-heal playbooks',
    'Pick your 7-day win goal',
  ];
  return (
    <div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {bullets.map((b) => (
          <li key={b} style={{ marginBottom: 6 }}>{b}</li>
        ))}
      </ul>
      <a href="#winplan" style={{ display: 'inline-block', marginTop: 8 }}>View full plan</a>
    </div>
  );
}


