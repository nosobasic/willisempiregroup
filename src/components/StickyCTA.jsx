import React, { useEffect, useMemo, useState } from 'react';
import { appendQuery, getParam } from '../utils/appendQuery';
import { track } from '../utils/analytics';

export default function StickyCTA({ href = '', text = 'Start OS Core', defaultPlan = 'core' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const plan = useMemo(() => {
    const planFromUrl = getParam('plan');
    const recFromUrl = getParam('rec');
    return planFromUrl || recFromUrl || defaultPlan;
  }, [defaultPlan]);

  const finalHref = useMemo(() => {
    const base = href && href.length > 0 ? href : `/checkout?plan=${encodeURIComponent(plan)}`;
    return appendQuery(base);
  }, [href, plan]);

  if (!show) return null;

  return (
    <div style={{position:'fixed',left:0,right:0,bottom:0,background:'#111827',color:'#fff',padding:'12px',display:'flex',justifyContent:'center',zIndex:60,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
      <a
        href={finalHref}
        onClick={() => {
          track('cta_clicked', { location: 'sticky_bar', plan });
          track('checkout_started', { source: 'sticky_bar', plan });
        }}
        style={{background:'#2563eb',color:'#fff',padding:'12px 20px',borderRadius:999,fontWeight:700,textDecoration:'none'}}
      >
        {text} →
      </a>
    </div>
  );
}


