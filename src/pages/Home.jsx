import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { appendQuery } from '../utils/appendQuery';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';

export default function HomePage() {
  useEffect(() => {
    setSEO({
      title: 'Build. Automate. Compound. — Willis Empire Group',
      description: 'Outcomes-first systems to grow without hiring — see the Business OS and take the 60-second audit.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <section style={{ textAlign: 'center', margin: '40px 0' }}>
          <h1>Build. Automate. Compound.</h1>
          <p style={{ color: '#94A3B8', maxWidth: 720, margin: '12px auto' }}>
            Systems, training, and an always-on command center to scale solo.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <a href={appendQuery('/revenue-ripple')} className="primary" style={{ background: '#2563eb', color: '#fff', padding: '12px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>See My Business OS</a>
            <Link to={appendQuery('/audit')} className="secondary" style={{ padding: '12px 16px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>Take the 60-Second Audit</Link>
          </div>
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, opacity: 0.8 }}>
          {['100+ operators', '30 min setup', '24/7 monitors'].map((t) => (
            <div key={t} style={{ padding: 12, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, textAlign: 'center' }}>{t}</div>
          ))}
        </section>
        <section style={{ marginTop: 40 }}>
          <h3>About Donte</h3>
          <p style={{ color: '#94A3B8' }}>Entrepreneur and builder focused on leverage: code, content, and capital.</p>
          <Link to={appendQuery('/case-studies')}>See case studies →</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}


