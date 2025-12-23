import React, { useEffect, useState } from 'react';
import TestimonialsSection from '../components/TestimonialsSection';
import AddTestimonialModal from '../components/AddTestimonialModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Zap,
  Brain,
  Globe,
  PenTool,
  Cpu,
  Send,
  Sparkles,
  Users,
  Star,
  Headphones,
  Check,
  Instagram,
  Twitter,
  MessageCircle,
  ArrowLeft,
  ChevronDown,
  X as CloseIcon,
  Ghost,
} from 'lucide-react';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Welcome() {
  const { user } = useAuth();
  const [howOpen, setHowOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [planPrice, setPlanPrice] = useState('50');
  const [planCurrency, setPlanCurrency] = useState('USD');

  useEffect(() => {
    setMounted(true);
    // Fetch plan price
    api('/api/plans/monthly')
      .then((res) => {
        if (res?.data) {
          setPlanPrice((res.data.price_cents / 100).toFixed(0));
          setPlanCurrency(res.data.currency);
        }
      })
      .catch(() => {
        // Keep default values
      });
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubscribe = async () => {
    try {
      const res = await api('/api/payments/checkout', {
        method: 'POST',
        body: {
          plan_id: 'monthly',
          return_url: window.location.origin + '/app',
        },
      });
      if (res?.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark selection:bg-brand-primary/30 scroll-smooth">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img
                src="/Pulse-logo.png"
                alt="Pulse"
                className="w-10 h-10 rounded-full shadow-glow"
              />
              <span className="font-display font-black text-xl tracking-tighter text-white hidden sm:block">
                PULSE
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                المميزات
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                كيف نعمل
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                الأسعار
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                الأسئلة الشائعة
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                اراء العملاء
              </button>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <a
                href={user ? '/app' : '/login'}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                {user ? 'لوحة التحكم' : 'دخول'}
              </a>
              <a
                href={user ? '/app' : '/register'}
                className="btn btn-primary px-6 py-2 rounded-xl text-sm font-bold">
                ابدأ الآن
              </a>
            </div>
          </div>
        </div>
      </nav>
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[140px] animate-pulse-slow delay-1000"></div>

        {/* Animated Orbs */}
        <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-brand-primary rounded-full animate-float opacity-40"></div>
        <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-brand-secondary rounded-full animate-float opacity-30"></div>
        <div className="absolute bottom-[30%] left-[20%] w-2 h-2 bg-white rounded-full animate-float opacity-20"></div>

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-32">
        {/* Hero Section */}
        <div
          className={`text-center transition-all duration-1000 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          {/* Brand Mark */}
          <div className="flex justify-center mb-10">
            <div className="relative group">
              <div className="absolute -inset-6 bg-linear-to-r from-brand-secondary via-brand-primary to-brand-secondary opacity-20 rounded-full blur-3xl group-hover:opacity-40 transition-all duration-700 animate-spin-slow"></div>
              {/* Ping Animations */}
              <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-ping-subtle" />
              <div className="absolute inset-0 rounded-full bg-brand-secondary/20 animate-ping-subtle delay-700" />
              <div className="absolute inset-0 rounded-full bg-brand-primary/10 animate-ping-subtle delay-1500" />

              <img
                src="/Pulse-logo.png"
                alt="Pulse"
                className="w-28 h-28 rounded-full shadow-2xl relative z-10 border-2 border-[#38bdf8]/60 group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
          </div>

          <div className="space-y-4 mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-secondary text-sm font-medium tracking-wide mb-4 animate-fade-in">
              مستقبلك في صناعة المحتوى يبدأ هنا
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-black tracking-tighter leading-tight">
              <p className="block text-white opacity-90">
                {' '}
                مرحباً بك في{' '}
                <span className="bg-linear-to-r from-brand-secondary via-white to-brand-primary bg-clip-text text-transparent drop-shadow-sm animate-shimmer">
                  عالم Alva
                </span>
              </p>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto mb-16 px-4">
            حوّل أفكارك إلى حملات إبداعية متكاملة في ثوانٍ. بوابتك الذكية للوصول
            إلى جمهورك بذكاء وفعالية.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <a
              href={user ? '/app' : '/login'}
              className="group relative px-10 btn btn-primary py-5 shadow-lg shadow-brand-primary/20 text-white rounded-2xl font-bold text-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-glow shadow-brand-primary/30">
              <span className="relative z-10 flex items-center gap-3">
                {user ? 'ابدأ الاستخدام' : 'ابدأ رحلتك مجاناً'}
                <Zap className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </a>
            <button
              onClick={() => setHowOpen(true)}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              اكتشف كيف نعمل
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="flex justify-center mt-16 animate-bounce">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>

        {/* Partners Section */}
        <div
          className={`mt-12 mb-24 transition-all duration-1000 delay-200 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
          <div className="text-center mb-10">
            <span className="text-gray-500 text-xs font-bold tracking-[0.4em] uppercase">
              نثق بهم & يثقون بنا
            </span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {['TikTok', 'Instagram', 'Snapchat', 'WhatsApp', 'Twitter'].map(
              (p) => (
                <div key={p} className="flex items-center gap-3 group px-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-display font-black text-sm group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                    {p[0]}
                  </div>
                  <span className="font-display font-bold text-2xl tracking-tighter group-hover:text-white transition-colors">
                    {p.toUpperCase()}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Features Hub */}
        <div
          id="features"
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-28 mt-16 md:mt-28 transition-all duration-1000 delay-300 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
          <FeatureCard
            number="01"
            icon={<Zap className="w-10 h-10" />}
            color="brand-secondary"
            title="سرعة خارقة"
            description="أنشئ محتوى مخصص لكل منصة (TikTok, Instagram, X) بضغطة زر واحدة."
          />
          <FeatureCard
            number="02"
            icon={<Brain className="w-10 h-10" />}
            color="brand-primary"
            title="ذكاء يتكيف معك"
            description="مساعدنا Alva يعرف هويتك، ويتحدث بأسلوبك، ويقترح عليك الأفضل دائماً."
          />
          <FeatureCard
            number="03"
            icon={<Globe className="w-10 h-10" />}
            color="purple-400"
            title="انتشار أوسع"
            description="استراتيجيات مبنية على بيانات واقعية تضمن وصول محتواك للجمهور الصحيح."
          />
        </div>

        {/* How It Works Section */}
        <div
          id="how-it-works"
          className={`mb-20 md:mb-28 transition-all duration-1000 delay-400 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-primary text-sm font-medium tracking-wide mb-6">
              كيف يعمل Alva
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white">
              ثلاث خطوات بسيطة للنجاح
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-brand-secondary via-brand-primary to-purple-400 opacity-20"></div>

            <HowItWorksStep
              number="1"
              title="أدخل فكرتك"
              description="شارك فكرة المحتوى، المنتج، والجمهور المستهدف"
              icon={<PenTool className="w-12 h-12" />}
              color="brand-secondary"
            />
            <HowItWorksStep
              number="2"
              title="دع Alva يعمل"
              description="الذكاء الاصطناعي يحلل ويختار أفضل استراتيجية لكل منصة"
              icon={<Sparkles className="w-12 h-12" />}
              color="brand-primary"
            />
            <HowItWorksStep
              number="3"
              title="انشر وانطلق"
              description="راجع، عدّل، وانشر محتواك على جميع المنصات"
              icon={<Send className="w-12 h-12" />}
              color="purple-400"
            />
          </div>
        </div>

        {/* Platforms Section */}
        <div
          className={`mb-20 md:mb-28 transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-primary text-sm font-medium tracking-wide mb-6">
              المنصات المدعومة
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4">
              محتوى مخصص لكل منصة
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              نصمم محتوى يناسب خصائص كل منصة لضمان أفضل تفاعل
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <PlatformCard
              name="TikTok"
              color="from-[#000000] to-[#25F4EE]"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                </svg>
              }
            />
            <PlatformCard
              name="Instagram"
              color="from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]"
              icon={<Instagram className="w-8 h-8" />}
            />
            <PlatformCard
              name="X (Twitter)"
              color="from-[#000000] to-[#1DA1F2]"
              icon={<Twitter className="w-8 h-8" />}
            />
            <PlatformCard
              name="Snapchat"
              color="from-[#FFFC00] to-[#FFFC00]"
              icon={<Ghost className="w-10 h-10 text-black fill-current" />}
            />
            <PlatformCard
              name="WhatsApp"
              color="from-[#25D366] to-[#128C7E]"
              icon={<MessageCircle className="w-8 h-8" />}
            />
          </div>
        </div>

        {/* Trust & Stats Section */}
        <div
          className={`border-y border-white/5 py-12 md:py-16 mb-20 md:mb-28 transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <StatCard
              number={<AnimatedCounter target={10000} prefix="+" suffix="" />}
              label="محتوى مُوَلَّد"
              icon={<Sparkles className="w-12 h-12 text-brand-primary" />}
            />
            <StatCard
              number={<AnimatedCounter target={2500} prefix="+" suffix="" />}
              label="صانع محتوى"
              icon={<Users className="w-12 h-12 text-brand-secondary" />}
            />
            <StatCard
              number={<AnimatedCounter target={99} prefix="" suffix="%" />}
              label="نسبة الرضا"
              icon={<Star className="w-12 h-12 text-yellow-400 fill-current" />}
            />
            <StatCard
              number="24/7"
              label="دعم ذكي"
              icon={<Headphones className="w-12 h-12 text-purple-400" />}
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div
          className={`transition-all duration-1000 delay-600 transform ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
          <TestimonialsSection />

          {/* Add Rating Button */}
          {user && (
            <div className="text-center mt-12">
              <button
                onClick={() => setRatingModalOpen(true)}
                className="px-8 py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-primary/20">
                <span className="flex items-center gap-3">
                  <Star className="w-5 h-5 fill-current" />
                  أضف تقييمك
                </span>
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mt-6 max-w-md mx-auto p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center">
              {successMessage}
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div
          id="pricing"
          className={`mb-20 md:mb-28 mt-20 md:mt-32 transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-secondary text-sm font-medium tracking-wide mb-6">
              خطط الأسعار
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4">
              اختر الخطة المناسبة لنموك
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              خطط مرنة تناسب الأفراد والشركات في رحلة صناعة المحتوى
            </p>
          </div>

          <div className="flex justify-center">
            <PricingCard
              title="الباقة الشاملة"
              price={planPrice}
              currency={planCurrency}
              period="/شهرياً"
              features={[
                'توليد لا محدود للمحتوى الإبداعي',
                'دعم كامل لجميع المنصات (TikTok, Instagram, etc)',
                'مساعد Alva الذكي متاح 24/7',
                'تخصيص كامل للهوية البصرية',
                'أولوية في معالجة البيانات والسرعة',
                'دعم فني مباشر ومخصص',
              ]}
              cta={user ? 'ترقية الآن' : 'ابدأ رحلتك الآن'}
              link={user ? undefined : '/register'}
              onSubscribe={user ? handleSubscribe : undefined}
              popular
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div
          id="faq"
          className={`mb-20 md:mb-28 mt-20 md:mt-28 transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-primary text-sm font-medium tracking-wide mb-6">
              الأسئلة الشائعة
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-white">
              لديك أسئلة؟ لدينا الإجابات
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <FAQItem
              question="ما هو Alva وكيف يعمل؟"
              answer="Alva هو مساعد ذكاء اصطناعي متخصص في إنشاء محتوى تسويقي احترافي لمنصات التواصل الاجتماعي. يستخدم تقنيات الذكاء الاصطناعي المتقدمة لفهم فكرتك وإنشاء محتوى مخصص لكل منصة."
              isOpen={faqOpen === 0}
              onClick={() => setFaqOpen(faqOpen === 0 ? null : 0)}
            />
            <FAQItem
              question="هل يدعم Alva اللغة العربية؟"
              answer="نعم! Alva مصمم خصيصاً للمحتوى العربي ويفهم الثقافة والأسلوب العربي في التسويق الرقمي."
              isOpen={faqOpen === 1}
              onClick={() => setFaqOpen(faqOpen === 1 ? null : 1)}
            />
            <FAQItem
              question="ما هي المنصات المدعومة؟"
              answer="نحن ندعم TikTok، Instagram، X (Twitter)، Snapchat، وWhatsApp. كل منصة تحصل على محتوى مخصص يناسب جمهورها وخصائصها."
              isOpen={faqOpen === 2}
              onClick={() => setFaqOpen(faqOpen === 2 ? null : 2)}
            />
            <FAQItem
              question="هل يمكنني تعديل المحتوى المُنشأ؟"
              answer="بالتأكيد! يمكنك مراجعة وتعديل أي محتوى قبل نشره. Alva يوفر لك نقطة بداية قوية يمكنك تخصيصها حسب احتياجاتك."
              isOpen={faqOpen === 3}
              onClick={() => setFaqOpen(faqOpen === 3 ? null : 3)}
            />
            <FAQItem
              question="كم يستغرق إنشاء المحتوى؟"
              answer="عادةً ما يستغرق الأمر أقل من دقيقة! فقط أدخل فكرتك ودع Alva يقوم بالباقي."
              isOpen={faqOpen === 4}
              onClick={() => setFaqOpen(faqOpen === 4 ? null : 4)}
            />
          </div>
        </div>

        {/* Final CTA Section */}
        <div
          className={`mb-28 mt-20 md:mt-32 p-12 md:p-20 rounded-[3rem] bg-linear-to-br from-brand-primary/10 via-brand-dark to-brand-secondary/10 border border-white/5 relative overflow-hidden text-center transition-all duration-1000 delay-800 ${
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-primary/10 blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-secondary/10 blur-[100px] translate-x-1/2 translate-y-1/2"></div>

          <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 relative z-10">
            جاهز لتغيير طريقة <br /> صناعة محتواك؟
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto relative z-10">
            انضم إلى أكثر من 2,500 صانع محتوى يستخدمون Alva يومياً للنمو
            والانتشار.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <a
              href={user ? '/app' : '/register'}
              className="btn btn-primary px-12 py-5 rounded-2xl text-xl font-bold shadow-glow-strong">
              {user ? 'اذهب للوحة التحكم' : 'ابدأ رحلتك الآن'}
            </a>
            <button className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-xl hover:bg-white/10 transition-all">
              تواصل مع المبيعات
            </button>
          </div>
        </div>

        {/* Footer branding */}
        <footer className="border-t border-white/5 pt-20 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/alva-logo.png"
                  alt="Pulse"
                  className="w-12 h-12 rounded-xl shadow-glow"
                />
                <span className="font-display font-black text-2xl tracking-tighter text-white">
                  ALVA
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                براند سعودي متخصص في التطوير التجاري وتنمية المشاريع الصغيره
                <br />
                نسعي في ALVA لتحسين الاداء التجاري للمنشئات وتطويرها
              </p>
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:border-brand-primary/50 cursor-pointer transition-colors">
                    <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">المنتج</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="hover:text-brand-primary transition-colors">
                    المميزات
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-brand-primary transition-colors">
                    كيف يعمل
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="hover:text-brand-primary transition-colors">
                    الأسعار
                  </button>
                </li>
                <li>
                  <a
                    href="/welcome"
                    className="hover:text-brand-primary transition-colors">
                    التحديثات
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">الشركة</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    من نحن
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    المدونة
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    الوظائف
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    تواصل معنا
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">قانوني</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    شروط الخدمة
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    سياسة الخصوصية
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-brand-primary transition-colors">
                    ملفات تعريف الارتباط
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
            <div className="text-sm text-gray-600 font-medium">
              © 2025 Pulse AI System. Crafted with precision by Alva Team
            </div>
            <div className="flex gap-8 text-xs text-gray-700 font-bold uppercase tracking-widest">
              <span>Made in Saudi Arabia</span>
              <span>Global Support</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Enhanced Modal */}
      {howOpen && (
        <div
          className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-100 p-6"
          onClick={() => setHowOpen(false)}>
          <div
            className="card-glass-premium p-10 w-full max-w-xl border border-white/10 rounded-4xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 right-0 p-6">
              <button
                onClick={() => setHowOpen(false)}
                className="text-gray-500 hover:text-white transition-colors">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-3xl font-display font-black text-white mb-8 pr-2 border-r-4 border-brand-primary">
              كيف نصنع السحر؟
            </h3>

            <div className="space-y-8 text-lg text-gray-300 leading-relaxed font-light">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-sm font-bold text-brand-primary shrink-0">
                  1
                </div>
                <p>تضيف فكرتك، ومنتجاتك، والجمهور اللي حابب تستهدفه.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-brand-secondary/20 flex items-center justify-center text-sm font-bold text-brand-secondary shrink-0">
                  2
                </div>
                <p>
                  محرك Pulse بيحلل السوق وبيختار أقوى الزوايا التسويقية المناسبة
                  لكل منصة.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400 shrink-0">
                  3
                </div>
                <p>
                  تراجع، تعدل، وتنشر. وبكذا تكون وفّرت ساعات من التفكير والتعب.
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary w-full mt-10 py-4 rounded-2xl font-bold"
              onClick={() => setHowOpen(false)}>
              فهمت الفكرة!
            </button>
          </div>
        </div>
      )}

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(''), 5000);
        }}
      />
    </div>
  );
}

function FeatureCard({ number, icon, title, description, color }) {
  return (
    <div className="card-glass-premium p-10 group hover:bg-white/3 transition-all duration-500 border border-white/5 hover:border-white/10 rounded-3xl relative overflow-hidden card-hover-lift">
      {/* Number Badge */}
      <div className="absolute top-6 left-6 text-6xl font-display font-black text-white/5 group-hover:text-white/10 transition-colors">
        {number}
      </div>

      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${color}/10 transition-colors`}></div>

      <div
        className={`mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 text-${color} relative z-10`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-white mb-4 transition-colors relative z-10">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed font-light text-lg relative z-10">
        {description}
      </p>

      <div className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-white transition-colors relative z-10">
        <span>اكتشف التفاصيل</span>
        <ArrowLeft className="w-4 h-4 translate-x-0 group-hover:-translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

function HowItWorksStep({ number, title, description, icon, color }) {
  return (
    <div className="relative">
      <div className="card-glass-premium p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group relative z-10">
        {/* Number Circle */}
        <div
          className={`w-16 h-16 rounded-full bg-${color}/20 border-2 border-${color} flex items-center justify-center mb-6 mx-auto relative z-10`}>
          <span className={`text-2xl font-bold text-${color}`}>{number}</span>
        </div>

        {/* Icon */}
        <div
          className={`text-${color} flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>

        <h3 className="text-xl font-bold text-white mb-3 text-center">
          {title}
        </h3>

        <p className="text-gray-400 text-center leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function PlatformCard({ name, color, icon }) {
  return (
    <div className="card-glass-premium p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group hover:scale-105 cursor-pointer flex flex-col items-center justify-center">
      <div
        className={`w-20 h-20 rounded-2xl bg-linear-to-br ${color} mb-4 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all duration-300 group-hover:shadow-glow`}>
        {icon}
      </div>
      <h4 className="text-white font-bold text-center text-sm">{name}</h4>
    </div>
  );
}

function StatCard({ number, label, icon }) {
  return (
    <div className="space-y-2 group">
      <div className="mb-2 group-hover:scale-110 transition-transform duration-300 flex justify-center">
        {icon}
      </div>
      <div className="text-4xl text-white font-display font-bold group-hover:text-brand-primary transition-colors">
        {number}
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
        {label}
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  currency = 'USD',
  period = '',
  features,
  cta,
  link,
  onSubscribe,
  popular = false,
}) {
  return (
    <div
      className={`card-glass-premium p-10 flex flex-col relative overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
        popular
          ? 'border-brand-primary/50 shadow-glow-strong scale-105 z-10'
          : 'border-white/5'
      }`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-brand-primary text-brand-dark text-[10px] font-black uppercase tracking-widest py-1.5 px-6 rounded-bl-xl">
          الأكثر طلباً
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-400 mb-4">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl md:text-5xl font-display font-black text-white">
            {price}
          </span>
          <span className="text-gray-400 font-bold mx-1">{currency}</span>
          <span className="text-gray-500 font-medium">{period}</span>
        </div>
      </div>
      <div className="space-y-4 mb-10 grow">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-gray-300 text-sm">
            <Check className="w-5 h-5 text-brand-secondary shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {onSubscribe ? (
        <button
          onClick={onSubscribe}
          className={`w-full py-4 rounded-xl font-bold text-center transition-all duration-300 block ${
            popular
              ? 'btn btn-primary'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          }`}>
          {cta}
        </button>
      ) : (
        <a
          href={link}
          className={`w-full py-4 rounded-xl font-bold text-center transition-all duration-300 block ${
            popular
              ? 'btn btn-primary'
              : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          }`}>
          {cta}
        </a>
      )}
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="card-glass-premium border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
      <button
        onClick={onClick}
        className="w-full p-6 text-right flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
        <span className="text-white font-bold text-lg">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-brand-primary transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}>
        <div className="p-6 pt-0 text-gray-400 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
}
