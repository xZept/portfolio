import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Allen James Laxamana | Junior .NET / Full-Stack Developer",
  description:
    "Portfolio of Allen James Laxamana — Computer Science graduate (BPSU, 2026), Junior .NET / Full-Stack Developer specializing in C# (.NET 10), Blazor, FastAPI, PostgreSQL, and enterprise RAG AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-[#38BDF8] selection:text-[#0F172A] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
