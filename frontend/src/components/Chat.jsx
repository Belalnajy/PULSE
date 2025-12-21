import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import SubscriptionPrompt from './SubscriptionPrompt';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [limitOpen, setLimitOpen] = useState(false);
  const boxRef = useRef(null);
  const endRef = useRef(null);
  const [waiting, setWaiting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [fairWarn, setFairWarn] = useState(false);
  const typingRef = useRef(null);
  const [typingIdx, setTypingIdx] = useState(null);
  const [typed, setTyped] = useState('');
  const [full, setFull] = useState('');
  const {
    entitlements,
    loadEntitlements,
    refreshTrialData,
    user,
    setTrialModalOpen,
  } = useAuth();
  const isAdmin =
    !!entitlements?.is_admin ||
    (user?.email || '').toLowerCase() === 'alva@admin.com';
  const isActive = !!entitlements?.has_active_subscription;

  function generateId() {
    return (
      globalThis.crypto?.randomUUID?.() || `msg-${Date.now()}-${Math.random()}`
    );
  }

  async function loadConversations() {
    const res = await api('/api/chat/conversations');
    setConversations(res.data.conversations || []);
  }

  useEffect(() => {
    loadConversations();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typed]);

  async function newConversation() {
    setActive(null);
    setMessages([]);
  }

  async function openConversation(id) {
    setActive(id);
    const res = await api(`/api/chat/conversations/${id}`);
    setMessages(res.data.messages || []);
  }

  async function deleteConversation(id) {
    await api(`/api/chat/conversations/${id}`, { method: 'DELETE' });
    setActive(null);
    setMessages([]);
    loadConversations();
  }

  async function send() {
    setError('');
    if (!text.trim()) return;
    if (waiting) return;
    if (cooldownUntil && Date.now() < cooldownUntil) {
      setError('خفف الاستخدام اليوم، حاول بعد قليل');
      return;
    }
    if (entitlements?.requires_renewal_block && !isAdmin) {
      setLimitOpen(true);
      return;
    }
    const remaining = Number(
      entitlements?.daily_usage?.chat_remaining_today || 0
    );
    const canTrial = !!entitlements?.can_use_trial_today;
    if (!isActive && !isAdmin && canTrial && remaining <= 0) {
      setLimitOpen(true);
      return;
    }
    const toSend = text;
    setText('');
    const localUserId = generateId();
    const localAssistantId = generateId();
    setMessages((prev) => {
      const next = [
        ...prev,
        {
          id: localUserId,
          role: 'user',
          content: toSend,
          timestamp: Date.now(),
        },
      ];
      const aiIdx = next.length;
      setTypingIdx(aiIdx);
      setTyped('');
      setFull('');
      setWaiting(true);
      return [
        ...next,
        {
          id: localAssistantId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          typing: true,
        },
      ];
    });
    try {
      const res = await api('/api/chat/send-message', {
        method: 'POST',
        body: { conversationId: active, message: toSend },
      });
      setActive(res.data.conversationId);
      const msgs = res.data.messages || [];
      const last = msgs.length ? msgs[msgs.length - 1] : null;
      if (last && last.role === 'assistant') {
        const reply = last.content;
        setFull(reply);
        setTyped('');
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = setInterval(() => {
          setTyped((prev) => {
            const nextText = reply.slice(
              0,
              Math.min(prev.length + 1, reply.length)
            );
            // Update the assistant placeholder content in-place
            setMessages((prevMsgs) => {
              const copy = [...prevMsgs];
              if (typeof typingIdx === 'number' && copy[typingIdx]) {
                copy[typingIdx] = {
                  ...copy[typingIdx],
                  content: nextText,
                  typing: nextText.length < reply.length,
                };
              }
              return copy;
            });
            if (nextText.length === reply.length) {
              clearInterval(typingRef.current);
              typingRef.current = null;
              setWaiting(false);
              // Ensure final content is set and typing flag cleared
              setMessages((prevMsgs) => {
                const copy = [...prevMsgs];
                if (typeof typingIdx === 'number' && copy[typingIdx]) {
                  copy[typingIdx] = {
                    ...copy[typingIdx],
                    content: reply,
                    typing: false,
                  };
                }
                return copy;
              });
            }
            return nextText;
          });
        }, 60);
      } else {
        setWaiting(false);
        setMessages((prevMsgs) => {
          const copy = [...prevMsgs];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'assistant' && copy[i].typing) {
              copy[i] = {
                ...copy[i],
                typing: false,
                content: 'لم يتم استلام رد من المساعد.',
              };
              break;
            }
          }
          return copy;
        });
      }
      loadConversations();
      loadEntitlements?.();
      refreshTrialData?.();
      if (!isActive && !isAdmin) {
        setTrialModalOpen?.(true);
      }
      if (res?.data?.fair_usage_warning) {
        setFairWarn(true);
        setTimeout(() => setFairWarn(false), 5000);
      }
    } catch (err) {
      setWaiting(false);
      const msg = err?.message || '';
      if (
        msg.includes('SUBSCRIPTION_REQUIRED') ||
        msg.includes('اشتراك') ||
        msg.includes('حد التجربة') ||
        msg.includes('TRIAL_LIMIT_REACHED')
      ) {
        setLimitOpen(true);
      } else if (
        msg.includes('FAIR_USAGE_THROTTLED') ||
        msg.includes('الاستخدام العادل') ||
        err?.data?.error?.code === 'FAIR_USAGE_THROTTLED'
      ) {
        setError(
          'سياسة الاستخدام العادل: تم إيقاف الإرسال مؤقتًا، حاول بعد دقيقة'
        );
        setCooldownUntil(Date.now() + 60000);
      } else {
        setError(err.message);
      }
      setMessages((prevMsgs) => {
        const copy = [...prevMsgs];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].role === 'assistant' && copy[i].typing) {
            copy[i] = {
              ...copy[i],
              typing: false,
              content: 'حدث خطأ أثناء محاولة الاتصال، حاول مرة أخرى.',
            };
            break;
          }
        }
        return copy;
      });
    }
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const hh = (h % 12 || 12).toString();
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ap = h >= 12 ? 'PM' : 'AM';
    return `${hh}:${mm} ${ap}`;
  }

  function copyMessage(content) {
    navigator.clipboard?.writeText(content || '').then(() => {
      setError('تم النسخ');
      setTimeout(() => setError(''), 1000);
    });
  }

  function deleteMessage(id) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  // Retry removed for this view

  return (
    <>
      <div className="chat">
        <div className="chat-sidebar">
          <div className="row">
            <button
              className="btn btn-primary btn-sm"
              onClick={newConversation}>
              محادثة جديدة
            </button>
          </div>
          <ul className="list">
            {conversations.length === 0 ? (
              <li>لا توجد محادثات</li>
            ) : (
              conversations.map((c) => (
                <li key={c.id} className={active === c.id ? 'active' : ''}>
                  <button onClick={() => openConversation(c.id)}>
                    {c.title}
                  </button>
                  <button
                    className="delete"
                    onClick={() => deleteConversation(c.id)}>
                    حذف
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="chat-main">
          <div className="messages" ref={boxRef}>
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              const isTyping = isAssistant && m.typing;
              if (isTyping && (m.content || '') === '') {
                return (
                  <div key={m.id} className={`bubble assistant fade-in`}>
                    <span className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <div className="msg-meta">
                      <span>{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                );
              }
              if (isAssistant) {
                return (
                  <div key={m.id} className="assistant-line">
                    <div className="msg-content">{m.content}</div>
                    <div className="msg-meta">
                      <span>{formatTime(m.timestamp)}</span>
                      <div className="msg-actions">
                        <button
                          className="icon-btn"
                          title="نسخ"
                          onClick={() => copyMessage(m.content)}>
                          📋
                        </button>
                        <button
                          className="icon-btn"
                          title="حذف"
                          onClick={() => deleteMessage(m.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className={`bubble user slide-in-right`}>
                  <div className="msg-content">{m.content}</div>
                  <div className="msg-meta">
                    <span>{formatTime(m.timestamp)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          {error && <div className="error">{error}</div>}
          {fairWarn ? (
            <div className="warning" style={{ marginBottom: 8 }}>
              تنبيه استخدام: خفف الاستخدام اليوم لراحة النظام
            </div>
          ) : null}
          {!isAdmin && !isActive && entitlements?.can_use_trial_today ? (
            <div className="info" style={{ marginBottom: 8 }}>
              تبقّى لك {entitlements?.daily_usage?.chat_remaining_today ?? 0}{' '}
              رسائل اليوم في التجربة المجانية
            </div>
          ) : null}
          <div className="chat-input row">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالتك..."
              disabled={
                waiting ||
                (!!entitlements?.requires_renewal_block && !isAdmin) ||
                (cooldownUntil && Date.now() < cooldownUntil)
              }
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={send}
              disabled={
                waiting ||
                (!!entitlements?.requires_renewal_block && !isAdmin) ||
                (cooldownUntil && Date.now() < cooldownUntil)
              }>
              إرسال
            </button>
          </div>
        </div>
      </div>
      <SubscriptionPrompt
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        strict={!!entitlements?.requires_renewal_block && !isAdmin}
      />
    </>
  );
}
