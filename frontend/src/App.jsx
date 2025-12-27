import React, { useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import Layout from './components/Layout';
import CampaignBuilder from './components/CampaignBuilder';
import ResultsCard from './components/ResultsCard';
import HashtagsDisplay from './components/HashtagsDisplay';
import PlatformTips from './components/PlatformTips';
import RightSidebar from './components/RightSidebar';
import ProfileCard from './components/ProfileCard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import SubscriptionPrompt from './components/SubscriptionPrompt';
import AdminDashboard from './pages/AdminDashboard';
import SubscriptionPage from './pages/Subscription';
import BillingMock from './pages/BillingMock';
import Splash from './pages/Splash';
import Welcome from './pages/Welcome';
import DashboardHome from './pages/DashboardHome';
import PricingManagement from './pages/PricingManagement';
import PaymentSuccess from './pages/PaymentSuccess';
import './styles.css';
import ClosedNotes from './pages/ClosedNotes';

function Protected({ children }) {
  const token = localStorage.getItem('auth_token');
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
}

function EntryRoute() {
  const token = localStorage.getItem('auth_token');
  if (token) return <Navigate to="/app" replace />;
  const seen = localStorage.getItem('seen_splash') === '1';
  return <Navigate to={seen ? '/welcome' : '/splash'} replace />;
}

function AppShell() {
  const [outputs, setOutputs] = useState({});
  const [regeneratingPlatform, setRegeneratingPlatform] = useState(null);
  const campaignBuilderRef = React.useRef(null);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState('dashboard');
  const [chatOpen, setChatOpen] = useState(false);

  const {
    mustChangePassword,
    setMustChangePassword,
    entitlements,
    loadEntitlements,
    user,
  } = useAuth();
  const isAdmin = useMemo(
    () => !!entitlements?.is_admin || user?.email === 'Alva@admin.com',
    [entitlements, user]
  );
  const shouldBlock = !!(entitlements?.requires_renewal_block && !isAdmin);

  React.useEffect(() => {
    loadEntitlements?.();
  }, [view]);

  React.useEffect(() => {
    // Check for payment status in URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus) {
      switch (paymentStatus) {
        case 'success':
          alert('✅ تم تفعيل اشتراكك بنجاح! مرحباً بك في Pulse 🎉');
          loadEntitlements?.();
          break;
        case 'pending':
          alert('⏳ الدفع قيد المعالجة. سيتم تفعيل اشتراكك قريباً.');
          break;
        case 'cancelled':
          alert('❌ تم إلغاء عملية الدفع والتحقق.');
          break;
        case 'rejected':
          alert('❌ تم رفض عملية الدفع من قبل المصدر (البنك المصدر للبطاقة).');
          break;
        case 'denied':
          alert('❌ تم رفض المعاملة - الحساب غير موثق أو الرصيد غير كافٍ.');
          break;
        case 'unavailable':
          alert('⚠️ خدمة التحقق غير متاحة حالياً. يرجى المحاولة لاحقاً.');
          break;
        case 'server_error':
          alert('⚠️ حدث خطأ في خادم التحقق. يرجى التواصل مع الدعم الفني.');
          break;
        case 'already_active':
          alert('✅ الاشتراك مفعّل بالفعل!');
          loadEntitlements?.();
          break;
        case 'verification_failed':
          alert('⚠️ فشل التحقق من عملية الدفع. يرجى التواصل مع الدعم الفني.');
          break;
        case 'session_not_found':
          alert('⚠️ جلسة الدفع غير موجودة أو انتهت صلاحيتها.');
          break;
        case 'missing_id':
          alert('⚠️ بيانات الدفع غير مكتملة.');
          break;
        case 'failed':
        default:
          alert(
            '❌ فشلت عملية الدفع. يرجى المحاولة مرة أخرى أو التأكد من بيانات البطاقة.'
          );
          break;
      }
      // Clean URL
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  React.useEffect(() => {
    if (entitlements && !isAdmin && !entitlements.is_verified) {
      window.location.href = '/verify-otp';
    }
  }, [entitlements, isAdmin]);

  const left = (
    <RightSidebar
      onNavigate={setView}
      currentView={view}
      chatOpen={chatOpen}
      setChatOpen={setChatOpen}
    />
  );

  let right;

  const resultsRef = React.useRef(null);
  const prevOutputsCountRef = React.useRef(0);

  React.useEffect(() => {
    const currentCount = outputs ? Object.keys(outputs).length : 0;
    const prevCount = prevOutputsCountRef.current;

    if (resultsRef.current && currentCount > 0 && prevCount === 0) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);
    }
    prevOutputsCountRef.current = currentCount;
  }, [outputs]);

  const handleRegenerate = async (platform) => {
    if (!platform || !campaignBuilderRef.current) return;
    setRegeneratingPlatform(platform);
    try {
      await campaignBuilderRef.current.regeneratePlatform(platform);
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  if (view === 'dashboard') {
    right = (
      <div className="main-layout" style={{ display: 'block' }}>
        <DashboardHome
          onNavigate={setView}
          onToggleChat={() => setChatOpen((prev) => !prev)}
        />
      </div>
    );
  } else if (view === 'profile') {
    right = (
      <div className="main-layout">
        <ProfileCard onCancel={() => setView('dashboard')} />
      </div>
    );
  } else if (view === 'admin') {
    right = (
      <div className="main-layout">
        <AdminDashboard onCancel={() => setView('dashboard')} />
      </div>
    );
  } else if (view === 'admin-pricing') {
    right = (
      <div className="main-layout">
        <AdminDashboard
          onCancel={() => setView('dashboard')}
          defaultTab="pricing"
        />
      </div>
    );
  } else if (view === 'closed-notes') {
    right = (
      <div className="main-layout">
        <ClosedNotes />
      </div>
    );
  } else if (view === 'subscription') {
    right = (
      <div className="main-layout">
        <SubscriptionPage />
      </div>
    );
  } else {
    // builder view
    right = (
      <div className="main-layout grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 mt-2 flex-t ">
        <div className="flex flex-col gap-4">
          <CampaignBuilder
            ref={campaignBuilderRef}
            onGenerated={setOutputs}
            onGenerating={setGenerating}
            hasResults={Object.keys(outputs || {}).length > 0}
            onResetOutputs={() => setOutputs({})}
            outputs={outputs}
          />
          {outputs?.hashtags && (
            <div className="card-glass p-5">
              <HashtagsDisplay hashtags={outputs.hashtags} />
            </div>
          )}
          {outputs?.platform_tips && (
            <div className="card-glass p-5">
              <PlatformTips platform_tips={outputs.platform_tips} />
            </div>
          )}
        </div>
        <ResultsCard
          outputs={outputs}
          ref={resultsRef}
          onRegenerate={handleRegenerate}
          regeneratingPlatform={regeneratingPlatform}
        />
      </div>
    );
  }

  return (
    <>
      <Layout left={left} right={right} />
      {generating && (
        <div className="generation-overlay">
          <div className="generation-card">
            {/* Main Loader Section */}
            <div className="loader-container">
              {/* Spinning Orbits */}
              <div className="loader-ring"></div>
              <div className="loader-orbit"></div>
              <div className="loader-orbit-outer"></div>

              {/* Centered Logo */}
              <img
                src="/Pulse-logo.png"
                alt="Pulse"
                className="generation-logo-centered rounded-full "
              />
            </div>

            {/* Content Section */}
            <div className="loading-text-container">
              <div className="loading-text">يتم توليد المحتوى الإبداعي...</div>
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar-fill"></div>
            </div>

            {/* Background Particles */}
            <div className="floating-bg">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${5 + Math.random() * 5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      <ForcePasswordChangeModal
        open={!!mustChangePassword}
        onDone={() => setMustChangePassword(false)}
      />
      <SubscriptionPrompt open={shouldBlock} onClose={() => {}} strict />
      {Object.keys(outputs || {}).length > 0 &&
        view !== 'dashboard' &&
        view !== 'profile' &&
        view !== 'admin' &&
        view !== 'admin-pricing' &&
        view !== 'closed-notes' &&
        view !== 'subscription' && (
          <button
            onClick={() =>
              resultsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
            className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-primary text-white p-3 rounded-full shadow-lg shadow-brand-primary/40 animate-bounce transition-all hover:bg-brand-primary/90"
            aria-label="Scroll to results">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<EntryRoute />} />
        <Route path="/splash" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        <Route
          path="/app"
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        />
        <Route
          path="/subscription"
          element={
            <Protected>
              <div className="main-layout">
                <Layout
                  left={<RightSidebar onNavigate={() => {}} />}
                  right={<SubscriptionPage />}
                />
              </div>
            </Protected>
          }
        />
        {import.meta.env.DEV ? (
          <Route
            path="/billing/mock"
            element={
              <Protected>
                <BillingMock />
              </Protected>
            }
          />
        ) : null}
        <Route
          path="/admin/pricing"
          element={
            <Protected>
              <PricingManagement />
            </Protected>
          }
        />
        <Route path="/payment/success" element={<PaymentSuccess />} />
      </Routes>
    </AuthProvider>
  );
}
