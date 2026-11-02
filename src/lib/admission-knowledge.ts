// ============================================================
// Sarvada Modern Secondary School — Official Admission Knowledge Base
// Based on Directorate of Education (DOE) Delhi Guidelines & School Rules
// ============================================================

export interface GradeAgeCriteria {
  grade: string;
  minAgeYears: number;
  maxAgeYears?: number;
  label: string;
  notes?: string;
}

export const DOE_AGE_CRITERIA: Record<string, GradeAgeCriteria> = {
  nursery: {
    grade: "Nursery",
    minAgeYears: 3,
    maxAgeYears: 4,
    label: "3+ years as of 31st March",
    notes: "Child must have completed 3 years and be less than 4 years as of 31st March of admission year."
  },
  lkg: {
    grade: "LKG",
    minAgeYears: 4,
    maxAgeYears: 5,
    label: "4+ years as of 31st March",
    notes: "Child must have completed 4 years and be less than 5 years as of 31st March."
  },
  ukg: {
    grade: "UKG",
    minAgeYears: 5,
    maxAgeYears: 6,
    label: "5+ years as of 31st March",
    notes: "Child must have completed 5 years and be less than 6 years as of 31st March."
  },
  "class-1": {
    grade: "Class 1st",
    minAgeYears: 6,
    maxAgeYears: 7,
    label: "6+ years as of 31st March",
    notes: "Child must have completed 6 years and be less than 7 years as of 31st March per DOE guidelines."
  },
  "class-2": { grade: "Class 2nd", minAgeYears: 7, label: "7+ years as of 31st March" },
  "class-3": { grade: "Class 3rd", minAgeYears: 8, label: "8+ years as of 31st March" },
  "class-4": { grade: "Class 4th", minAgeYears: 9, label: "9+ years as of 31st March" },
  "class-5": { grade: "Class 5th", minAgeYears: 10, label: "10+ years as of 31st March" },
  "class-6": { grade: "Class 6th", minAgeYears: 11, label: "11+ years as of 31st March" },
  "class-7": { grade: "Class 7th", minAgeYears: 12, label: "12+ years as of 31st March" },
  "class-8": { grade: "Class 8th", minAgeYears: 13, label: "13+ years as of 31st March" },
  "class-9": { grade: "Class 9th", minAgeYears: 14, label: "14+ years as of 31st March" },
};

export const REQUIRED_DOCUMENTS = {
  nurseryToFirst: [
    { id: "birth_cert", title: "Birth Certificate", desc: "Original / Attested copy issued by MCD / competent municipal authority" },
    { id: "student_aadhar", title: "Photocopy of Student Aadhar Card", desc: "Valid Aadhar card copy of the student" },
    { id: "parents_aadhar", title: "Photocopy of Mother & Father Aadhar Card", desc: "Valid Aadhar card copies of both parents" },
    { id: "photographs", title: "2 Passport Size Photographs", desc: "Recent color photographs of the student" },
    { id: "caste_cert", title: "SC / OBC Certificate", desc: "Applicable only for SC / OBC students (mandatory for quota)" },
    { id: "pan_card", title: "PAN Number", desc: "Applicable for LKG, UKG, and Class 1st" },
    { id: "sibling_fee_slip", title: "Fee Slip of Sibling", desc: "Applicable only if a real brother/sister is currently studying in Sarvada Modern School" }
  ],
  class2ndTo9th: [
    { id: "student_aadhar", title: "Photocopy of Student Aadhar Card", desc: "Valid Aadhar card copy of the student" },
    { id: "previous_marksheet", title: "Photocopy of Previous School Marksheet", desc: "Report card / marksheet of the previous passed class" },
    { id: "transfer_certificate", title: "Transfer Certificate (T.C.)", desc: "Original T.C. issued by previous recognized or Govt. school" },
    { id: "student_pan", title: "Student PAN Number", desc: "PAN card copy / number of the student" },
    { id: "student_apaar_id", title: "Student APAAR ID", desc: "Automated Permanent Academic Account Registry (One Nation, One Student ID)" },
    { id: "parents_aadhar", title: "Photocopy of Student's Father & Mother Aadhar Card", desc: "Valid Aadhar card copies of both parents" },
    { id: "photographs", title: "2 Passport Size Photographs of Student", desc: "Recent color photographs of the student" },
    { id: "caste_cert", title: "SC / OBC Certificate", desc: "Applicable only for SC / OBC students (mandatory for quota)" }
  ]
};

export const POINTS_CRITERIA = [
  { criterion: "Distance (0-3 KM)", points: 60, desc: "Residence within 0 to 3 KM radius from school campus" },
  { criterion: "Sibling", points: 20, desc: "Real brother/sister already studying in the school" },
  { criterion: "Alumni", points: 10, desc: "Parents who are alumni of Sarvada Modern School" },
  { criterion: "Single Parent", points: 5, desc: "Single mother or father applicant" },
  { criterion: "First Child Born", points: 5, desc: "First-born child in the family" }
];

export const SCHOOL_INFO = {
  name: "Sarvada Modern Secondary School",
  affiliation: "CBSE Affiliated",
  schoolId: "1104340",
  established: 1972,
  address: "A/18 Gali No. 1, Sukkar Bazar, Sadatpur Extn., Karawal Nagar Road, New Delhi — 110094",
  phone: "+91 99994 39422",
  phoneDisplay: "+91 99994 39422",
  officeHours: "Monday to Saturday, 8:00 AM – 2:30 PM",
  email: "sarvada@ymail.com",
  officialWebsite: "smsschool.net",
  currentAcademicSession: "2026-27",
  upcomingAcademicSession: "2027-28"
};

export type JourneyStage =
  | "DISCOVERY"
  | "ELIGIBILITY_EVALUATED"
  | "DOCUMENTS_REVIEWED"
  | "COLLECTING_DETAILS"
  | "REGISTERED";

export interface AdmissionJourneyContext {
  stage: JourneyStage;
  grade?: string;
  dob?: string;
  calculatedAge?: string;
  isEligible?: boolean;
  studentName?: string;
  parentName?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  phone?: string;
  referenceNumber?: string;
  distanceKm?: number;
  calculatedPoints?: number;
  language?: "en" | "hi";
}

