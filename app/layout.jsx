import './globals.css';
import { LanguageProvider } from '@/components/LanguageProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Pune Civic Platform | Independent Civic Issue Reporting & Redressal',
  description:
    'An independent civic platform for citizens of Pune to report, track, and resolve municipal issues like potholes, garbage, and drainage with transparent public accountability.',
  keywords: [
    'Pune Civic Platform',
    'Pune Municipal Corporation Issues',
    'Report Pothole Pune',
    'Civic Redressal Pune',
    'PMC Grievance Tracker',
    'Pune Civic Map',
  ],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
