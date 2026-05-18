"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Link from "next/link";

const translations = {
  en: {
    title: "Parent Feedback Form",
    subtitle: "Your feedback is essential in helping us nurture excellence, refine our pedagogy, and build a safer, more vibrant school community.",
    languageToggleLabel: "हिन्दी में प्रतिक्रिया दें",
    parentName: "Parent / Guardian Name",
    parentNamePlaceholder: "e.g., Ramesh Kumar",
    studentName: "Student's Name",
    studentNamePlaceholder: "e.g., Aarav Kumar",
    studentClass: "Class / Section",
    studentClassPlaceholder: "Select Student's Class",
    suggestions: "Suggestions for Improvement (Optional)",
    suggestionsPlaceholder: "Please share any additional thoughts, ideas, or suggestions with us...",
    requiredField: "This field is required",
    ratingRequired: "Please rate this section",
    submitButton: "Submit Feedback",
    submitting: "Submitting securely...",
    successTitle: "Thank You!",
    successSubtitle: "Feedback Submitted Successfully",
    successMessage: "We deeply appreciate you taking the time to share your valuable feedback. Your insights directly help us in our continuous pursuit of academic and holistic excellence.",
    goBackHome: "Go Back Home",
    formInstructions: "Please rate the following aspects of our school on a scale of 1 to 5 stars, where 1 represents 'Needs Improvement' and 5 represents 'Excellent'.",
    ratingLegends: {
      1: "Needs Improvement",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    },
    ratings: {
      academics: {
        label: "Academic Quality",
        description: "Quality of classroom teaching, teacher dedication, curriculum progress, and focus on practical/logical understanding."
      },
      infrastructure: {
        label: "Infrastructure & Facilities",
        description: "Cleanliness of classrooms, science & computer laboratories, sports equipment, and library resources."
      },
      safety: {
        label: "Safety & Security",
        description: "Campus security protocols, child supervision, hygiene, drinking water safety, and emergency alertness."
      },
      activities: {
        label: "Co-curricular Activities",
        description: "Sports, physical training, drawing, cultural functions, public speaking, and personality development programs."
      },
      communication: {
        label: "Teacher-Parent Communication",
        description: "PTM organization, portal notifications, transparency in updates, and accessibility of teachers and principal."
      },
      overall: {
        label: "Overall Satisfaction",
        description: "Your comprehensive experience with Sarvada Modern Secondary School."
      }
    }
  },
  hi: {
    title: "अभिभावक प्रतिक्रिया फॉर्म",
    subtitle: "आपकी प्रतिक्रिया उत्कृष्टता को पोषित करने, हमारी शिक्षण पद्धति को परिष्कृत करने और एक सुरक्षित, अधिक जीवंत स्कूल समुदाय के निर्माण में अत्यंत महत्वपूर्ण है।",
    languageToggleLabel: "Provide Feedback in English",
    parentName: "अभिभावक / संरक्षक का नाम",
    parentNamePlaceholder: "उदा., रमेश कुमार",
    studentName: "छात्र / छात्रा का नाम",
    studentNamePlaceholder: "उदा., आरव कुमार",
    studentClass: "कक्षा / वर्ग",
    studentClassPlaceholder: "छात्र की कक्षा चुनें",
    suggestions: "सुधार के लिए सुझाव (वैकल्पिक)",
    suggestionsPlaceholder: "कृपया हमारे साथ कोई भी अतिरिक्त विचार, विचार या रचनात्मक सुझाव साझा करें...",
    requiredField: "यह जानकारी आवश्यक है",
    ratingRequired: "कृपया इस श्रेणी को रेट करें",
    submitButton: "प्रतिक्रिया जमा करें",
    submitting: "सुरक्षित रूप से जमा किया जा रहा है...",
    successTitle: "धन्यवाद!",
    successSubtitle: "प्रतिक्रिया सफलतापूर्वक सबमिट की गई",
    successMessage: "अपनी बहुमूल्य प्रतिक्रिया साझा करने के लिए समय निकालने के लिए हम आपके अत्यंत आभारी हैं। आपके विचार अकादमिक और समग्र उत्कृष्टता की हमारी निरंतर खोज में हमारी सीधी सहायता करते हैं।",
    goBackHome: "मुख्य पृष्ठ पर जाएं",
    formInstructions: "कृपया हमारे स्कूल के निम्नलिखित पहलुओं को 1 से 5 सितारों के पैमाने पर रेट करें, जहाँ 1 'सुधार की आवश्यकता' और 5 'उत्कृष्ट' का प्रतिनिधित्व करता है।",
    ratingLegends: {
      1: "सुधार की आवश्यकता",
      2: "सामान्य",
      3: "अच्छा",
      4: "बहुत अच्छा",
      5: "उत्कृष्ट"
    },
    ratings: {
      academics: {
        label: "शैक्षणिक गुणवत्ता",
        description: "कक्षा शिक्षण की गुणवत्ता, शिक्षकों का समर्पण, पाठ्यक्रम की प्रगति, और व्यावहारिक/तार्किक समझ पर ध्यान देना।"
      },
      infrastructure: {
        label: "बुनियादी ढांचा और सुविधाएं",
        description: "कक्षाओं की स्वच्छता, विज्ञान और कंप्यूटर प्रयोगशालाएं, खेल उपकरण और पुस्तकालय संसाधन।"
      },
      safety: {
        label: "सुरक्षा और संरक्षा",
        description: "परिसर सुरक्षा प्रोटोकॉल, बच्चों की देखरेख, स्वच्छता, पीने के पानी की सुरक्षा, और आपातकालीन सतर्कता।"
      },
      activities: {
        label: "सह-पाठ्यचर्या गतिविधियाँ",
        description: "खेलकूद, शारीरिक प्रशिक्षण, ड्राइंग, सांस्कृतिक कार्यक्रम, सार्वजनिक भाषण और व्यक्तित्व विकास कार्यक्रम।"
      },
      communication: {
        label: "शिक्षक-अभिभावक संचार",
        description: "पीटीएम (अभिभावक-शिक्षक बैठक) का आयोजन, पोर्टल सूचनाएं, अपडेट में पारदर्शिता, और शिक्षकों व प्रधानाचार्य की सुलभता।"
      },
      overall: {
        label: "समग्र संतुष्टि",
        description: "सर्वदा मॉडर्न सेकेंडरी स्कूल के साथ आपका समग्र व्यापक अनुभव।"
      }
    }
  }
};

const classesList = [
  "Nursery", "LKG", "UKG", 
  "Class I", "Class II", "Class III", "Class IV", "Class V", 
  "Class VI", "Class VII", "Class VIII", "Class IX", "Class X", 
  "Class XI", "Class XII"
];

type RatingKeys = "academics" | "infrastructure" | "safety" | "activities" | "communication" | "overall";

export default function ParentFeedback() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [parentName, setParentName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [suggestions, setSuggestions] = useState("");
  
  const [ratings, setRatings] = useState<Record<RatingKeys, number>>({
    academics: 0,
    infrastructure: 0,
    safety: 0,
    activities: 0,
    communication: 0,
    overall: 0
  });

  const [hoveredRatings, setHoveredRatings] = useState<Record<RatingKeys, number>>({
    academics: 0,
    infrastructure: 0,
    safety: 0,
    activities: 0,
    communication: 0,
    overall: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = translations[lang];

  const handleRatingSelect = (category: RatingKeys, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
    if (errors[category]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[category];
        return copy;
      });
    }
  };

  const handleRatingHover = (category: RatingKeys, value: number) => {
    setHoveredRatings(prev => ({ ...prev, [category]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!parentName.trim()) newErrors.parentName = t.requiredField;
    if (!studentName.trim()) newErrors.studentName = t.requiredField;
    if (!studentClass) newErrors.studentClass = t.requiredField;

    const ratingKeys: RatingKeys[] = ["academics", "infrastructure", "safety", "activities", "communication", "overall"];
    ratingKeys.forEach(key => {
      if (ratings[key] === 0) {
        newErrors[key] = t.ratingRequired;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    try {
      // Try to authenticate anonymously first. If it's disabled, we catch the error and attempt direct write (which succeeds if Firestore rules permit public writes).
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (authErr) {
        console.warn("Anonymous auth is disabled, attempting direct write to Firestore:", authErr);
      }

      await addDoc(collection(db, "feedbacks"), {
        parentName: parentName.trim(),
        studentName: studentName.trim(),
        studentClass,
        ratings,
        suggestions: suggestions.trim(),
        lang,
        submittedAt: serverTimestamp()
      });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Submission failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background pt-32 pb-24 px-margin-mobile md:px-margin-desktop flex items-center justify-center">
        <div className="max-w-2xl w-full bg-surface-container-lowest border border-outline-variant/30 p-10 md:p-16 shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#456553]"></div>
          
          <div className="w-20 h-20 rounded-full bg-[#c4e8d1] text-secondary-fixed-dim flex items-center justify-center mb-8 shadow-sm">
            <span className="material-symbols-outlined text-[44px] text-[#456553] symbol-fill">done_all</span>
          </div>
          
          <h1 className="font-display-lg text-4xl md:text-5xl text-primary mb-3 uppercase tracking-tight font-bold">{t.successTitle}</h1>
          <p className="font-label-caps text-secondary text-xs uppercase tracking-[0.2em] mb-8 font-semibold">{t.successSubtitle}</p>
          
          <p className="font-body-lg text-on-surface-variant leading-relaxed max-w-lg mb-12 font-light">
            {t.successMessage}
          </p>
          
          <Link href="/" className="px-12 py-5 bg-primary text-on-primary font-label-caps text-xs tracking-widest uppercase hover:bg-secondary transition-all w-full sm:w-auto shadow-md">
            {t.goBackHome}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pt-32 md:pt-40 pb-24 px-margin-mobile md:px-margin-desktop">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block font-semibold">Sarvada Modern School</span>
            <h1 className="font-display-lg text-4xl md:text-5xl text-primary tracking-tight leading-none uppercase font-bold">{t.title}</h1>
          </div>
          <button 
            type="button"
            onClick={() => setLang(prev => prev === "en" ? "hi" : "en")}
            className="flex items-center gap-2 border border-primary px-5 py-3 font-label-caps text-[11px] uppercase tracking-wider text-primary hover:bg-primary hover:text-on-primary transition-all font-semibold rounded-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            {t.languageToggleLabel}
          </button>
        </div>

        <p className="font-body-lg text-on-surface-variant mb-12 font-light max-w-3xl leading-relaxed">
          {t.subtitle}
        </p>

        {/* Feedback Form Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 p-8 md:p-12 shadow-xl relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
          
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Identity Information Section */}
            <div className="space-y-6">
              <h3 className="font-label-caps text-xs text-secondary uppercase tracking-[0.22em] border-b border-surface-variant/40 pb-3 font-bold">1. General Information / सामान्य जानकारी</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Parent Name */}
                <div id="parentName" className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                    {t.parentName} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => {
                      setParentName(e.target.value);
                      if (errors.parentName) setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.parentName;
                        return copy;
                      });
                    }}
                    className={`w-full px-4 py-4 bg-surface-container-low/50 border ${
                      errors.parentName ? 'border-error ring-1 ring-error' : 'border-surface-variant/50'
                    } focus:border-primary outline-none font-body-sm transition-all focus:bg-white`}
                    placeholder={t.parentNamePlaceholder}
                  />
                  {errors.parentName && (
                    <p className="text-error text-xs font-body-sm flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.parentName}
                    </p>
                  )}
                </div>

                {/* Student Name */}
                <div id="studentName" className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                    {t.studentName} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      if (errors.studentName) setErrors(prev => {
                        const copy = { ...prev };
                        delete copy.studentName;
                        return copy;
                      });
                    }}
                    className={`w-full px-4 py-4 bg-surface-container-low/50 border ${
                      errors.studentName ? 'border-error ring-1 ring-error' : 'border-surface-variant/50'
                    } focus:border-primary outline-none font-body-sm transition-all focus:bg-white`}
                    placeholder={t.studentNamePlaceholder}
                  />
                  {errors.studentName && (
                    <p className="text-error text-xs font-body-sm flex items-center gap-1.5 mt-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {errors.studentName}
                    </p>
                  )}
                </div>
              </div>

              {/* Student Class */}
              <div id="studentClass" className="space-y-2 md:w-1/2 md:pr-4">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  {t.studentClass} <span className="text-error">*</span>
                </label>
                <select
                  value={studentClass}
                  title={t.studentClass}
                  onChange={(e) => {
                    setStudentClass(e.target.value);
                    if (errors.studentClass) setErrors(prev => {
                      const copy = { ...prev };
                      delete copy.studentClass;
                      return copy;
                    });
                  }}
                  className={`w-full px-4 py-4 bg-surface-container-low/50 border ${
                    errors.studentClass ? 'border-error ring-1 ring-error' : 'border-surface-variant/50'
                  } focus:border-primary outline-none font-body-sm transition-all focus:bg-white appearance-none cursor-pointer`}
                >
                  <option value="">-- {t.studentClassPlaceholder} --</option>
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                {errors.studentClass && (
                  <p className="text-error text-xs font-body-sm flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {errors.studentClass}
                  </p>
                )}
              </div>
            </div>

            {/* Rating Matrix Section */}
            <div className="space-y-8">
              <div>
                <h3 className="font-label-caps text-xs text-secondary uppercase tracking-[0.22em] border-b border-surface-variant/40 pb-3 font-bold">2. Survey Questions / सर्वेक्षण प्रश्न</h3>
                <p className="font-body-sm text-on-surface-variant mt-3 leading-relaxed font-light">{t.formInstructions}</p>
              </div>

              <div className="divide-y divide-surface-variant/30 space-y-6">
                {(["academics", "infrastructure", "safety", "activities", "communication", "overall"] as RatingKeys[]).map((key) => {
                  const ratingInfo = t.ratings[key];
                  const currentSelected = ratings[key];
                  const currentHovered = hoveredRatings[key];
                  const activeRating = currentHovered || currentSelected;

                  return (
                    <div key={key} id={key} className="pt-6 first:pt-0 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Rating descriptions */}
                        <div className="lg:col-span-7 space-y-1">
                          <h4 className="font-headline-sm text-lg text-primary font-bold uppercase tracking-wide">{ratingInfo.label}</h4>
                          <p className="font-body-sm text-on-surface-variant leading-relaxed font-light">{ratingInfo.description}</p>
                        </div>
                        
                        {/* Interactive stars and legend label */}
                        <div className="lg:col-span-5 flex flex-col sm:items-end gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((starValue) => {
                              const isLit = starValue <= activeRating;
                              return (
                                <button
                                  key={starValue}
                                  type="button"
                                  title={`${starValue} Stars - ${t.ratingLegends[starValue as 1|2|3|4|5]}`}
                                  onClick={() => handleRatingSelect(key, starValue)}
                                  onMouseEnter={() => handleRatingHover(key, starValue)}
                                  onMouseLeave={() => handleRatingHover(key, 0)}
                                  className="p-1 focus:outline-none transition-transform active:scale-95 group"
                                >
                                  <span 
                                    className={`material-symbols-outlined text-[32px] md:text-[36px] transition-all duration-200 select-none ${
                                      isLit 
                                        ? "text-[#d97706] symbol-fill scale-110 drop-shadow-sm" 
                                        : "text-surface-variant hover:text-[#d97706]/40 hover:scale-105"
                                    }`}
                                  >
                                    star
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Rating legend status display */}
                          <div className="h-5">
                            {activeRating > 0 && (
                              <span className="font-label-caps text-[10px] tracking-widest text-[#d97706] uppercase font-bold animate-in fade-in duration-200">
                                {t.ratingLegends[activeRating as 1|2|3|4|5]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {errors[key] && (
                        <p className="text-error text-xs font-body-sm flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {errors[key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions & Submit Area */}
            <div className="space-y-6 pt-6 border-t border-surface-variant/40">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">{t.suggestions}</label>
                <textarea
                  rows={5}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  className="w-full px-4 py-4 bg-surface-container-low/50 border border-surface-variant/50 focus:border-primary outline-none font-body-sm transition-all focus:bg-white resize-y leading-relaxed"
                  placeholder={t.suggestionsPlaceholder}
                />
              </div>

              {/* Submit triggers */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-5 font-label-caps text-xs tracking-widest uppercase hover:bg-secondary disabled:bg-surface-variant/40 disabled:text-on-surface-variant/60 disabled:cursor-not-allowed transition-all shadow-md relative overflow-hidden flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-surface-variant/30 border-t-on-primary rounded-full animate-spin"></div>
                      <span>{t.submitting}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{t.submitButton}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
