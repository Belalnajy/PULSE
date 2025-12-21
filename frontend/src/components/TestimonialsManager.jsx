import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null = list, {} = create, {id...} = edit

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    rating: 5,
    content: '',
    avatar: '',
    is_visible: true,
    is_approved: true,
    order: 0,
  });

  async function loadTestimonials() {
    setLoading(true);
    try {
      const res = await api('/api/testimonials');
      setTestimonials(res.testimonials || []);
    } catch (e) {
      setError(e.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTestimonials();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this testimonial?'))
      return;
    try {
      await api(`/api/testimonials/${id}`, { method: 'DELETE' });
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing && editing.id) {
        // Update
        const res = await api(`/api/testimonials/${editing.id}`, {
          method: 'PUT',
          body: formData,
        });
        setTestimonials((prev) =>
          prev.map((t) => (t.id === editing.id ? res.testimonial : t))
        );
      } else {
        // Create
        const res = await api('/api/testimonials', {
          method: 'POST',
          body: formData,
        });
        setTestimonials((prev) => [res.testimonial, ...prev]);
      }
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  function startEdit(t) {
    setFormData({
      name: t.name || '',
      title: t.title || '',
      rating: t.rating || 5,
      content: t.content || '',
      avatar: t.avatar || '',
      is_visible: t.is_visible,
      is_approved: t.is_approved,
      order: t.order || 0,
    });
    setEditing(t);
  }

  function startCreate() {
    setFormData({
      name: '',
      title: '',
      rating: 5,
      content: '',
      avatar: '',
      is_visible: true,
      is_approved: true,
      order: 0,
    });
    setEditing({});
  }

  async function toggleField(t, field) {
    try {
      const newVal = !t[field];
      await api(`/api/testimonials/${t.id}`, {
        method: 'PUT',
        body: { ...t, [field]: newVal },
      });
      setTestimonials((prev) =>
        prev.map((item) =>
          item.id === t.id ? { ...item, [field]: newVal } : item
        )
      );
    } catch (e) {
      alert('Failed to update');
    }
  }

  if (editing) {
    return (
      <div className="bg-brand-dark-lighter/40 backdrop-blur-sm border border-white/5 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-6">
          {editing.id ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
        </h3>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الاسم</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-hidden focus:border-brand-primary"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                المسمى الوظيفي / الشركة
              </label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-hidden focus:border-brand-primary"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                التقييم (1-5)
              </label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-hidden focus:border-brand-primary"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Number(e.target.value) })
                }>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r} className="text-black">
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                الترتيب
              </label>
              <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-hidden focus:border-brand-primary"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              رابط الصورة (اختياري)
            </label>
            <input
              type="text"
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-hidden focus:border-brand-primary"
              value={formData.avatar}
              onChange={(e) =>
                setFormData({ ...formData, avatar: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              نص التقييم
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white min-h-[100px] focus:outline-hidden focus:border-brand-primary"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_approved}
                onChange={(e) =>
                  setFormData({ ...formData, is_approved: e.target.checked })
                }
                className="rounded bg-white/10 border-white/20"
              />
              معتمد (Approved)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) =>
                  setFormData({ ...formData, is_visible: e.target.checked })
                }
                className="rounded bg-white/10 border-white/20"
              />
              ظاهر (Visible)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary px-6 py-2 rounded">
              حفظ
            </button>
            <button
              type="button"
              className="btn btn-secondary px-6 py-2 rounded"
              onClick={() => setEditing(null)}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-brand-dark-lighter/40 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
        <h3 className="text-lg font-bold text-white m-0">إدارة التقييمات</h3>
        <button className="btn btn-primary btn-sm" onClick={startCreate}>
          + إضافة تقييم
        </button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        {loading ? (
          <div className="text-center text-gray-500 mt-10">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white/5 border border-white/5 rounded-lg p-4 flex items-start justify-between group hover:border-white/10 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/20 shrink-0 overflow-hidden">
                    {t.avatar ? (
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                        {t.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-white">{t.name}</h4>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                        {t.title}
                      </span>
                      <div className="flex text-yellow-500 text-xs">
                        {'★'.repeat(t.rating)}
                        <span className="text-gray-600">
                          {'★'.repeat(5 - t.rating)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{t.content}</p>
                    <div className="flex gap-3 text-xs">
                      <button
                        onClick={() => toggleField(t, 'is_approved')}
                        className={`px-2 py-0.5 rounded ${
                          t.is_approved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                        {t.is_approved ? 'معتمد' : 'غير معتمد'}
                      </button>
                      <button
                        onClick={() => toggleField(t, 'is_visible')}
                        className={`px-2 py-0.5 rounded ${
                          t.is_visible
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        {t.is_visible ? 'ظاهر' : 'مخفي'}
                      </button>
                      <span className="text-gray-500 px-2 py-0.5">
                        الترتيب: {t.order}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-50 group-hover:opacity-100">
                  <button
                    className="p-2 hover:text-brand-primary"
                    onClick={() => startEdit(t)}>
                    <svg
                      className="w-4 h-4"
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
                    className="p-2 hover:text-red-500"
                    onClick={() => handleDelete(t.id)}>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
