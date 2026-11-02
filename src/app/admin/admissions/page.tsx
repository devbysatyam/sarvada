"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, ensureAuth } from "@/lib/firebase";
import { generateLeadMessage } from "@/lib/whatsapp";

export interface AdmissionLead {
  id: string;
  referenceNumber: string;
  studentName: string;
  parentName: string;
  fatherName?: string;
  motherName?: string;
  phone: string;
  grade: string;
  dob?: string;
  gender?: string;
  category?: string;
  address?: string;
  email?: string;
  aadhaar?: string;
  previousSchool?: string;
  previousClass?: string;
  notes?: string;
  source?: string;
  status: "NEW" | "CONTACTED" | "VERIFIED" | "ENROLLED" | "NOT_INTERESTED" | "REJECTED";
  workStatus?: "PENDING" | "WORK_DONE";
  rejectionReason?: string;
  lastNote?: string;
  counselorName?: string;
  lastFollowUpAt?: string;
  nextFollowUpDate?: string;
  createdDate?: string;
  createdAt?: any;
  skool24Synced?: boolean;
  skool24LeadId?: number;
  storedInPortal?: boolean;
  crmSyncedAt?: string;
  lastWhatsAppSentAt?: string;
}

export interface ActivityLogItem {
  id: string;
  leadId: string;
  studentName: string;
  parentName: string;
  phone: string;
  grade: string;
  type: "NOTE" | "STATUS_CHANGE" | "CRM_SYNC" | "ENQUIRY_CREATED" | "WHATSAPP";
  title: string;
  description: string;
  author: string;
  timestamp: string;
  badgeColor: string;
}

const COMMON_REASONS = {
  NOT_INTERESTED: [
    "Distance too far / Transport unavailable",
    "Fee structure not within budget",
    "Enrolled in another school",
    "Shifted locality / Relocated",
    "Postponed admission to next year",
    "Parent unreachable / No response after 3 attempts",
    "Other / Miscellaneous",
  ],
  REJECTED: [
    "Age criteria not met (DOE Delhi guidelines)",
    "Required documents / TC not provided",
    "No vacancy in requested class",
    "Failed readiness / academic assessment",
    "Invalid contact information / Fake inquiry",
    "Duplicate submission",
    "Other / Miscellaneous",
  ],
};

function playNotificationChime() {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1 (D5 - 587 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2 (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch {
    // Browser audio context policy might require first user click
  }
}

export default function AdmissionsAdmin() {
  const [activeTab, setActiveTab] = useState<"leads" | "logs" | "settings">("leads");

  const [settings, setSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    spotlightText:
      "Registration for Pre-School (Nursery) is now open. Forms are available for collection and submission at the Primary Building campus.",
    isActive: true,
    classesOffered: "Nursery, LKG, UKG, Grade 1 to Grade 12",
    feeStructure: "",
    contactNumber: "+91 99994 39422",
    documentsRequired:
      "Nursery to 1st: Birth Certificate, Student Aadhar, Parents Aadhar, 2 Photos, SC/OBC cert, PAN (LKG/UKG/1st), Sibling Fee slip.\nClass 2nd to 9th: Student Aadhar, Previous Marksheet, Transfer Certificate (T.C.), Student PAN, Student APAAR ID, Parents Aadhar, 2 Photos, SC/OBC cert.",
    admissionProcess:
      "1. Verify age as per DOE Delhi guidelines (Nur 3+, LKG 4+, UKG 5+, 1st 6+)\n2. Submit registration details online or collect hardcopy form\n3. Verification of documents\n4. Interaction with student and parents\n5. Final enrollment and fee deposit",
  });

  const [leads, setLeads] = useState<AdmissionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWork, setFilterWork] = useState("all");
  const [filterCrm, setFilterCrm] = useState<"all" | "synced" | "unsynced">("all");

  // Multi-Selection State for Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Bulk WhatsApp Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTemplateKey, setBulkTemplateKey] = useState<
    "welcome" | "docs" | "fees" | "reminder" | "enrolled" | "custom"
  >("reminder");
  const [bulkCustomText, setBulkCustomText] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkDispatchMode, setBulkDispatchMode] = useState<"api" | "web_queue">("api");
  const [bulkResultsReport, setBulkResultsReport] = useState<any | null>(null);
  const [bulkWebQueueIndex, setBulkWebQueueIndex] = useState(0);

  // Autonomous Follow-up Engine In-Progress State
  const [autoFollowupRunning, setAutoFollowupRunning] = useState(false);

  // Bulk CRM Sync In-Progress State
  const [bulkSyncingCrm, setBulkSyncingCrm] = useState(false);

  // Real-time Notification Banner & Audio
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);
  const [newLeadAlert, setNewLeadAlert] = useState<{ lead: AdmissionLead; time: number } | null>(null);
  const isInitialSnapshotLoaded = useRef(false);

  // CRM Sync In-Progress State (Single Lead)
  const [syncingLeadId, setSyncingLeadId] = useState<string | null>(null);

  // Reason Modal State
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [targetLead, setTargetLead] = useState<AdmissionLead | null>(null);
  const [targetStatus, setTargetStatus] = useState<"REJECTED" | "NOT_INTERESTED">("REJECTED");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReasonText, setCustomReasonText] = useState("");
  const [reasonSaving, setReasonSaving] = useState(false);

  // Detail / Work Done Drawer State
  const [detailDrawerLead, setDetailDrawerLead] = useState<AdmissionLead | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  const [counselorInput, setCounselorInput] = useState("");
  const [nextFollowUpInput, setNextFollowUpInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // Text / Message Templates Modal State (Single Lead)
  const [messageModalLead, setMessageModalLead] = useState<AdmissionLead | null>(null);
  const [activeTemplateKey, setActiveTemplateKey] = useState<
    "welcome" | "docs" | "fees" | "reminder" | "enrolled"
  >("welcome");
  const [editedTemplateText, setEditedTemplateText] = useState("");
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Activity Log State
  const [logFilterType, setLogFilterType] = useState<"all" | "NOTE" | "CRM_SYNC" | "STATUS_CHANGE" | "WHATSAPP">("all");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // WhatsApp Cloud API Settings State
  const [waSettings, setWaSettings] = useState({
    phoneNumberId: "",
    accessToken: "",
    businessAccountId: "",
    defaultTemplateName: "admission_followup_reminder",
    isEnabled: false,
    autoFollowupHours: 24,
    schoolHelpNumber: "+91 99994 39422",
    hasAccessToken: false,
    maskedAccessToken: "",
  });
  const [savingWaSettings, setSavingWaSettings] = useState(false);

  // Load sound alert preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sarvada_lead_sound_alert");
      if (saved !== null) {
        setSoundAlertsEnabled(saved === "true");
      }
    }
  }, []);

  const toggleSoundAlerts = () => {
    setSoundAlertsEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sarvada_lead_sound_alert", String(next));
      }
      return next;
    });
  };

  // Load WhatsApp Cloud API settings
  useEffect(() => {
    fetch("/api/admin/whatsapp/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setWaSettings((prev) => ({ ...prev, ...data.config }));
        }
      })
      .catch((err) => console.warn("Could not load WhatsApp config:", err));
  }, []);

  // Subscribe to Admission Settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "admissions"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings((prev) => ({ ...prev, ...data }));
      }
      setLoading(false);
    });
    return () => unsubSettings();
  }, []);

  // Subscribe to Captured Leads in Real-Time
  useEffect(() => {
    const q = query(collection(db, "admissions_leads"), orderBy("createdAt", "desc"));
    const unsubLeads = onSnapshot(q, (snapshot) => {
      const records: AdmissionLead[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Check if newly added leads arrived after initial load
      if (isInitialSnapshotLoaded.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const addedLead = { id: change.doc.id, ...(change.doc.data() as any) } as AdmissionLead;
            if (soundAlertsEnabled) {
              playNotificationChime();
            }
            setNewLeadAlert({ lead: addedLead, time: Date.now() });
          }
        });
      } else {
        isInitialSnapshotLoaded.current = true;
      }

      setLeads(records);
    });
    return () => unsubLeads();
  }, [soundAlertsEnabled]);

  // Auto-dismiss new lead alert banner after 15 seconds
  useEffect(() => {
    if (!newLeadAlert) return;
    const timer = setTimeout(() => setNewLeadAlert(null), 15000);
    return () => clearTimeout(timer);
  }, [newLeadAlert]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await setDoc(doc(db, "settings", "admissions"), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      setMessage("Admissions settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating admissions:", error);
      setMessage("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save WhatsApp Settings
  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWaSettings(true);
    try {
      const res = await fetch("/api/admin/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waSettings),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("WhatsApp Business API settings saved successfully!");
        setWaSettings((prev) => ({ ...prev, isEnabled: true }));
      } else {
        setMessage(`Error: ${data.error || "Failed to save WhatsApp config"}`);
      }
    } catch (err: any) {
      setMessage("Failed to save WhatsApp configuration.");
    } finally {
      setSavingWaSettings(false);
      setTimeout(() => setMessage(""), 3500);
    }
  };

  // Status Change Controller
  const handleStatusChangeRequest = (lead: AdmissionLead, nextStatus: AdmissionLead["status"]) => {
    if (nextStatus === "REJECTED" || nextStatus === "NOT_INTERESTED") {
      setTargetLead(lead);
      setTargetStatus(nextStatus);
      setSelectedReason(lead.rejectionReason || COMMON_REASONS[nextStatus][0]);
      setCustomReasonText("");
      setReasonModalOpen(true);
    } else {
      executeStatusUpdate(lead.id, nextStatus, {
        workStatus: "WORK_DONE",
        rejectionReason: "",
      });
    }
  };

  const executeStatusUpdate = async (
    id: string,
    newStatus: AdmissionLead["status"],
    extraFields: Partial<AdmissionLead> = {}
  ) => {
    try {
      const isWorkDone =
        newStatus === "CONTACTED" ||
        newStatus === "VERIFIED" ||
        newStatus === "ENROLLED" ||
        newStatus === "NOT_INTERESTED" ||
        newStatus === "REJECTED";

      await updateDoc(doc(db, "admissions_leads", id), {
        status: newStatus,
        workStatus: isWorkDone ? "WORK_DONE" : "PENDING",
        updatedAt: serverTimestamp(),
        lastFollowUpAt: new Date().toISOString(),
        ...extraFields,
      });
      setMessage(`Status updated to ${newStatus.replace("_", " ")}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      setMessage("Error updating lead status.");
    }
  };

  const handleSaveReasonModal = async () => {
    if (!targetLead) return;
    setReasonSaving(true);
    const finalReason =
      selectedReason === "Other / Miscellaneous" && customReasonText.trim()
        ? customReasonText.trim()
        : selectedReason || "Reason not specified";

    await executeStatusUpdate(targetLead.id, targetStatus, {
      rejectionReason: finalReason,
      workStatus: "WORK_DONE",
    });

    setReasonSaving(false);
    setReasonModalOpen(false);
    setTargetLead(null);
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this admission enquiry?")) {
      try {
        await deleteDoc(doc(db, "admissions_leads", id));
        setSelectedLeadIds((prev) => prev.filter((item) => item !== id));
      } catch (err) {
        console.error("Failed to delete lead:", err);
      }
    }
  };

  const handleOpenDetailDrawer = (lead: AdmissionLead) => {
    setDetailDrawerLead(lead);
    setCounselorInput(lead.counselorName || "");
    setNextFollowUpInput(lead.nextFollowUpDate || "");
    setNewNoteText("");
  };

  const handleSaveDetailNote = async () => {
    if (!detailDrawerLead) return;
    setNoteSaving(true);
    try {
      const updates: Record<string, any> = {
        updatedAt: serverTimestamp(),
        lastFollowUpAt: new Date().toISOString(),
      };

      if (counselorInput.trim()) {
        updates.counselorName = counselorInput.trim();
      }
      if (nextFollowUpInput) {
        updates.nextFollowUpDate = nextFollowUpInput;
      }
      if (newNoteText.trim()) {
        const timestampStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const author = counselorInput.trim() || "Counselor";
        const appendedNote = `[${timestampStr} - ${author}]: ${newNoteText.trim()}`;
        updates.notes = detailDrawerLead.notes
          ? `${detailDrawerLead.notes}\n${appendedNote}`
          : appendedNote;
        updates.lastNote = newNoteText.trim();
        updates.workStatus = "WORK_DONE";
      }

      await updateDoc(doc(db, "admissions_leads", detailDrawerLead.id), updates);
      setDetailDrawerLead((prev) => (prev ? { ...prev, ...updates } : null));
      setNewNoteText("");
      setMessage("Follow-up remark saved & work status updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error("Failed to save note:", err);
      setMessage("Error saving follow-up note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleToggleWorkStatus = async (lead: AdmissionLead) => {
    const nextWork = lead.workStatus === "WORK_DONE" ? "PENDING" : "WORK_DONE";
    try {
      await updateDoc(doc(db, "admissions_leads", lead.id), {
        workStatus: nextWork,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to toggle work status:", err);
    }
  };

  // 1-Click Sync Single Lead to Skool24 CRM
  const handleSyncToCrm = async (lead: AdmissionLead) => {
    setSyncingLeadId(lead.id);
    try {
      const res = await fetch("/api/admin/leads/sync-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`☁️ Synced to Skool24 CRM successfully! (CRM ID: #${data.skool24LeadId})`);
        setTimeout(() => setMessage(""), 4000);
      } else {
        setMessage(`CRM Sync Warning: ${data.error || "Could not sync"}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } catch (err: any) {
      console.error("CRM Sync Error:", err);
      setMessage("Failed to connect to Skool24 CRM.");
    } finally {
      setSyncingLeadId(null);
    }
  };

  // Bulk Sync to Skool24 CRM
  const handleBulkSyncCrm = async () => {
    if (selectedLeadIds.length === 0) return;
    const leadsToSync = leads.filter((l) => selectedLeadIds.includes(l.id) && !l.skool24Synced);

    if (leadsToSync.length === 0) {
      alert("All selected leads are already synced to Skool24 CRM!");
      return;
    }

    setBulkSyncingCrm(true);
    let synced = 0;
    let failed = 0;

    for (const lead of leadsToSync) {
      try {
        const res = await fetch("/api/admin/leads/sync-crm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id }),
        });
        const data = await res.json();
        if (data.success) synced++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setBulkSyncingCrm(false);
    setMessage(`Bulk CRM Sync Complete: ${synced} pushed to Skool24, ${failed} failed.`);
    setTimeout(() => setMessage(""), 4000);
  };

  // Trigger Autonomous Follow-Up Engine
  const handleRunAutonomousFollowup = async () => {
    setAutoFollowupRunning(true);
    try {
      const res = await fetch("/api/admin/leads/auto-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`🤖 ${data.message}`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`Autonomous follow-up warning: ${data.error || "Failed"}`);
      }
    } catch (err: any) {
      setMessage("Error executing autonomous follow-up engine.");
    } finally {
      setAutoFollowupRunning(false);
    }
  };

  // Multi-Selection Handlers
  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleSelectAllPending = () => {
    const pendingIds = leads
      .filter((l) => !l.status || l.status === "NEW" || l.workStatus === "PENDING")
      .map((l) => l.id);
    setSelectedLeadIds(pendingIds);
  };

  // Selected leads list
  const selectedLeads = useMemo(() => {
    return leads.filter((l) => selectedLeadIds.includes(l.id));
  }, [leads, selectedLeadIds]);

  // Bulk WhatsApp Dispatch
  const handleExecuteBulkWhatsApp = async () => {
    if (selectedLeads.length === 0) return;
    setBulkSending(true);
    setBulkResultsReport(null);

    try {
      const res = await fetch("/api/admin/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadIds: selectedLeadIds,
          templateKey: bulkTemplateKey,
          customText: bulkTemplateKey === "custom" ? bulkCustomText : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setBulkResultsReport(data);
        setMessage(`🚀 Bulk WhatsApp Complete! Sent: ${data.sent}, Manual/Fallback: ${data.failed}`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`Bulk send error: ${data.error || "Failed to dispatch"}`);
      }
    } catch (err: any) {
      console.error("Bulk Send Error:", err);
      setMessage("Network error executing bulk WhatsApp dispatch.");
    } finally {
      setBulkSending(false);
    }
  };

  // Single Lead Message Modal Handlers
  const handleOpenMessageModal = (lead: AdmissionLead) => {
    setMessageModalLead(lead);
    const initialKey = lead.status === "ENROLLED" ? "enrolled" : "welcome";
    setActiveTemplateKey(initialKey);
    setEditedTemplateText(generateLeadMessage(lead, initialKey));
    setCopiedSuccess(false);
  };

  const handleSelectTemplate = (key: typeof activeTemplateKey) => {
    if (!messageModalLead) return;
    setActiveTemplateKey(key);
    setEditedTemplateText(generateLeadMessage(messageModalLead, key));
    setCopiedSuccess(false);
  };

  const handleCopyMessageText = () => {
    if (!editedTemplateText) return;
    navigator.clipboard.writeText(editedTemplateText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleSendWhatsAppDirect = (lead: AdmissionLead, customText?: string) => {
    const cleanPhone = (lead.phone || "").replace(/\D/g, "").slice(-10);
    const textToSend = customText || editedTemplateText || generateLeadMessage(lead, "welcome");
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(textToSend)}`, "_blank");
  };

  const handleSendSMS = (lead: AdmissionLead) => {
    const cleanPhone = (lead.phone || "").replace(/\D/g, "").slice(-10);
    const textToSend = editedTemplateText || generateLeadMessage(lead, "welcome");
    window.open(`sms:+91${cleanPhone}?body=${encodeURIComponent(textToSend)}`, "_blank");
  };

  // Export CSV
  const exportLeadsCSV = () => {
    if (leads.length === 0) return alert("No leads to export.");
    const headers = [
      "Reference No",
      "Student Name",
      "Parent Name",
      "Mother Name",
      "Phone",
      "Grade",
      "Date of Birth",
      "Admission Status",
      "Work Status",
      "Portal Stored",
      "Skool24 Synced",
      "Skool24 Lead ID",
      "Rejection / Not Interested Reason",
      "Assigned Counselor",
      "Address",
      "Last WhatsApp Sent",
      "Notes History",
      "Source",
      "Created Date",
    ];
    const rows = filteredLeads.map((l) => [
      `"${l.referenceNumber || ""}"`,
      `"${l.studentName || ""}"`,
      `"${l.parentName || ""}"`,
      `"${l.motherName || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.grade || ""}"`,
      `"${l.dob || ""}"`,
      `"${l.status || "NEW"}"`,
      `"${l.workStatus || "PENDING"}"`,
      `"TRUE"`,
      `"${l.skool24Synced ? "TRUE" : "FALSE"}"`,
      `"${l.skool24LeadId || ""}"`,
      `"${(l.rejectionReason || "").replace(/"/g, '""')}"`,
      `"${l.counselorName || ""}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.lastWhatsAppSentAt || ""}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${l.source || "Website"}"`,
      `"${l.createdDate || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sarvada-admission-leads-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics Calculations
  const totalLeadsCount = leads.length;
  const pendingWorkCount = leads.filter(
    (l) => !l.status || l.status === "NEW" || l.workStatus === "PENDING"
  ).length;
  const inProgressCount = leads.filter(
    (l) => l.status === "CONTACTED" || l.status === "VERIFIED"
  ).length;
  const enrolledCount = leads.filter((l) => l.status === "ENROLLED").length;
  const notInterestedCount = leads.filter((l) => l.status === "NOT_INTERESTED").length;
  const rejectedCount = leads.filter((l) => l.status === "REJECTED").length;
  const crmSyncedCount = leads.filter((l) => Boolean(l.skool24Synced)).length;
  const crmPendingCount = totalLeadsCount - crmSyncedCount;

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      lead.studentName?.toLowerCase().includes(q) ||
      lead.parentName?.toLowerCase().includes(q) ||
      lead.phone?.includes(q) ||
      lead.referenceNumber?.toLowerCase().includes(q) ||
      lead.rejectionReason?.toLowerCase().includes(q) ||
      lead.counselorName?.toLowerCase().includes(q) ||
      lead.address?.toLowerCase().includes(q);

    const matchesGrade =
      filterGrade === "all" || lead.grade?.toLowerCase().includes(filterGrade.toLowerCase());

    const leadStatus = lead.status || "NEW";
    const matchesStatus = filterStatus === "all" || leadStatus === filterStatus;

    const leadWork = lead.workStatus || (leadStatus === "NEW" ? "PENDING" : "WORK_DONE");
    const matchesWork = filterWork === "all" || leadWork === filterWork;

    const matchesCrm =
      filterCrm === "all" ||
      (filterCrm === "synced" && Boolean(lead.skool24Synced)) ||
      (filterCrm === "unsynced" && !lead.skool24Synced);

    return matchesSearch && matchesGrade && matchesStatus && matchesWork && matchesCrm;
  });

  // Extract Activity Logs from Leads Data
  const activityLogs: ActivityLogItem[] = useMemo(() => {
    const items: ActivityLogItem[] = [];

    leads.forEach((lead) => {
      // 1. Creation event
      if (lead.createdDate || lead.createdAt) {
        items.push({
          id: `${lead.id}-created`,
          leadId: lead.id,
          studentName: lead.studentName,
          parentName: lead.parentName,
          phone: lead.phone,
          grade: lead.grade,
          type: "ENQUIRY_CREATED",
          title: "New Admission Inquiry Received",
          description: `Applied for ${lead.grade} via ${lead.source || "Website Form"}. Stored in School Software.`,
          author: lead.source || "Online Portal",
          timestamp: lead.createdDate || new Date().toISOString(),
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
        });
      }

      // 2. Skool24 CRM Sync event
      if (lead.skool24Synced) {
        items.push({
          id: `${lead.id}-crm`,
          leadId: lead.id,
          studentName: lead.studentName,
          parentName: lead.parentName,
          phone: lead.phone,
          grade: lead.grade,
          type: "CRM_SYNC",
          title: "Pushed to Skool24 ERP",
          description: `Direct CRM synchronization complete. Lead assigned ERP ID #${lead.skool24LeadId || "N/A"}.`,
          author: "Dual-Sync Engine",
          timestamp: lead.crmSyncedAt || lead.createdDate || new Date().toISOString(),
          badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
        });
      }

      // 3. WhatsApp Message event
      if (lead.lastWhatsAppSentAt) {
        items.push({
          id: `${lead.id}-wa`,
          leadId: lead.id,
          studentName: lead.studentName,
          parentName: lead.parentName,
          phone: lead.phone,
          grade: lead.grade,
          type: "WHATSAPP",
          title: "WhatsApp Reminder Dispatched",
          description: `Follow-up message sent via WhatsApp Business API / Web to ${lead.phone}.`,
          author: "WhatsApp Agent",
          timestamp: lead.lastWhatsAppSentAt,
          badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
        });
      }

      // 4. Status changes / Reasons
      if (lead.status && lead.status !== "NEW") {
        let desc = `Lead status updated to ${lead.status.replace("_", " ")}.`;
        if (lead.rejectionReason) {
          desc += ` Specified Reason: "${lead.rejectionReason}"`;
        }
        items.push({
          id: `${lead.id}-status`,
          leadId: lead.id,
          studentName: lead.studentName,
          parentName: lead.parentName,
          phone: lead.phone,
          grade: lead.grade,
          type: "STATUS_CHANGE",
          title: `Status: ${lead.status.replace("_", " ")}`,
          description: desc,
          author: lead.counselorName || "Admission Admin",
          timestamp: lead.lastFollowUpAt || lead.createdDate || new Date().toISOString(),
          badgeColor:
            lead.status === "ENROLLED"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
              : lead.status === "REJECTED"
              ? "bg-rose-50 text-rose-800 border-rose-300"
              : "bg-indigo-50 text-indigo-800 border-indigo-300",
        });
      }

      // 5. Counselor Notes lines
      if (lead.notes) {
        const lines = lead.notes.split("\n").filter((l) => l.trim().length > 0);
        lines.forEach((line, idx) => {
          items.push({
            id: `${lead.id}-note-${idx}`,
            leadId: lead.id,
            studentName: lead.studentName,
            parentName: lead.parentName,
            phone: lead.phone,
            grade: lead.grade,
            type: "NOTE",
            title: "Counselor Call Note",
            description: line,
            author: lead.counselorName || "Staff Member",
            timestamp: lead.lastFollowUpAt || lead.createdDate || new Date().toISOString(),
            badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          });
        });
      }
    });

    // Sort by timestamp desc
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [leads]);

  const filteredActivityLogs = activityLogs.filter((item) => {
    const matchesType = logFilterType === "all" || item.type === logFilterType;
    const q = logSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.studentName.toLowerCase().includes(q) ||
      item.parentName.toLowerCase().includes(q) ||
      item.phone.includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
          Loading admission controls & leads...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28">
      {/* ── Top Real-time Incoming Inquiry Alert Banner ───────── */}
      {newLeadAlert && (
        <div className="bg-gradient-to-r from-amber-500 via-primary to-amber-600 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300 border-2 border-amber-300">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl animate-bounce">notifications_active</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  ⚡ New Admission Inquiry Just Arrived!
                </span>
                <span className="text-xs text-amber-100">Saved in Software & Skool24</span>
              </div>
              <h4 className="font-bold text-base mt-0.5">
                {newLeadAlert.lead.studentName} applying for {newLeadAlert.lead.grade}
              </h4>
              <p className="text-xs text-amber-100">
                Parent: {newLeadAlert.lead.parentName} · Phone: {newLeadAlert.lead.phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                handleOpenMessageModal(newLeadAlert.lead);
                setNewLeadAlert(null);
              }}
              className="px-3.5 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">chat</span>
              Send Message
            </button>
            <button
              onClick={() => {
                handleOpenDetailDrawer(newLeadAlert.lead);
                setNewLeadAlert(null);
              }}
              className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              View Profile
            </button>
            <button
              onClick={() => setNewLeadAlert(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/80 cursor-pointer"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-variant/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary text-secondary flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-3xl">school</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-sm text-primary uppercase tracking-widest font-bold">
                Admission CRM & Leads Desk
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Skool24 Dual-Storage
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                WhatsApp Business Ready
              </span>
            </div>
            <p className="font-body-sm text-on-surface-variant text-xs mt-0.5">
              Automated multi-channel follow-ups, Skool24 parallel synchronization, and bulk WhatsApp reminders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Autonomous Follow-Up Engine Quick Action */}
          <button
            onClick={handleRunAutonomousFollowup}
            disabled={autoFollowupRunning}
            title="Run autonomous AI follow-up engine to find overdue inquiries and dispatch WhatsApp reminders"
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            <span className={`material-symbols-outlined text-[16px] ${autoFollowupRunning ? "animate-spin" : ""}`}>
              {autoFollowupRunning ? "sync" : "smart_toy"}
            </span>
            <span>{autoFollowupRunning ? "Running Agent..." : "Run Auto Follow-up"}</span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={toggleSoundAlerts}
            title={soundAlertsEnabled ? "Audio chimes are active for new leads" : "Audio chimes are muted"}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundAlertsEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {soundAlertsEnabled ? "volume_up" : "volume_off"}
            </span>
            <span>{soundAlertsEnabled ? "Sound ON" : "Muted"}</span>
          </button>

          {/* Session Status Pill */}
          <div className="flex items-center gap-2 bg-surface-container px-3.5 py-1.5 rounded-full border border-surface-variant/60">
            <span
              className={`w-2 h-2 rounded-full ${
                settings.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            ></span>
            <span className="font-label-caps text-xs uppercase tracking-wider font-bold text-slate-800">
              {settings.isActive ? `Session ${settings.session}` : "Paused"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-surface-variant/60">
        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-3.5 px-4 font-label-caps text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "leads"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
          Leads Management ({totalLeadsCount})
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3.5 px-4 font-label-caps text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Activity & Follow-Up Log ({activityLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-3.5 px-4 font-label-caps text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Admission & WhatsApp Settings
        </button>
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          className={`p-3.5 text-xs font-semibold flex items-center gap-2.5 rounded-xl shadow-xs animate-in fade-in duration-200 ${
            message.includes("Error") || message.includes("Failed") || message.includes("Warning")
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {message.includes("Error") || message.includes("Failed") ? "error" : "check_circle"}
          </span>
          {message}
        </div>
      )}

      {/* ── TAB 1: LEADS MANAGEMENT ───────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          {/* ── 7 Metrics Reporting Cards ──────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* 1. Total Leads */}
            <div className="p-3.5 bg-surface-container-lowest border border-surface-variant/70 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Total Leads</span>
                <span className="material-symbols-outlined text-[16px] text-slate-400">groups</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalLeadsCount}</p>
              <span className="text-[10px] text-slate-500 font-medium">Inquiries received</span>
            </div>

            {/* 2. Pending Action */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Pending Action</span>
                <span className="material-symbols-outlined text-[16px] text-amber-600 animate-pulse">
                  pending_actions
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-900">{pendingWorkCount}</p>
              <span className="text-[10px] text-amber-700 font-medium">Follow-up due</span>
            </div>

            {/* 3. In Progress */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-sky-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">In Progress</span>
                <span className="material-symbols-outlined text-[16px] text-sky-600">phone_in_talk</span>
              </div>
              <p className="text-2xl font-bold text-sky-900">{inProgressCount}</p>
              <span className="text-[10px] text-sky-700 font-medium">Contacted / Visited</span>
            </div>

            {/* 4. Enrolled / Admission Done */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Admission Done</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{enrolledCount}</p>
              <span className="text-[10px] text-emerald-700 font-medium">
                {totalLeadsCount > 0
                  ? `${((enrolledCount / totalLeadsCount) * 100).toFixed(1)}% Conversion`
                  : "Enrolled"}
              </span>
            </div>

            {/* 5. Not Interested */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-700 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Not Interested</span>
                <span className="material-symbols-outlined text-[16px] text-slate-500">do_not_disturb_on</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{notInterestedCount}</p>
              <span className="text-[10px] text-slate-500 font-medium">With reasons logged</span>
            </div>

            {/* 6. Rejected */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Rejected</span>
                <span className="material-symbols-outlined text-[16px] text-rose-600">cancel</span>
              </div>
              <p className="text-2xl font-bold text-rose-900">{rejectedCount}</p>
              <span className="text-[10px] text-rose-700 font-medium">Age / Documents / Seats</span>
            </div>

            {/* 7. Dual-Storage / Skool24 Status */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between text-indigo-800 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider">Skool24 CRM</span>
                <span className="material-symbols-outlined text-[16px] text-indigo-600">cloud_sync</span>
              </div>
              <p className="text-2xl font-bold text-indigo-900">{crmSyncedCount}</p>
              <span className="text-[10px] text-indigo-700 font-medium">
                {crmPendingCount > 0 ? `${crmPendingCount} Pending Sync` : "All 100% Synced"}
              </span>
            </div>
          </div>

          {/* ── Search & Filter Controls ───────────────────────── */}
          <div className="p-4 bg-surface-container-lowest border border-surface-variant/80 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex-1 w-full flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[220px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[17px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search student, parent, phone, ref, address, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">All Statuses ({totalLeadsCount})</option>
                <option value="NEW">New Inquiry ({leads.filter((l) => (l.status || "NEW") === "NEW").length})</option>
                <option value="CONTACTED">Contacted ({leads.filter((l) => l.status === "CONTACTED").length})</option>
                <option value="VERIFIED">Verified ({leads.filter((l) => l.status === "VERIFIED").length})</option>
                <option value="ENROLLED">Admission Done ({enrolledCount})</option>
                <option value="NOT_INTERESTED">Not Interested ({notInterestedCount})</option>
                <option value="REJECTED">Rejected ({rejectedCount})</option>
              </select>

              {/* Work Status Filter */}
              <select
                value={filterWork}
                onChange={(e) => setFilterWork(e.target.value)}
                className="px-3 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">All Work States</option>
                <option value="PENDING">Action Due ⏳</option>
                <option value="WORK_DONE">Work Done ✓</option>
              </select>

              {/* Dual-Storage / CRM Sync Filter */}
              <select
                value={filterCrm}
                onChange={(e) => setFilterCrm(e.target.value as any)}
                className="px-3 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">All Storage ({totalLeadsCount})</option>
                <option value="synced">☁️ Skool24 Synced ({crmSyncedCount})</option>
                <option value="unsynced">⚠️ Skool24 Pending ({crmPendingCount})</option>
              </select>

              {/* Grade Filter */}
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="px-3 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">All Grades</option>
                <option value="nursery">Nursery</option>
                <option value="lkg">LKG</option>
                <option value="ukg">UKG</option>
                <option value="class 1">Class 1st</option>
                <option value="class 2">Class 2nd</option>
                <option value="class 3">Class 3rd</option>
                <option value="class 4">Class 4th</option>
                <option value="class 5">Class 5th</option>
                <option value="class 6">Class 6th</option>
                <option value="class 7">Class 7th</option>
                <option value="class 8">Class 8th</option>
                <option value="class 9">Class 9th</option>
                <option value="class 10">Class 10th</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Quick Select All Pending button */}
              <button
                onClick={handleSelectAllPending}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Select all inquiries requiring follow-up"
              >
                <span className="material-symbols-outlined text-[15px]">select_all</span>
                <span>Select Pending ({pendingWorkCount})</span>
              </button>

              <button
                onClick={exportLeadsCSV}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                Export CSV ({filteredLeads.length})
              </button>
            </div>
          </div>

          {/* ── Leads Data Table ───────────────────────────────── */}
          <div className="bg-surface-container-lowest border border-surface-variant/80 rounded-xl overflow-hidden shadow-2xs">
            {filteredLeads.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">
                  person_search
                </span>
                <p className="text-sm font-bold text-slate-800">No matching inquiries found.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query, CRM sync filter, or status filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-surface-variant/70 text-slate-600 font-label-caps uppercase tracking-wider">
                      {/* Select All Checkbox */}
                      <th className="py-3 px-3 w-8 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedLeadIds.length === filteredLeads.length &&
                            filteredLeads.length > 0
                          }
                          onChange={toggleSelectAllFiltered}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                          title="Select / Unselect all visible inquiries"
                        />
                      </th>
                      <th className="py-3 px-3.5">Ref # / Dual-Storage</th>
                      <th className="py-3 px-3.5">Student & Parents</th>
                      <th className="py-3 px-3.5">Contact</th>
                      <th className="py-3 px-3.5">Class</th>
                      <th className="py-3 px-3.5">Work Done?</th>
                      <th className="py-3 px-3.5">Admission Status & Reason</th>
                      <th className="py-3 px-3.5 text-right">Instant Follow-up Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/40">
                    {filteredLeads.map((lead) => {
                      const isWorkDone =
                        lead.workStatus === "WORK_DONE" ||
                        (lead.status && lead.status !== "NEW");

                      const statusColor =
                        lead.status === "ENROLLED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : lead.status === "CONTACTED"
                          ? "bg-sky-50 text-sky-800 border-sky-300"
                          : lead.status === "VERIFIED"
                          ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                          : lead.status === "NOT_INTERESTED"
                          ? "bg-slate-100 text-slate-800 border-slate-300"
                          : lead.status === "REJECTED"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-amber-50 text-amber-900 border-amber-300";

                      const isSelected = selectedLeadIds.includes(lead.id);

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-slate-50/70 transition-colors group ${
                            isSelected ? "bg-amber-50/40" : ""
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectLead(lead.id)}
                              className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                            />
                          </td>

                          {/* Col 1: Ref & Dual-Storage Status */}
                          <td className="py-3.5 px-3.5">
                            <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                              <span>{lead.referenceNumber || lead.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {lead.createdDate
                                ? new Date(lead.createdDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "2-digit",
                                  })
                                : "Recent"}
                            </div>

                            {/* Dual Parallel Storage Badges */}
                            <div className="flex flex-col gap-1 mt-2">
                              {/* 1. Software Portal Badge */}
                              <span
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit"
                                title="Safely stored in School Software Firestore Database"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Portal: Saved
                              </span>

                              {/* 2. Skool24 CRM Badge / Action */}
                              {lead.skool24Synced ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 w-fit"
                                  title={`Synced to Skool24 School ERP (CRM ID: #${lead.skool24LeadId})`}
                                >
                                  <span className="material-symbols-outlined text-[11px] text-indigo-600">
                                    cloud_done
                                  </span>
                                  Skool24: #{lead.skool24LeadId || "Synced"}
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSyncToCrm(lead)}
                                  disabled={syncingLeadId === lead.id}
                                  className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer disabled:opacity-50 w-fit"
                                  title="Push this lead directly to Skool24 CRM now"
                                >
                                  <span
                                    className={`material-symbols-outlined text-[11px] ${
                                      syncingLeadId === lead.id ? "animate-spin" : ""
                                    }`}
                                  >
                                    sync
                                  </span>
                                  {syncingLeadId === lead.id ? "Syncing..." : "Sync to Skool24"}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Col 2: Student & Parent */}
                          <td className="py-3.5 px-3.5">
                            <div className="font-bold text-slate-900 text-sm">
                              {lead.studentName || "N/A"}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Father: <span className="font-medium">{lead.parentName || "N/A"}</span>
                            </div>
                            {lead.motherName && (
                              <div className="text-[10px] text-slate-500">
                                Mother: {lead.motherName}
                              </div>
                            )}
                            {lead.dob && (
                              <div className="text-[10px] text-slate-400">DOB: {lead.dob}</div>
                            )}
                          </td>

                          {/* Col 3: Contact */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${lead.phone}`}
                                className="font-bold text-primary hover:underline flex items-center gap-1 font-mono text-xs"
                                title="Call Parent"
                              >
                                <span className="material-symbols-outlined text-[14px]">call</span>
                                {lead.phone}
                              </a>
                            </div>
                            {lead.address && (
                              <div
                                className="text-[10.5px] text-slate-500 mt-1 max-w-[170px] truncate"
                                title={lead.address}
                              >
                                📍 {lead.address}
                              </div>
                            )}
                            {lead.lastWhatsAppSentAt && (
                              <div
                                className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1"
                                title={`WhatsApp sent at ${new Date(lead.lastWhatsAppSentAt).toLocaleString("en-IN")}`}
                              >
                                <span className="material-symbols-outlined text-[11px]">mark_chat_read</span>
                                <span>Reminded</span>
                              </div>
                            )}
                          </td>

                          {/* Col 4: Grade */}
                          <td className="py-3.5 px-3.5 font-bold text-slate-800">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-800 font-bold border border-slate-200">
                              {lead.grade || "Nursery"}
                            </span>
                          </td>

                          {/* Col 5: Work Done? */}
                          <td className="py-3.5 px-3.5">
                            <button
                              onClick={() => handleToggleWorkStatus(lead)}
                              title="Click to toggle Work Done / Action Due"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer transition-all active:scale-95 ${
                                isWorkDone
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 animate-pulse"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isWorkDone ? "check_circle" : "pending"}
                              </span>
                              <span>{isWorkDone ? "Work Done" : "Action Due"}</span>
                            </button>
                            {lead.counselorName && (
                              <div className="text-[10px] text-slate-500 mt-1">
                                By: {lead.counselorName}
                              </div>
                            )}
                          </td>

                          {/* Col 6: Status & Reason */}
                          <td className="py-3.5 px-3.5">
                            <select
                              value={lead.status || "NEW"}
                              onChange={(e) =>
                                handleStatusChangeRequest(lead, e.target.value as any)
                              }
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${statusColor}`}
                            >
                              <option value="NEW">⏳ New Inquiry</option>
                              <option value="CONTACTED">📞 Contacted</option>
                              <option value="VERIFIED">🏫 Visited / Verified</option>
                              <option value="ENROLLED">🎓 Admission Done</option>
                              <option value="NOT_INTERESTED">✋ Not Interested</option>
                              <option value="REJECTED">❌ Rejected</option>
                            </select>

                            {/* Show Reason Badge if Rejected or Not Interested */}
                            {(lead.status === "REJECTED" || lead.status === "NOT_INTERESTED") && (
                              <div className="mt-1.5">
                                <span
                                  onClick={() => handleStatusChangeRequest(lead, lead.status)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border max-w-[200px] truncate cursor-pointer ${
                                    lead.status === "REJECTED"
                                      ? "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
                                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                                  }`}
                                  title={`Reason: ${lead.rejectionReason || "Click to set reason"}`}
                                >
                                  <span className="material-symbols-outlined text-[11px]">info</span>
                                  <span className="truncate">
                                    {lead.rejectionReason || "Set reason..."}
                                  </span>
                                </span>
                              </div>
                            )}

                            {lead.lastNote && (
                              <div
                                className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic max-w-[200px]"
                                title={lead.lastNote}
                              >
                                Note: {lead.lastNote}
                              </div>
                            )}
                          </td>

                          {/* Col 7: Actions */}
                          <td className="py-3.5 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Message Templates Drawer */}
                              <button
                                onClick={() => handleOpenMessageModal(lead)}
                                title="Open Ready-to-Send Text & WhatsApp Templates"
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                <span>Text</span>
                              </button>

                              {/* Direct WhatsApp */}
                              <button
                                onClick={() => handleSendWhatsAppDirect(lead)}
                                title="Send Personalized WhatsApp Message"
                                className="w-7 h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">send</span>
                              </button>

                              {/* Direct Phone Call */}
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call parent"
                                className="w-7 h-7 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[15px]">call</span>
                              </a>

                              {/* View Details / Add Note Drawer */}
                              <button
                                onClick={() => handleOpenDetailDrawer(lead)}
                                title="View details, follow-up history, and add notes"
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                title="Delete inquiry record"
                                className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING BULK ACTIONS TOOLBAR ─────────────────────── */}
      {selectedLeadIds.length > 0 && activeTab === "leads" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs">
              {selectedLeadIds.length}
            </span>
            <span className="text-xs font-bold whitespace-nowrap">Selected</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          {/* Bulk WhatsApp Reminder Button */}
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkResultsReport(null);
            }}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
            <span>Send Bulk WhatsApp ({selectedLeadIds.length})</span>
          </button>

          {/* Bulk Skool24 CRM Sync Button */}
          <button
            onClick={handleBulkSyncCrm}
            disabled={bulkSyncingCrm}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <span className={`material-symbols-outlined text-[16px] ${bulkSyncingCrm ? "animate-spin" : ""}`}>
              cloud_sync
            </span>
            <span>{bulkSyncingCrm ? "Syncing..." : "Sync to Skool24"}</span>
          </button>

          <button
            onClick={() => setSelectedLeadIds([])}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── BULK WHATSAPP NOTIFICATION MODAL ─────────────────── */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col justify-between overflow-hidden">
            <div>
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      WhatsApp Business Bulk Notification
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedLeads.length} Recipients Selected
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">
                    Send Automated Reminders to Pending Clients
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatches personalized messages with each student's name, grade, and reference ID.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setBulkModalOpen(false);
                    setBulkResultsReport(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Template Selector */}
              <div className="py-3 border-b border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Select Reminder Template
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(
                    [
                      { key: "reminder", label: "1. Seat Availability Reminder" },
                      { key: "welcome", label: "2. Campus Visit & Welcome" },
                      { key: "docs", label: "3. Document Checklist" },
                      { key: "fees", label: "4. Fees & Timings Guide" },
                      { key: "enrolled", label: "5. Admission Done Welcome" },
                      { key: "custom", label: "6. Custom Message" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setBulkTemplateKey(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        bulkTemplateKey === t.key
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Preview or Custom Editor */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-emerald-600">visibility</span>
                    Personalized Preview for:{" "}
                    <strong className="text-primary font-bold">
                      {selectedLeads[0]?.studentName || "Selected Student"} (
                      {selectedLeads[0]?.grade || "Grade"})
                    </strong>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Variables auto-replace per parent
                  </span>
                </div>

                {bulkTemplateKey === "custom" ? (
                  <div>
                    <textarea
                      rows={6}
                      placeholder="Type custom text... Available variables: {studentName}, {parentName}, {grade}, {referenceNumber}"
                      value={bulkCustomText}
                      onChange={(e) => setBulkCustomText(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary resize-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tip: Write <code>{"{studentName}"}</code> or <code>{"{parentName}"}</code> to personalize for each parent.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto text-xs font-sans leading-relaxed text-slate-800 whitespace-pre-wrap">
                    {selectedLeads[0]
                      ? generateLeadMessage(selectedLeads[0], bulkTemplateKey)
                      : "Select at least 1 lead to preview"}
                  </div>
                )}
              </div>

              {/* Results Report if dispatched */}
              {bulkResultsReport && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    <span>{bulkResultsReport.message}</span>
                  </div>
                  {bulkResultsReport.results?.some((r: any) => !r.success) && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      Note: Leads without Meta API access can be launched sequentially in WhatsApp Web below.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <strong>{selectedLeads.length}</strong> recipients ready
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setBulkModalOpen(false);
                    setBulkResultsReport(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>

                {/* Primary Automated Send Button */}
                <button
                  onClick={handleExecuteBulkWhatsApp}
                  disabled={bulkSending || selectedLeads.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <span className={`material-symbols-outlined text-[17px] ${bulkSending ? "animate-spin" : ""}`}>
                    {bulkSending ? "sync" : "send"}
                  </span>
                  <span>
                    {bulkSending
                      ? "Dispatching Reminders..."
                      : `Send to ${selectedLeads.length} Parents via WhatsApp`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ACTIVITY & FOLLOW-UP LOG ───────────────────── */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="p-4 bg-surface-container-lowest border border-surface-variant/80 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex-1 w-full flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[17px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter logs by student name, parent, phone, counselor..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container border border-surface-variant/80 rounded-lg text-xs outline-none focus:border-primary transition-all"
                />
              </div>

              {/* Activity Type Filter */}
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-surface-variant/80 overflow-x-auto">
                {(
                  [
                    { key: "all", label: "All Logs" },
                    { key: "WHATSAPP", label: "WhatsApp Alerts" },
                    { key: "NOTE", label: "Counselor Notes" },
                    { key: "CRM_SYNC", label: "CRM Syncs" },
                    { key: "STATUS_CHANGE", label: "Status Updates" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setLogFilterType(tab.key)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      logFilterType === tab.key
                        ? "bg-primary text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredActivityLogs.length} events
            </span>
          </div>

          {/* Activity Log Stream */}
          <div className="bg-surface-container-lowest border border-surface-variant/80 rounded-xl p-5 shadow-2xs">
            {filteredActivityLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
                  history_toggle_off
                </span>
                <p className="text-sm font-bold text-slate-700">No activity events matching query.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Counselor call remarks, WhatsApp dispatches, and CRM syncs will stream here automatically.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {filteredActivityLogs.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Bullet marker */}
                    <span
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        item.type === "WHATSAPP"
                          ? "bg-emerald-500 ring-4 ring-emerald-100"
                          : item.type === "CRM_SYNC"
                          ? "bg-indigo-600 ring-4 ring-indigo-100"
                          : item.type === "ENQUIRY_CREATED"
                          ? "bg-emerald-600 ring-4 ring-emerald-100"
                          : item.type === "NOTE"
                          ? "bg-amber-500 ring-4 ring-amber-100"
                          : "bg-primary ring-4 ring-slate-100"
                      }`}
                    ></span>

                    <div className="bg-slate-50/80 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${item.badgeColor}`}
                          >
                            {item.title}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {item.studentName} ({item.grade})
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Parent: {item.parentName} · Ph: {item.phone}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-200/60">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>
                          Logged by: <strong className="text-slate-700">{item.author}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const found = leads.find((l) => l.id === item.leadId);
                              if (found) handleOpenMessageModal(found);
                            }}
                            className="text-amber-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">chat</span>
                            Send Text
                          </button>
                          <button
                            onClick={() => {
                              const found = leads.find((l) => l.id === item.leadId);
                              if (found) handleOpenDetailDrawer(found);
                            }}
                            className="text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TEXT & MESSAGE TEMPLATES MODAL (Single Lead) ─────── */}
      {messageModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col justify-between overflow-hidden">
            <div>
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      Ready-to-Send Text Templates
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {messageModalLead.referenceNumber || messageModalLead.id.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">
                    Send Follow-up Message to {messageModalLead.parentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student: <strong className="text-slate-800">{messageModalLead.studentName}</strong> (
                    {messageModalLead.grade}) · Phone:{" "}
                    <strong className="text-slate-800">{messageModalLead.phone}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setMessageModalLead(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Template Tabs Selection */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-100">
                {(
                  [
                    { key: "welcome", label: "1. Campus Visit & Welcome" },
                    { key: "docs", label: "2. Documents Checklist" },
                    { key: "fees", label: "3. Fees & Timings Guide" },
                    { key: "reminder", label: "4. Seat Availability Reminder" },
                    { key: "enrolled", label: "5. Admission Done Welcome" },
                  ] as const
                ).map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => handleSelectTemplate(tpl.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeTemplateKey === tpl.key
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>

              {/* Editable Template Textarea */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">edit</span>
                    Live Editable Message Preview
                  </span>
                  <span className="text-[11px] text-slate-400">
                    You can edit or customize the text below before sending
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={editedTemplateText}
                  onChange={(e) => setEditedTemplateText(e.target.value)}
                  className="w-full p-3.5 text-xs font-sans leading-relaxed bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary resize-none focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Copy to Clipboard */}
                <button
                  onClick={handleCopyMessageText}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    copiedSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedSuccess ? "check" : "content_copy"}
                  </span>
                  <span>{copiedSuccess ? "Copied! ✓" : "Copy Text"}</span>
                </button>

                {/* SMS Link */}
                <button
                  onClick={() => handleSendSMS(messageModalLead)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Open native SMS app"
                >
                  <span className="material-symbols-outlined text-[16px]">sms</span>
                  <span>SMS</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setMessageModalLead(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* Direct WhatsApp Open */}
                <button
                  onClick={() => handleSendWhatsAppDirect(messageModalLead, editedTemplateText)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  <span>Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REASON CAPTURE MODAL (Rejected / Not Interested) ── */}
      {reasonModalOpen && targetLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {targetStatus === "REJECTED" ? "❌ Lead Rejection" : "✋ Parent Not Interested"}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  Specify Reason for {targetLead.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Select why this inquiry is being closed for accurate reporting.
                </p>
              </div>
              <button
                onClick={() => setReasonModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Primary Reason *
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {COMMON_REASONS[targetStatus].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      selectedReason === reason
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection_reason"
                      checked={selectedReason === reason}
                      onChange={() => setSelectedReason(reason)}
                      className="accent-amber-400"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === "Other / Miscellaneous" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Describe Custom Reason:
                  </label>
                  <textarea
                    rows={2}
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    placeholder="E.g. Parent requested CBSE school with hostel facility..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-primary resize-none bg-slate-50"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReasonModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReasonModal}
                disabled={reasonSaving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-on-primary hover:bg-secondary transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {reasonSaving ? "Saving..." : "Save Reason & Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL & NOTES DRAWER ───────────────────────────── */}
      {detailDrawerLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {detailDrawerLead.referenceNumber || detailDrawerLead.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {detailDrawerLead.source || "Website"}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mt-1">
                    {detailDrawerLead.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applying for: <span className="font-bold text-slate-800">{detailDrawerLead.grade}</span>
                  </p>
                </div>
                <button
                  onClick={() => setDetailDrawerLead(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Quick Profile Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Parent / Guardian
                  </span>
                  <p className="font-bold text-slate-800">{detailDrawerLead.parentName || "N/A"}</p>
                  {detailDrawerLead.motherName && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Mother: {detailDrawerLead.motherName}</p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Contact Phone
                  </span>
                  <a
                    href={`tel:${detailDrawerLead.phone}`}
                    className="font-bold text-primary font-mono hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">call</span>
                    {detailDrawerLead.phone}
                  </a>
                  <button
                    onClick={() => handleOpenMessageModal(detailDrawerLead)}
                    className="mt-1 text-[10.5px] font-semibold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">chat</span>
                    Open Message Templates
                  </button>
                </div>

                {detailDrawerLead.dob && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Date of Birth
                    </span>
                    <p className="font-bold text-slate-800">{detailDrawerLead.dob}</p>
                  </div>
                )}

                {detailDrawerLead.aadhaar && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Student Aadhaar
                    </span>
                    <p className="font-bold text-slate-800 font-mono">{detailDrawerLead.aadhaar}</p>
                  </div>
                )}

                {detailDrawerLead.address && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 col-span-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Address
                    </span>
                    <p className="font-medium text-slate-700 text-[11.5px] leading-relaxed">
                      {detailDrawerLead.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Dual-Storage Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Dual-Storage Synchronization Status
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">🏫 School Software Portal:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Saved in Firestore
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">☁️ Skool24 School ERP:</span>
                  {detailDrawerLead.skool24Synced ? (
                    <span className="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Synced (Lead ID #{detailDrawerLead.skool24LeadId})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSyncToCrm(detailDrawerLead)}
                      disabled={syncingLeadId === detailDrawerLead.id}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">sync</span>
                      {syncingLeadId === detailDrawerLead.id ? "Syncing..." : "Sync Now"}
                    </button>
                  )}
                </div>
              </div>

              {/* Status & Work Done Overview */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Current Status:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900">
                    {detailDrawerLead.status || "NEW"}
                  </span>
                </div>
                {detailDrawerLead.rejectionReason && (
                  <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                    <strong>Reason:</strong> {detailDrawerLead.rejectionReason}
                  </div>
                )}
              </div>

              {/* Follow-up Notes & History */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Counselor Call Logs & Notes</span>
                </h4>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 max-h-48 overflow-y-auto space-y-2 text-xs">
                  {detailDrawerLead.notes ? (
                    detailDrawerLead.notes.split("\n").map((line, idx) => (
                      <p key={idx} className="text-slate-700 text-[11px] leading-relaxed border-b border-slate-200/50 pb-1">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No notes logged yet.</p>
                  )}
                </div>

                {/* Add New Note Form */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Counselor Name
                      </label>
                      <input
                        type="text"
                        placeholder="E.g. Priya Sharma"
                        value={counselorInput}
                        onChange={(e) => setCounselorInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Next Reminder Date
                      </label>
                      <input
                        type="date"
                        value={nextFollowUpInput}
                        onChange={(e) => setNextFollowUpInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Add New Follow-up Remarks
                    </label>
                    <textarea
                      rows={3}
                      placeholder="E.g. Called parent, interested in bus route. Scheduled campus visit on Friday 10 AM..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveDetailNote}
                    disabled={noteSaving || (!newNoteText.trim() && !counselorInput.trim())}
                    className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-secondary transition-all disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    {noteSaving ? "Saving..." : "Save Note & Update Call Log"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <button
                onClick={() => setDetailDrawerLead(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
              <button
                onClick={() => handleOpenMessageModal(detailDrawerLead)}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">chat</span>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ADMISSION & WHATSAPP SETTINGS ──────────────── */}
      {activeTab === "settings" && (
        <div className="space-y-10">
          {/* WhatsApp Business API Configuration Form */}
          <form
            onSubmit={handleSaveWhatsAppConfig}
            className="space-y-8 bg-surface-container-lowest p-8 sm:p-10 border border-surface-variant rounded-xl shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-surface-variant pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold">
                    Meta WhatsApp Business Cloud API Configuration
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      waSettings.isEnabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {waSettings.isEnabled ? "API Configured" : "Fallback / Web Mode"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Connect your Meta WhatsApp Cloud API credentials to enable 1-click automated bulk reminders directly to parent phones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={waSettings.phoneNumberId}
                  onChange={(e) => setWaSettings({ ...waSettings, phoneNumberId: e.target.value })}
                  placeholder="e.g., 104523958291039"
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none transition-all rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400">From Meta App Dashboard → WhatsApp → API Setup</span>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  value={waSettings.businessAccountId}
                  onChange={(e) => setWaSettings({ ...waSettings, businessAccountId: e.target.value })}
                  placeholder="e.g., 291039485729104"
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none transition-all rounded-lg font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  Meta System User Access Token (Permanent / 60-day token)
                </label>
                <input
                  type="password"
                  value={waSettings.accessToken}
                  onChange={(e) => setWaSettings({ ...waSettings, accessToken: e.target.value })}
                  placeholder={
                    waSettings.hasAccessToken
                      ? `Current Token: ${waSettings.maskedAccessToken} (leave blank to keep unchanged)`
                      : "Paste EAAB... token from Meta Business Manager"
                  }
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none transition-all rounded-lg font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  Autonomous Follow-Up Threshold (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={waSettings.autoFollowupHours}
                  onChange={(e) =>
                    setWaSettings({ ...waSettings, autoFollowupHours: Number(e.target.value) || 24 })
                  }
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none transition-all rounded-lg"
                />
                <span className="text-[10px] text-slate-400">
                  Inquiries older than this threshold receive automatic reminders
                </span>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest block font-bold">
                  Default Pre-Approved Template Name
                </label>
                <input
                  type="text"
                  value={waSettings.defaultTemplateName}
                  onChange={(e) => setWaSettings({ ...waSettings, defaultTemplateName: e.target.value })}
                  placeholder="e.g., admission_followup_reminder"
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none transition-all rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Fallback: If Cloud API is not configured, dashboard provides 1-click WhatsApp Web sequential launcher.
              </span>
              <button
                type="submit"
                disabled={savingWaSettings}
                className="px-6 py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:bg-secondary transition-all rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {savingWaSettings ? "Saving API Credentials..." : "Save WhatsApp Settings"}
              </button>
            </div>
          </form>

          {/* Admission Session Controls Form */}
          <form
            onSubmit={handleSaveSettings}
            className="space-y-10 bg-surface-container-lowest p-8 sm:p-10 border border-surface-variant rounded-xl shadow-2xs"
          >
            {/* Section: Core Settings */}
            <div>
              <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3 font-bold">
                Core Session Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Academic Session
                  </label>
                  <input
                    required
                    type="text"
                    value={settings.session}
                    onChange={(e) => setSettings({ ...settings, session: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all rounded-lg"
                    placeholder="e.g., 2026-27 or 2027-28"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    DOE Delhi Age Criteria
                  </label>
                  <input
                    required
                    type="text"
                    value={settings.ageCriteria}
                    onChange={(e) => setSettings({ ...settings, ageCriteria: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all rounded-lg"
                    placeholder="e.g., Nursery 3+, LKG 4+, UKG 5+, 1st 6+ as on 31.03"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Application Deadline
                  </label>
                  <input
                    required
                    type="text"
                    value={settings.deadline}
                    onChange={(e) => setSettings({ ...settings, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all rounded-lg"
                    placeholder="e.g., 27th Dec 2025"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Inquiry Contact Number
                  </label>
                  <input
                    type="text"
                    value={settings.contactNumber}
                    onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all rounded-lg"
                    placeholder="e.g., +91 99994 39422"
                  />
                </div>
              </div>
            </div>

            {/* Section: Documents & Process */}
            <div>
              <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3 font-bold">
                Official Document Checklist & Process
              </h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Documents Required Checklist
                  </label>
                  <textarea
                    rows={4}
                    value={settings.documentsRequired}
                    onChange={(e) => setSettings({ ...settings, documentsRequired: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Admission Process Steps
                  </label>
                  <textarea
                    rows={4}
                    value={settings.admissionProcess}
                    onChange={(e) => setSettings({ ...settings, admissionProcess: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section: Spotlight */}
            <div>
              <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3 font-bold">
                Homepage Spotlight Announcement
              </h4>
              <div className="space-y-2">
                <textarea
                  required
                  rows={3}
                  value={settings.spotlightText}
                  onChange={(e) => setSettings({ ...settings, spotlightText: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all text-xs rounded-lg"
                  placeholder="Homepage banner alert..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-surface-variant">
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-4 bg-primary text-on-primary font-label-caps uppercase tracking-[0.2em] hover:bg-secondary transition-all disabled:opacity-50 shadow-md text-xs font-bold rounded-lg cursor-pointer"
              >
                {saving ? "Saving Changes..." : "Update Settings"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
