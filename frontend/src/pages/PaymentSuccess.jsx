import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('جاري التحقق من عملية الدفع...');

  useEffect(() => {
    const invoiceId = searchParams.get('id');
    // const paymentStatus = searchParams.get('status'); // Removed as per new logic

    if (!invoiceId) {
      // No invoice ID in URL - show manual activation option
      setStatus('manual');
      setMessage('أدخل معرف الفاتورة لتفعيل اشتراكك');
      return;
    }

    // Auto-verify if we have invoice ID
    verifyPayment(invoiceId);
  }, [searchParams]);

  const verifyPayment = async (invoiceId) => {
    setStatus('verifying');
    setMessage('جاري التحقق من عملية الدفع...');

    try {
      const response = await fetch(`/api/payments/verify/${invoiceId}`);
      const data = await response.json();

      if (
        data.success &&
        (data.status === 'activated' || data.status === 'already_active')
      ) {
        setStatus('success');
        setMessage('تم تفعيل اشتراكك بنجاح!');
        setTimeout(() => {
          navigate('/app');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || data.error || 'حدث خطأ في التحقق من الدفع');
      }
    } catch (error) {
      setStatus('error');
      setMessage('حدث خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-brand-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">
              جاري التحقق...
            </h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">تم بنجاح! 🎉</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-primary w-full">
              الذهاب إلى لوحة التحكم
            </button>
          </>
        )}

        {status === 'manual' && (
          <>
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              تفعيل الاشتراك
            </h2>
            <p className="text-gray-400 mb-4">
              انسخ معرف الفاتورة من صفحة Moyasar والصقه هنا:
            </p>
            <input
              type="text"
              placeholder="c011f291-2f5f-4366-9ad3-3f47c5c88211"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white mb-4 focus:border-brand-primary focus:outline-none"
              onPaste={(e) => {
                const invoiceId = e.clipboardData.getData('text').trim();
                if (invoiceId) {
                  verifyPayment(invoiceId);
                }
              }}
            />
            <p className="text-xs text-gray-500 mb-6">
              ستجد المعرف في أعلى صفحة الدفع بعد كلمة "Invoice Paid"
            </p>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-secondary w-full">
              العودة إلى لوحة التحكم
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">حدث خطأ</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-primary w-full">
              العودة إلى لوحة التحكم
            </button>
          </>
        )}
      </div>
    </div>
  );
}
