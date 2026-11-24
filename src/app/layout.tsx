import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'UNICOM TIC LMS',
  description:
    'Independent learning and student lifecycle management platform for UNICOM TIC.',
  icons: {
    icon: '/logo-badge.jpg',
    shortcut: '/logo-badge.jpg',
    apple: '/logo-badge.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
