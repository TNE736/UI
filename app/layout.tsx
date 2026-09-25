import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
import { CommandMenu } from '@/components/shell/CommandMenu';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// Editorial serif for headlines and big figures; italic for the accent word.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: 'LeadOps Studio',
  description: 'Live view of the consultant outreach pipeline: uploads, stages, conversion and mix.',
};

export const viewport: Viewport = {
  themeColor: '#f6f7f2',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-dvh">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
            </div>
          </div>
          <CommandMenu />
        </Providers>
      </body>
    </html>
  );
}
