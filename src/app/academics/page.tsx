import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CBSE Academics, Curriculum & Infrastructure | Labs & Facilities",
  description: "Explore the comprehensive CBSE curricular framework, CCE evaluation methodology, and world-class academic laboratories at Sarvada Modern School, Karawal Nagar, Delhi. Science lab, computer lab, library, and multimedia resources.",
  keywords: ["CBSE curriculum Delhi", "CCE evaluation", "school labs Karawal Nagar", "science lab school Delhi", "computer lab school", "academic infrastructure North East Delhi"],
  alternates: { canonical: "/academics" },
  openGraph: {
    title: "Academics & Infrastructure | Sarvada Modern School",
    description: "CBSE curriculum, CCE framework, and state-of-the-art labs for holistic academic development.",
    url: "https://sarvadamodernschool.com/academics",
    type: "website",
  },
};

export default function AcademicsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-section-padding flex flex-col items-center text-center">
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-8 max-w-4xl mx-auto">Cultivating Excellence Through Rigorous Academics</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">Our curriculum blends traditional pedagogical strengths with modern, learner-centered methodology, strictly adhering to CBSE guidelines and the CCE framework.</p>
      </section>

      {/* CCE & Vision Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-lowest">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          <div className="lg:col-span-7">
            <h2 className="font-headline-lg text-primary mb-8">Academic Framework (CCE)</h2>
            <div className="space-y-6 font-body-md text-on-surface-variant leading-relaxed">
              <p>
                In strict adherence to the regulations of **CCE (Continuous and Comprehensive Evaluation)**, we plan, formulate, and conduct various activities and pen-paper exams regularly. Special emphasis is given on the quality of knowledge that shapes the student's future.
              </p>
              <p>
                Our report cards are designed as "CCE Mirrors", reflecting different aspects of scholastic and co-scholastic areas, values of life, and individual traits periodically available to parents.
              </p>
              <div className="bg-background p-8 border-l-4 border-secondary">
                <h4 className="font-bold text-primary mb-2">Faculty Empowerment</h4>
                <p>Teachers' training programs are organized at regular intervals to keep our faculty current and innovative for imparting excellent quality education in the changing global scenario.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 bg-primary text-on-primary p-10">
            <h3 className="font-headline-sm mb-6 uppercase tracking-widest">Learner-Centered Approach</h3>
            <p className="font-body-md leading-relaxed">
              We look at education vision differently. We have made our pattern of academic framework flexible, worthy, and need-based, ensuring every student develops their full potential through unit tests, pre-term, and terminal examinations.
            </p>
          </div>
        </div>
      </section>

      {/* Science Lab Showcase */}
      <section className="px-margin-mobile md:px-margin-desktop py-12">
        <div className="max-w-container-max mx-auto">
          <div className="relative aspect-[21/9] bg-surface-container overflow-hidden rounded-lg">
            <img 
              alt="Advanced Science Laboratory" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              src="/images/academics-lab.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-12">
              <p className="text-white font-label-caps text-sm tracking-widest uppercase">Hands-on Learning: Our Advanced Science Laboratory</p>
            </div>
          </div>
        </div>
      </section>

      {/* Labs & Infrastructure Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-background">
        <div className="max-w-container-max mx-auto">
          <h2 className="font-display-lg text-primary mb-16 text-center">World-Class Facilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Science Lab */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">biotech</span>
              <h3 className="font-headline-sm text-primary mb-4">Science Lab</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Well-equipped with latest apparatus for physics, chemistry, and biology. Stress is on "Learning-based" education to provide practical knowledge.
              </p>
            </div>
            {/* Computer Lab */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">computer</span>
              <h3 className="font-headline-sm text-primary mb-4">Computer Lab</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                An air-conditioned lab where computer education is compulsory. Students connect globally with high-speed internet facilities.
              </p>
            </div>
            {/* Math & Geography */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">square_foot</span>
              <h3 className="font-headline-sm text-primary mb-4">Math & Geo Lab</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Equipped with latest teaching aids, charts, and audio-visual equipment to make complex concepts intuitive.
              </p>
            </div>
            {/* Library */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">menu_book</span>
              <h3 className="font-headline-sm text-primary mb-4">Central Library</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                A decorated and richly stocked library empowering learners for the 21st century with books on all academic subjects and general knowledge.
              </p>
            </div>
            {/* Music Room */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">music_note</span>
              <h3 className="font-headline-sm text-primary mb-4">Music Studio</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                Training in both vocal and instrumental music. Every student is motivated to participate and acquaint themselves with cultural rhythms.
              </p>
            </div>
            {/* Audio-Visual Room */}
            <div className="bg-surface-container-lowest p-8 border border-outline-variant/30 group hover:border-primary transition-all">
              <span className="material-symbols-outlined text-4xl text-secondary mb-6">featured_video</span>
              <h3 className="font-headline-sm text-primary mb-4">Multimedia Aids</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed">
                The school provides multimedia and audio-visual aids to facilitate easy growth of talent in scholastic areas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
