"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const formatTanggal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export default function Jadwal() {
  const [data, setData] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [minggu, setMinggu] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jumlahPetugas, setJumlahPetugas] = useState(2);
  const [petugas, setPetugas] = useState(["", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    const { data } = await supabase.from("jadwal").select("*").order("minggu");
    setData(data || []);
  };

  const loadAnggota = async () => {
    const { data } = await supabase.from("anggota").select("*").order("nama");
    setAnggota(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadData(), loadAnggota()]);
      setLoading(false);
    };
    load();
  }, []);

  const tampilPetugas = useMemo(() => {
    return Array.from({ length: jumlahPetugas }, (_, idx) => petugas[idx] || "");
  }, [jumlahPetugas, petugas]);

  const ubahJumlahPetugas = (value) => {
    setJumlahPetugas(value);
    setPetugas((prev) => {
      const next = [...prev];
      next.length = value;
      for (let i = 0; i < value; i += 1) {
        if (typeof next[i] !== "string") next[i] = "";
      }
      return next;
    });
  };

  const pilihPetugas = (index, nama) => {
    setPetugas((prev) => {
      const next = [...prev];
      next[index] = nama;
      return next;
    });
  };

  const tambah = async () => {
    setErrorMsg("");
    if (!minggu) {
      setErrorMsg("Minggu wajib diisi.");
      return;
    }
    if (!tanggal) {
      setErrorMsg("Tanggal pelaksanaan wajib diisi.");
      return;
    }
    const petugasAktif = tampilPetugas.filter((p) => p);
    if (petugasAktif.length !== jumlahPetugas) {
      setErrorMsg("Semua petugas harus dipilih.");
      return;
    }

    setSaving(true);
    const payload = {
      minggu,
      tanggal,
      petugas1: tampilPetugas[0] || null,
      petugas2: tampilPetugas[1] || null,
      petugas3: tampilPetugas[2] || null,
    };

    const { error } = await supabase.from("jadwal").insert([payload]);

    if (error) {
      setErrorMsg(error.message || "Gagal menyimpan jadwal.");
      setSaving(false);
      return;
    }

    setMinggu("");
    setTanggal("");
    setJumlahPetugas(2);
    setPetugas(["", ""]);
    await loadData();
    setSaving(false);
  };

  const hapus = async (id) => {
    await supabase.from("jadwal").delete().eq("id", id);
    loadData();
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between fade-in-up">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Jadwal Piket
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-2">
              Rotasi Tugas Mingguan
            </h1>
            <p className="text-[color:var(--muted)] mt-2">
              Pilih anggota piket dan tanggal pelaksanaannya.
            </p>
          </div>
          <div className="rounded-2xl bg-[color:var(--surface)] border border-black/5 px-5 py-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
            <p className="text-sm text-[color:var(--muted)]">Total jadwal</p>
            <p className="text-2xl font-semibold mt-1">
              {loading ? "Memuat" : `${data.length} minggu`}
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-10">
          <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-1">
            <h2 className="text-xl font-semibold">Tambah Jadwal</h2>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Buat jadwal baru untuk minggu berikutnya.
            </p>

            <div className="mt-5 space-y-4">
              <input
                type="number"
                placeholder="Minggu ke-"
                value={minggu}
                onChange={(e) => setMinggu(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
              />

              <div>
                <p className="text-sm font-semibold mb-2">Tanggal pelaksanaan</p>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Jumlah petugas</p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => ubahJumlahPetugas(value)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                        jumlahPetugas === value
                          ? "bg-[color:var(--accent)] text-white border-transparent"
                          : "bg-white/80 border-black/10"
                      }`}
                    >
                      {value} orang
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {tampilPetugas.map((selected, index) => (
                  <div key={`petugas-${index}`}>
                    <p className="text-sm font-semibold mb-2">
                      Petugas {index + 1}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {anggota.map((a) => (
                        <button
                          key={`${index}-${a.id}`}
                          type="button"
                          onClick={() => pilihPetugas(index, a.nama)}
                          className={`px-4 py-2 rounded-full text-sm border transition ${
                            selected === a.nama
                              ? "bg-[color:var(--accent)] text-white border-transparent"
                              : "bg-white/80 border-black/10"
                          }`}
                        >
                          {a.nama}
                        </button>
                      ))}
                      {!anggota.length && (
                        <span className="text-sm text-[color:var(--muted)]">
                          Belum ada data anggota.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={tambah}
                disabled={saving}
                className="w-full rounded-2xl bg-[color:var(--accent)] text-white py-3 font-semibold hover:bg-[color:var(--accent-strong)] transition"
              >
                {saving ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            </div>
          </div>

          <div className="rounded-[28px] bg-white/80 border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-2">
            <h2 className="text-xl font-semibold">Daftar Jadwal</h2>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              Jadwal tersimpan akan tampil di sini.
            </p>

            <div className="mt-5 grid gap-3">
              {data.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-black/5 bg-[color:var(--surface)] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Minggu ke-{j.minggu}</p>
                      {j.tanggal && (
                        <p className="text-xs text-[color:var(--muted)]">
                          {formatTanggal(j.tanggal)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => hapus(j.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[j.petugas1, j.petugas2, j.petugas3]
                      .filter(Boolean)
                      .map((petugasNama, idx) => (
                        <span
                          key={`${j.id}-petugas-${idx}`}
                          className="px-3 py-1 rounded-full text-xs bg-white/80 border border-black/5"
                        >
                          {petugasNama}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
              {!data.length && (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                  Belum ada jadwal. Tambahkan jadwal pertama.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
