import { Tajawal, Amiri } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layout-client";
import Navbar from "./nav/navbar";
import CustomThemeProvider from "./nav/theme/ThemeProvider";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./auth/AuthProvider";
import { Providers } from "./providers";
import { SessionProvider } from "../contexts/SessionContext";
import AIChatWidget from "@/components/AI/ai";
import Footer from "@/components/footer";
// Load Arabic fonts
const tajawal = Tajawal({
  weight: ['400', '500', '700'],
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata = {
  title: "Balad Gate",
  description: "بوابتك لخدمات ومعلومات المدينة",
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
export default function RootLayout({ children }) {
  return (
    <html 
      lang="ar" // Default to Arabic, will be updated client-side
      dir="rtl" // Default to RTL, will be updated client-side
      className={`${tajawal.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen font-sans antialiased bg-gray-50 dark:bg-gray-900">
        <Providers>
          <AuthProvider>
            <SessionProvider>
              <CustomThemeProvider>
                <CssBaseline />
                <LayoutClient>
                  <Navbar />
                  <main className="pt-16">
                    {children}
                  </main>
                </LayoutClient>
                <AIChatWidget />
                <Footer />
              </CustomThemeProvider>
            </SessionProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}