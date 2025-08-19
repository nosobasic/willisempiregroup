import React, { useMemo } from 'react';
import { appendQuery, getParam } from '../../utils/appendQuery';
import { track } from '../../utils/analytics';

function PlanCard({ name, price, features = [], highlight = false }) {
  const plan = name.toLowerCase();
  const href = appendQuery(`/checkout?plan=${encodeURIComponent(plan)}`);
  return (
    <div style={{ border: `2px solid ${highlight ? '#60A5FA' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h4 style={{ margin: 0 }}>{name}</h4>
        <div style={{ fontWeight: 800 }}>{price}</div>
      </div>
      <ul style={{ paddingLeft: 18 }}>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <a
        href={href}
        onClick={() => { track('cta_clicked', { location: 'pricing', plan }); track('checkout_started', { source: 'pricing', plan }); }}
        style={{ display: 'inline-block', marginTop: 8, background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}
      >
        Choose {name}
      </a>
    </div>
  );
}

export default function PricingPlans({ defaultPlan = 'core' }) {
  const planFromUrl = getParam('plan');
  const recFromUrl = getParam('rec');
  const selected = useMemo(() => (planFromUrl || recFromUrl || defaultPlan).toLowerCase(), [planFromUrl, recFromUrl, defaultPlan]);

  const ribbon = 'Education $47 + Tracker $29 + Command Center $97 = $173+. Core is $197/mo.';

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#94A3B8', fontSize: 14 }}>{ribbon}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <PlanCard name="Pro" price="$497/mo" highlight={selected === 'pro'} features={[ 'Everything in Core', 'Team automations', 'Advanced integrations' ]} />
        <PlanCard name="Core" price="$197/mo" highlight={selected === 'core'} features={[ 'OS Core platform', 'AI visibility + command center', 'Training included' ]} />
        <PlanCard name="Lite" price="$97/mo" highlight={selected === 'lite'} features={[ 'Starter toolkit', 'Basic monitors' ]} />
        <PlanCard name="Education" price="$47/mo" highlight={selected === 'education'} features={[ 'Education + community' ]} />
      </div>
    </div>
  );
}


