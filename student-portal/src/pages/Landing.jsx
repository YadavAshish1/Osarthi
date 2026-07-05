import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, BookOpen, Shield, Sparkles, Users } from 'lucide-react';

const features = [
  { icon: BookOpen, title: 'Rich Content', desc: 'Medium-style blocks with highlights, media, and structured lessons.' },
  { icon: BarChart3, title: 'Smart Quizzes', desc: 'Google Forms-like assessments with timers, auto-grading, and insights.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bcrypt hashing, JWT with refresh tokens, and secure session handling.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Separate experiences for teachers and students with class-level content.' },
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300 mb-6">
              <Sparkles className="h-4 w-4" /> Next-generation EdTech platform
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Education that <span className="gradient-text">scales</span> with ambition
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
              Osarthi empowers teachers to craft beautiful, highlighted lessons and powerful quizzes — while students learn with clarity, accountability, and real-time feedback.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/get-started" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 font-semibold hover:bg-brand-500 transition shadow-lg shadow-brand-600/25">
                Start free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/about" className="rounded-full border border-white/20 px-8 py-3.5 font-semibold hover:bg-white/5 transition">
                Learn more
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold mb-12">Built for modern classrooms</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 hover:border-brand-500/30 transition"
            >
              <f.icon className="h-10 w-10 text-brand-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-2xl font-bold mb-4">Ready to transform learning?</h2>
          <p className="text-slate-400 mb-8">Join teachers and students already building the future of education on Osarthi.</p>
          <Link to="/get-started" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3 font-semibold hover:bg-brand-500 transition">
            Create your account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
