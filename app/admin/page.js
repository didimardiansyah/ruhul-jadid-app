"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TARGET = 65000;

export default function Pembayaran() {
  const [data, setData] = useState([]);
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState("");

  const loadData = async () => {
    const { data } = await supabase
      .from("pembayaran")
      .select("*")
      .order("id");
    setData(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tambah = async () => {
    await supabase.from("pembayaran").insert([
      { nama, nominal },
    ]);
    setNama("");
    setNominal("");
    loadData();
  };

  const hapus = async (id) => {
    await supabase
      .from("pembayaran")
      .delete()
      .eq("id", id);
    loadData();
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        Pembayaran Kos
      </h1>

      <input
        placeholder="Nama"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        className="border p-2 mr-2"
      />

      <input
        type="number"
        placeholder="Nominal"
        value={nominal}
        onChange={(e) => setNominal(e.target.value)}
        className="border p-2 mr-2"
      />

      <button
        onClick={tambah}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Tambah
      </button>

      {data.map((d) => {
        const persen = Math.min(
          Math.round((d.nominal / TARGET) * 100),
          100
        );

        return (
          <div
            key={d.id}
            className="bg-white p-4 shadow mt-4"
          >
            <b>{d.nama}</b>
            <p>Rp {d.nominal}</p>
            <p>{persen}%</p>

            <button
              onClick={() => hapus(d.id)}
              className="text-red-500"
            >
              Hapus
            </button>
          </div>
        );
      })}
    </div>
  );
}
