"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const TARGET = 65000;

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Pembayaran() {
  const [anggota, setAnggota] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [pengeluaran, setPengeluaran] = useState([]);
  const [anggotaId, setAnggotaId] = useState("");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [nominalKeluar, setNominalKeluar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKeluar, setSavingKeluar] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const loadAnggota = async () => {
    const { data } = await supabase.from("anggota").select("*").order("nama");
    setAnggota(data || []);
  };

  const loadPembayaran = async () => {
    const { data } = await supabase
      .from("pembayaran")
      .select(
        "id, nominal, anggota_id, anggota:anggota_id (id, nama)"
      )
      .order("id", { ascending: false });

    setPembayaran(data || []);
  };

  const loadPengeluaran = async () => {
    const { data } = await supabase
      .from("pengeluaran")
      .select("id, nominal, keterangan, created_at")
      .order("id", { ascending: false });
    setPengeluaran(data || []);
  };

  const ensureProfile = async (userId) => {
    await supabase.from("profiles").upsert({ id: userId });
  };

  const checkAdmin = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    if (error) return false;
    return Boolean(data?.is_admin);
  };

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      if (data.session?.user?.id) {
        await ensureProfile(data.session.user.id);
        const adminValue = await checkAdmin(data.session.user.id);
        if (!active) return;
        setIsAdmin(adminValue);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user?.id) {
          await ensureProfile(nextSession.user.id);
          const adminValue = await checkAdmin(nextSession.user.id);
          setIsAdmin(adminValue);
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadAnggota(), loadPembayaran(), loadPengeluaran()]);
      setLoading(false);
    };
    load();
  }, []);

  const tambah = async () => {
    setErrorMsg("");
    if (!isAdmin) {
      setErrorMsg("Hanya admin yang bisa menambah pembayaran.");
      return;
    }

    const nominalValue = Number(nominal);
    if (!anggotaId) {
      setErrorMsg("Pilih anggota terlebih dahulu.");
      return;
    }
    if (!nominalValue || nominalValue <= 0) {
      setErrorMsg("Nominal harus lebih dari 0.");
      return;
    }

    const selectedAnggota = anggota.find(
      (item) => Number(item.id) === Number(anggotaId)
    );
    if (!selectedAnggota?.nama) {
      setErrorMsg("Nama anggota tidak ditemukan.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("pembayaran").insert([
      {
        anggota_id: Number(anggotaId),
        nama: selectedAnggota.nama,
        nominal: nominalValue,
      },
    ]);

    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("row-level security")
      ) {
        setErrorMsg(
          "Akses ditolak. Login sebagai admin di /admin untuk menambah pembayaran."
        );
      } else {
        setErrorMsg(error.message || "Gagal menyimpan pembayaran.");
      }
      setSaving(false);
      return;
    }

    await loadPembayaran();
    setNominal("");
    setSaving(false);
  };

  const tambahPengeluaran = async () => {
    setErrorMsg("");
    if (!isAdmin) {
      setErrorMsg("Hanya admin yang bisa menambah pengeluaran.");
      return;
    }

    const nominalValue = Number(nominalKeluar);
    if (!keterangan.trim()) {
      setErrorMsg("Keterangan pengeluaran wajib diisi.");
      return;
    }
    if (!nominalValue || nominalValue <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih dari 0.");
      return;
    }

    setSavingKeluar(true);
    const { error } = await supabase.from("pengeluaran").insert([
      {
        keterangan: keterangan.trim(),
        nominal: nominalValue,
      },
    ]);

    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("row-level security")
      ) {
        setErrorMsg(
          "Akses ditolak. Login sebagai admin di /admin untuk menambah pengeluaran."
        );
      } else {
        setErrorMsg(error.message || "Gagal menyimpan pengeluaran.");
      }
      setSavingKeluar(false);
      return;
    }

    await loadPengeluaran();
    setKeterangan("");
    setNominalKeluar("");
    setSavingKeluar(false);
  };

  const hapusPengeluaran = async (id) => {
    if (!isAdmin) {
      setErrorMsg("Hanya admin yang bisa menghapus pengeluaran.");
      return;
    }
    const { error } = await supabase.from("pengeluaran").delete().eq("id", id);
    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("row-level security")
      ) {
        setErrorMsg(
          "Akses ditolak. Login sebagai admin di /admin untuk menghapus pengeluaran."
        );
      } else {
        setErrorMsg(error.message || "Gagal menghapus pengeluaran.");
      }
      return;
    }
    loadPengeluaran();
  };

  const hapus = async (id) => {
    if (!isAdmin) {
      setErrorMsg("Hanya admin yang bisa menghapus pembayaran.");
      return;
    }
    const { error } = await supabase.from("pembayaran").delete().eq("id", id);
    if (error) {
      if (
        error.message
          ?.toLowerCase()
          .includes("row-level security")
      ) {
        setErrorMsg(
          "Akses ditolak. Login sebagai admin di /admin untuk menghapus pembayaran."
        );
      } else {
        setErrorMsg(error.message || "Gagal menghapus pembayaran.");
      }
      return;
    }
    loadPembayaran();
  };

  const keluar = async () => {
    if (!session) return;
    setErrorMsg("");
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMsg(error.message || "Gagal logout.");
      setSigningOut(false);
      return;
    }
    setSigningOut(false);
  };

  const totalPerOrang = useMemo(
    () =>
      anggota.map((a) => {
        const bayar = pembayaran
          .filter((p) => Number(p.anggota_id) === Number(a.id))
          .reduce((sum, p) => sum + Number(p.nominal), 0);

        return {
          ...a,
          total: bayar,
          persen: Math.min(Math.round((bayar / TARGET) * 100), 100),
        };
      }),
    [anggota, pembayaran]
  );

  const totalTerkumpul = pembayaran.reduce(
    (sum, p) => sum + Number(p.nominal || 0),
    0
  );

  const totalKeluar = pengeluaran.reduce(
    (sum, p) => sum + Number(p.nominal || 0),
    0
  );

  const saldoAkhir = totalTerkumpul - totalKeluar;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between fade-in-up">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Pembayaran Kos
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">
              Catat Iuran Penghuni
            </h1>
            <p className="text-[color:var(--muted)] mt-2">
              Target iuran per orang: {formatRupiah(TARGET)}.
            </p>
            <div className="mt-3">
              {authLoading ? (
                <span className="text-xs text-[color:var(--muted)]">
                  Mengecek akses...
                </span>
              ) : isAdmin ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1">
                    Admin aktif
                  </span>
                  {session && (
                    <button
                      onClick={keluar}
                      disabled={signingOut}
                      className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)] hover:bg-white transition disabled:opacity-60"
                    >
                      {signingOut ? "Keluar..." : "Keluar"}
                    </button>
                  )}
                </div>
              ) : session ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1">
                    Akses pengguna
                  </span>
                  <button
                    onClick={keluar}
                    disabled={signingOut}
                    className="inline-flex items-center rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)] hover:bg-white transition disabled:opacity-60"
                  >
                    {signingOut ? "Keluar..." : "Keluar"}
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1">
                  Hanya Admin yang Bisa Mengubah Data
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="rounded-2xl bg-[color:var(--surface)] border border-black/5 px-5 py-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
              <p className="text-sm text-[color:var(--muted)]">
                Total terkumpul
              </p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? "Memuat" : formatRupiah(totalTerkumpul)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 border border-black/5 px-5 py-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
              <p className="text-sm text-[color:var(--muted)]">Saldo akhir</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? "Memuat" : formatRupiah(saldoAkhir)}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-10">
          {isAdmin ? (
            <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-1">
              <h2 className="text-xl font-semibold">Tambah Pembayaran</h2>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Simpan transaksi baru agar status iuran selalu terbaru.
              </p>

              <div className="mt-5 space-y-4">
                <select
                  value={anggotaId}
                  onChange={(e) => setAnggotaId(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                >
                  <option value="">Pilih Anggota</option>
                  {anggota.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nama}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Nominal"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                />

                <button
                  onClick={tambah}
                  disabled={saving}
                  className="w-full rounded-2xl bg-[color:var(--accent)] text-white py-3 font-semibold hover:bg-[color:var(--accent-strong)] transition"
                >
                  {saving ? "Menyimpan..." : "Simpan Pembayaran"}
                </button>
                {errorMsg && (
                  <p className="text-sm text-red-600">{errorMsg}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-1">
              <h2 className="text-xl font-semibold">Akses Terkunci</h2>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Hanya admin yang bisa menambah atau menghapus pembayaran.
              </p>
              <Link
                href="/admin"
                className="inline-flex mt-5 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                Login sebagai admin
              </Link>
            </div>
          )}

          <div className="rounded-[28px] bg-white/80 border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-2">
            <h2 className="text-xl font-semibold">Status Iuran</h2>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Pantau siapa yang sudah lunas dan yang masih perlu diingatkan.
            </p>

            <div className="mt-5 grid gap-3">
              {totalPerOrang.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-black/5 bg-[color:var(--surface)] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{a.nama}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        a.persen >= 100
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {a.persen >= 100 ? "Lunas" : "Belum lunas"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-[color:var(--muted)]">
                    <span>{formatRupiah(a.total)}</span>
                    <span>{a.persen}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--accent)]"
                      style={{ width: `${a.persen}%` }}
                    />
                  </div>
                </div>
              ))}
              {!totalPerOrang.length && (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                  Belum ada anggota. Tambahkan data penghuni terlebih dahulu.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {isAdmin ? (
            <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-1">
              <h2 className="text-xl font-semibold">Tambah Pengeluaran</h2>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Catat pengeluaran kas kos agar saldo tetap terpantau.
              </p>

              <div className="mt-5 space-y-4">
                <input
                  type="text"
                  placeholder="Keterangan"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                />

                <input
                  type="number"
                  placeholder="Nominal"
                  value={nominalKeluar}
                  onChange={(e) => setNominalKeluar(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                />

                <button
                  onClick={tambahPengeluaran}
                  disabled={savingKeluar}
                  className="w-full rounded-2xl bg-[color:var(--accent)] text-white py-3 font-semibold hover:bg-[color:var(--accent-strong)] transition"
                >
                  {savingKeluar ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-1">
              <h2 className="text-xl font-semibold">Pengeluaran Terkunci</h2>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Hanya admin yang bisa menambah atau menghapus pengeluaran.
              </p>
              <Link
                href="/admin"
                className="inline-flex mt-5 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                Login sebagai admin
              </Link>
            </div>
          )}

          <div className="rounded-[28px] bg-white/80 border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Riwayat Pengeluaran</h2>
                <p className="text-sm text-[color:var(--muted)] mt-2">
                  Total pengeluaran:{" "}
                  {loading ? "Memuat" : formatRupiah(totalKeluar)}
                </p>
              </div>
              <span className="text-sm text-[color:var(--muted)]">
                {pengeluaran.length} transaksi
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {pengeluaran.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-[color:var(--surface)] px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{p.keterangan}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      Pengeluaran kas
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {formatRupiah(p.nominal)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => hapusPengeluaran(p.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!pengeluaran.length && (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                  Belum ada pengeluaran. Tambahkan transaksi pertama.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Riwayat Pembayaran</h2>
            <span className="text-sm text-[color:var(--muted)]">
              {pembayaran.length} transaksi
            </span>
          </div>

          {errorMsg && !isAdmin && (
            <p className="text-sm text-amber-700 mt-4">
              {errorMsg}
            </p>
          )}

          <div className="mt-5 grid gap-3">
            {pembayaran.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{p.anggota?.nama}</p>
                  <p className="text-xs text-[color:var(--muted)]">Iuran masuk</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{formatRupiah(p.nominal)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => hapus(p.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!pembayaran.length && (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                Belum ada pembayaran. Tambahkan transaksi pertama.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
