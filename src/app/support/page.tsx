import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Support Us & Partnership Opportunities | Sarvada Modern School",
  description: "Join hands with Sarvada Shiksha Samiti to fund modern digital labs, sponsor clean drinking water, and build a permanent endowment fund for underprivileged children.",
};

export default function SupportPage() {
  notFound();

  return (
    <main className="bg-surface">
      {/* Page Hero Header */}
      <section className="py-20 md:py-28 px-margin-mobile md:px-margin-desktop bg-surface-container border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto text-center">
          <span className="font-label-caps text-secondary uppercase tracking-[0.4em] mb-6 block">Make an Impact</span>
          <h1 className="font-display-lg text-[32px] md:text-display-lg text-primary mb-8 uppercase tracking-tight leading-none">
            Partnership &<br className="md:hidden" /> Endowment Fund
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
            Sarvada Shiksha Samiti has worked for over 54 years in North East Delhi. By partnering with us, you help bridge the educational divide, providing world-class CBSE education to families in India's most densely populated funding desert.
          </p>
        </div>
      </section>

      {/* Regional Focus & Need Analysis */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">The Funding Desert</span>
              <h2 className="font-headline-lg text-[26px] md:text-[36px] text-primary mb-6 leading-tight uppercase font-bold">
                Why North East Delhi Needs You
              </h2>
              <div className="space-y-6 font-body-md text-on-surface-variant leading-relaxed">
                <p>
                  North East Delhi is among India's most densely populated areas, with over <strong>30,000 residents per square kilometer</strong>. Many students are first-generation learners from households of daily-wage workers, home-based artisans, and small traders. Due to extreme overcrowding, municipal schools run in up to four shifts.
                </p>
                <p>
                  While Delhi's total educational CSR spending reached <strong>₹2,487 Crore</strong> in the last decade, North East Delhi received <strong>less than 0.8%</strong> of that entire pool. Corporate spending has historically been concentrated in affluent central districts.
                </p>
                <p className="font-medium text-primary">
                  Sarvada is a registered, certified non-profit trust (Reg. No. 4532/1972) serving Sadatpur and Karawal Nagar. Your sponsorship directly addresses this acute resource disparity.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 bg-surface-container-low p-8 border border-outline-variant/30 shadow-md">
              <span className="font-label-caps text-[10px] text-secondary tracking-widest uppercase block mb-4">CSR Allocation Disparity</span>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span>New Delhi District</span>
                    <span className="text-primary">₹1,119 Cr (45%)</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-2">
                    <div className="bg-[#1a3a2a] h-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span>Central Delhi District</span>
                    <span className="text-primary">₹733 Cr (29.5%)</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-2">
                    <div className="bg-[#1a3a2a] h-full" style={{ width: "29.5%" }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                    <span>North East Delhi (Our Area)</span>
                    <span className="text-secondary font-bold">Under ₹19 Cr (&lt; 0.8%)</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-2">
                    <div className="bg-secondary h-full" style={{ width: "0.8%" }}></div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant italic mt-8 leading-normal text-center">
                Source: National CSR Portal (MCA) &middot; Cumulative Funding (2014–2024)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Milestones */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Our Roadmap</span>
            <h2 className="font-headline-lg text-[28px] md:text-[38px] text-primary uppercase font-bold">Strategic Milestones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[36px] font-bold text-secondary/30 block mb-4 font-mono">01</span>
                <h3 className="font-headline-sm text-primary mb-4 font-bold">World-Class Access</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E6C2D] block mb-4 bg-[#F9F5EB] w-max px-3 py-1">Goal: 2100+ Enrolled Students</span>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-6">
                  Expanding our school premises, building additional modern classrooms, and hiring certified expert faculty to accommodate and educate more low-income learners in the district.
                </p>
              </div>
              <span className="text-xs font-semibold text-secondary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Active Expansion Drive
              </span>
            </div>
            
            <div className="bg-white p-8 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[36px] font-bold text-secondary/30 block mb-4 font-mono">02</span>
                <h3 className="font-headline-sm text-primary mb-4 font-bold">Top-Tier Infrastructure</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E6C2D] block mb-4 bg-[#F9F5EB] w-max px-3 py-1">Goal: Top 1% Facility in District</span>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-6">
                  Equipping every classroom with interactive smart boards, robust fiber broadband, fully updated digital/computer labs, hygienic sanitation setups, and solar energy arrays.
                </p>
              </div>
              <span className="text-xs font-semibold text-secondary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Active Infrastructure Upgrades
              </span>
            </div>

            <div className="bg-white p-8 border border-outline-variant/30 flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[36px] font-bold text-secondary/30 block mb-4 font-mono">03</span>
                <h3 className="font-headline-sm text-primary mb-4 font-bold">Sustainable Free Education</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E6C2D] block mb-4 bg-[#F9F5EB] w-max px-3 py-1">Goal: Permanent Endowment Corpus</span>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-6">
                  Building a permanent financial reserve fund so that high-quality, completely free education is guaranteed for underprivileged students across future generations, unaffected by annual fundraising fluctuations.
                </p>
              </div>
              <span className="text-xs font-semibold text-secondary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Core Endowment Drive
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Flexible Asset & In-Kind Opportunities */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Asset Partnership</span>
            <h2 className="font-headline-lg text-[28px] md:text-[38px] text-primary uppercase font-bold">Flexible In-Kind Sponsorships</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mt-4">
              We welcome resource support that matches your corporate inventory or philanthropic capacity. Contributors can donate physical items or sponsor broad developmental initiatives.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                t: "Digital Tech & Labs",
                d: "Desktop computers, laptops, tablets, interactive display panels, robotic kits, educational software, or server modules.",
                i: "computer"
              },
              {
                t: "RO Water & Hygiene",
                d: "High-volume RO drinking water filtration units, water coolers, sanitation fixtures, or pediatric health screening support.",
                i: "local_hospital"
              },
              {
                t: "STEM & Co-Curriculars",
                d: "Physics/Chemistry lab glassware, general library books, sports gear, musical instruments, and arts club supplies.",
                i: "science"
              },
              {
                t: "Infrastructure & Energy",
                d: "Rooftop solar panels, power inverters, eco-friendly classroom furniture, building repair materials, or eco-plantation tools.",
                i: "solar_power"
              }
            ].map(item => (
              <div key={item.t} className="bg-surface-container-lowest p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-[40px] text-secondary mb-6">{item.i}</span>
                <h4 className="font-headline-sm text-[18px] text-primary font-bold mb-4">{item.t}</h4>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Contribution Tiers */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Structured Support</span>
            <h2 className="font-headline-lg text-[28px] md:text-[38px] text-primary uppercase font-bold">Choose Your Impact</h2>
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mt-4">
              For organizations and families seeking clearly defined financial sponsorships, we maintain transparent cost-tracked giving tiers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                cat: "Individual / Family",
                title: "Sponsor a Child's Year",
                cost: "₹36,000 / $450",
                freq: "per year",
                impact: "Direct Educational Support",
                desc: "Covers tuition, textbooks, learning materials, uniforms, and digital lab access for one student for a full academic year. Donors receive quarterly progress updates with the student's academic performance."
              },
              {
                cat: "SME / Corporate CSR",
                title: "Equip the STEM & Robotics Lab",
                cost: "₹7,50,000 / $9,000",
                freq: "one-time",
                impact: "Enabling 200+ Students Weekly",
                desc: "Funds 15 high-speed desktops running open-source software (Ubuntu Linux), 10 Arduino starter kits with electronic components, and dedicated instructor training for a full programme cycle."
              },
              {
                cat: "Anchor CSR Partner",
                title: "Sponsor a Smart Classroom",
                cost: "₹15,00,000 / $18,000",
                freq: "one-time",
                impact: "Institutional Naming Rights",
                desc: "Installs a 75-inch interactive smart panel, high-speed Wi-Fi, ergonomic furniture, and educational wall graphics. The classroom carries your name permanently — a visible, lasting legacy on campus."
              },
              {
                cat: "Endowment Builder",
                title: "Permanent Corpus Contribution",
                cost: "₹50,00,000+ / $60,000+",
                freq: "corpus",
                impact: "Multi-Generational Legacy",
                desc: "Deposited into the school's permanent endowment reserve. Only the annual interest is utilised for scholarships and infrastructure — your capital remains intact, generating impact year after year, indefinitely."
              }
            ].map(tier => (
              <div key={tier.title} className="bg-white p-6 border border-outline-variant/30 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-2">{tier.cat}</span>
                  <h4 className="font-headline-sm text-[16px] text-primary font-bold mb-3">{tier.title}</h4>
                  <div className="mb-4">
                    <span className="text-[22px] font-bold text-primary font-mono block">{tier.cost}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block mt-0.5">{tier.freq}</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8E6C2D] block mb-3 bg-[#F9F5EB] w-max px-2 py-0.5">{tier.impact}</span>
                  <p className="font-body-sm text-on-surface-variant leading-relaxed">{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSR Alignment Table */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Regulatory Mandates</span>
            <h2 className="font-headline-lg text-[28px] md:text-[38px] text-primary uppercase font-bold">Schedule VII CSR Compliance</h2>
          </div>
          <div className="overflow-x-auto border border-outline-variant/30">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-[#1a3a2a] text-white">
                  <th className="p-5 font-label-caps text-[11px] uppercase tracking-wider border-b border-outline-variant/30 w-[25%]">CSR Category</th>
                  <th className="p-5 font-label-caps text-[11px] uppercase tracking-wider border-b border-outline-variant/30 w-[20%]">Delhi Pool (10Yr)</th>
                  <th className="p-5 font-label-caps text-[11px] uppercase tracking-wider border-b border-outline-variant/30">School Alignment & Specific Needs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-body-md text-on-surface-variant">
                {[
                  { cat: "Education & STEM", pool: "₹2,487 Crore", need: "Computer lab hardware, classroom smart interactive displays, robotics training kits, computer programming resources, and professional faculty digital certification." },
                  { cat: "Health & Sanitation", pool: "₹1,985 Crore", need: "Water filtration systems and drinking water coolers, health and sanitation infrastructure, child health screening camps, and student nutrition support." },
                  { cat: "Gender Equality", pool: "₹229 Crore", need: "Dedicated merit scholarships for girl students, personal hygiene facilities, self-defense training, and career-readiness workshops." },
                  { cat: "Environment", pool: "₹155 Crore", need: "Rooftop solar power systems, campus greening and tree plantation drives, and student waste-management awareness programs." },
                  { cat: "Sports & Culture", pool: "₹131 Crore", need: "Sports equipment, co-curricular facilities, inter-school tournament support, photography/creative club equipment, and cultural heritage festivals." }
                ].map((row, idx) => (
                  <tr key={row.cat} className={idx % 2 === 1 ? "bg-surface-container-lowest" : "bg-white"}>
                    <td className="p-5 font-bold text-primary">{row.cat}</td>
                    <td className="p-5 font-semibold text-secondary">{row.pool}</td>
                    <td className="p-5 leading-relaxed">{row.need}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Donation & Payment Details with Live QR */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Bank & UPI Details</span>
              <h2 className="font-headline-lg text-[26px] md:text-[36px] text-primary mb-6 leading-tight uppercase font-bold">
                Initiate Contribution
              </h2>
              <p className="font-body-lg text-on-surface-variant mb-8 leading-relaxed">
                Direct wire transfers and UPI payments go directly to our official bank account. Tax-deductible receipts will be issued within fifteen working days of contribution verification.
              </p>
              
              <div className="bg-surface-container-low p-8 border border-outline-variant/30 space-y-4">
                <div className="grid grid-cols-3 border-b border-outline-variant/20 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Account Name</span>
                  <span className="col-span-2 font-bold text-primary">SARVADA SHIKSHA SAMITI</span>
                </div>
                <div className="grid grid-cols-3 border-b border-outline-variant/20 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Bank Name</span>
                  <span className="col-span-2 text-primary">Kotak Mahindra Bank Ltd</span>
                </div>
                <div className="grid grid-cols-3 border-b border-outline-variant/20 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Account Number</span>
                  <span className="col-span-2 font-mono font-bold text-primary tracking-wide">997205012345</span>
                </div>
                <div className="grid grid-cols-3 border-b border-outline-variant/20 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">IFSC Code</span>
                  <span className="col-span-2 font-mono font-bold text-primary">KKBK0000172</span>
                </div>
                <div className="grid grid-cols-3 border-b border-outline-variant/20 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">UPI ID</span>
                  <span className="col-span-2 font-bold text-secondary bg-[#F9F5EB] px-2 py-0.5 w-max">sarvadasociety@kotak</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Swift Code</span>
                  <span className="col-span-2 text-primary">KKBKINBBXXX (International)</span>
                </div>
              </div>

              {/* 80G tax benefit */}
              <div className="mt-8 flex gap-4 p-6 bg-[#1a3a2a]/5 border-l-4 border-[#1a3a2a] items-start">
                <span className="material-symbols-outlined text-[24px] text-[#1a3a2a] shrink-0 mt-0.5">verified_user</span>
                <div>
                  <h5 className="font-bold text-[#1a3a2a] uppercase text-xs tracking-wider mb-1">50% Tax Deduction (Section 80G)</h5>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Sarvada Shiksha Samiti is a registered non-profit trust in India. Domestic individual and corporate donations are fully eligible for a 50% tax exemption under Section 80G of the Income Tax Act, 1961.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Live QR Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-white border border-outline-variant/30 shadow-md">
              <div className="w-56 h-56 relative bg-white p-2 border border-outline-variant/20 mb-6 flex items-center justify-center">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dsarvadasociety%40kotak%26pn%3DSARVADA%2520SHIKSHA%2520SAMITI%26cu%3DINR" 
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#1e293b] mb-2 bg-[#f1f5f9] px-3 py-1">UPI Payment Portal</span>
              <p className="text-xs text-on-surface-variant text-center max-w-xs leading-relaxed">
                Scan this QR code with any UPI application (GPay, PhonePe, Paytm, BHIM, Kotak) to securely transfer funds instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brochure & Resources Download Panel */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto text-center">
          <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Interactive Materials</span>
          <h2 className="font-headline-lg text-[26px] md:text-[36px] text-primary uppercase font-bold mb-8">Outreach Resources</h2>
          <div className="max-w-xl mx-auto">
            <a 
              href="/brochure/index.html" 
              target="_blank" 
              className="block p-10 bg-white border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col items-center group"
            >
              <span className="material-symbols-outlined text-[48px] text-primary mb-4 group-hover:scale-105 transition-transform">picture_as_pdf</span>
              <h4 className="font-bold text-primary mb-2 uppercase text-sm tracking-wider">Official Partnership Proposal Brochure</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6 max-w-sm">
                Open the official 7-page comprehensive partnership and endowment proposal. This is perfectly styled for printing or saving as a standard A4 PDF document.
              </p>
              <span className="text-xs font-bold text-secondary underline decoration-2 underline-offset-4">Open Web Brochure &rarr;</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
