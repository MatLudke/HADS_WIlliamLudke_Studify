import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Lexend } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { AppStateProvider } from '@/contexts/AppStateContext';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '700', '800']
});

export const metadata: Metadata = {
  title: 'Studify',
  description: 'Sua jornada para estudos mais produtivos começa aqui.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", inter.variable, lexend.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppStateProvider>
            {children}
            <Toaster />
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
