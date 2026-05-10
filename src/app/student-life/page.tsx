import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Life | Sarvada Modern School",
  description: "Explore the vibrant student life at Sarvada Modern School, from athletics to arts, culture, and our unique house system.",
};

export default function StudentLifePage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-surface-container-lowest px-margin-mobile md:px-margin-desktop py-section-padding overflow-hidden">
        <div className="relative z-10 max-w-container-max mx-auto w-full flex flex-col md:row items-center gap-gutter">
          <div className="md:w-1/2 flex flex-col gap-6">
            <span className="text-secondary font-label-caps text-label-caps uppercase tracking-[0.2em]">Beyond the Classroom</span>
            <h1 className="font-display-xl text-display-lg-mobile md:text-display-xl text-primary max-w-3xl">
              Cultivating Character,<br/> Celebrating Excellence
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              At Sarvada Modern School, education transcends traditional boundaries. From our unique house system to our creative newspaper, "Sarvada Times", we nurture true potential.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="aspect-[4/3] rounded overflow-hidden shadow-2xl">
              <img alt="Students in school uniform" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR6PBVPjpKS8FV6TiVk_p3zvgPWeOOY8P1OaMz1FnOieNHt5qeK8LcjaS8R-y8Ihbi0Y0zpfQXIKGAy8r5iLtG9UGN9ifIowIJRV51rVyo0q8Gy6P6ol9Gv9LceZaOnnoWtvUhoHHvfNX427ydFe8Krwqmtz9fZ0n8t_DUZ_qUL72OexCZdER2rnrZ5Q5wCk94ArRfwFJLlXE88qavUhTv39rV52XDwJ-X_xQmVPb8YNjku-sTayUo4x9w_T2T2jRYampxnOuu9NGx"/>
            </div>
          </div>
        </div>
      </section>

      {/* House System Section */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display-lg text-primary mb-6">Our House System</h2>
            <p className="font-body-lg text-on-surface-variant max-w-3xl mx-auto">
              To foster competition, discipline, and cooperation, students are assigned to four houses. Each house is led by elected members through a secret ballot democratic system.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-surface-container-lowest p-8 border-t-8 border-[#3b82f6] text-center shadow-sm">
              <h3 className="font-headline-sm text-primary mb-2">Indira House</h3>
              <p className="font-label-caps text-[#3b82f6] font-bold">Blue House</p>
            </div>
            <div className="bg-surface-container-lowest p-8 border-t-8 border-[#eab308] text-center shadow-sm">
              <h3 className="font-headline-sm text-primary mb-2">Subhash House</h3>
              <p className="font-label-caps text-[#eab308] font-bold">Yellow House</p>
            </div>
            <div className="bg-surface-container-lowest p-8 border-t-8 border-[#ef4444] text-center shadow-sm">
              <h3 className="font-headline-sm text-primary mb-2">Tagore House</h3>
              <p className="font-label-caps text-[#ef4444] font-bold">Red House</p>
            </div>
            <div className="bg-surface-container-lowest p-8 border-t-8 border-[#22c55e] text-center shadow-sm">
              <h3 className="font-headline-sm text-primary mb-2">Nehru House</h3>
              <p className="font-label-caps text-[#22c55e] font-bold">Green House</p>
            </div>
          </div>
        </div>
      </section>

      {/* School Uniform Section */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto">
          <h2 className="font-display-lg text-primary mb-12 text-center">School Uniform Code</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <h3 className="font-headline-md text-secondary border-b-2 border-secondary pb-2 w-fit">Summer Session (15 Mar - 31 Oct)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body-sm">
                <div className="bg-surface-container-lowest p-6 border border-outline-variant/30">
                  <h4 className="font-bold text-primary mb-4">Boys</h4>
                  <ul className="space-y-1 text-on-surface-variant">
                    <li>White Shirt (with monogram)</li>
                    <li>Navy Blue Half/Full Pant</li>
                    <li>Navy Blue Socks</li>
                    <li>Black Leather Shoes (with lace)</li>
                    <li>School Tie, Belt & Badge</li>
                  </ul>
                </div>
                <div className="bg-surface-container-lowest p-6 border border-outline-variant/30">
                  <h4 className="font-bold text-primary mb-4">Girls</h4>
                  <ul className="space-y-1 text-on-surface-variant">
                    <li>White Shirt (with monogram)</li>
                    <li>Navy Blue Skirt</li>
                    <li>Navy Blue Socks</li>
                    <li>Black Leather Shoes (with lace)</li>
                    <li>White Ribbon/Hair Band</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <h3 className="font-headline-md text-secondary border-b-2 border-secondary pb-2 w-fit">Winter Session (1 Nov - 14 Mar)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body-sm">
                <div className="bg-surface-container-lowest p-6 border border-outline-variant/30">
                  <h4 className="font-bold text-primary mb-4">Boys</h4>
                  <ul className="space-y-1 text-on-surface-variant">
                    <li>White Shirt, Grey Pant</li>
                    <li>Navy Blue V-Neck Sweater/Blazer</li>
                    <li>Grey Socks, Black Leather Shoes</li>
                    <li>School Tie, Belt & Badge</li>
                  </ul>
                </div>
                <div className="bg-surface-container-lowest p-6 border border-outline-variant/30">
                  <h4 className="font-bold text-primary mb-4">Girls</h4>
                  <ul className="space-y-1 text-on-surface-variant">
                    <li>White Shirt, Grey Skirt</li>
                    <li>Navy Blue V-Neck Sweater/Blazer</li>
                    <li>Grey Socks, Black Leather Shoes</li>
                    <li>White Ribbon/Hair Band</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 p-6 bg-surface-container text-center font-body-md text-primary">
            <p><strong>Wednesdays & Saturdays:</strong> House T-shirts / White Uniform as per schedule. Check student diary for specifics.</p>
          </div>
        </div>
      </section>

      {/* Cultural & Newspaper Section */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <div className="lg:col-span-7 space-y-10">
            <div className="bg-surface-container p-10 border-l-8 border-primary">
              <h2 className="font-headline-lg text-primary mb-6">Sarvada Times</h2>
              <p className="font-body-lg text-on-surface-variant leading-relaxed">
                To enhance hidden creative treasures, we publish "Sarvada Times" twice a year. It's a platform for students to exhibit their potential and convey their thoughts through creative writing.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 border border-outline-variant/30">
                <h4 className="font-headline-sm text-primary mb-4">Festival Celebrations</h4>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  We celebrate Holi, Diwali, Independence Day, and more. Special focus on spiritual growth with **Hanuman Chalisa** recitation every Tuesday.
                </p>
              </div>
              <div className="p-8 border border-outline-variant/30">
                <h4 className="font-headline-sm text-primary mb-4">Ex-Students Hub</h4>
                <p className="font-body-sm text-on-surface-variant leading-relaxed">
                  Our passing out students remain in contact and are honored for their achievements in regular school functions.
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[3/4] overflow-hidden rounded shadow-xl">
              <img alt="School Festival" className="w-full h-full object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUOqVl8ykkBkvGCXRGlPy5EANSR7oj6BR2sbyZ2Uwilx6l_8X8lBCTMMkAfiRopoYq73I_-LHXAA_QLfZVjy5bLVXHUCUUNhCvJC6WJfVLOlNhj4mVGWDWCvUTjTLKO7kRMsus1U3cz78yaE-4XZr5hr3jkbgdZd_j2I1sQCy84v1EleE7BI_CeLqg2jlF9lDFv6PN5-zV5H8lVqZcJMjVZENH-PLu6NgNe08gYqCLOskFKlJBDpPQ8FdR1EsaKphEzrcbMxpAT6Ni"/>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
