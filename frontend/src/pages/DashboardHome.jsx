import React from 'react';

export default function DashboardHome({ onNavigate, onToggleChat }) {
  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in-up">
      {/* Hero Section */}
      <div className="relative flex flex-col-reverse sm:flex-row items-center justify-between p-8 sm:p-12 mb-10 bg-gradient-surface rounded-lg border border-white/10 overflow-hidden shadow-glass-lg">
        {/* Helper visual blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="flex-1 z-10 text-center sm:text-right mt-8 sm:mt-0">
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight leading-tight">
            <span className="bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">
              Alva
            </span>{' '}
            Marketing Assistant
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg mx-auto sm:mx-0">
            أنشئ محتوى تسويقي احترافي في ثوانٍ.
            <br />
            <span>
              {' '}
              <span className="bg-linear-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent font-bold">
                PULSE
              </span>{' '}
              هو مساعدك الذكي و متاح دائمًا لخدمتك لتحقيق أفضل النتائج.
            </span>
          </p>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            <button
              className="btn btn-primary btn-lg px-8"
              onClick={() => onNavigate('builder')}>
              ابدأ الآن
            </button>
            <button
              className="btn btn-ghost border border-white/10 hover:border-white/30"
              onClick={onToggleChat}>
              تحدث مع Alva
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center w-48 h-48 sm:w-64 sm:h-64 ">
          {/* Ring animation */}
          <div className="absolute inset-0 border border-brand-primary/20 rounded-full h-full w-full animate-ping"></div>
          <div className="absolute inset-4  border border-brand-primary/20 rounded-full h-full w-full animate-ping opacity-60"></div>
          <img
            src="/alva-logo.png"
            alt="Alva"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-[0_0_50px_rgba(56,189,248,0.3)] z-10 relative object-cover ring-2 ring-[#38bdf8]/80"
          />
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon={
            <svg
              className="w-8 h-8 text-brand-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          title="منشئ المحتوى"
          desc="توليد محتوى احترافي لمنصات التواصل الاجتماعي، الإعلانات، والمزيد."
          onClick={() => onNavigate('builder')}
        />
        <FeatureCard
          icon={
            <svg
              className="w-8 h-8 text-brand-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          title="مساعد ذكي"
          desc="تحدث مع Alva للحصول على أفكار، استراتيجيات، أو تحسين النصوص."
          onClick={onToggleChat}
        />
        <FeatureCard
          icon={
            <svg
              className="w-8 h-8 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          title="إدارة حسابك"
          desc="تخصيص بياناتك ومتابعة خطة اشتراكك بكل سهولة."
          onClick={() => onNavigate('profile')}
        />
      </div>

      {/* Onboarding / Tips Section */}
      <div className="bg-brand-dark-lighter/40 border border-white/5 rounded-lg p-6 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 text-white px-2">كيف تبدأ؟</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
          <StepItem num="1" text="اختر نوع المحتوى" />
          <StepItem num="2" text="أدخل التفاصيل" />
          <StepItem num="3" text="احصل على النتيجة" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card-glass p-6 cursor-pointer group hover:-translate-y-1 hover:border-brand-primary/30 hover:bg-white/[0.07] transition-all duration-300 flex flex-col gap-3">
      <div className="mb-2 group-hover:scale-110 transition-transform duration-300 w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed flex-1">{desc}</p>
      <div className="self-end text-brand-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16l-4-4m0 0l4-4m-4 4h18"
          />
        </svg>
      </div>
    </div>
  );
}

function StepItem({ num, text }) {
  return (
    <div className="flex   items-center gap-3 bg-white/5 border border-white/5 px-5 py-3 rounded-full  hover:bg-white/10 transition-colors cursor-default">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold shadow-glow">
        {num}
      </span>
      <span className="text-base text-gray-200">{text}</span>
    </div>
  );
}
