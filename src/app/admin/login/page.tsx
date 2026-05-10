"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-margin-mobile md:px-0">
      <div className="w-full max-w-md bg-surface-container-lowest p-10 shadow-2xl border border-surface-variant">
        <div className="text-center mb-12">
          <h1 className="font-display-lg text-primary mb-2">Sarvada Admin</h1>
          <p className="font-body-md text-on-surface-variant uppercase tracking-widest text-xs">Secure Management Portal</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-error-container text-error text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary focus:ring-0 outline-none font-body-md transition-colors"
              placeholder="admin@sarvadaschool.com"
            />
          </div>

          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary focus:ring-0 outline-none font-body-md transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-on-primary font-label-caps tracking-[0.2em] uppercase hover:bg-inverse-surface transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-surface-variant text-center">
          <a href="/" className="font-body-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Public Website
          </a>
        </div>
      </div>
    </div>
  );
}
