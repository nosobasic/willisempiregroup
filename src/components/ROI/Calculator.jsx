import React, { useMemo, useState } from 'react';
import { track } from '../../utils/analytics';

function paybackDays({ leadValue, assetsPerMonth, visibilityLiftPct = 15, convRate = 0.02 }) {
  const newLeads = assetsPerMonth * (visibilityLiftPct / 100);
  const newSales = newLeads * convRate;
  const newRevenueMonthly = newSales * leadValue;
  const coreCost = 197;
  const days = (coreCost / Math.max(newRevenueMonthly, 1)) * 30;
  return Math.round(days);
}

export default function ROICalculator() {
  const [leadValue, setLeadValue] = useState(200);
  const [assetsPerMonth, setAssetsPerMonth] = useState(8);
  const [visibilityLiftPct, setVisibilityLiftPct] = useState(15);
  const [convRate, setConvRate] = useState(2);

  const days = useMemo(() => {
    const d = paybackDays({
      leadValue: Number(leadValue) || 0,
      assetsPerMonth: Number(assetsPerMonth) || 0,
      visibilityLiftPct: Number(visibilityLiftPct) || 0,
      convRate: Number(convRate) / 100 || 0,
    });
    return d;
  }, [leadValue, assetsPerMonth, visibilityLiftPct, convRate]);

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
      <h3 style={{ marginTop: 0 }}>ROI Calculator</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Lead value ($)</span>
          <input type="number" value={leadValue} onChange={(e) => setLeadValue(e.target.value)} min={0} style={{ padding: 8, borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Assets per month</span>
          <input type="number" value={assetsPerMonth} onChange={(e) => setAssetsPerMonth(e.target.value)} min={0} style={{ padding: 8, borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Visibility lift (%)</span>
          <input type="number" value={visibilityLiftPct} onChange={(e) => setVisibilityLiftPct(e.target.value)} min={0} style={{ padding: 8, borderRadius: 8 }} />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Conversion rate (%)</span>
          <input type="number" value={convRate} onChange={(e) => setConvRate(e.target.value)} min={0} style={{ padding: 8, borderRadius: 8 }} />
        </label>
      </div>
      <button
        onClick={() => track('roi_calculated', { leadValue: Number(leadValue), assetsPerMonth: Number(assetsPerMonth), visibilityLiftPct: Number(visibilityLiftPct), convRate: Number(convRate) / 100, payback_days: days })}
        style={{ marginTop: 12 }}
      >
        Calculate
      </button>
      <div style={{ marginTop: 12 }}>
        Estimated payback: <strong>{Number.isFinite(days) ? days : '—'} days</strong>
      </div>
    </div>
  );
}


