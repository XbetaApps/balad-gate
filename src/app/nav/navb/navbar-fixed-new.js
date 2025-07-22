"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "./theme/ThemeProvider";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import { useSession } from "../../contexts/SessionContext";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { FaStore, FaShoppingBag, FaUser } from "react-icons/fa";

// Dynamic imports for client-side only components
const SessionVerification = dynamic(
  () => import("../components/session/SessionVerification"),
  { ssr: false }
);

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useMediaQuery, useTheme as useMuiTheme } from "@mui/material";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import CssBaseline from "@mui/material/CssBaseline";

import logo from "./icons/1111.png";

/* Hide AppBar on scroll */
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Navigation items in Arabic
const navItems = {
  home: "الرئيسية",
  departments: "الأقسام",
  news: "الأخبار",
  weather: "الطقس",
  money: "العملات",
  services: "الخدمات",
  about: "عن البوابة"
};

export default function ResponsiveAppBar() {
  // Hooks and state
  const { mode, toggleColorMode, darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const router = useRouter();
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  
  // State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const { user, loading, logout } = useAuth();
  const { isVerified: isSessionVerified } = useSession();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Session verification is handled in SessionVerification component
  
  // Callbacks
  const handleLoginSuccess = useCallback(() => {
    console.log('Login successful, executing action');
    setShowAuthModal(false);
    if (typeof authAction === 'function') {
      authAction();
    } else {
      console.error('authAction is not a function:', authAction);
    }
  }, [authAction]);
  
  const handleProtectedClick = useCallback((action) => (e) => {
    e.preventDefault();
    if (user) {
      action();
    } else {
      setAuthAction(() => action);
      setShowAuthModal(true);
    }
  }, [user]);
  
  // Handle profile click
  const handleProfileClick = useCallback((e) => {
    e.preventDefault();
    console.log('Profile icon clicked');
    
    if (user) {
      console.log('Redirecting to profile');
      router.push('/profile');
    } else {
      console.log('Opening login modal');
      setShowAuthModal(true);
    }
  }, [user, router]);
  
  // Set mounted to true after initial render
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Colors based on theme
  const bgColor = darkMode ? '#1a1a1a' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#000000';
  const hoverColor = "#f0e68c";
  
  if (!mounted) return null;

  // Protected profile avatar component
  const ProfileAvatarProtected = (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      ':hover': {
        color: hoverColor,
      }
    }}>
      <IconButton 
        onClick={handleProfileClick}
        sx={{ 
          color: 'inherit',
          '&:hover': { 
            color: hoverColor,
            transform: 'translateY(-2px)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          },
          transition: 'all 0.2s',
          p: 1
        }}
      >
        <FaUser size={20} />
      </IconButton>
    </div>
  );

  // Render auth modal
  const renderAuthModal = () => {
    if (!showAuthModal) return null;
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowAuthModal(false)}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ color: 'black', marginBottom: '20px' }}>تسجيل الدخول</h3>
          <p style={{ marginBottom: '20px', color: '#666' }}>يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => {
                setShowAuthModal(false);
                router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname));
              }}
              style={{
                padding: '12px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                width: '100%',
                maxWidth: '200px',
              }}
            >
              تسجيل الدخول
            </button>
            
            <button 
              onClick={() => setShowAuthModal(false)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                width: '100%',
                maxWidth: '200px',
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile drawer list
  const drawerList = (
    <Box
      sx={{
        width: 260,
        bgcolor: bgColor,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
      onKeyDown={() => setDrawerOpen(false)}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ color: textColor }}>
          القائمة
        </Typography>
        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: textColor }}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List>
        {Object.entries(navItems).map(([key, text]) => (
          <ListItem key={key} disablePadding>
            <ListItemButton
              component={Link}
              href={`/${key === 'home' ? '' : key}`}
              selected={pathname === `/${key === 'home' ? '' : key}`}
              sx={{
                color: textColor,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ mt: 'auto', p: 2 }}>
        {user ? (
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              logout();
              setDrawerOpen(false);
            }}
          >
            تسجيل خروج
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => {
              setDrawerOpen(false);
              router.push('/auth');
            }}
          >
            تسجيل الدخول
          </Button>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <CssBaseline />
      <SessionVerification />
      
      <HideOnScroll>
        <AppBar 
          position="fixed" 
          sx={{ 
            bgcolor: bgColor,
            color: textColor,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ width: "100%" }}>
              {/* Desktop Logo */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
                <Link href="/" passHref>
                  <Image
                    src={logo}
                    alt="Logo"
                    width={50}
                    height={50}
                    style={{ cursor: 'pointer' }}
                    priority
                  />
                </Link>
              </Box>
              
              {/* Mobile Menu Button */}
              <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  size="large"
                  aria-label="menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={() => setDrawerOpen(true)}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
              
              {/* Mobile Logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'center' }}>
                <Link href="/" passHref>
                  <Image
                    src={logo}
                    alt="Logo"
                    width={40}
                    height={40}
                    style={{ cursor: 'pointer' }}
                    priority
                  />
                </Link>
              </Box>
              
              {/* Desktop Navigation */}
              <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                {Object.entries(navItems).map(([key, text]) => (
                  <Button
                    key={key}
                    component={Link}
                    href={`/${key === 'home' ? '' : key}`}
                    sx={{
                      my: 2,
                      color: textColor,
                      display: 'block',
                      mx: 1,
                      '&:hover': {
                        color: hoverColor,
                        backgroundColor: 'transparent',
                      },
                      borderBottom: pathname === `/${key === 'home' ? '' : key}` ? `2px solid ${hoverColor}` : 'none',
                      borderRadius: 0,
                    }}
                  >
                    {text}
                  </Button>
                ))}
              </Box>
              
              {/* Theme Toggle and Profile */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title={darkMode ? 'الوضع الفاتح' : 'الوضع المظلم'}>
                  <IconButton 
                    onClick={toggleColorMode} 
                    color="inherit"
                    sx={{
                      p: 1,
                      color: textColor,
                      '&:hover': { 
                        color: hoverColor,
                        transform: 'rotate(30deg)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={user ? 'الملف الشخصي' : 'تسجيل الدخول'}>
                  {ProfileAvatarProtected}
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '100vw',
            backgroundColor: bgColor,
            color: textColor,
            '& .MuiDrawer-paper': {
              width: '100%',
              boxSizing: 'border-box',
            },
          },
        }}
      >
        {drawerList}
      </SwipeableDrawer>
      
      {/* Auth Modal */}
      {renderAuthModal()}
      
      {/* Add padding to prevent content from being hidden behind the AppBar */}
      <Toolbar />
    </>
  );
}
