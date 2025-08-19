import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProofCounters from '../components/Proof/Counters';
import ChecklistPreview from '../components/Onboarding/ChecklistPreview';
import ValueStackTable from '../components/ValueStack/Table';
import PricingPlans from '../components/Pricing/Plans';
import ROICalculator from '../components/ROI/Calculator';
import FAQList from '../components/FAQ/List';
import StickyCTA from '../components/StickyCTA';
import ExitIntentModal from '../components/Modal/ExitIntent.jsx';
import { appendQuery, getParam } from '../utils/appendQuery';
import { track } from '../utils/analytics';
import { setSEO } from '../utils/seo';

export default function RevenueRipplePage() {
  useEffect(() => { track('rr_core_viewed'); }, []);
  useEffect(() => {
    setSEO({
      title: 'Scale your business without hiring a team. — Revenue Ripple',
      description: 'Outcomes-first tools—AI visibility + an always-on command center—with training included. Set up in 30 minutes, get your first insights in 24 hours.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  const plan = getParam('plan') || getParam('rec') || 'core';

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        {/* 1) Hero */}
        <section style={{ textAlign: 'center', margin: '24px 0' }}>
          <h1>Scale your business without hiring a team.</h1>
          <p style={{ color: '#94A3B8', maxWidth: 760, margin: '12px auto' }}>
            Outcomes-first tools—AI visibility + an always-on command center—with training included. Set up in 30 minutes, get your first insights in 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={appendQuery(`/checkout?plan=${plan}`)} className="primary" style={{ background: '#2563eb', color: '#fff', padding: '12px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }} onClick={() => { track('cta_clicked', { location: 'hero', plan }); track('checkout_started', { source: 'hero', plan }); }}>Start OS Core</a>
            <a href="#winplan" className="secondary" style={{ padding: '12px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>See 7-Day Win Plan</a>
          </div>
        </section>

        {/* 2) Proof Counters */}
        <section>
          <ProofCounters />
        </section>

        {/* 3) Outcomes */}
        <section>
          <h3>Outcomes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {['Capture demand', 'Prevent outages', 'Ship faster'].map((o) => (
              <div key={o} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>{o}</div>
            ))}
          </div>
        </section>

        {/* 4) 7-Day Win Plan preview */}
        <section id="winplan">
          <h3>7-Day Win Plan</h3>
          <ChecklistPreview />
        </section>

        {/* 5) Value Stack */}
        <section>
          <h3>Value Stack</h3>
          <ValueStackTable />
        </section>

        {/* 6) Pricing */}
        <section>
          <h3>Pricing</h3>
          <PricingPlans defaultPlan={plan} />
        </section>

        {/* 7) ROI Calculator */}
        <section>
          <ROICalculator />
        </section>

        {/* 8) Case Tiles */}
        <section>
          <h3>Case Studies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 700 }}>Operator #{i}</div>
                <div style={{ color: '#94A3B8' }}>Grew capture rate by 27% in 14 days.</div>
                <a href={appendQuery(`/revenue-ripple?rec=${plan}`)} style={{ marginTop: 8, display: 'inline-block' }}>See details →</a>
              </div>
            ))}
          </div>
        </section>

        {/* 9) FAQs */}
        <section>
          <FAQList />
        </section>

        {/* 10) Guarantee */}
        <section>
          <div style={{ padding: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
            14-day guarantee. If you do not get value, contact support for a full refund.
          </div>
        </section>
      </main>
      <Footer />
      <StickyCTA defaultPlan={plan} />
      <ExitIntentModal />
    </div>
  );
}


