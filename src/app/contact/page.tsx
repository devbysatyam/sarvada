"use client";

import { useState } from "react";
import { Metadata } from "next";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          formType: "Contacts"
        }),
      });

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
    }
  };

  return (
    <main className="flex-grow w-full px-margin-mobile md:px-margin-desktop py-space-xl flex flex-col gap-space-xl">
      {/* Header Section */}
      <header className="max-w-4xl mx-auto text-center flex flex-col gap-space-sm py-16">
        <h1 className="font-display-lg text-display-lg text-primary uppercase tracking-tighter">Contact & Locate</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">We welcome inquiries from prospective families and current parents. Reach out to us for any queries regarding admissions, transportation, or academic support.</p>
      </header>

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-container-max mx-auto w-full">
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-10 border border-surface-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <h2 className="font-headline-sm text-primary mb-8 uppercase tracking-widest">Send us a Message</h2>

          {status === "success" ? (
            <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
              <span className="material-symbols-outlined text-6xl text-primary mb-4">check_circle</span>
              <h3 className="font-headline-md text-primary mb-2">Message Sent!</h3>
              <p className="font-body-md text-on-surface-variant">Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setStatus("idle")} className="mt-8 text-primary font-label-caps uppercase tracking-widest underline underline-offset-8">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="e.g. +91 9999XXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Subject</label>
                <select
                  value={formData.subject}
                  title="Inquiry Subject"
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all appearance-none"
                >
                  <option>General Inquiry</option>
                  <option>Admission Query</option>
                  <option>Transport Issue</option>
                  <option>Fee Related</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Your Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all resize-none"
                  placeholder="How can we help you today?"
                />
              </div>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-primary text-on-primary py-5 font-label-caps uppercase tracking-[0.3em] hover:bg-secondary transition-all disabled:opacity-50"
              >
                {status === "submitting" ? "Sending..." : "Submit Inquiry"}
              </button>
              {status === "error" && (
                <p className="text-error text-xs text-center font-medium">Failed to send message. Please try again or contact us via phone.</p>
              )}
            </form>
          )}
        </div>

        {/* Quick Info & Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-gutter">
          <div className="bg-primary text-on-primary p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-on-primary/5 rounded-full -mr-16 -mt-16"></div>
            <h3 className="font-headline-sm mb-8 uppercase tracking-widest opacity-80">Direct Contact</h3>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">phone_iphone</span>
                <div>
                  <p className="font-label-caps text-[10px] uppercase opacity-60 mb-1">Administrative Help</p>
                  <p className="font-headline-sm">099994 39422</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">mail</span>
                <div>
                  <p className="font-label-caps text-[10px] uppercase opacity-60 mb-1">Official Email</p>
                  <p className="font-headline-sm">sarvada@ymail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">location_on</span>
                <div>
                  <p className="font-label-caps text-[10px] uppercase opacity-60 mb-1">Campus Address</p>
                  <p className="font-body-md leading-relaxed">
                    A/18 Gali no. 1 sukkar Bazar,<br />
                    near by Sarvada Modern sec. School,<br />
                    Sadatpur, Karawal Nagar, New Delhi, Delhi 110090
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-10 border border-surface-variant/30">
            <h3 className="font-headline-sm text-primary mb-6 uppercase tracking-widest text-sm">PTA & Visiting Hours</h3>
            <ul className="space-y-4 font-body-sm text-on-surface-variant">
              <li className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                <span>PTA: Last day of every month (**9:00 AM - 12:00 Noon**)</span>
              </li>
              <li className="flex gap-4">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <span>Office Hours: 8:30 AM - 1:30 PM (Mon-Sat)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-container-max mx-auto w-full mb-16 h-[450px] bg-surface-container border border-surface-variant overflow-hidden group">
        <img
          alt="Map View"
          className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-opacity duration-700"
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
        />
      </section>
    </main>
  );
}
