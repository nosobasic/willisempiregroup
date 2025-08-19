import React from 'react';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { appendQuery } from '../utils/appendQuery';

export default function CaseStudiesPage() {
  const cases = [
    ['7-day capture lift', 'Operator consolidated alerts', '27% capture increase'],
    ['Fewer outages', 'Monitors + auto-heal playbooks', '2.1x uptime'],
    ['Faster shipping', 'Command center coordination', '3x weekly releases'],
  ];
  useEffect(() => {
    setSEO({
      title: 'Case Studies — Revenue Ripple',
      description: 'Real outcomes from operators using the OS to scale.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <h1>Case Studies</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {cases.map(([h, sub, metric]) => (
            <div key={h} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700 }}>{h}</div>
              <div style={{ color: '#94A3B8' }}>{sub}</div>
              <div style={{ marginTop: 8 }}>{metric}</div>
              <a href={appendQuery('/revenue-ripple')} style={{ display: 'inline-block', marginTop: 12 }}>See the OS →</a>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}


