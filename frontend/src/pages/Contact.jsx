import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-4">Contact us</h1>
        <p className="text-slate-400 mb-12">We&apos;d love to hear from educators, institutions, and partners.</p>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-6">
            {[
              { icon: Mail, text: 'hello@osarthi.com' },
              { icon: Phone, text: '+91 98765 43210' },
              { icon: MapPin, text: 'Bengaluru, India' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                <Icon className="h-5 w-5 text-brand-400" /> {text}
              </div>
            ))}
          </div>
          {sent ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-green-400 font-medium">Thank you! We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-4">
              <input required placeholder="Name" className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
              <input required type="email" placeholder="Email" className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
              <textarea required placeholder="Message" rows={4} className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3" />
              <button type="submit" className="w-full rounded-full bg-brand-600 py-3 font-semibold hover:bg-brand-500">Send message</button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
