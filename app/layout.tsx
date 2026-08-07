import type {Metadata} from 'next';
import './globals.css'; // Global styles
import AuthProvider from '@/src/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Lunch Money',
  description: 'Shared Expense Splitter',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
