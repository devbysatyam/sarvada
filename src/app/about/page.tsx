import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Heritage & Leadership | 54 Years of Excellence | Sarvada Modern School",
  description: "Learn about the legacy of Sarvada Modern School, established in 1972. Managed by Sarvada Shiksha Samiti, we have been enlightening minds for over five decades.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full relative h-[716px] min-h-[500px] flex items-end pb-16 px-margin-mobile md:px-margin-desktop">
        <div className="absolute inset-0 z-0">
          <img alt="Hero Background" className="w-full h-full object-cover" src="/images/cultural-celebration.jpg"/>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-4xl text-on-primary">
          <p className="font-label-caps text-label-caps text-surface-bright uppercase tracking-widest mb-4">Our Legacy</p>
          <h1 className="font-display-xl text-display-xl md:text-[80px] mb-8 leading-tight">Enlightening Knowledge Since 1972</h1>
          <p className="font-body-lg text-body-lg text-surface-bright/90 max-w-2xl leading-relaxed">Managed by Sarvada Shiksha Samiti, our institution has spread its branches like a banyan tree, serving humanity for 54 years.</p>
        </div>
      </section>

      {/* Brief History & Vision */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7">
            <h2 className="font-display-lg text-primary mb-8">A Brief History</h2>
            <div className="space-y-6 font-body-lg text-on-surface-variant leading-relaxed mb-12">
              <p>
                Affiliated to Central Board of Secondary Education, Sarvada Modern Secondary School enjoys the privilege of being considered as one of the leading institution in this semi-urban area of remote North East of Delhi, managed by **Sarvada Shiksha Samiti**.
              </p>
              <p>
                Established in 1972, the school has now spread its branches like a banyan tree and is serving the humanity by enlightening of knowledge. Our philosophy of nurturing achievers has led to the institution that produces students who excel in fields across the spectrum.
              </p>
              <p>
                The holistic approach adopted by this school over the years has resulted in their admission in prestigious schools and colleges, not only in India but also abroad. We endeavor to keep in view the heritage and cultural background of our century and aim at developing the full mental, physical, and spiritual potential of each child.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-surface-container border-l-4 border-secondary">
                <h4 className="font-headline-sm text-primary mb-4">Discipline Motto</h4>
                <p className="font-body-md text-on-surface-variant italic">
                  "Discipline is the Ladder of success." We inspire discipline as a habit, not a burden, led by our **Head Boy** and **Head Girl**.
                </p>
              </div>
              <div className="p-8 bg-surface-container border-l-4 border-secondary">
                <h4 className="font-headline-sm text-primary mb-4">Medical Aid</h4>
                <p className="font-body-md text-on-surface-variant">
                  A dedicated medical room with first-aid facilities and emergency protocols ensures the health and safety of every student.
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-primary text-on-primary p-8 md:p-12">
              <h3 className="font-headline-sm mb-8 uppercase tracking-widest text-on-primary/80">Infrastructure Wings</h3>
              <ul className="space-y-6 font-body-md">
                <li className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-secondary">child_care</span>
                  <span>Nursery Wing (Spacious & Air-cooled)</span>
                </li>
                <li className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-secondary">school</span>
                  <span>Middle Wing</span>
                </li>
                <li className="flex gap-4 items-center">
                  <span className="material-symbols-outlined text-secondary">history_edu</span>
                  <span>Secondary Wing</span>
                </li>
              </ul>
              <p className="mt-8 text-sm text-on-primary/70 leading-relaxed">
                Established in 1972, serving humanity for **54 Years**.
              </p>
            </div>
            
            <div className="bg-surface-container p-8 md:p-12 border border-outline-variant/30 text-center">
              <h3 className="font-headline-sm text-primary mb-6">School Awards</h3>
              <ul className="font-body-sm text-on-surface-variant space-y-3">
                <li>100% Maximum Attendance</li>
                <li>Highest Percentage Distinction</li>
                <li>All Rounder Student (Best in Activities)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Messages */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto">
          <h2 className="font-display-lg text-primary mb-16 text-center">Leadership Messages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Principal */}
            <div className="flex flex-col gap-8">
              <div className="aspect-[16/9] overflow-hidden bg-surface-dim">
                <img alt="Principal Portrait" className="w-full h-full object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIBLhhJh1nIwm1lkszFZLnM76pbL96El4OlY9cbBj0AlHFHAwi5eNzShaHbys3P25TZoncVatcapXcPd5eU_VkPE3orNi7Ixuh1_4kLF_mehZtC_3IxbaLUGaL0BBo9q4rXKg66GSc8cTLI6Y4XJ-BixiuzHtNXWAn5dlmB_T5B4peKc_udxdiefopkVYopGVLMPu5aLxEuQ0ukab989ZQxB1KSSFQlu23nzWOJNDEPLW6jFavEoAyZLv8DqWqp8HUA6PRWQdQ7Lye"/>
              </div>
              <div>
                <h3 className="font-headline-md text-primary mb-4">From the Principal's Desk</h3>
                <blockquote className="font-body-lg text-on-surface-variant italic leading-relaxed mb-6">
                  "I behold with immense pleasure and satisfaction on the progress of Sarvada Modern Secondary School, which has made in 54 years of span since its inception."
                </blockquote>
                <p className="font-label-caps text-secondary font-bold tracking-widest">Sh. Rakesh Kapoor</p>
              </div>
            </div>
            {/* Manager */}
            <div className="flex flex-col gap-8">
              <div className="aspect-[16/9] overflow-hidden bg-surface-dim">
                <img alt="Manager Portrait" className="w-full h-full object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMvlwk3KCvb4u6vWbjtuRVrXu7mEyM9OA0CWsryfhulcLhgdpZqBI8rmvW78FjczWFwQgSoWy72KQtW5BkgS58XAEajVmR1JurRdZQVr9SV73cg6fkO47ZcYUQYGW4cEUyBVHlQW5rO_bOEeGqSsZ7a2R0-_9lFVFunAj1komrmdkHiWENdOpT4q6Q8jM8w5sOlCnSKQPoyPMPJGgnfJ7WPF5M6zPVvkuvRqOiRMRrFg88ch02ZYiCSz-hrPXXBH46ZyGBC88GRiFN"/>
              </div>
              <div>
                <h3 className="font-headline-md text-primary mb-4">From the Manager's Desk</h3>
                <blockquote className="font-body-lg text-on-surface-variant italic leading-relaxed mb-6">
                  "I extend my soulful greeting to one and all. Welcome to another exciting academic year at Sarvada Modern Secondary School, which has been continuously marked by excellence."
                </blockquote>
                <p className="font-label-caps text-secondary font-bold tracking-widest">Mr. Lalit Paliwal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Society Information */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-surface border-t border-outline-variant/30">
        <div className="max-w-4xl mx-auto text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-6">account_balance</span>
          <h2 className="font-headline-md text-headline-md text-primary mb-6">Sarvada Shiksha Samiti</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-8 max-w-2xl mx-auto">
            Sarvada Modern Secondary School is proudly managed by the Sarvada Shiksha Samiti, an educational trust dedicated to serving humanity through the enlightenment of knowledge.
          </p>
          <div className="inline-flex items-center gap-4 bg-surface-container-lowest border border-outline-variant px-6 py-3 rounded-none">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Registration Status:</span>
            <span className="font-body-md text-body-md text-primary font-medium">Government Recognized Institution</span>
          </div>
        </div>
      </section>
    </>
  );
}
