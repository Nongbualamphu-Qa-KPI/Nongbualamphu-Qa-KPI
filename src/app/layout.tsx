import type { Metadata } from 'next';
import type React from 'react';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบบันทึกข้อมูล QA',
  description: 'แบบฟอร์มบันทึกข้อมูลคุณภาพโรงพยาบาล',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${prompt.className} bg-slate-100 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
