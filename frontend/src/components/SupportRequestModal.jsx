import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FaWhatsapp } from 'react-icons/fa';
import { BiLogoGmail } from 'react-icons/bi';

const WHATSAPP_NUMBER = '0547796429';
const EMAIL = 'Alva.knowladge@gmail.com';

export default function SupportRequestModal({
  open,
  onClose,
  orderId,
  phone,
  prefillEmail,
  hideNewUser,
  contactOnly,
}) {
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(prefillEmail || '');
      setIsNewUser(false);
      setMessage('');
      setError('');
      setSuccess(false);
      setSending(false);
    }
  }, [open, prefillEmail]);

  if (!open) return null;

  const disabled = sending || !email.trim() || !message.trim();

  async function handleSubmit() {
    if (disabled) return;
    setSending(true);
    setError('');
    setSuccess(false);
    try {
      const body = {
        email: email.trim(),
        message: message.trim(),
        isNewUser,
      };
      if (orderId) body.orderId = orderId;
      if (phone) body.phone = phone;
      await api('/api/support/request', { method: 'POST', body });
      setSuccess(true);
      setMessage('');
    } catch (err) {
      console.error('Support request failed', err);
      setError('تعذر إرسال الاستفسار، حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
        <div
          className="bg-brand-dark border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-glass-lg relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}>
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

          <h3 className="text-xl font-bold mb-2 text-white relative z-10">
            مساعدة؟
          </h3>
          <p className="text-sm text-gray-400 mb-6 relative z-10 leading-relaxed">
            {contactOnly
              ? 'إذا واجهت مشكلة في تفعيل أو تجديد الاشتراك، يمكنك ارسال استفسارك علي القنوات التاليه وسنقوم بالرد عليك في أقرب وقت.'
              : 'إذا واجهت مشكلة في تفعيل أو تجديد الاشتراك، يمكنك كتابة استفسارك هنا وسنقوم بالرد عليك في أقرب وقت.'}
          </p>

          <div className="flex flex-col gap-3 mb-6 relative z-10">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">
                <FaWhatsapp className="w-5 h-5 text-[#25D366]" />
              </span>
              <span className="text-sm font-mono text-gray-300">
                {WHATSAPP_NUMBER}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">
                <BiLogoGmail className="w-5 h-5 text-[#EA4335]" />
              </span>
              <span className="text-sm text-gray-300 truncate">{EMAIL}</span>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {!contactOnly && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      className="input-base flex-1"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="أدخل بريدك الإلكتروني"
                    />
                    {!hideNewUser && (
                      <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={isNewUser}
                          onChange={(e) => setIsNewUser(e.target.checked)}
                          className="w-4 h-4 rounded bg-white/10 border-gray-600 text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="text-xs text-gray-300 whitespace-nowrap">
                          مستخدم جديد
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <textarea
                  className="input-base min-h-[100px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="أدخل رسالتك هنا"
                />

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={sending}>
                    إلغاء
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={disabled}>
                    {sending ? 'جارٍ الإرسال...' : 'إرسال'}
                  </button>
                </div>
              </>
            )}
            {contactOnly && (
              <div className="flex justify-end mt-4">
                <button className="btn btn-primary w-full" onClick={onClose}>
                  حسناً
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60]"
          onClick={() => setSuccess(false)}>
          <div
            className="bg-brand-dark border border-brand-primary/30 rounded-full p-10 max-w-sm text-center shadow-[0_0_50px_rgba(56,189,248,0.2)] animate-scale-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl animate-pulse"></div>
                <img
                  src="/Pulse-logo.png"
                  alt="Pulse"
                  className="w-16 h-16 rounded-full relative z-10"
                />
              </div>

              <h4 className="text-lg font-bold text-white">
                تم استلام طلبك بنجاح
              </h4>
              <div className="text-sm text-gray-300 leading-relaxed">
                سيقوم فريق Alva بالرد عليك في أقرب وقت.
                <br />
                <span className="text-xs text-gray-500 mt-2 block">
                  قد يستغرق الرد من 24 الى 48 ساعة
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
