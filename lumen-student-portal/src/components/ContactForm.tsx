"use client";

import React, { useState } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    isTeacher: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Thank you — your note has landed.");
      setForm({ name: "", email: "", message: "", isTeacher: false });
    } catch (err: any) {
      toast.error(formatApiErrorDetail(err?.response?.data?.message || err?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-12 space-y-6 bg-white border border-[#E5E1D8] rounded-xl p-8 shadow-xs font-ui"
    >
      <div>
        <label className="block eyebrow text-[11px] text-[#5C5A55] mb-2">
          Your name
        </label>
        <input
          data-testid="contact-name-input"
          type="text"
          required
          minLength={1}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Aarav Sharma"
          className="w-full h-11 px-4 border border-[#E5E1D8] rounded-md bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
        />
      </div>

      <div>
        <label className="block eyebrow text-[11px] text-[#5C5A55] mb-2">
          Email address
        </label>
        <input
          data-testid="contact-email-input"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="student@example.com"
          className="w-full h-11 px-4 border border-[#E5E1D8] rounded-md bg-white text-sm focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
        />
      </div>

      <div>
        <label className="block eyebrow text-[11px] text-[#5C5A55] mb-2">
          Message
        </label>
        <textarea
          data-testid="contact-message-input"
          required
          minLength={1}
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="What's on your mind?"
          className="w-full p-4 border border-[#E5E1D8] rounded-md bg-white font-serif-body text-[15px] leading-relaxed focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32]"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isTeacher"
          checked={form.isTeacher}
          onChange={(e) => setForm({ ...form, isTeacher: e.target.checked })}
          className="w-4 h-4 rounded border-[#E5E1D8] text-[#A84C32] focus:ring-[#A84C32]"
        />
        <label htmlFor="isTeacher" className="text-sm text-[#5C5A55] cursor-pointer">
          I am a teacher interested in contributing insights
        </label>
      </div>

      <button
        data-testid="contact-submit"
        type="submit"
        disabled={loading}
        className="h-11 px-8 rounded-full bg-[#1A1A1A] text-white font-ui text-sm font-semibold hover:bg-[#A84C32] transition-colors disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
