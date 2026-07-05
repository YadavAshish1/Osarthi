import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-6">About Osarthi</h1>
        <p className="text-lg text-slate-300 leading-relaxed mb-6">
          Osarthi is an EdTech platform built to bridge the gap between exceptional teaching and meaningful learning. We believe every classroom deserves tools that match the ambition of its educators.
        </p>
        <div className="grid gap-6 sm:grid-cols-3 mt-12">
          {[
            { n: '10K+', l: 'Lessons delivered' },
            { n: '500+', l: 'Educators onboarded' },
            { n: '99.9%', l: 'Platform uptime' },
          ].map((s) => (
            <div key={s.l} className="glass rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold gradient-text">{s.n}</p>
              <p className="text-sm text-slate-400 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-semibold mt-16 mb-4">Our mission</h2>
        <p className="text-slate-400 leading-relaxed">
          To democratize high-quality education technology — giving teachers intuitive content creation, rich text highlighting, and powerful assessment tools, while giving students a clear, engaging path to mastery.
        </p>
      </motion.div>
    </div>
  );
}
