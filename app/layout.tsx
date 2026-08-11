import type {Metadata} from 'next';
import './globals.css'; // Global styles
import AuthProvider from '@/src/components/AuthProvider';
import { ThemeProvider } from '@/src/components/theme-provider';

export const metadata: Metadata = {
  title: 'Lunch Money',
  description: 'Shared Expense Splitter',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
