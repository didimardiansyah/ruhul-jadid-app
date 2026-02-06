"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "adminruhul@kos.com";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const ensureProfile = async (userId) => {
    await supabase.from("profiles").upsert({ id: userId });
  };

  const checkAdmin = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) {
      setIsAdmin(false);
      return false;
    }

    const adminValue = Boolean(data?.is_admin);
    setIsAdmin(adminValue);
    return adminValue;
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      if (data.session?.user?.id) {
        await ensureProfile(data.session.user.id);
        await checkAdmin(data.session.user.id);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user?.id) {
          await ensureProfile(nextSession.user.id);
          await checkAdmin(nextSession.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setAuthError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message || "Gagal masuk.");
      setLoggingIn(false);
      return;
    }

    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <header className="fade-in-up">
          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Admin Area
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-2">
            Akses Admin Pembayaran
          </h1>
          <p className="text-[color:var(--muted)] mt-2">
            Login dengan email admin untuk membuka akses tambah dan hapus pembayaran.
          </p>
        </header>

        {authLoading ? (
          <div className="mt-8 rounded-2xl bg-[color:var(--surface)] border border-black/5 p-6">
            Memuat sesi...
          </div>
        ) : !session ? (
          <div className="mt-8 rounded-2xl bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold">Login Admin</h2>
            <div className="mt-4 space-y-3">
              <input
                type="email"
                placeholder="Email admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                className="w-full rounded-2xl bg-[color:var(--accent)] text-white py-3 font-semibold hover:bg-[color:var(--accent-strong)] transition"
              >
                {loggingIn ? "Masuk..." : "Masuk sebagai Admin"}
              </button>
              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}
            </div>
            <p className="text-xs text-[color:var(--muted)] mt-4">
              Hanya email {ADMIN_EMAIL} yang diberikan role admin di Supabase.
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  Status akun
                </p>
                <p className="text-lg font-semibold mt-1">
                  {session.user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full border border-black/10 bg-white/80 text-sm font-semibold hover:bg-white transition"
              >
                Keluar
              </button>
            </div>

            {isAdmin ? (
              <>
                <p className="text-sm text-emerald-700 mt-4">
                  Akses admin aktif. Kamu bisa mengelola pembayaran.
                </p>
                <Link
                  href="/pembayaran"
                  className="inline-flex mt-4 px-5 py-3 rounded-full bg-[color:var(--accent)] text-white font-semibold hover:bg-[color:var(--accent-strong)] transition"
                >
                  Buka Kelola Pembayaran
                </Link>
              </>
            ) : (
              <p className="text-sm text-amber-700 mt-4">
                Akun ini belum memiliki akses admin di Supabase.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
