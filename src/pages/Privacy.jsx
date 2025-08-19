import React from 'react';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  useEffect(() => {
    setSEO({
      title: 'Privacy Policy — Willis Empire Group',
      description: 'Privacy policy placeholder.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <h1>Privacy Policy</h1>
        <p>Placeholder content. Update with your actual policy.</p>
      </main>
      <Footer />
    </div>
  );
}


