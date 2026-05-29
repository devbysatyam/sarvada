"use client";

import { useState } from "react";

export default function StudentInterestPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    gradeClass: "",
    rollNumber: "",
    hobbies: [] as string[],
    otherHobby: "",
    hobbyHours: "",
    careerFields: [] as string[],
    otherCareer: "",
    dreamGoal: "",
    learningStyles: {
      readingWriting: "Neutral",
      handsOn: "Neutral",
      teamDiscussions: "Neutral",
      visuals: "Neutral",
    },
    learningPace: "",
    newClubsActivities: "",
    studentSpecialty: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hobbiesOptions = [
    "Sports & Athletics",
    "Fine Arts & Painting",
    "Coding & Robotics",
    "Drama, Acting & Theatre",
    "Vocal & Instrumental Music",
    "Creative Writing & Poetry",
    "Gardening & Plant Care",
    "Photography & Video Making",
  ];

  const careerOptions = [
    "Engineering & Tech / Software Development",
    "Medicine, Nursing & Healthcare",
    "Business, Startups & Entrepreneurship",
    "Civic Services, Law & Governance",
    "Art, Fashion & Creative Design",
    "Pure Scientific Research & Space Sciences",
    "Teaching & Academic Education",
    "Professional Sports & Athletics coaching",
  ];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
      if (!formData.gradeClass) newErrors.gradeClass = "Please select your Grade";
      if (!formData.rollNumber.trim()) newErrors.rollNumber = "Roll Number / ID is required";
    } else if (step === 2) {
      if (formData.hobbies.length === 0) newErrors.hobbies = "Please select at least one hobby";
      if (!formData.hobbyHours) newErrors.hobbyHours = "Please select an hours option";
    } else if (step === 3) {
      if (formData.careerFields.length === 0) newErrors.careerFields = "Please select at least one field";
      if (!formData.dreamGoal.trim()) newErrors.dreamGoal = "Dream Goal is required";
    } else if (step === 4) {
      if (!formData.learningPace) newErrors.learningPace = "Please select your preferred pace";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleCheckboxChange = (type: "hobbies" | "careerFields", value: string) => {
    setFormData((prev) => {
      const list = [...prev[type]];
      if (list.includes(value)) {
        return { ...prev, [type]: list.filter((item) => item !== value) };
      } else {
        return { ...prev, [type]: [...list, value] };
      }
    });
  };

  const handleGridChange = (row: keyof typeof formData.learningStyles, column: string) => {
    setFormData((prev) => ({
      ...prev,
      learningStyles: {
        ...prev.learningStyles,
        [row]: column,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      setSubmitted(true);
      window.scrollTo(0, 0);
    }
  };

  return (
    <main className="bg-surface py-20 px-margin-mobile md:px-margin-desktop min-h-screen">
      <div className="max-w-2xl mx-auto bg-white border border-outline-variant/30 shadow-md p-8 md:p-12">
        
        {/* Header Block */}
        <div className="text-center border-b border-outline-variant/20 pb-8 mb-8">
          <span className="font-label-caps text-secondary uppercase tracking-[0.3em] text-xs block mb-3">Student Development</span>
          <h1 className="font-display-lg text-2xl md:text-3xl text-primary font-bold uppercase tracking-tight leading-none mb-4">
            Student Interest & Aspirations
          </h1>
          <p className="font-body-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Help us understand how you learn best, what hobbies excite you, and what careers you want to explore so we can build a better school together.
          </p>
        </div>

        {/* Form Wizard Progress Bar */}
        {!submitted && (
          <div className="mb-10">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-secondary mb-3">
              <span>Section {step} of 5</span>
              <span>
                {step === 1 && "Basic Information"}
                {step === 2 && "Hobbies & Extracurriculars"}
                {step === 3 && "Career Aspirations"}
                {step === 4 && "Learning Preferences"}
                {step === 5 && "Open-Ended / Creative"}
              </span>
            </div>
            <div className="w-full bg-outline-variant/20 h-1.5 rounded-none overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Wizard Form Sheets */}
        {submitted ? (
          /* Submission Screen */
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-[64px] text-primary mb-6">task_alt</span>
            <h2 className="font-display-lg text-2xl text-primary uppercase font-bold mb-4">Form Submitted Successfully!</h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed max-w-md mx-auto mb-8">
              Thank you, <strong className="text-primary">{formData.fullName}</strong>! Your interests have been captured and logged. Our educational team will analyze this data to introduce matching clubs and co-curricular programs.
            </p>
            <div className="bg-surface-container-low p-6 border border-outline-variant/20 text-left space-y-3 font-body-sm mb-8">
              <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                <span className="font-semibold">Student Name:</span>
                <span>{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                <span className="font-semibold">Grade & Section:</span>
                <span>{formData.gradeClass}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                <span className="font-semibold">Roll Number / ID:</span>
                <span>{formData.rollNumber}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-2">
                <span className="font-semibold">Hobbies Selected:</span>
                <span>{formData.hobbies.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Career Industries:</span>
                <span>{formData.careerFields.join(", ")}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setStep(1);
                setSubmitted(false);
                setFormData({
                  fullName: "",
                  gradeClass: "",
                  rollNumber: "",
                  hobbies: [],
                  otherHobby: "",
                  hobbyHours: "",
                  careerFields: [],
                  otherCareer: "",
                  dreamGoal: "",
                  learningStyles: {
                    readingWriting: "Neutral",
                    handsOn: "Neutral",
                    teamDiscussions: "Neutral",
                    visuals: "Neutral",
                  },
                  learningPace: "",
                  newClubsActivities: "",
                  studentSpecialty: "",
                });
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#1a3a2a] text-white font-label-caps text-xs uppercase tracking-widest hover:shadow-lg transition-all rounded-none"
            >
              Submit Another Entry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 font-body-md text-on-surface">
            
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider mb-2">Student Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm transition-colors"
                    placeholder="Enter your name"
                  />
                  {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="gradeClass" className="block text-xs font-bold uppercase tracking-wider mb-2">Grade / Class *</label>
                  <select
                    id="gradeClass"
                    value={formData.gradeClass}
                    onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 bg-white focus:border-primary outline-none rounded-none text-sm transition-colors"
                  >
                    <option value="">Select your class</option>
                    {Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gradeClass && <p className="text-red-600 text-xs mt-1">{errors.gradeClass}</p>}
                </div>

                <div>
                  <label htmlFor="rollNumber" className="block text-xs font-bold uppercase tracking-wider mb-2">Roll Number / Student ID *</label>
                  <input
                    type="text"
                    id="rollNumber"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm transition-colors"
                    placeholder="Enter your unique ID or roll number"
                  />
                  {errors.rollNumber && <p className="text-red-600 text-xs mt-1">{errors.rollNumber}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Hobbies & Extracurriculars */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-3">Which activities do you enjoy most in your free time? * (Select all that apply)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hobbiesOptions.map((hobby) => (
                      <label key={hobby} className="flex items-center gap-3 p-3 border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer rounded-none">
                        <input
                          type="checkbox"
                          checked={formData.hobbies.includes(hobby)}
                          onChange={() => handleCheckboxChange("hobbies", hobby)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">{hobby}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hobbies && <p className="text-red-600 text-xs mt-2">{errors.hobbies}</p>}
                </div>

                <div>
                  <label htmlFor="otherHobby" className="block text-xs font-bold uppercase tracking-wider mb-2">Other Hobbies (If not listed above)</label>
                  <input
                    type="text"
                    id="otherHobby"
                    value={formData.otherHobby}
                    onChange={(e) => setFormData({ ...formData, otherHobby: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm"
                    placeholder="E.g., Chess, baking, volunteering..."
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-3">On average, how many hours a week do you spend on hobbies? *</span>
                  <div className="space-y-3">
                    {[
                      "Under 2 hours a week",
                      "2 to 5 hours a week",
                      "More than 5 hours a week"
                    ].map((hours) => (
                      <label key={hours} className="flex items-center gap-3 p-3 border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer rounded-none">
                        <input
                          type="radio"
                          name="hobbyHours"
                          checked={formData.hobbyHours === hours}
                          onChange={() => setFormData({ ...formData, hobbyHours: hours })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">{hours}</span>
                      </label>
                    ))}
                  </div>
                  {errors.hobbyHours && <p className="text-red-600 text-xs mt-2">{errors.hobbyHours}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Career Aspirations */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-3">Which career fields sound the most interesting to you? * (Select all that apply)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {careerOptions.map((field) => (
                      <label key={field} className="flex items-center gap-3 p-3 border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer rounded-none">
                        <input
                          type="checkbox"
                          checked={formData.careerFields.includes(field)}
                          onChange={() => handleCheckboxChange("careerFields", field)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">{field}</span>
                      </label>
                    ))}
                  </div>
                  {errors.careerFields && <p className="text-red-600 text-xs mt-2">{errors.careerFields}</p>}
                </div>

                <div>
                  <label htmlFor="otherCareer" className="block text-xs font-bold uppercase tracking-wider mb-2">Other Fields of Interest</label>
                  <input
                    type="text"
                    id="otherCareer"
                    value={formData.otherCareer}
                    onChange={(e) => setFormData({ ...formData, otherCareer: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm"
                    placeholder="E.g., Performing Arts, Agricultural Sciences..."
                  />
                </div>

                <div>
                  <label htmlFor="dreamGoal" className="block text-xs font-bold uppercase tracking-wider mb-2">What is your ultimate dream goal or career? *</label>
                  <textarea
                    id="dreamGoal"
                    value={formData.dreamGoal}
                    onChange={(e) => setFormData({ ...formData, dreamGoal: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm"
                    rows={3}
                    placeholder="E.g., I want to become a pediatric doctor and open a low-cost clinic..."
                  />
                  {errors.dreamGoal && <p className="text-red-600 text-xs mt-1">{errors.dreamGoal}</p>}
                </div>
              </div>
            )}

            {/* Step 4: Learning Preferences */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-3">How do you prefer to learn new topics? (1 = Dislike, 3 = Neutral, 5 = Love)</span>
                  
                  <div className="space-y-4">
                    {[
                      { key: "readingWriting", label: "Reading & Writing (Textbooks, summaries)" },
                      { key: "handsOn", label: "Hands-on Activities (Labs, experiments, building)" },
                      { key: "teamDiscussions", label: "Collaborative (Team discussions, group work)" },
                      { key: "visuals", label: "Visual Media (Videos, presentations, diagrams)" },
                    ].map((item) => (
                      <div key={item.key} className="p-4 bg-surface-container-low border border-outline-variant/10">
                        <span className="block text-xs font-semibold uppercase tracking-wider mb-2 text-primary">{item.label}</span>
                        <div className="flex justify-between items-center gap-1.5">
                          {["Dislike", "Soft Dislike", "Neutral", "Like", "Love"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleGridChange(item.key as any, val)}
                              className={`flex-1 py-2 text-[10px] font-bold uppercase border transition-colors rounded-none ${
                                formData.learningStyles[item.key as keyof typeof formData.learningStyles] === val
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-on-surface border-outline-variant/40 hover:bg-surface-container-lowest"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider mb-3">What is your ideal learning pace? *</span>
                  <div className="space-y-3">
                    {[
                      "Fast-paced (Challenge me with quick content)",
                      "Steady & Structured (Guided step-by-step progress)",
                      "Self-paced (Allowing me to spend extra time where needed)"
                    ].map((pace) => (
                      <label key={pace} className="flex items-center gap-3 p-3 border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer rounded-none">
                        <input
                          type="radio"
                          name="learningPace"
                          checked={formData.learningPace === pace}
                          onChange={() => setFormData({ ...formData, learningPace: pace })}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">{pace}</span>
                      </label>
                    ))}
                  </div>
                  {errors.learningPace && <p className="text-red-600 text-xs mt-2">{errors.learningPace}</p>}
                </div>
              </div>
            )}

            {/* Step 5: Open-Ended / Creative */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="newClubsActivities" className="block text-xs font-bold uppercase tracking-wider mb-2">What is one club, facility, or activity you want our school to introduce?</label>
                  <textarea
                    id="newClubsActivities"
                    value={formData.newClubsActivities}
                    onChange={(e) => setFormData({ ...formData, newClubsActivities: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm"
                    rows={4}
                    placeholder="E.g., I would love to have a photography club or an archery facility..."
                  />
                </div>

                <div>
                  <label htmlFor="studentSpecialty" className="block text-xs font-bold uppercase tracking-wider mb-2">What is one talent or skill you have that you would love to guide or teach others in?</label>
                  <textarea
                    id="studentSpecialty"
                    value={formData.studentSpecialty}
                    onChange={(e) => setFormData({ ...formData, studentSpecialty: e.target.value })}
                    className="w-full p-3 border border-outline-variant/50 focus:border-primary outline-none rounded-none text-sm"
                    rows={4}
                    placeholder="E.g., I am good at solving Rubik's cubes and would love to teach a weekend workshop..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex gap-4 pt-6 border-t border-outline-variant/20 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 py-3 border border-[#1a3a2a] text-[#1a3a2a] font-label-caps text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-none"
                >
                  Previous
                </button>
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 bg-[#1a3a2a] text-white font-label-caps text-xs uppercase tracking-widest hover:shadow-lg transition-all rounded-none"
                >
                  Next Section
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-3 bg-secondary text-white font-label-caps text-xs uppercase tracking-widest hover:shadow-lg transition-all rounded-none"
                >
                  Submit Survey
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
