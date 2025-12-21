import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProfileCard({ onCancel }) {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [initial, setInitial] = useState({ displayName: '', email: '' });

  useEffect(() => {
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
  }, []);

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
      setNotice('تم حفظ التغييرات بنجاح');
      setTimeout(() => setNotice(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-glass max-w-2xl mx-auto mt-8 p-6 md:p-8 animate-fade-in-up">
      <h2 className="text-xl font-bold font-display text-white mb-6 border-b border-white/10 pb-4">تعديل بيانات الحساب</h2>
      
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">اسم المستخدم</label>
          <input 
            type="text" 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)} 
            placeholder="ادخل اسمك أو اسم العرض" 
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">البريد الإلكتروني</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="example@domain.com" 
            className="input-base"
          />
        </div>

        <div className="pt-4 border-t border-white/5 mt-2">
           <div className="text-sm font-semibold text-gray-300 mb-3">تغيير كلمة المرور (اختياري)</div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs text-gray-400 mb-1.5">كلمة المرور الحالية</label>
               <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  className="input-base"
               />
             </div>
             <div>
               <label className="block text-xs text-gray-400 mb-1.5">كلمة المرور الجديدة</label>
               <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="input-base"
               />
             </div>
           </div>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-lg">{error}</div>}
        {notice && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-200 text-sm rounded-lg">{notice}</div>}

        <div className="flex justify-start pt-2">
          <button className="btn btn-primary px-8" onClick={submit} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
