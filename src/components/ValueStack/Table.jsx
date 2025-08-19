import React, { useMemo } from 'react';

const VALUE_ROWS = [
  ['Full Learning Platform', '46+ tutorials, 25+ courses, always updated.', '$2,500/mo'],
  ['AI Insights Tool', 'Track competitors + optimize prompts for AI results.', '$1,500/mo'],
  ['AI Command Center', '24/7 monitors & auto-heal for your automations.', '$1,000/mo'],
  ['Affiliate Program', 'Plug-and-play assets to earn recurring.', '$500/mo'],
  ['Reseller/White-Label', 'Sell under your brand with white-label reports.', '$2,000/mo'],
  ['Bonus: Prebuilt Funnels', 'Launch-ready flows.', '$1,000 value'],
  ['Bonus: Swipe Library', 'Ads, emails, landing copy.', '$500 value'],
  ['Bonus: Strategy Calls', 'Quarterly plans to keep scaling.', '$2,000 value'],
];

function parseMoney(str) {
  const match = String(str).replace(/[^0-9.]/g, '');
  const num = parseFloat(match || '0');
  return Number.isFinite(num) ? num : 0;
}

export default function ValueStackTable() {
  const total = useMemo(() => VALUE_ROWS.reduce((sum, row) => sum + parseMoney(row[2]), 0), []);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Benefit</th>
            <th style={{ textAlign: 'left', padding: '8px 12px' }}>Details</th>
            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Perceived value</th>
          </tr>
        </thead>
        <tbody>
          {VALUE_ROWS.map(([title, desc, val]) => (
            <tr key={title}>
              <td style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>{title}</td>
              <td style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>{desc}</td>
              <td style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' }}>{val}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: '12px', fontWeight: 700 }}>Total Perceived Value</td>
            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800 }}>
              ${total.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}


