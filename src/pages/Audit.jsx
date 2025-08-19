import React, { useState } from 'react';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { track } from '../utils/analytics';

export default function AuditPage() {
  const navigate = useNavigate();
  const [teamSize, setTeamSize] = useState('1');
  const [integrations, setIntegrations] = useState('1');
  const [maturity, setMaturity] = useState('starting');
  const [assetsPerMonth, setAssetsPerMonth] = useState(4);

  const onSubmit = (e) => {
    e.preventDefault();
    const results = { teamSize: Number(teamSize), integrations: Number(integrations), maturity, assetsPerMonth: Number(assetsPerMonth) };
    localStorage.setItem('rr_audit', JSON.stringify(results));
    let rec = 'core';
    if (results.teamSize >= 3 || results.integrations >= 4) rec = 'pro';
    if (results.maturity === 'starting') rec = 'core';
    track('audit_completed', results);
    const score = `${results.teamSize}-${results.integrations}-${results.assetsPerMonth}`;
    navigate(`/revenue-ripple?rec=${rec}&score=${encodeURIComponent(score)}`);
  };

  useEffect(() => {
    setSEO({
      title: '60-Second Audit — Revenue Ripple',
      description: 'Answer a few questions to get a recommendation and personalized plan.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <h1>60-Second Audit</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
            <legend>Team size</legend>
            {[1,2,3,4,5].map((n) => (
              <label key={n} style={{ marginRight: 12 }}>
                <input type="radio" name="team" value={n} checked={String(n)===teamSize} onChange={(e) => setTeamSize(e.target.value)} /> {n}
              </label>
            ))}
          </fieldset>

          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
            <legend>Integrations in your stack</legend>
            {[1,2,3,4,5,6].map((n) => (
              <label key={n} style={{ marginRight: 12 }}>
                <input type="radio" name="integrations" value={n} checked={String(n)===integrations} onChange={(e) => setIntegrations(e.target.value)} /> {n}
              </label>
            ))}
          </fieldset>

          <fieldset style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
            <legend>Where are you today?</legend>
            {[
              ['starting', 'Just getting started'],
              ['growing', 'Growing steadily'],
              ['scaling', 'Scaling up'],
            ].map(([value, label]) => (
              <label key={value} style={{ display: 'block', marginBottom: 8 }}>
                <input type="radio" name="maturity" value={value} checked={maturity===value} onChange={(e) => setMaturity(e.target.value)} /> {label}
              </label>
            ))}
          </fieldset>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Assets you publish per month (numeric)</span>
            <input type="number" value={assetsPerMonth} onChange={(e) => setAssetsPerMonth(e.target.value)} min={0} style={{ padding: 8, borderRadius: 8 }} />
          </label>

          <button type="submit" onClick={() => track('audit_started')} style={{ background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, width: 'fit-content' }}>Get my recommendation</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}


