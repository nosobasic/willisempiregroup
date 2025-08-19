import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { appendQuery } from '../utils/appendQuery';
import { track } from '../utils/analytics';

export default function Navbar() {
  const location = useLocation();
  const primaryHref = appendQuery('/revenue-ripple');
  const links = [
    { to: '/', label: 'Home' },
    { to: '/revenue-ripple', label: 'Revenue Ripple' },
    { to: '/audit', label: 'Audit' },
    { to: '/case-studies', label: 'Case Studies' },
    { to: '/resources', label: 'Resources' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)',
      background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', maxWidth: 1200, margin: '0 auto'}}>
        <Link to={appendQuery('/')} style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
          Willis Empire Group
        </Link>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {links.map((l) => (
            <Link key={l.to} to={appendQuery(l.to)} style={{ color: location.pathname === l.to ? '#60A5FA' : '#ddd', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
          <a
            href={primaryHref}
            onClick={() => track('intent_clicked', { from: 'navbar' })}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: '#fff', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700
            }}
          >Start OS Core</a>
        </div>
      </div>
    </nav>
  );
}


