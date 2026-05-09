import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Amex', 'Capital One', 'Citi', 'TD Bank', 'US Bank', 'PNC', 'Discover', 'Chase', 'Bank of America', 'Wells Fargo', 'Amex', 'Capital One'];

const STEPS = [
  { n: '01', icon: '📤', title: 'Upload Statement', desc: 'Drag & drop your PDF or CSV bank/credit card statement. We support all major banks.' },
  { n: '02', icon: '🤖', title: 'AI Parses & Categorizes', desc: 'Claude AI extracts every transaction, cleans merchant names, and assigns categories automatically.' },
  { n: '03', icon: '📊', title: 'Get Actionable Insights', desc: 'Your dashboard populates instantly with charts, trends, and dollar-quantified savings recommendations.' },
];

const FEATURES = [
  { icon: '📄', title: 'PDF & CSV Upload',        desc: 'Chase, Amex, Wells Fargo, Capital One — drop any statement and our AI reads it.' },
  { icon: '🤖', title: 'AI Categorization',        desc: 'Claude AI categorizes every transaction with >90% accuracy. No manual tagging.' },
  { icon: '📊', title: 'Spending Dashboard',       desc: 'Income vs expenses, category breakdown, and 6-month cash flow — all in one view.' },
  { icon: '💡', title: 'Smart Recommendations',    desc: 'Dollar-quantified tips: refinance suggestions, cashback stores, unused subscriptions.' },
  { icon: '🔍', title: 'Subscription Audit',       desc: 'Automatically flags recurring charges so you can cancel what you no longer use.' },
  { icon: '📈', title: 'Debt Ratio Tracker',       desc: 'See your income-to-debt ratio at a glance — the most important financial health number.' },
];

const STATS = [
  { value: '< 30s',  label: 'Upload to insights' },
  { value: '90%+',   label: 'AI accuracy' },
  { value: '$100+',  label: 'Avg monthly savings found' },
  { value: '3+',     label: 'AI tips per month' },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

// ── Mini dashboard mockup shown in hero ────────────────────────────────────────
function DashboardMockup() {
  const bars = [55, 80, 60, 90, 70, 95, 65];
  return (
    <div className="relative bg-[#0f0f1a] rounded-2xl border border-purple-800/40 p-5
                    shadow-[0_0_60px_rgba(124,58,237,0.2)] w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 font-medium">May 2026 · Overview</span>
        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">Live</span>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Income',  value: '$5,200', color: 'text-green-400' },
          { label: 'Spent',   value: '$3,840', color: 'text-red-400' },
          { label: 'Saved',   value: '$1,360', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a2e] rounded-xl p-2.5">
            <div className="text-[10px] text-gray-500 mb-1">{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Bar chart */}
      <div className="bg-[#1a1a2e] rounded-xl p-3 mb-3">
        <div className="text-[10px] text-gray-500 mb-2">Spending by month</div>
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t"
              style={{ height: `${h}%`, background: i === 6 ? 'linear-gradient(to top, #7c3aed, #a78bfa)' : 'rgba(124,58,237,0.3)' }} />
          ))}
        </div>
      </div>
      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: 'Groceries 22%', c: 'bg-purple-600/20 text-purple-300' },
          { label: 'Dining 18%',    c: 'bg-violet-600/20 text-violet-300' },
          { label: 'Rent 34%',      c: 'bg-indigo-600/20 text-indigo-300' },
          { label: 'Subs 8%',       c: 'bg-pink-600/20 text-pink-300' },
        ].map(p => (
          <span key={p.label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.c}`}>{p.label}</span>
        ))}
      </div>
      {/* Glow dot */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
    </div>
  );
}

// ── Scrolling bank ticker ──────────────────────────────────────────────────────
function BankTicker() {
  return (
    <div className="py-10 border-y border-purple-900/20 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#070711] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#070711] to-transparent z-10" />
      <div className="flex whitespace-nowrap">
        <div className="flex animate-marquee">
          {BANKS.map((b, i) => (
            <span key={i} className="mx-8 text-gray-500 text-sm font-medium tracking-widest uppercase">
              {b} <span className="text-purple-800 mx-6">·</span>
            </span>
          ))}
        </div>
        <div className="flex animate-marquee2 absolute">
          {BANKS.map((b, i) => (
            <span key={i} className="mx-8 text-gray-500 text-sm font-medium tracking-widest uppercase">
              {b} <span className="text-purple-800 mx-6">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="bg-[#070711] min-h-screen text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-4
                      bg-[#070711]/80 backdrop-blur-md border-b border-purple-900/20">
        <span className="text-xl font-bold gradient-text">FinSight</span>
        <div className="flex items-center gap-8 text-sm text-gray-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features"     className="hover:text-white transition-colors">Features</a>
          <Link to="/login"       className="hover:text-white transition-colors">Sign in</Link>
          <Link to="/register"
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl
                       transition-all font-medium shadow-lg shadow-purple-900/40">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center pt-20 px-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-16 w-full">
          {/* Left */}
          <motion.div className="flex-1" variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-600/20
                            px-4 py-1.5 rounded-full text-xs text-purple-400 mb-6 font-medium">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              Powered by Claude AI
            </div>
            <h1 className="text-6xl font-black leading-[1.1] mb-6">
              Know exactly where<br />
              <span className="gradient-text">every dollar goes.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
              Upload your bank or credit card statement. FinSight's AI parses, categorizes
              every transaction, and gives you actionable recommendations to improve your financial health.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/register"
                className="px-7 py-3.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold
                           transition-all shadow-lg shadow-purple-900/50 text-base">
                Start for Free
              </Link>
              <a href="#how-it-works"
                className="px-7 py-3.5 border border-gray-700 hover:border-gray-500 rounded-xl
                           font-semibold transition-colors text-gray-300 hover:text-white text-base">
                See How It Works
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-600">No bank connection required · Just upload and go</p>
          </motion.div>

          {/* Right — dashboard mockup */}
          <motion.div className="flex-1 flex justify-center" variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.7, delay: 0.2 }}>
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ── Bank ticker ── */}
      <BankTicker />

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 px-10 max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden"
          whileInView="show" viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="text-xs text-purple-400 font-semibold tracking-widest uppercase">Simple Process</span>
          <h2 className="text-4xl font-black mt-3">Three steps to financial clarity</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} variants={fadeUp} initial="hidden"
              whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-[#0f0f1a] border border-purple-900/30 rounded-2xl p-8
                         hover:border-purple-600/50 transition-all group">
              <div className="text-4xl mb-4">{s.icon}</div>
              <div className="text-xs text-purple-500 font-bold tracking-widest mb-2">{s.n}</div>
              <h3 className="text-lg font-bold mb-3 group-hover:text-purple-300 transition-colors">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-10 max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" variants={fadeUp} initial="hidden"
          whileInView="show" viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="text-xs text-purple-400 font-semibold tracking-widest uppercase">Features</span>
          <h2 className="text-4xl font-black mt-3">Everything you need to take control</h2>
        </motion.div>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} initial="hidden"
              whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(124,58,237,0.15)' }}
              className="bg-[#0f0f1a] border border-purple-900/20 rounded-2xl p-6 cursor-default
                         hover:border-purple-600/40 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-10 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-purple-900/30 to-violet-900/20 border border-purple-800/30
                     rounded-2xl p-10 grid grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-4xl font-black gradient-text mb-2">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-10 text-center">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-5xl font-black mb-4">
            Start your financial<br /><span className="gradient-text">journey today.</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">Free to use. No bank connection required. Just upload and go.</p>
          <Link to="/register"
            className="inline-block px-10 py-4 bg-purple-600 hover:bg-purple-500 rounded-xl
                       font-bold text-lg transition-all shadow-2xl shadow-purple-900/50">
            Create Free Account
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-10 border-t border-purple-900/20 flex items-center justify-between text-gray-600 text-sm">
        <span className="gradient-text font-bold text-base">FinSight</span>
        <span>Built with FastAPI · React · Claude AI</span>
        <div className="flex gap-6">
          <Link to="/login"    className="hover:text-gray-400 transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-gray-400 transition-colors">Get started</Link>
        </div>
      </footer>
    </div>
  );
}
