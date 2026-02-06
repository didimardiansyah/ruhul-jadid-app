import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <h1 className="text-4xl font-bold">
        🏠 Sistem Kos Ruhul Jadid
      </h1>

      <Link
        href="/pembayaran"
        className="bg-white text-black px-6 py-3 rounded-xl shadow"
      >
        💰 Pembayaran
      </Link>

      <Link
        href="/jadwal"
        className="bg-white text-black px-6 py-3 rounded-xl shadow"
      >
        📅 Jadwal Piket
      </Link>
    </div>
  );
}
