import React, { useState } from 'react';
import { api } from '../api/client';

export default function ForcePasswordChangeModal({ open, onDone }) {
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/force-change-password', { method: 'POST', body: { newPassword: newPwd } });
      setError('');
      onDone?.();
    } catch (e) {
      setError('تعذر تحديث كلمة المرور، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !newPwd || !confirmPwd || newPwd !== confirmPwd;

  return (
    <div className="force-modal-overlay">
      <div className="force-modal-card" onClick={e => e.stopPropagation()}>
        <h3 className="force-modal-title">تحديث كلمة المرور</h3>
        <p className="force-modal-text">تم تعيين كلمة مرور مؤقتة لحسابك، الرجاء تعيين كلمة مرور جديدة للاستمرار في استخدام التطبيق.</p>
        <form onSubmit={handleSubmit} className="force-modal-form">
          <div className="force-modal-field">
            <label>كلمة المرور الجديدة</label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
          </div>
          <div className="force-modal-field">
            <label>تأكيد كلمة المرور</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
          </div>
          {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
          <div className="force-modal-actions">
            <button type="submit" className="btn btn-primary" disabled={disabled}>{loading ? 'جاري التحديث...' : 'تحديث'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

