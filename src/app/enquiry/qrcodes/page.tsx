"use client";

import { useRef } from "react";

const BASE_URL = "https://sarvadamodernschool.com";

const QR_PAGES = [
  {
    slug:     "nursery",
    label:    "Nursery & KG",
    subtitle: "Playgroup · Nursery · KG · Class 1",
    emoji:    "🌟",
    color:    "#f59e0b",
    bg:       "#fffbeb",
    border:   "#fde68a",
    desc:     "For parents seeking admission\nin Playgroup, Nursery or KG",
  },
  {
    slug:     "primary",
    label:    "Primary School",
    subtitle: "Classes 1 – 5",
    emoji:    "📚",
    color:    "#3b82f6",
    bg:       "#eff6ff",
    border:   "#bfdbfe",
    desc:     "For parents seeking admission\nin Classes 1 to 5",
  },
  {
    slug:     "senior",
    label:    "Senior School",
    subtitle: "Classes 6 – 10",
    emoji:    "🎓",
    color:    "#059669",
    bg:       "#f0fdf4",
    border:   "#a7f3d0",
    desc:     "For parents seeking admission\nin Classes 6 to 10",
  },
];

function qrUrl(slug: string, size = 300) {
  const target = encodeURIComponent(`${BASE_URL}/enquiry/${slug}#form`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${target}&margin=12&color=1a1c1c&bgcolor=ffffff&format=png`;
}

export default function QRCodesPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #qr-print-area, #qr-print-area * { visibility: visible; }
          #qr-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>

      {/* ── Screen header ────────────────────────────────── */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a1c1c" }}>
            📋 Admission QR Codes — Print Sheet
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Sarvada Modern School · Admissions 2026-27</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-md hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg, #1a3a2a, #059669)" }}
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* ── Instructions (screen only) ─────────────────── */}
      <div className="no-print max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 mb-8">
          <h3 className="font-bold text-blue-800 mb-2">📌 How to Use These QR Codes</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Print this sheet and cut the QR cards individually</li>
            <li>Paste them on pamphlets, notice boards, banners, or entry gates</li>
            <li>Share the direct links in school announcements, SMS broadcasts, or notices</li>
            <li>Each QR opens directly to the enquiry form — no navigation needed</li>
          </ul>
        </div>

        {/* Direct links table */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">🔗 Direct Form Links (for digital sharing)</h3>
          <div className="space-y-3">
            {QR_PAGES.map(p => (
              <div key={p.slug} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.subtitle}</p>
                </div>
                <a
                  href={`/enquiry/${p.slug}#form`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono px-3 py-1.5 rounded-lg text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  {BASE_URL}/enquiry/{p.slug}#form ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Printable QR Sheet ────────────────────────────── */}
      <div
        id="qr-print-area"
        ref={printRef}
        className="max-w-6xl mx-auto px-6 pb-16"
      >
        {/* Print header */}
        <div className="text-center mb-8 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-1">
            Sarvada Modern School — Admissions 2026-27
          </p>
          <p className="text-xs text-gray-400">
            A/18 Gali No. 1, Sukkar Bazar, Sadatpur, Karawal Nagar, New Delhi — 110090
          </p>
        </div>

        {/* QR cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {QR_PAGES.map(p => (
            <div
              key={p.slug}
              className="rounded-3xl overflow-hidden shadow-xl border-2 flex flex-col"
              style={{ borderColor: p.border }}
            >
              {/* Card header */}
              <div className="py-5 px-4 text-center" style={{ background: p.color }}>
                <div className="text-5xl mb-2">{p.emoji}</div>
                <h2 className="text-xl font-bold text-white">{p.label}</h2>
                <p className="text-white/80 text-sm mt-0.5">{p.subtitle}</p>
              </div>

              {/* QR code */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 px-4" style={{ background: p.bg }}>
                <div
                  className="rounded-2xl p-3 shadow-md mb-4 border-2"
                  style={{ background: "white", borderColor: p.border }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl(p.slug, 260)}
                    alt={`QR Code for ${p.label} enquiry`}
                    width={220}
                    height={220}
                    className="block"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                <p
                  className="text-xs font-bold uppercase tracking-widest text-center mb-3"
                  style={{ color: p.color }}
                >
                  📱 Scan to Enquire
                </p>

                <p className="text-xs text-center text-gray-500 leading-relaxed mb-4">
                  {p.desc}
                </p>

                {/* URL text for print */}
                <div className="w-full rounded-xl px-3 py-2 text-center" style={{ background: "white", border: `1px solid ${p.border}` }}>
                  <p className="text-[10px] font-mono break-all" style={{ color: "#374151" }}>
                    sarvadamodernschool.com/enquiry/{p.slug}
                  </p>
                </div>
              </div>

              {/* Card footer */}
              <div className="py-3 px-4 text-center" style={{ background: "#1a1c1c" }}>
                <p className="text-[11px] font-bold text-white/90">
                  📞 +91 99994 39422
                </p>
                <p className="text-[9px] text-white/50 mt-0.5">Mon–Sat · 8 AM – 2:30 PM</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom school branding */}
        <div className="mt-10 text-center">
          <div className="inline-block px-8 py-4 rounded-2xl border-2 border-gray-200 bg-white">
            <p className="font-bold text-gray-800 text-sm">🏫 Sarvada Modern Secondary School</p>
            <p className="text-xs text-gray-500 mt-1">
              Sadatpur, Karawal Nagar, New Delhi 110090 · Est. 1972 · CBSE Affiliated
            </p>
            <p className="text-xs font-bold mt-1" style={{ color: "#059669" }}>
              www.sarvadamodernschool.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
