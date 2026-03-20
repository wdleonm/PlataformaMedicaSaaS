import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'VitalNexus | Médico & Dental SaaS',
  description: 'La evolución digital de tu práctica médica con gestión de alta precisión y control financiero.',
  icons: {
    icon: '/img/logo/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${outfit.variable} font-sans antialiased bg-background text-foreground min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white`}>
        {/* Fondo Decorativo Sutil Premium */}
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <AdminAuthProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
