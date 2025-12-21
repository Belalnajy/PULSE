import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BillingMock() {
  const dev = import.meta.env.DEV;
  const loc = useLocation();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const session = params.get('session');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { loadEntitlements } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api(`/api/payments/checkout/${session}`);
        if (mounted) setStatus(res.data || null);
      } catch (e) {
        if (mounted) setError(e.message || 'تعذر تحميل الجلسة');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (session) load();
    return () => { mounted = false; };
  }, [session]);

  async function simulatePaid() {
    try {
      await api(`/api/payments/checkout/${session}/mark-paid`, { method: 'POST' });
      await loadEntitlements?.();
      window.location.href = '/app';
    } catch (e) {
      setError(e.message || 'تعذر إتمام عملية الدفع التجريبية');
    }
  }

  async function simulateFailed() {
    try {
      await api(`/api/payments/checkout/${session}/mark-failed`, { method: 'POST' });
      const res = await api(`/api/payments/checkout/${session}`);
      setStatus(res.data || null);
    } catch (e) {
      setError(e.message || 'تعذر محاكاة الفشل');
    }
  }

  if (!dev) return <Navigate to="/login" replace />;

  return (
    <div className="main-layout">
      <div className="builder-card" style={{maxWidth:600, margin:'40px auto'}}>
        <div className="builder-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 className="section-title">الدفع التجريبي</h2>
        </div>
        <div className="builder-scroll" style={{padding:'12px 16px'}}>
          {loading ? (
            <div className="info">جاري التحميل...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <>
              <div className="info">Session: {status?.session_id}</div>
              <div className="info">Plan: {status?.plan_id}</div>
              <div className="info">Provider: {status?.provider}</div>
              <div className={status?.status === 'paid' ? 'success' : status?.status === 'failed' ? 'warning' : 'muted'}>Status: {status?.status}</div>
              <div className="row" style={{marginTop:10}}>
                <button className="btn btn-primary" onClick={simulatePaid} disabled={!session}>Simulate Paid</button>
                <button className="btn btn-secondary" onClick={simulateFailed} disabled={!session} style={{marginLeft:8}}>Simulate Failed</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
