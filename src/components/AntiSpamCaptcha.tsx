"use client";

import { useState, useEffect } from "react";

interface AntiSpamCaptchaProps {
  onVerify: (isValid: boolean) => void;
  className?: string;
}

export default function AntiSpamCaptcha({ onVerify, className = "" }: AntiSpamCaptchaProps) {
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(5);
  const [userAnswer, setUserAnswer] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);

  const generateChallenge = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    setNum1(n1);
    setNum2(n2);
    setUserAnswer("");
    setHasInteracted(false);
    onVerify(false);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setUserAnswer(val);
    setHasInteracted(true);
    const parsed = parseInt(val, 10);
    const correct = parsed === num1 + num2;
    onVerify(correct);
  };

  const isCorrect = parseInt(userAnswer, 10) === num1 + num2;

  return (
    <div className={`p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-xl ${className}`}>
      {/* Invisible Honeypot to catch dumb spam bots */}
      <input
        type="text"
        name="school_security_honeypot"
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: "none" }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Human Verification
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mt-0.5">
              <span>What is</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-sm text-slate-900 shadow-2xs">
                {num1} + {num2}
              </span>
              <span>?</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={userAnswer}
            onChange={handleChange}
            placeholder="Answer"
            className={`w-24 px-3 py-1.5 text-sm bg-white border rounded-lg outline-none font-bold text-center transition-all ${
              hasInteracted && isCorrect
                ? "border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/10"
                : hasInteracted && !isCorrect
                ? "border-rose-400 text-rose-800"
                : "border-slate-300 focus:border-primary text-slate-900"
            }`}
          />
          <button
            type="button"
            onClick={generateChallenge}
            title="Get another question"
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      {hasInteracted && !isCorrect && (
        <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[13px]">info</span>
          Please enter the correct sum to submit your enquiry.
        </p>
      )}
    </div>
  );
}
