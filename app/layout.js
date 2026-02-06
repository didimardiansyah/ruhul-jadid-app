import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistem Informasi Kos",
  description: "Dashboard kos sederhana untuk jadwal dan iuran.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
