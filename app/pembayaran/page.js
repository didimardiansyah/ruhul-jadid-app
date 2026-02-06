"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TARGET = 65000;

export default function Pembayaran() {
  const [anggota, setAnggota] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);

  const [anggotaId, setAnggotaId] = useState("");
  const [nominal, setNominal] = useState("");

  // Load anggota
  const loadAnggota = async () => {
    const { data } = await supabase
      .from("anggota")
      .select("*")
      .order("nama");

    setAnggota(data || []);
  };

  // Load pembayaran
  const loadPembayaran = async () => {
    const { data } = await supabase
      .from("pembayaran")
      .select(`
        id,
        nominal,
        anggota_id,
        anggota:anggota_id (id, nama)
      `);

    setPembayaran(data || []);
  };

  useEffect(() => {
    loadAnggota();
    loadPembayaran();
    console.log(pembayaran);
  }, []);

  // Tambah pembayaran
  const tambah = async () => {
  if (!anggotaId || !nominal) return;

  const { error } = await supabase
    .from("pembayaran")
    .insert([
      {
        anggota_id: anggotaId,
        nominal: Number(nominal),
      },
    ]);

  if (!error) {
    loadPembayaran();
    setNominal("");
  }
};


  // Hapus
  const hapus = async (id) => {
    await supabase
      .from("pembayaran")
      .delete()
      .eq("id", id);

    loadPembayaran();
  };

  // Hitung total per anggota
  const totalPerOrang = anggota.map((a) => {
  const bayar = pembayaran
    .filter(
      (p) => Number(p.anggota_id) === Number(a.id)
    )
    .reduce((sum, p) => sum + Number(p.nominal), 0);

  return {
    ...a,
    total: bayar,
    persen: Math.min(
      Math.round((bayar / TARGET) * 100),
      100
    ),
  };
});


  return (
    <div className="p-8 max-w-xl mx-auto">

      <h1 className="text-3xl font-bold mb-6 text-center">
        💰 Pembayaran Kos
      </h1>

      {/* FORM */}
      <div className="bg-white p-5 rounded-xl shadow mb-6 space-y-3">

        <select
          value={anggotaId}
          onChange={(e) =>
            setAnggotaId(Number(e.target.value))
          }
          className="border p-3 rounded w-full"
        >
          <option value="">
            Pilih Anggota
          </option>

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
          onChange={(e) =>
            setNominal(e.target.value)
          }
          className="border p-3 rounded w-full"
        />

        <button
          onClick={tambah}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded w-full"
        >
          Tambah Pembayaran
        </button>
      </div>

      {/* LIST TOTAL PER ORANG */}
      <div className="space-y-4">
        {totalPerOrang.map((a) => (
          <div
            key={a.id}
            className="bg-white p-4 rounded-xl shadow"
          >
            <div className="flex justify-between mb-1">
              <h3 className="font-bold">
                {a.nama}
              </h3>

              <span className="text-sm">
                {a.persen >= 100
                  ? "✅ Lunas"
                  : "⏳ Rung Lunas Cok!"}
              </span>
            </div>

            <p className="text-sm mb-2">
              Rp {a.total} / 65000
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                style={{
                  width: `${a.persen}%`,
                }}
                className="bg-green-500 h-3 rounded"
              ></div>
            </div>

            <p className="text-sm mt-1">
              {a.persen}%
            </p>
          </div>
        ))}
      </div>

      {/* RIWAYAT PEMBAYARAN */}
      <h2 className="text-xl font-bold mt-8 mb-3">
        Riwayat
      </h2>

      <div className="space-y-2">
        {pembayaran.map((p) => (
          <div
            key={p.id}
            className="flex justify-between bg-gray-100 p-3 rounded"
          >
            <span>
              {p.anggota?.nama} - Rp {p.nominal}
            </span>

            <button
              onClick={() => hapus(p.id)}
              className="text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
