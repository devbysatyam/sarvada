"use client";

import { useState, useEffect, useRef } from "react";
import {
  SCHOOL_INFO,
  AdmissionJourneyContext,
  JourneyStage,
} from "@/lib/admission-knowledge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: any[];
  referenceNumber?: string;
  timestamp: string;
}

interface AdmissionChatbotProps {
  initialPrompt?: string;
  embedded?: boolean;
  onClose?: () => void;
}

const JOURNEY_STEPS: { stage: JourneyStage; label: string; desc: string }[] = [
  { stage: "DISCOVERY", label: "Inquiry", desc: "General queries" },
  { stage: "ELIGIBILITY_EVALUATED", label: "Eligibility", desc: "DOE age criteria" },
  { stage: "DOCUMENTS_REVIEWED", label: "Documents", desc: "Required papers" },
  { stage: "COLLECTING_DETAILS", label: "Details", desc: "Applicant info" },
  { stage: "REGISTERED", label: "Confirmed", desc: "Reference issued" },
];

const QUICK_STARTERS = [
  {
    icon: "verified_user",
    title: "Age Eligibility",
    subtitle: "DOE Delhi Cut-off (31st March)",
    query: "Check age eligibility for admission (DOE Guidelines)",
  },
  {
    icon: "description",
    title: "Required Documents",
    subtitle: "Nursery–1st & 2nd–9th checklist",
    query: "What documents are required for admission?",
  },
  {
    icon: "calculate",
    title: "100-Point Criteria",
    subtitle: "Distance, sibling & alumni points",
    query: "Calculate 100-point pre-school criteria score",
  },
  {
    icon: "how_to_reg",
    title: "Register Inquiry",
    subtitle: "Book counselor interaction",
    query: "I want to register an admission inquiry",
  },
];

function FormattedText({ text, isUser }: { text: string; isUser: boolean }) {
  // Matches markdown links [label](url), inline code `code`, bold-italic ***text***, bold **text** or __text__, italic *text* or _text_
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Markdown Link [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, label, url] = linkMatch;
          return (
            <a
              key={i}
              href={url}
              target={url.startsWith("http") ? "_blank" : undefined}
              rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`underline font-medium transition-colors ${
                isUser ? "text-amber-200 hover:text-white" : "text-amber-700 hover:text-amber-900"
              }`}
            >
              {label}
            </a>
          );
        }

        // Bold Italic ***text***
        if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
          return (
            <strong
              key={i}
              className={`font-semibold italic ${isUser ? "text-white" : "text-slate-900"}`}
            >
              {part.slice(3, -3)}
            </strong>
          );
        }

        // Bold **text**
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong
              key={i}
              className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Bold __text__
        if (part.startsWith("__") && part.endsWith("__") && part.length >= 4) {
          return (
            <strong
              key={i}
              className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Code `code`
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={i}
              className={`font-mono px-1.5 py-0.5 rounded text-[11px] font-medium ${
                isUser ? "bg-white/20 text-white" : "bg-slate-100 text-slate-800 border border-slate-200/60"
              }`}
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Italic *text*
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) {
          return (
            <em key={i} className={`italic ${isUser ? "text-slate-200" : "text-slate-600"}`}>
              {part.slice(1, -1)}
            </em>
          );
        }

        // Italic _text_
        if (part.startsWith("_") && part.endsWith("_") && part.length >= 2 && !part.startsWith("__")) {
          return (
            <em key={i} className={`italic ${isUser ? "text-slate-200" : "text-slate-600"}`}>
              {part.slice(1, -1)}
            </em>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const rawLines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  const flushTable = (keyIdx: number) => {
    if (tableBuffer.length === 0) return;
    const rows = tableBuffer.map((line) =>
      line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim())
    );

    const hasHeader = rows.length >= 2 && rows[1].every((cell) => /^:?-+:?$/.test(cell));
    const headerRow = hasHeader ? rows[0] : null;
    const bodyRows = hasHeader ? rows.slice(2) : rows;

    if (bodyRows.length > 0 || headerRow) {
      elements.push(
        <div
          key={`tbl-${keyIdx}`}
          className="my-2.5 overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs"
        >
          <table className="w-full text-left text-xs border-collapse">
            {headerRow && (
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr>
                  {headerRow.map((col, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3 py-2 font-semibold text-slate-800"
                    >
                      <FormattedText text={col} isUser={isUser} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 bg-white">
              {bodyRows.map((bRow, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                  {bRow.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-slate-700">
                      <FormattedText text={cell} isUser={isUser} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      continue;
    } else if (tableBuffer.length > 0) {
      flushTable(idx);
    }

    if (!trimmed) {
      if (idx === 0 || idx === rawLines.length - 1) continue;
      elements.push(<div key={`gap-${idx}`} className="h-1.5" />);
      continue;
    }

    // Divider rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(
        <hr
          key={`hr-${idx}`}
          className={`my-2 border-t ${isUser ? "border-white/15" : "border-slate-200/70"}`}
        />
      );
      continue;
    }

    // Markdown headings (#, ##, ###)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const text = headingMatch[2];
      elements.push(
        <div
          key={`h-${idx}`}
          className={`font-semibold mt-2.5 mb-1 text-[13px] ${
            isUser ? "text-amber-200" : "text-slate-900"
          }`}
        >
          <FormattedText text={text} isUser={isUser} />
        </div>
      );
      continue;
    }

    // Blockquotes (> text)
    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.replace(/^>\s*/, "");
      elements.push(
        <div
          key={`quote-${idx}`}
          className={`pl-3 py-1 border-l-2 my-1 text-xs italic ${
            isUser
              ? "border-amber-300 text-amber-100 bg-white/5"
              : "border-amber-500 text-slate-700 bg-amber-50/30"
          } rounded-r-md`}
        >
          <FormattedText text={quoteText} isUser={isUser} />
        </div>
      );
      continue;
    }

    // Bullet point (•, -, +, or *)
    if (
      trimmed.startsWith("•") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("+ ") ||
      (trimmed.startsWith("* ") && !trimmed.startsWith("**"))
    ) {
      const cleanText = trimmed.replace(/^[•\-*+]\s*/, "");
      elements.push(
        <div key={`bullet-${idx}`} className="flex items-start gap-2 my-0.5 ml-0.5">
          <span
            className={`font-bold shrink-0 text-xs mt-0.5 ${
              isUser ? "text-amber-300" : "text-amber-600"
            }`}
          >
            •
          </span>
          <div className="flex-1 leading-relaxed">
            <FormattedText text={cleanText} isUser={isUser} />
          </div>
        </div>
      );
      continue;
    }

    // Numbered list (1., 1), (1))
    const numMatch = trimmed.match(/^(?:(\d+)[\.\)]|\((\d+)\))\s+(.*)/);
    if (numMatch) {
      const num = numMatch[1] || numMatch[2];
      const text = numMatch[3];
      elements.push(
        <div key={`num-${idx}`} className="flex items-start gap-2 my-1 ml-0.5">
          <span
            className={`w-4.5 h-4.5 rounded-full font-medium text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
              isUser
                ? "bg-amber-400 text-slate-950 font-bold"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {num}
          </span>
          <div className="flex-1 leading-relaxed">
            <FormattedText text={text} isUser={isUser} />
          </div>
        </div>
      );
      continue;
    }

    // Standard text line
    elements.push(
      <div key={`p-${idx}`}>
        <FormattedText text={rawLine} isUser={isUser} />
      </div>
    );
  }

  if (tableBuffer.length > 0) {
    flushTable(rawLines.length);
  }

  return (
    <div className="space-y-1 leading-relaxed font-sans text-[13px] sm:text-[13.5px]">
      {elements}
    </div>
  );
}

export default function AdmissionChatbot({
  initialPrompt,
  embedded = false,
  onClose,
}: AdmissionChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        `Namaste! 🙏 Welcome to **Sarvada Modern Secondary School**.\n\n` +
        `I am your **AI Admission Counselor** for Session ${SCHOOL_INFO.currentAcademicSession} & ${SCHOOL_INFO.upcomingAcademicSession}.\n\n` +
        `How can I assist you with your child's schooling today? You can ask in **English or हिंदी**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionContext, setSessionContext] = useState<AdmissionJourneyContext>({
    stage: "DISCOVERY",
    language: "en",
  });
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    "Check Age Eligibility",
    "What documents are required?",
    "School Timings & Location",
  ]);

  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [likedMsgIds, setLikedMsgIds] = useState<Set<string>>(new Set());
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [hasResumedSession, setHasResumedSession] = useState(false);

  const STORAGE_KEY = "sarvada_admission_session_v2";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Restore session from localStorage on mount (Website application continuity)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          if (Array.isArray(parsed.messages) && parsed.messages.length > 1) {
            setMessages(parsed.messages);
            setHasResumedSession(true);
          }
          if (parsed.sessionContext && typeof parsed.sessionContext === "object") {
            setSessionContext(parsed.sessionContext);
          }
          if (Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0) {
            setSuggestedActions(parsed.suggestedActions);
          }
        }
      }
    } catch (e) {
      console.warn("Session restore note:", e);
    }
  }, []);

  // Persist session to localStorage on every state transition
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (messages.length > 1 || sessionContext.stage !== "DISCOVERY" || sessionContext.studentName) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            messages,
            sessionContext,
            suggestedActions,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.warn("Session save note:", e);
    }
  }, [messages, sessionContext, suggestedActions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(Boolean(SpeechRec));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  useEffect(() => {
    if (initialPrompt) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = sessionContext.language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const copyToClipboard = (text: string, id: string, isRef = false) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isRef) {
        setCopiedRefId(id);
        setTimeout(() => setCopiedRefId(null), 2500);
      } else {
        setCopiedMsgId(id);
        setTimeout(() => setCopiedMsgId(null), 2500);
      }
    }
  };

  const toggleLike = (id: string) => {
    setLikedMsgIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetChat = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
    setHasResumedSession(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          `Namaste! 🙏 Welcome to **Sarvada Modern Secondary School**.\n\n` +
          `I am your **AI Admission Counselor** for Session ${SCHOOL_INFO.currentAcademicSession} & ${SCHOOL_INFO.upcomingAcademicSession}.\n\n` +
          `How can I assist you with your child's schooling today? You can ask in **English or हिंदी**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setSessionContext({ stage: "DISCOVERY", language: "en" });
    setSuggestedActions([
      "Check Age Eligibility",
      "What documents are required?",
      "School Timings & Location",
    ]);
    setInput("");
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/agent/admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          sessionContext,
        }),
      });

      const data = await res.json();

      if (data.sessionContext) {
        setSessionContext(data.sessionContext);
      }

      if (data.suggestedActions && Array.isArray(data.suggestedActions)) {
        setSuggestedActions(data.suggestedActions);
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Thank you. Our admissions team has noted this.",
        tools: data.executedTools || [],
        referenceNumber: data.referenceNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content:
            "I encountered a temporary connection issue. You can call our admission counselor directly at **+91 99994 39422**.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = JOURNEY_STEPS.findIndex((s) => s.stage === sessionContext.stage);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden transition-all ${
        embedded
          ? "w-full h-[650px] rounded-2xl border border-slate-200 shadow-sm"
          : "w-full h-[92vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.22)]"
      }`}
    >
      {/* ── ULTRA-MINIMAL CLEAN HEADER ───────────────────── */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100/90 bg-white/95 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center text-sm shadow-2xs shrink-0">
            🎓
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight leading-tight truncate">
                Sarvada Admissions AI
              </h3>
              {sessionContext.grade && (
                <span className="text-[9.5px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.2 rounded-full shrink-0">
                  {sessionContext.grade}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10.5px] text-slate-400 font-normal truncate">
                Session 2026-27 · English / हिंदी
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-slate-400 shrink-0">
          <button
            onClick={resetChat}
            title="Start New Chat"
            aria-label="Restart Conversation"
            className="w-7 h-7 rounded-md hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">restart_alt</span>
          </button>

          <a
            href={`tel:${SCHOOL_INFO.phone}`}
            title={`Call Admission Desk (${SCHOOL_INFO.phoneDisplay})`}
            className="w-7 h-7 rounded-md hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">call</span>
          </a>

          {!embedded && onClose && (
            <button
              onClick={onClose}
              aria-label="Close Chat Window"
              className="w-7 h-7 rounded-md hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors active:scale-95 ml-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── HAIRLINE 5-STEP JOURNEY PROGRESS ──────────────── */}
      <div className="bg-slate-50/60 px-4 py-1.5 border-b border-slate-100/80 shrink-0">
        <div className="flex items-center gap-1 mb-1">
          {JOURNEY_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={step.stage}
                className={`h-[2px] flex-1 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-slate-900"
                    : isCurrent
                    ? "bg-amber-500"
                    : "bg-slate-200/60"
                }`}
                title={`Step ${idx + 1}: ${step.label}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10.5px] text-slate-500 leading-none">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Step {activeStep + 1}/5:</span>
            <span className="font-medium text-slate-700">{JOURNEY_STEPS[activeStep]?.label}</span>
          </div>
          {sessionContext.referenceNumber ? (
            <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
              Ref: #{sessionContext.referenceNumber}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400"> Sadatpur Campus</span>
          )}
        </div>
      </div>

      {/* ── RESUMED APPLICATION NOTIFICATION BANNER ──────── */}
      {hasResumedSession && (
        <div className="bg-amber-50/90 px-4 py-1.5 border-b border-amber-200/60 flex items-center justify-between text-[11px] text-amber-950 animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[14px] text-amber-600">history</span>
            <span className="font-medium truncate">
              {sessionContext.studentName
                ? `Resumed inquiry for ${sessionContext.studentName} (${sessionContext.grade || "Applied"})`
                : sessionContext.grade
                ? `Resumed inquiry for ${sessionContext.grade}`
                : "Resumed previous inquiry"}
            </span>
          </div>
          <button
            onClick={resetChat}
            className="text-[10.5px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 ml-2 cursor-pointer"
            title="Clear and start new admission chat"
          >
            Start New
          </button>
        </div>
      )}

      {/* ── CHAT MESSAGES CONTAINER ──────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-[#FAFBFD] chat-scrollbar">
        {messages.map((m) => {
          const isUser = m.role === "user";

          if (isUser) {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="bg-slate-900 text-slate-50 rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs max-w-[85%] sm:max-w-[78%]">
                  <FormattedMessage content={m.content} isUser={true} />
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <span>{m.timestamp}</span>
                    <span className="text-amber-400 text-[10px]">✓✓</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={m.id} className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[86%]">
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold shadow-2xs">
                🎓
              </div>

              <div className="flex-1 bg-white text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-slate-200/70">
                {/* Minimal Official Reference Card */}
                {m.referenceNumber && (
                  <div className="mb-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-600 text-[17px]">
                          check_circle
                        </span>
                        <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                          Inquiry Confirmed
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-medium">
                        Session 2026-27
                      </span>
                    </div>

                    <div className="my-2 p-2 bg-white rounded-lg border border-emerald-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">
                          Application Reference ID
                        </span>
                        <span className="font-mono text-base font-bold text-slate-900">
                          {m.referenceNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(m.referenceNumber!, m.id, true)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 flex items-center gap-1 transition-colors"
                        title="Copy Reference ID"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {copiedRefId === m.id ? "check" : "content_copy"}
                        </span>
                        <span>{copiedRefId === m.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Your inquiry has been recorded. Our admissions desk will call you within 24 business hours.
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-emerald-200/50 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${SCHOOL_INFO.phone}`}
                        className="flex-1 min-w-[130px] py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title={`Call Sarvada School Admission Office (${SCHOOL_INFO.phoneDisplay})`}
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        Call Admission Desk
                      </a>
                      <a
                        href="/admission-form.pdf"
                        download
                        className="flex-1 min-w-[100px] py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        title="Download Admission Application Form (PDF)"
                      >
                        <span className="material-symbols-outlined text-[15px]">download</span>
                        Form (PDF)
                      </a>
                      <a
                        href="https://maps.google.com/?q=Sarvada+Modern+Secondary+School+Sadatpur+Karawal+Nagar+Delhi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1 transition-colors shadow-2xs"
                        title="Open Campus Directions on Google Maps"
                      >
                        <span className="material-symbols-outlined text-[15px]">location_on</span>
                        Directions
                      </a>
                    </div>
                  </div>
                )}

                <FormattedMessage content={m.content} isUser={false} />

                {/* Unobtrusive Action Footer */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(m.content, m.id)}
                      className="hover:text-slate-700 flex items-center gap-1 transition-colors"
                      title="Copy response"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {copiedMsgId === m.id ? "check" : "content_copy"}
                      </span>
                      <span>{copiedMsgId === m.id ? "Copied" : "Copy"}</span>
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => toggleLike(m.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        likedMsgIds.has(m.id) ? "text-amber-600 font-semibold" : "hover:text-slate-700"
                      }`}
                      title="Helpful response"
                    >
                      <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                      <span>Helpful</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* ── SLEEK MINIMAL QUICK STARTER CHIPS (Only at beginning) ── */}
        {messages.length <= 1 && (
          <div className="pt-1.5 animate-in fade-in duration-300">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-0.5">
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_STARTERS.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(card.query)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-left transition-all shadow-2xs flex items-center gap-1.5 group cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px] text-amber-600">
                    {card.icon}
                  </span>
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-950">
                    {card.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1 py-1">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70 flex items-center justify-center text-xs shrink-0 font-bold">
              🎓
            </div>
            <div className="bg-white px-3.5 py-2 rounded-2xl rounded-tl-xs shadow-2xs border border-slate-200/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── CONTEXTUAL SUGGESTION CHIPS ───────────────────── */}
      {suggestedActions.length > 0 && (
        <div className="bg-white/95 px-3.5 py-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {suggestedActions.map((action, i) => (
            <button
              key={i}
              onClick={() => sendMessage(action)}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200/60 text-slate-700 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300 text-xs font-medium transition-colors shadow-2xs flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span>{action}</span>
              <span className="material-symbols-outlined text-[13px] text-slate-400">
                arrow_forward
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── MINIMAL CAPSULE INPUT BAR ─────────────────────── */}
      <div className="p-3 sm:p-3.5 bg-white border-t border-slate-150/70 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className={`relative flex items-center bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 border rounded-full transition-all px-2 py-1 ${
            isListening ? "border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20" : "border-slate-200/80"
          }`}
        >
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Speak in Hindi or English (Voice Dictation)"}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isListening ? "mic" : "mic_none"}
              </span>
            </button>
          )}

          <input
            type="text"
            placeholder={
              isListening
                ? "Listening... Speak in Hindi or English"
                : "Ask in English or हिंदी (e.g. 3rd class admission)..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-2.5 py-1.5 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-sans"
          />

          {input.trim() && !loading && (
            <button
              type="button"
              onClick={() => setInput("")}
              className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center mr-1"
              title="Clear"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          )}

          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_upward</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-2 pt-1.5">
          <span>CBSE Affiliation: 1104340</span>
          <a
            href={`tel:${SCHOOL_INFO.phone}`}
            className="hover:text-slate-700 transition-colors"
          >
            Helpline: {SCHOOL_INFO.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
