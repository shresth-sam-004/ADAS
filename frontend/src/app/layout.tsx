import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ADAS Guardian – Cybersecurity Platform for Autonomous Vehicles',
  description: 'A premium cybersecurity operations platform protecting future autonomous and ADAS vehicles from cyber threats, hacking, and remote sensor manipulation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="text-brand-text antialiased overflow-x-hidden font-body relative">
        {/* Background Image Layer (z-[-2]) */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[-2] pointer-events-none" 
          style={{ backgroundImage: "url('/images/bg-car.png')" }} 
        />
        
        {/* Frosted Glass Overlay Layer (z-[-1]) */}
        <div className="fixed inset-0 bg-[#030712]/90 backdrop-blur-xl z-[-1] pointer-events-none" />
        
        {children}
      </body>
    </html>
  );
}
