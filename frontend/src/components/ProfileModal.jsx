import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ open, onClose, onSuccess }) {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState({ displayName: '', email: '' });

  useEffect(() => {
    if (!open) return;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const res = await api('/api/profile');
        const u = res.data.user || {};
        setDisplayName(u.display_name || '');
        setEmail(u.email || '');
        setInitial({ displayName: u.display_name || '', email: u.email || '' });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const body = {};
      const nameChanged = displayName !== initial.displayName;
      const emailChanged = email !== initial.email;
      const passChanged = newPassword.trim().length > 0;
      if (nameChanged) body.displayName = displayName;
      if (emailChanged) body.email = email;
      if (emailChanged || passChanged) {
        if (!currentPassword) {
          setError('يلزم إدخال كلمة المرور الحالية عند تغيير البريد أو كلمة المرور.');
          setLoading(false);
          return;
        }
        body.currentPassword = currentPassword;
      }
      if (passChanged) body.newPassword = newPassword;

      const res = await api('/api/profile', { method: 'PUT', body });
      const updated = res.data.user;
      setUser(prev => ({ ...prev, email: updated.email, display_name: updated.display_name }));
      onSuccess?.('تم حفظ التغييرات بنجاح');
      onClose?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return createPortal(
    <>
    {open && <div className="panel-overlay" onClick={onClose} />}
    <div className={open ? 'profile-panel open' : 'profile-panel'} onClick={e => e.stopPropagation()}>
      <div className="panel-header">
        <h3 style={{margin:0}}>تعديل بيانات الحساب</h3>
      </div>
      <div className="panel-body">
        <div className="form">
          <label>اسم المستخدم</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ادخل اسمك أو اسم العرض" />

          <label>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@domain.com" />

          <div style={{marginTop:8, fontWeight:600}}>تغيير كلمة المرور (اختياري)</div>
          <label>كلمة المرور الحالية</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          <label>كلمة المرور الجديدة</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />

          {error && <div className="error">{error}</div>}
        </div>
      </div>
      <div className="panel-footer">
        <input value={''} readOnly style={{opacity:0, pointerEvents:'none'}} />
        <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
      </div>
    </div>
    </>,
    document.body
  );
}
