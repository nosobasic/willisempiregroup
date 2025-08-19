import React from 'react';

export default function FAQList() {
  const faqs = [
    ['How fast is setup?', 'Most users complete setup in ~30 minutes and get insights within 24 hours.'],
    ['Do I need a team?', 'No. The command center and monitors are designed for solo operators and small teams.'],
    ['Can I cancel anytime?', 'Yes, there is no long-term contract.'],
  ];
  return (
    <div>
      {faqs.map(([q, a]) => (
        <details key={q} style={{ marginBottom: 8, padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
          <div style={{ marginTop: 8, color: '#94A3B8' }}>{a}</div>
        </details>
      ))}
    </div>
  );
}


