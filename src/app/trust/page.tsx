import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Society Information | Sarvada Modern School",
  description: "Learn about the Sarvada Educational Society, the foundational bedrock of Sarvada Modern School.",
};

export default function TrustPage() {
  return (
    <main className="flex-grow pt-[100px] pb-section-padding">
      {/* Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div className="col-span-1 md:col-span-8">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-6 border border-surface-dim px-3 py-1 inline-block">Foundation & Trust</span>
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-xl md:text-display-xl text-primary mb-8">Sarvada Educational Society</h1>
            <p className="font-body-lg text-on-surface-variant max-w-3xl leading-relaxed">Established in 1990, the Society forms the foundational bedrock of Sarvada Modern School. It operates with a singular mandate: to facilitate an academic environment of uncompromised excellence and ethical clarity.</p>
          </div>
        </div>
      </section>

      {/* Mission & Details */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-padding">
        <div className="border-t border-surface-dim pt-gutter">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="col-span-1 md:col-span-4 mb-8 md:mb-0">
              <h2 className="font-headline-md text-primary sticky top-32">The Mandate</h2>
            </div>
            <div className="col-span-1 md:col-span-8">
              <div className="space-y-12">
                <div>
                  <h3 className="font-headline-sm text-primary mb-4">Core Philosophy</h3>
                  <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">The Society was conceived not merely as an administrative body, but as an intellectual custodian. We reject pedagogical complacency, insisting instead on a rigorous adherence to academic fundamentals paired with a deeply humanistic approach to student development. Our resources are deliberately directed towards faculty excellence, infrastructural refinement, and the cultivation of an environment that demands intellectual curiosity.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  <div className="bg-surface-container-lowest border border-surface-dim p-8">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-2 block">Established</span>
                    <span className="font-headline-md text-primary">1990</span>
                  </div>
                  <div className="bg-surface-container-lowest border border-surface-dim p-8">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-2 block">Registration No.</span>
                    <span className="font-headline-md text-primary">S-21500/90</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Members List */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-padding">
        <div className="border-t border-surface-dim pt-gutter">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="col-span-1 md:col-span-4 mb-8 md:mb-0">
              <h2 className="font-headline-md text-primary sticky top-32">Board of Trustees</h2>
              <p className="font-body-sm text-on-surface-variant mt-4">The governing body ensuring adherence to the founding principles.</p>
            </div>
            <div className="col-span-1 md:col-span-8">
              <ul className="flex flex-col">
                <li className="py-6 border-b border-surface-dim flex justify-between items-baseline group">
                  <span className="font-headline-sm text-primary">Dr. A. K. Sharma</span>
                  <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Chairman</span>
                </li>
                <li className="py-6 border-b border-surface-dim flex justify-between items-baseline group">
                  <span className="font-headline-sm text-primary">Mrs. S. Verma</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Secretary</span>
                </li>
                <li className="py-6 border-b border-surface-dim flex justify-between items-baseline group">
                  <span className="font-headline-sm text-primary">Mr. R. N. Gupta</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Treasurer</span>
                </li>
                <li className="py-6 border-b border-surface-dim flex justify-between items-baseline group">
                  <span className="font-headline-sm text-primary">Prof. M. K. Sinha</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Member</span>
                </li>
                <li className="py-6 border-b border-surface-dim flex justify-between items-baseline group">
                  <span className="font-headline-sm text-primary">Dr. (Mrs.) P. Rao</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Member</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Document */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="border-t border-surface-dim pt-gutter">
          <div className="bg-surface-container-low p-gutter md:p-[64px] grid grid-cols-1 md:grid-cols-2 gap-gutter items-center border border-surface-variant">
            <div>
              <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mb-4 block">Official Documentation</span>
              <h2 className="font-headline-lg text-primary mb-6">Society Registration Certificate</h2>
              <p className="font-body-md text-on-surface-variant mb-8 leading-relaxed">A matter of public record and institutional transparency. The official registration document formalizing the establishment of the Sarvada Educational Society under the Societies Registration Act, 1860.</p>
              <a className="inline-flex items-center gap-2 border border-primary px-6 py-3 font-label-caps text-label-caps text-primary uppercase tracking-widest hover:bg-secondary hover:text-on-secondary hover:border-secondary transition-colors duration-300" href="#">
                <span className="material-symbols-outlined">download</span>
                Download PDF Copy
              </a>
            </div>
            <div className="relative h-[400px] w-full bg-surface-container-lowest border border-surface-dim flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583526362016-c3137c71cc3a?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 grayscale"></div>
              <div className="z-10 text-center p-8 bg-surface-container-lowest/80 backdrop-blur-sm border border-surface-dim">
                <span className="material-symbols-outlined text-[48px] text-surface-tint mb-4">description</span>
                <span className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Document Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
