import React from 'react';
import { useEffect } from 'react';
import { setSEO } from '../utils/seo';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsPage() {
  useEffect(() => {
    setSEO({
      title: 'Terms of Service — Willis Empire Group',
      description: 'Terms of service placeholder.',
      ogImage: '/og/revenue-ripple.png',
    });
  }, []);

  return (
    <div>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <h1>Terms of Service</h1>
        <p>Placeholder content. Update with your actual terms.</p>
      </main>
      <Footer />
    </div>
  );
}


