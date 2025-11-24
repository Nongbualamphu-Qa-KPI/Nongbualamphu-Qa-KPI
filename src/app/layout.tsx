import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA Hospital System",
  description: "ระบบบันทึกข้อมูล QA โรงพยาบาลหนองบัวลำภู"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
