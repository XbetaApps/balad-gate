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
import OnboardingWrapper from "./components/OnboardingWrapper";

// Load Arabic fonts
const tajawal = Tajawal({
  weight: ["400", "500", "700"],
  subsets: ["arabic"],
  variable: "--font-tajawal",
  display: "swap",
});

const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata = {
  title: "Balad Gate",
  description: "بوابتك لخدمات ومعلومات المدينة",
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Balad Gate',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ar" // Default to Arabic
      dir="rtl" // Default to RTL
      className={`${tajawal.variable} ${amiri.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
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
            {/* المودال الترحيبي يعتمد على useAuth، لذلك يوضع داخل AuthProvider */}
            <OnboardingWrapper />

            {/* بقية مزودي الحالة الخاصين بمشروعك */}
            <SessionProvider>
              <CustomThemeProvider>
                <CssBaseline />
                <LayoutClient>
                  <Navbar />
                  <main className="pt-16">{children}</main>
                </LayoutClient>

                {/* ويدجت الذكاء الاصطناعي */}
                <AIChatWidget />
              </CustomThemeProvider>
            </SessionProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
