"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full pt-section-padding pb-12 px-margin-mobile md:px-margin-desktop bg-surface border-t border-outline-variant/30 text-primary">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
        {/* Brand Col */}
        <div className="col-span-1 md:col-span-4 lg:col-span-5 flex flex-col mb-8 md:mb-0">
          <Link className="flex items-center gap-4 mb-6" href="/">
            <div className="w-16 h-16 relative overflow-hidden rounded-full border border-primary/10 flex items-center justify-center bg-white">
              <img 
                src="/logo.png" 
                alt="Sarvada Modern School Logo" 
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-4xl text-primary">school</span>';
                }}
              />
            </div>
            <span className="font-display-lg-mobile text-[40px] text-primary">Sarvada.</span>
          </Link>
          <p className="font-body-lg text-[18px] text-on-surface-variant mb-12 max-w-md font-light">
              Nurturing minds, building character, and shaping the leaders of tomorrow since 1972 (54 Years of Excellence).
          </p>
          <Link className="inline-flex items-center gap-3 border border-outline rounded-full px-6 py-3 text-primary font-label-caps text-[12px] uppercase tracking-widest w-max hover:bg-primary hover:text-white transition-colors" href="/compliance">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            CBSE Mandatory Disclosure
          </Link>
        </div>
        
        {/* Links Col 1 */}
        <div className="col-span-1 md:col-span-3 lg:col-span-2">
          <h4 className="font-label-caps text-[12px] tracking-[0.2em] uppercase text-on-surface-variant mb-8">Navigation</h4>
          <ul className="space-y-4">
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/about">About</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/academics">Academics</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/admissions">Admissions</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/student-life">Student Life</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/faculty">Faculty</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/gallery">Gallery</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/results">Results</Link></li>
          </ul>
        </div>
        
        {/* Links Col 2 */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <h4 className="font-label-caps text-[12px] tracking-[0.2em] uppercase text-on-surface-variant mb-8">Legal</h4>
          <ul className="space-y-4">
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/compliance">Compliance</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/trust">Trust & Society</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/notices">Notice Board</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/feedback">Parent Feedback</Link></li>
            <li><Link className="font-body-md text-[16px] text-primary hover:text-on-surface-variant transition-colors" href="/admin">Staff Login</Link></li>
          </ul>
        </div>
        
        {/* Contact Col */}
        <div className="col-span-1 md:col-span-3 lg:col-span-3">
          <h4 className="font-label-caps text-[12px] tracking-[0.2em] uppercase text-on-surface-variant mb-8">Contact</h4>
          <address className="not-italic font-body-md text-[16px] text-primary space-y-4">
            <p>A/18 Gali no. 1 sukkar Bazar, near by Sarvada Modern sec. School,<br/>Sadatpur, Karawal Nagar, New Delhi, Delhi 110090</p>
            <p className="pt-4 flex flex-col gap-1">
              <a className="hover:text-on-surface-variant transition-colors block font-medium" href="tel:09999439422">099994 39422</a>
            </p>
            <p><a className="hover:text-on-surface-variant transition-colors block" href="mailto:manager.sarvada@gmail.com">manager.sarvada@gmail.com</a></p>
          </address>
        </div>
        
        {/* Bottom Copyright Row */}
        <div className="col-span-1 md:col-span-12 mt-24 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-label-caps text-[12px] text-on-surface-variant tracking-widest uppercase">© 2026 Sarvada Modern School. | School Code: 07030327105</p>
          <div className="flex gap-8">
            <a aria-label="Facebook" className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">public</span></a>
            <a aria-label="Twitter" className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">alternate_email</span></a>
            <a aria-label="Instagram" className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">photo_camera</span></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
