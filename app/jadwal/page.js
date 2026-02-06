"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Jadwal() {
  const [data, setData] = useState([]);
  const [minggu, setMinggu] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const loadData = async () => {
    const { data } = await supabase
      .from("jadwal")
      .select("*")
      .order("minggu");

    setData(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tambah = async () => {
    if (!minggu || !p1) return;

    await supabase.from("jadwal").insert([
      {
        minggu,
        petugas1: p1,
        petugas2: p2,
      },
    ]);

    setMinggu("");
    setP1("");
    setP2("");
    loadData();
  };

  const hapus = async (id) => {
    await supabase
      .from("jadwal")
      .delete()
      .eq("id", id);
    loadData();
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        📅 Jadwal Piket Mingguan
      </h1>

      {/* FORM */}
      <div className="bg-white p-4 shadow rounded-xl mb-6">
        <input
          type="number"
          placeholder="Minggu ke-"
          value={minggu}
          onChange={(e) => setMinggu(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          placeholder="Petugas 1"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          placeholder="Petugas 2 (opsional)"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <button
          onClick={tambah}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Tambah Jadwal
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {data.map((j) => (
          <div
            key={j.id}
            className="bg-white p-4 shadow rounded-xl"
          >
            <div className="flex justify-between">
              <h2 className="font-bold">
                Minggu ke-{j.minggu}
              </h2>

              <button
                onClick={() => hapus(j.id)}
                className="text-red-500"
              >
                Hapus
              </button>
            </div>

            <p>👤 {j.petugas1}</p>
            {j.petugas2 && <p>👤 {j.petugas2}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
