import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trialDaily, setTrialDaily] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    setLoading(true);
    try {
      const res = await api('/api/auth/me');
      setUser(res.data.user);
      setSubscription(res.data.subscription);
      setTrialDaily(res.data.trialDaily || null);
      setSubscriptionRequired(!!res.data.subscriptionRequired);
      setMustChangePassword(
        !!(
          res?.data?.mustChangePassword ??
          res?.data?.user?.force_password_change
        )
      );
    } catch {
      setUser(null);
      setSubscription(null);
      setTrialDaily(null);
      setSubscriptionRequired(false);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  }

  async function loadEntitlements() {
    try {
      const res = await api('/api/profile/entitlements');
      setEntitlements(res.data || null);
    } catch {
      setEntitlements(null);
    }
  }

  async function refreshTrialData() {
    try {
      const res = await api('/api/auth/me');
      setTrialDaily(res.data.trialDaily || null);
    } catch (err) {
      console.error('Failed to refresh trial data:', err);
    }
  }

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      loadMe();
      loadEntitlements();
    } else setLoading(false);
  }, []);

  function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }

  const [trialModalOpen, setTrialModalOpen] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        trialDaily,
        subscriptionRequired,
        entitlements,
        mustChangePassword,
        setMustChangePassword,
        trialModalOpen,
        setTrialModalOpen,
        setUser,
        setSubscription,
        setTrialDaily,
        loadMe,
        loadEntitlements,
        refreshTrialData,
        logout,
        loading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
