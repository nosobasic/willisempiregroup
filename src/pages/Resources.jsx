import React, { useState } from 'react';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { appendQuery } from '../utils/appendQuery';
import { track } from '../utils/analytics';

export default function ResourcesPage() {
  const [email, setEmail] = useState('');
  const onSubmit = (e) => {
    e.preventDefault();
    track('intent_clicked', { location: 'resources_capture', email });
    window.location.href = appendQuery('/revenue-ripple');
  };
  useEffect(() => {
    setSEO({
      title: 'Resources — Revenue Ripple',
      description: 'Lead magnets and tools to help you scale.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h1>Resources</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            ['Context Engineering Ebook', '/images/downloads/context-engineering-ebook.pdf'],
            ['Revenue Ripple One-Pager', '#'],
          ].map(([title, href]) => (
            <a key={title} href={href} style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>{title}</a>
          ))}
        </div>
        <form onSubmit={onSubmit} style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8 }} />
          <button type="submit" style={{ background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 8, fontWeight: 700 }}>Get updates</button>
        </form>
      </main>
      <Footer />
    </div>
  );
}


