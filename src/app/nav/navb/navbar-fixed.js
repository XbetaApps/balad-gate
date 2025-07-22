"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "./theme/ThemeProvider";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import { useSession } from "../../contexts/SessionContext";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FaUser } from "react-icons/fa";

// Material-UI Components
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Avatar,
  Tooltip,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  Slide,
  useScrollTrigger,
  CssBaseline
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

// Dynamic Import for SessionVerification
const SessionVerification = dynamic(
  () => import("../components/session/SessionVerification"),
  { ssr: false }
);

// HideOnScroll Component
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Navigation Items
const navItems = {
  home: "الرئيسية",
  departments: "الأقسام",
  news: "الأخبار",
  weather: "الطقس",
  money: "العملات",
  services: "الخدمات",
  about: "من نحن",
  car: "احوال الطرق",
  auth: "تسجيل الدخول"
};

const pageKeys = [
  { key: "home", href: "/" },
  { key: "departments", href: "/departments" },
  { key: "news", href: "/news" },
  { key: "weather", href: "/weather" },
  { key: "money", href: "/money" },
  { key: "services", href: "/services" },
  { key: "about", href: "/about" },
  { key: "car", href: "/car" },
  { key: "auth", href: "/auth" },
];

const linkFont = '"Tajawal", "Amiri", serif';

function ResponsiveAppBar() {
  // Hooks
  const { mode, toggleColorMode, darkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery('(max-width:900px)');
  
  // State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const { user, loading, logout } = useAuth();
  const { isVerified: isSessionVerified } = useSession();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Callbacks
  const handleLoginSuccess = useCallback(() => {
    setShowAuthModal(false);
    if (typeof authAction === 'function') {
      authAction();
    }
  }, [authAction]);
  
  const handleProfileClick = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (user) {
      router.push("/profile");
    } else {
      setAuthAction(() => () => router.push("/profile"));
      setShowAuthModal(true);
    }
  }, [user, router]);
  
  // Effects
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Logout Handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [logout, router]);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  }, []);

  // Navigation Handler
  const handleNavClick = useCallback((e, href, requiresAuth = false) => {
    e.preventDefault();
    setDrawerOpen(false);
    
    if (requiresAuth && (!user || !isSessionVerified)) {
      setShowAuthModal(true);
      setAuthAction(() => () => router.push(href));
    } else {
      router.push(href);
    }
  }, [user, isSessionVerified, router]);

  // Constants
  const bgColor = "#000000";
  const textColor = "#ffd700";
  
  if (!mounted) return null;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <HideOnScroll>
        <AppBar 
          component="nav" 
          position="fixed"
          sx={{
            backgroundColor: bgColor,
            color: textColor,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 1100,
            height: '64px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer(true)}
                sx={{ 
                  mr: 2,
                  display: { md: 'none' },
                }}
              >
                <MenuIcon />
              </IconButton>

              {/* Logo */}
              <Box 
                component={Link} 
                href="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  mr: 2
                }}
              >
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontFamily: linkFont,
                    fontWeight: 700,
                    flexGrow: 1,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  بلدية غيزان
                </Typography>
              </Box>

              {/* Desktop Navigation */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexGrow: 1, justifyContent: 'center' }}>
                {pageKeys.map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      margin: '0 10px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {navItems[key]}
                  </Link>
                ))}
              </Box>

              {/* Right Side Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Theme Toggle */}
                <IconButton 
                  color="inherit" 
                  onClick={toggleColorMode}
                  sx={{ ml: 1 }}
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>

                {/* Profile Button */}
                <IconButton 
                  color="inherit" 
                  onClick={handleProfileClick}
                  sx={{ ml: 1 }}
                >
                  <FaUser />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            {pageKeys.map(({ key, href }) => (
              <ListItem key={key} disablePadding>
                <ListItemButton 
                  component={Link} 
                  href={href}
                  sx={{
                    textAlign: 'right',
                    fontFamily: linkFont,
                  }}
                >
                  <ListItemText primary={navItems[key]} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </SwipeableDrawer>

      {/* Session Verification Modal */}
      {showAuthModal && (
        <SessionVerification 
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </Box>
  );
}

export default ResponsiveAppBar;
