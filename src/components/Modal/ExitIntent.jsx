import React, { useEffect, useState } from 'react';
import { appendQuery } from '../../utils/appendQuery';
import { track } from '../../utils/analytics';

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem('rr_exit_seen');
    if (already) return;

    const timer = setTimeout(() => setOpen(true), 20000);
    const onLeave = (e) => {
      if (e.clientY <= 0) setOpen(true);
    };
    document.addEventListener('mouseout', onLeave);
    return () => { clearTimeout(timer); document.removeEventListener('mouseout', onLeave); };
  }, []);

  useEffect(() => {
    if (open) sessionStorage.setItem('rr_exit_seen', '1');
  }, [open]);

  if (!open) return null;

  const liteHref = appendQuery('/checkout?plan=lite');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0B1220', color: '#fff', padding: 20, borderRadius: 12, maxWidth: 520, width: '92%', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ marginTop: 0 }}>Not ready for Core yet?</h3>
        <p style={{ color: '#94A3B8' }}>Grab Lite to start building momentum. You can upgrade anytime.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => setOpen(false)} style={{ padding: '8px 12px', borderRadius: 8 }}>Keep browsing</button>
          <a
            href={liteHref}
            onClick={() => { track('cta_clicked', { location: 'exit_intent', plan: 'lite' }); track('checkout_started', { source: 'exit_intent', plan: 'lite' }); }}
            style={{ background: '#2563eb', color: '#fff', padding: '10px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}
          >
            See Lite
          </a>
        </div>
      </div>
    </div>
  );
}


