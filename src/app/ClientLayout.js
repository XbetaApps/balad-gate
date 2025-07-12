'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "./nav/navbar";
import { CustomThemeProvider } from "./nav/theme/ThemeProvider";
import { CssBaseline, Box, useTheme } from "@mui/material";

// This component is needed to avoid hydration issues
function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box sx={{ visibility: 'hidden' }}>
        <Navbar />
        <Box component="main" sx={{ pt: 8 }}>
          {children}
        </Box>
      </Box>
    );
  }

  return children;
}

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth';

  return (
    <CustomThemeProvider>
      <CssBaseline />
      <ClientOnly>
        {!isAuthPage && <Navbar />}
        <Box 
          component="main" 
          sx={{
            pt: !isAuthPage ? 8 : 0,
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            transition: 'background-color 0.3s, color 0.3s',
          }}
        >
          {children}
        </Box>
      </ClientOnly>
    </CustomThemeProvider>
  );
}
