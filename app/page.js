"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const TARGET = 65000;
const TARGET_PENGHUNI = 10;

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

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

export default function Home() {
  const [anggota, setAnggota] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [anggotaRes, jadwalRes, pembayaranRes] = await Promise.all([
        supabase.from("anggota").select("*").order("nama"),
        supabase.from("jadwal").select("*").order("minggu"),
        supabase
          .from("pembayaran")
          .select("id, nominal, anggota_id, anggota:anggota_id (id, nama)"),
      ]);

      setAnggota(anggotaRes.data || []);
      setJadwal(jadwalRes.data || []);
      setPembayaran(pembayaranRes.data || []);
      setLoading(false);
    };

    load();
  }, []);

  const totalsByMember = useMemo(() => {
    const map = new Map();
    pembayaran.forEach((item) => {
      const key = Number(item.anggota_id);
      const current = map.get(key) || 0;
      map.set(key, current + Number(item.nominal || 0));
    });
    return map;
  }, [pembayaran]);

  const totalPerOrang = useMemo(
    () =>
      anggota.map((a) => {
        const total = totalsByMember.get(Number(a.id)) || 0;
        const persen = Math.min(Math.round((total / TARGET) * 100), 100);
        return {
          ...a,
          total,
          persen,
        };
      }),
    [anggota, totalsByMember]
  );

  const summary = useMemo(() => {
    const totalPenghuni = anggota.length;
    const totalTerkumpul = pembayaran.reduce(
      (sum, item) => sum + Number(item.nominal || 0),
      0
    );
    const totalTarget = totalPenghuni * TARGET;
    const belumLunas = totalPerOrang.filter((item) => item.total < TARGET).length;
    return {
      totalPenghuni,
      totalTerkumpul,
      totalTarget,
      belumLunas,
    };
  }, [anggota, pembayaran, totalPerOrang]);

  const displayMembers = useMemo(() => {
    const filled = [...totalPerOrang];
    const remaining = Math.max(0, TARGET_PENGHUNI - filled.length);
    for (let i = 0; i < remaining; i += 1) {
      filled.push({
        id: `slot-${i}`,
        nama: "Slot kosong",
        total: 0,
        persen: 0,
        kosong: true,
      });
    }
    return filled.slice(0, TARGET_PENGHUNI);
  }, [totalPerOrang]);

  const progressPersen =
    summary.totalTarget > 0
      ? Math.min(
          Math.round((summary.totalTerkumpul / summary.totalTarget) * 100),
          100
        )
      : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between fade-in-up">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Flow Kas Kostan
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold mt-2">
              Kos Ruhul Jadid CUkimaAYYY
            </h1>
            <p className="text-[color:var(--muted)] mt-2 max-w-xl">
              Pantau jadwal piket kamar mandi, kos, dan pembayaran kas sareng-sareng!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pembayaran"
              className="px-5 py-3 rounded-full bg-[color:var(--accent)] text-white shadow-lg shadow-[color:var(--ring)] hover:bg-[color:var(--accent-strong)] transition"
            >
              Kelola Pembayaran
            </Link>
            <Link
              href="/jadwal"
              className="px-5 py-3 rounded-full border border-[color:var(--foreground)]/10 bg-white/80 backdrop-blur hover:bg-white transition"
            >
              Atur Jadwal Piket
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4 mt-10 fade-in-up delay-1">
          {[
            {
              label: "Total penghuni",
              value: loading ? "Memuat" : `${summary.totalPenghuni} orang`,
            },
            {
              label: "Iuran terkumpul",
              value: loading ? "Memuat" : formatRupiah(summary.totalTerkumpul),
            },
            {
              label: "Target bulan Februari",
              value: loading ? "Memuat" : formatRupiah(summary.totalTarget),
            },
            {
              label: "Belum lunas",
              value: loading ? "Memuat" : `${summary.belumLunas} orang`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl bg-[color:var(--surface)] border border-black/5 p-5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {item.label}
              </p>
              <h2 className="text-2xl font-semibold mt-3">{item.value}</h2>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mt-10">
          <div className="rounded-[32px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)] fade-in-up delay-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Alur Iuran Kos</h3>
              <span className="text-sm text-[color:var(--muted)]">
                Target {TARGET_PENGHUNI} orang
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                <span>Terkumpul</span>
                <span>{progressPersen}%</span>
              </div>
              <div className="h-3 bg-[color:var(--surface-strong)] rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[color:var(--accent)] transition-all"
                  style={{ width: `${progressPersen}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="font-medium">
                  {formatRupiah(summary.totalTerkumpul)}
                </span>
                <span className="text-[color:var(--muted)]">
                  Sisa {formatRupiah(Math.max(summary.totalTarget - summary.totalTerkumpul, 0))}
                </span>
              </div>
            </div>

            <div className="grid gap-3 mt-6">
              {displayMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 rounded-2xl bg-white/80 border border-black/5 px-4 py-3"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      member.kosong
                        ? "bg-[color:var(--surface-strong)] text-[color:var(--muted)]"
                        : "bg-[color:var(--accent)] text-white"
                    }`}
                  >
                    {member.kosong ? "-" : member.nama?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {member.nama}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[color:var(--muted)] mt-1">
                      <span>{formatRupiah(member.total)}</span>
                      <span>
                        {member.kosong
                          ? "Belum terisi"
                          : member.total >= TARGET
                          ? "Lunas"
                          : "Belum lunas"}
                      </span>
                    </div>
                  </div>
                  <div className="w-20">
                    <div className="h-2 rounded-full bg-[color:var(--surface-strong)] overflow-hidden">
                      <div
                        className={`h-full ${
                          member.kosong
                            ? "bg-[color:var(--surface-strong)]"
                            : "bg-[color:var(--accent)]"
                        }`}
                        style={{ width: `${member.persen}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[color:var(--muted)] mt-1 text-right">
                      {member.persen}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 fade-in-up delay-3">
            <div className="rounded-[28px] bg-white/80 border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)]">
              <h3 className="text-xl font-semibold">Jadwal Piket</h3>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Rotasi tugas kebersihan agar kos selalu rapi.
              </p>
              <div className="grid gap-3 mt-4">
                {(jadwal.length ? jadwal.slice(0, 4) : []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/5 bg-[color:var(--surface)] px-4 py-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                          Minggu ke-{item.minggu}
                        </p>
                        {item.tanggal && (
                          <p className="text-xs text-[color:var(--muted)] mt-1">
                            {formatTanggal(item.tanggal)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[item.petugas1, item.petugas2, item.petugas3]
                        .filter(Boolean)
                        .map((petugasNama, idx) => (
                          <span
                            key={`${item.id}-petugas-${idx}`}
                            className="px-3 py-1 rounded-full text-xs bg-white/80 border border-black/5"
                          >
                            {petugasNama}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
                {!jadwal.length && (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                    Belum ada jadwal. Tambahkan jadwal pertama kamu.
                  </div>
                )}
              </div>
              <Link
                href="/jadwal"
                className="inline-flex mt-5 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                Kelola jadwal piket
              </Link>
            </div>

            <div className="rounded-[28px] bg-[color:var(--surface)] border border-black/5 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.6)]">
              <h3 className="text-xl font-semibold">Riwayat Pembayaran</h3>
              <p className="text-sm text-[color:var(--muted)] mt-2">
                Lihat transaksi terakhir untuk memastikan kas tetap aman.
              </p>
              <div className="mt-4 grid gap-3">
                {(pembayaran.length ? pembayaran.slice(0, 5) : []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/90 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold">{item.anggota?.nama}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        Iuran masuk
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatRupiah(item.nominal)}
                    </span>
                  </div>
                ))}
                {!pembayaran.length && (
                  <div className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-sm text-[color:var(--muted)]">
                    Belum ada pembayaran. Mulai dari menu pembayaran.
                  </div>
                )}
              </div>
              <Link
                href="/pembayaran"
                className="inline-flex mt-5 text-sm font-semibold text-[color:var(--accent-strong)]"
              >
                Lihat semua pembayaran
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
