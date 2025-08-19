import React from 'react';
import { Link } from 'react-router-dom';
import { appendQuery } from '../utils/appendQuery';

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', maxWidth: 1200, margin: '0 auto' }}>
        <div>© {new Date().getFullYear()} Willis Empire Group</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={appendQuery('/privacy')} style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacy</Link>
          <Link to={appendQuery('/terms')} style={{ color: '#94A3B8', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}


