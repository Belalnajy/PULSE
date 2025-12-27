import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import SubscriptionPrompt from './SubscriptionPrompt';
import { useAuth } from '../context/AuthContext';

function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/\*\*|\*/g, '')
    .replace(/^[-•]\s?/gm, '')
    .replace(/_/g, '');
}

export default function ChatWidget({ open, onClose }) {
  const { refreshTrialData } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [showList, setShowList] = useState(false);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const boxRef = useRef(null);
  const typingRef = useRef(null);
  const [typingIdx, setTypingIdx] = useState(null);
  const [typed, setTyped] = useState('');
  const [full, setFull] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);
  const [limitOpen, setLimitOpen] = useState(false);

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
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [typed]);

  function startNew() {
    if (messages.length > 0) {
      setActive(null);
      setMessages([]);
    } else {
      setActive(null);
    }
  }

  async function openConversation(id) {
    setActive(id);
    const res = await api(`/api/chat/conversations/${id}`);
    const rows = res.data.messages || [];
    const mapped = rows.map((r) => ({
      id: String(r.id ?? generateId()),
      role: r.role,
      content: r.content,
      timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    }));
    setMessages(mapped);
    setShowList(false);
  }

  async function deleteConversation(id) {
    try {
      await api(`/api/chat/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (active === id) {
        setActive(null);
        setMessages([]);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function send() {
    setError('');
    if (!text.trim()) return;
    if (waiting) return;
    const toSend = text;
    setText('');
    const localUserId = generateId();
    const localAssistantId = generateId();
    setMessages((prev) => {
      const next = [
        ...prev,
        {
          id: localUserId,
          localId: localUserId,
          role: 'user',
          content: toSend,
          timestamp: Date.now(),
        },
      ];
      const aiIdx = next.length; // placeholder index
      setTypingIdx(aiIdx);
      setTyped('');
      setFull('');
      setWaiting(true);
      return [
        ...next,
        {
          id: localAssistantId,
          localId: localAssistantId,
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
        const reply = sanitize(last.content);
        setWaiting(false);
        setFull(reply);
        setTyped('');
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = setInterval(() => {
          setTyped((prev) => {
            const next = reply.slice(
              0,
              Math.min(prev.length + 1, reply.length)
            );
            if (next.length === reply.length) {
              clearInterval(typingRef.current);
              typingRef.current = null;
            }
            return next;
          });
        }, 60);
        setMessages((prev) => {
          const withoutTyping = prev.filter((m) => !m.typing);
          return [
            ...withoutTyping,
            {
              id: generateId(),
              role: 'assistant',
              content: reply,
              timestamp: Date.now(),
            },
          ];
        });
      } else {
        setWaiting(false);
      }
      loadConversations();
      refreshTrialData?.();
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
      } else {
        setError(err.message);
      }
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

  function copyMessage(id, content) {
    navigator.clipboard?.writeText(content || '').then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    });
  }

  function deleteMessage(id) {
    setMessages((prev) => prev.filter((m) => (m.id || m.localId) !== id));
  }

  function renderMessage(m, i) {
    const isAssistant = m.role === 'assistant';
    const id = m.id || m.localId || i;
    const isWaiting = isAssistant && i === typingIdx && waiting && !full;
    const showType = isAssistant && i === typingIdx && typed !== '' && full;
    const content = showType ? typed : sanitize(m.content);
    if (isWaiting) {
      return (
        <div
          key={id}
          className="self-start bg-white/5 border border-white/5 rounded-2xl rounded-tr-xl rounded-tl-none p-3 px-4 max-w-[85%] animate-pulse">
          <div className="flex gap-1 items-center h-5">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {formatTime(m.timestamp || Date.now())}
          </div>
        </div>
      );
    }
    if (isAssistant) {
      return (
        <div
          key={id}
          className="self-start bg-white/5 border border-white/5 text-gray-200 rounded-2xl rounded-tr-xl rounded-tl-none p-3 px-4 max-w-[85%] group">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
          <div className="flex justify-between items-center mt-1.5 min-w-[60px]">
            <span className="text-[10px] text-gray-500 font-medium">
              {formatTime(m.timestamp || m.created_at)}
            </span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="text-gray-500 hover:text-white transition-colors"
                title="نسخ"
                onClick={() => copyMessage(id, content)}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
              <button
                className="text-gray-500 hover:text-red-400 transition-colors"
                title="حذف"
                onClick={() => deleteMessage(id)}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          {copiedId === id && (
            <span className="text-[10px] text-brand-primary animate-fade-in block mt-1">
              تم النسخ
            </span>
          )}
        </div>
      );
    }
    return (
      <div
        key={id}
        className={`self-end bg-brand-primary/20 text-white border border-brand-primary/20 rounded-2xl rounded-tl-xl rounded-tr-none p-3 px-4 max-w-[85%] animate-slide-in-right`}>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {content}
        </div>
        <div className="text-right text-[10px] text-brand-primary/60 mt-1 font-medium">
          {formatTime(m.timestamp || m.created_at)}
        </div>
      </div>
    );
  }

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 bg-transparent z-40 md:bg-transparent"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 md:bottom-20 left-0 md:left-20 md:right-auto md:top-auto w-full md:w-[400px] h-[85vh] md:h-[600px] bg-[#0c131d] md:bg-[#0c131d]/90 backdrop-blur-xl border-t md:border border-white/10 md:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-left z-50 ${
          open
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-10 opacity-0 scale-95 pointer-events-none'
        }`}
        dir="rtl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col gap-3 rounded-t-2xl shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-50 animate-pulse"></span>
                <img
                  src="/alva-logo.png"
                  alt="Alva"
                  className="w-8 h-8 rounded-full relative z-10 ring-2 ring-white/10"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0c131d] rounded-full z-20"></span>
              </div>
              <div>
                <div className="font-bold text-white text-sm">Alva</div>
                <div className="text-[10px] text-green-400 font-medium">
                  متصل الآن
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-sm px-2 text-gray-400 hover:text-white"
                onClick={startNew}
                title="محادثة جديدة">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                className="btn btn-ghost btn-sm px-2 text-gray-400 hover:text-white"
                onClick={onClose}
                title="إغلاق">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                !showList
                  ? 'bg-brand-primary/20 text-brand-primary font-bold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              onClick={() => setShowList(false)}>
              المحادثة الحالية
            </button>
            <button
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                showList
                  ? 'bg-brand-primary/20 text-brand-primary font-bold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              onClick={() => setShowList(true)}>
              السجل
            </button>
          </div>
        </div>

        {showList ? (
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <svg
                  className="w-12 h-12 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-sm">لا توجد محادثات سابقة</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                    <button
                      className="flex-1 text-right text-sm text-gray-300 truncate font-medium"
                      onClick={() => openConversation(c.id)}>
                      {c.title || 'محادثة بدون عنوان'}
                    </button>
                    <button
                      className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id);
                      }}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin bg-black/20"
            ref={boxRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 my-auto pb-10 gap-3">
                <img
                  src="/alva-logo.png"
                  alt="Alva"
                  className="w-16 h-16 rounded-2xl opacity-50 grayscale"
                />
                <div className="text-sm">
                  يا أهلاً بك! أنا Alva، كيف أقدر أساعدك اليوم
                </div>
              </div>
            )}
            {messages.map((m, i) => renderMessage(m, i))}
            <div ref={endRef} />
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-200 text-xs border border-red-500/10 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-white/5 bg-white/5 rounded-b-2xl shrink-0">
          <div className="flex gap-2 relative">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="اكتب رسالتك..."
              disabled={waiting || showList}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all placeholder-gray-500"
              autoFocus
            />
            <button
              className="btn btn-primary px-4 shadow-lg shadow-brand-primary/10 disabled:grayscale disabled:opacity-50 flex items-center justify-center"
              onClick={send}
              disabled={waiting || showList || !text.trim()}>
              {waiting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-5 h-5 transform rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="text-[10px] text-gray-600 text-center mt-2 font-medium">
            Alva can make mistakes. Check important info.
          </div>
        </div>
      </div>

      <SubscriptionPrompt
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        strict
      />
    </>,
    document.body
  );
}
