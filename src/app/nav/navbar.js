"use client";

import React, { useState, useEffect, useContext } from "react";
import { useTheme } from "./theme/ThemeProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from '../auth/AuthProvider';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { keyframes } from '@emotion/react';
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import List from "@mui/material/List";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import CssBaseline from "@mui/material/CssBaseline";

import Image from "next/image";
const logo = "/Logo.png";  // This is the correct path to the logo in the public folder

/* الوضع الليلي */
const ThemeSwitch = styled(Switch)(({ theme }) => ({
  width: 68,
  height: 38,
  padding: 8,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(7px)",
    "&.Mui-checked": {
      transform: "translateX(27px)",
      "& .MuiSwitch-thumb:before": { content: "'🌙'" },
      "& + .MuiSwitch-track": { backgroundColor: "#c0c0c0" },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.mode === "dark" ? "#002d75" : "#ffd700",
    width: 32,
    height: 32,
    borderRadius: 16,
    "&:before": {
      content: "'☀️'",
      position: "absolute",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
    },
  },
  "& .MuiSwitch-track": { borderRadius: 20, backgroundColor: "#c0c0c0" },
}));

/* تبديل اللغة */

/* Navigation items in Arabic */
const navItems = {
  home: "الرئيسية",
  news: "الأخبار",
  weather: "الطقس",
  car: "حالة الطرق",
  money: "العملات",
  services: "الخدمات",
  auth: "تسجيل الدخول",
  contact: "من نحن",
};

const pageKeys = [
  { key: "home", href: "/", title: "الرئيسية" },
  { key: "news", href: "/news", title: "الأخبار" },
  { key: "weather", href: "/weather", title: "الطقس" },
  { key: "car", href: "/car", title: "حالة الطرق" },
  { key: "money", href: "/money", title: "العملات" },
  { key: "services", href: "/services", title: "الخدمات" },
  { key: "auth", href: "/auth", title: "تسجيل الدخول" },
  { key: "contact", href: "/contact", title: "من نحن" },
];

// Font for links
const linkFont = '"Tajawal", "Amiri", serif';

export default function ResponsiveAppBar() {
  const { mode, toggleColorMode, darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const pathname = usePathname();
  const profileSrc = "/logo.png";
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { isAuthenticated, checkAuth } = useAuth();
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleProfileClick = async (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      try {
        // Check session first
        const sessionRes = await fetch('/api/test-session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const sessionData = await sessionRes.json();
        
        if (sessionData?.authenticated) {
          // If session is valid but state wasn't updated, refresh auth
          await checkAuth(true);
          router.push('/profile');
        } else {
          // If no valid session, show login dialog
          setLoginDialogOpen(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoginDialogOpen(true);
      }
    }
  };

  const handleLogin = () => {
    setLoginDialogOpen(false);
    window.location.href = '/auth';
  };

  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  useEffect(() => {
    setMounted(true);
    // Set Arabic as default
    
  }, []);

  const handleDarkModeChange = () => {
    toggleColorMode();
  };

  // Language is fixed to Arabic

  const handleDrawerToggle = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Handle navigation link clicks
  const handleNavClick = (e, href) => {
    e.preventDefault();
    setDrawerOpen(false);
    
    // For home, navigate to root
    if (href === '/') {
      window.location.href = '/';
      return;
    }
    
    // For other pages, navigate to the href
    window.location.href = href;
  };

  if (!mounted) return null;

  // Custom colors for light/dark modes
  const bgColor = darkMode ? '#000000' : '#FFFFFF';
  const textColor = darkMode ? '#FFD700' : '#000000';
  const borderColor = darkMode ? '#FFD700' : '#000000';
  const hoverColor = darkMode ? '#FFD700' : '#000000';

  const drawerList = (
    <Box
      sx={{
        width: 300,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: darkMode ? '#000000' : '#FFFFFF',
        color: darkMode ? '#FFFFFF' : '#000000',
        '& .MuiListItemButton-root': {
          color: darkMode ? '#FFFFFF' : '#000000',
          '&:hover': {
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: darkMode ? '#FFD700' : '#000000',
          },
        },
        '& .MuiSvgIcon-root': {
          color: darkMode ? '#FFFFFF' : '#000000',
        },
        '& .MuiListItemText-primary': {
          color: darkMode ? '#FFFFFF' : '#000000',
        },
        '& .MuiListItemText-primary': {
          color: 'inherit',
          fontFamily: linkFont,
          fontSize: '1.1rem',
          fontWeight: 600,
        },
      }}
      role="presentation"
    >
      <Box sx={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        p: 2,
        borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <IconButton 
          onClick={() => setDrawerOpen(false)} 
          sx={{ 
            color: darkMode ? '#FFFFFF' : '#000000',
            '&:hover': {
              backgroundColor: 'transparent',
              color: darkMode ? '#FFD700' : '#000000',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ 
        flexGrow: 1,
        py: 2,
        '& .MuiListItemButton-root': {
          py: 2,
          px: 3,
          margin: '4px 10px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateX(5px)',
          },
          '&.Mui-selected': {
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: darkMode ? '#FFD700' : '#000000',
            borderRight: `3px solid ${darkMode ? '#FFD700' : '#000000'}`,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            },
          },
        },
      }}>
        {pageKeys.map((p) => (
          <ListItemButton
            key={p.href}
            component={Link}
            href={p.href}
            selected={pathname === p.href}
            onClick={() => setDrawerOpen(false)}
            sx={{
              color: darkMode ? '#FFFFFF' : '#000000',
              '&:hover': {
                color: darkMode ? '#FFD700' : '#000000',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
              '& .MuiListItemText-root': {
                color: 'inherit',
              },
              '& .MuiTypography-root': {
                color: 'inherit',
              },
            }}
          >
            <ListItemText
              primary={navItems[p.key]}
              sx={{
                textAlign: 'center',
                '& .MuiTypography-root': {
                  fontFamily: linkFont,
                  fontWeight: 600,
                  fontSize: '1rem',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <CssBaseline />
        <AppBar
          className="custom-navbar"
          position="sticky"
          elevation={0}
          sx={{
            width: 'calc(100% - 80px)',
            margin: '0 40px',
            left: 0,
            right: 0,
            borderRadius: "40px",
            backdropFilter: "blur(10px)",
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            '& .MuiToolbar-root': {
              minHeight: '70px',
            },
            '& a': {
              color: textColor,
              textDecoration: 'none',
              '&:hover': {
                color: hoverColor,
              },
            },
            '& .MuiSvgIcon-root': {
              color: textColor,
            },
            '& .MuiButtonBase-root': {
              color: textColor,
              '&:hover': {
                backgroundColor: 'transparent',
                color: hoverColor,
              },
            },
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ width: "100%" }}>
              {/* شعار سطح المكتب */}
              <Link href="/" passHref style={{ textDecoration: 'none' }}>
                <Box
                  component="div"
                  sx={{
                    mr: 2,
                    display: { xs: "none", md: "flex" },
                    alignItems: 'center',
                    fontFamily: linkFont,
                    fontWeight: 800,
                    letterSpacing: ".3rem",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: { xs: "none", md: "flex" }, mr: 1, position: 'relative', width: 80, height: 80 }}>
                    <Image 
                      src={logo} 
                      alt="logo" 
                      fill 
                      style={{ objectFit: 'contain' }} 
                      sizes="100px"
                      priority
                    />
                  </Box>
                </Box>
              </Link>

              {/* Mobile Menu Button */}
              <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end' }}>
                <IconButton 
                  size="large" 
                  onClick={() => setDrawerOpen(true)}
                  aria-label="فتح القائمة"
                  sx={{ 
                    color: textColor,
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <MenuIcon fontSize="large" />
                </IconButton>
              </Box>

              {/* شعار صغير للموبايل */}
              <Link href="/" passHref>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    mr: 2,
                    display: { xs: "flex", md: "none" },
                    flexGrow: 1,
                    fontFamily: linkFont,
                    fontWeight: 800,
                    letterSpacing: ".3rem",
                    color: "inherit",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: { xs: "flex", md: "none" }, mr: 1, position: 'relative', width: 64, height: 64 }}>
                    <Image 
                      src={logo} 
                      alt="logo" 
                      fill 
                      style={{ objectFit: 'contain' }}
                      sizes="64px"
                      priority
                    />
                  </Box>
                </Typography>
              </Link>

              {/* روابط سطح المكتب */}
              {!isMobile && (
                <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "space-evenly", width: "100%" }}>
                  {pageKeys.map((p) => (
                    <Tooltip key={p.href} title={navItems[p.key]} arrow placement="bottom">
                      <Link 
                        href={p.href} 

                        style={{ textDecoration: "none" }}
                        onClick={(e) => handleNavClick(e, p.href)}
                      >
                        <Typography
                          sx={{
                            fontFamily: linkFont,
                            fontWeight: 600,
                            fontSize: '1.3rem',
                            color: textColor,
                            '&:hover': {
                              color: hoverColor,
                              fontSize: '1.35rem',
                            },
                            transition: "color 0.2s, transform 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              color: hoverColor,
                              transform: "translateY(-3px)",
                            },
                          }}
                        >
                          {navItems[p.key]}
                        </Typography>
                      </Link>
                    </Tooltip>
                  ))}
                </Box>
              )}

              {/* Dark mode toggle */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mx: 2 }}>
                <Tooltip title={darkMode ? 'الوضع الفاتح' : 'الوضع المظلم'} arrow>
                  <IconButton 
                    onClick={handleDarkModeChange} 
                    sx={{
                      border: '1px solid',
                      borderColor: textColor,
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderColor: hoverColor,
                        color: hoverColor,
                      }
                    }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={isAuthenticated ? "الملف الشخصي" : "تسجيل الدخول"} arrow>
                  <Box 
                    component={isAuthenticated ? Link : 'div'}
                    href={isAuthenticated ? "/profile" : "#"}
                    onClick={handleProfileClick}
                    sx={{
                      position: 'relative',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      marginRight: '8px',
                      cursor: 'pointer',
                      background: darkMode 
                        ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(184, 134, 11, 0.3))' 
                        : 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(68, 68, 68, 0.1))',
                      boxShadow: darkMode 
                        ? '0 4px 15px rgba(0, 0, 0, 0.3)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.05)',
                        boxShadow: darkMode 
                          ? '0 6px 20px rgba(0, 0, 0, 0.4)' 
                          : '0 6px 20px rgba(0, 0, 0, 0.15)',
                        '&::before': {
                          opacity: 1,
                          transform: 'scale(1.1)'
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        padding: '2px',
                        background: darkMode 
                          ? 'linear-gradient(135deg, #D4AF37, #FFD700)' 
                          : 'linear-gradient(135deg, #333, #000)',
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        opacity: 0.7,
                        transition: 'all 0.4s ease',
                        pointerEvents: 'none'
                      }
                    }}
                  >
                    <PersonOutlineIcon 
                      sx={{ 
                        fontSize: '1.5rem',
                        color: darkMode ? '#FFD700' : '#000',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 1
                      }} 
                    />
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)',
                        opacity: darkMode ? 0.15 : 0.1,
                        pointerEvents: 'none'
                      }}
                    />
                  </Box>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>

          {/* Login Dialog */}
          <Dialog
            open={loginDialogOpen}
            onClose={() => setLoginDialogOpen(false)}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            dir="rtl"
          >
            <DialogTitle id="alert-dialog-title">
              تنبيه
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                يرجى تسجيل الدخول للوصول إلى الملف الشخصي
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setLoginDialogOpen(false)} color="primary">
                إلغاء
              </Button>
              <Button onClick={handleLogin} color="primary" autoFocus>
                تسجيل الدخول
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Snackbar for notifications */}
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MuiAlert 
              onClose={handleSnackbarClose} 
              severity="info"
              variant="filled"
              sx={{ width: '100%' }}
            >
              يجب تسجيل الدخول للوصول إلى الملف الشخصي
            </MuiAlert>
          </Snackbar>
        </AppBar>

      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        sx={{
          display: { xs: 'block', md: 'none' }, // Only show on mobile
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: darkMode ? '#121212' : '#ffffff',
            color: darkMode ? '#ffffff' : '#000000',
            borderLeft: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
            '&:focus-visible': {
              outline: 'none',
            },
            overflowY: 'auto',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`
          }}>
            <Typography variant="h6" sx={{ 
              fontFamily: linkFont, 
              fontWeight: 700,
              color: darkMode ? '#FFD700' : '#000000',
              fontSize: '1.25rem',
              '&:hover': {
                color: darkMode ? '#FFD700' : '#000000',
                opacity: 0.9
              }
            }}>
              القائمة
            </Typography>
            <IconButton 
              onClick={() => setDrawerOpen(false)}
              size="small"
              sx={{ 
                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={{ width: '100%' }}>
            {pageKeys.map((p) => {
              const isActive = pathname === p.href;
              return (
                <ListItem 
                  key={p.href} 
                  disablePadding
                  sx={{ 
                    mb: 2,
                    '&:last-child': { mb: 0 }
                  }}
                >
                  <ListItemButton
                    component={Link}
                    href={p.href}
                    selected={isActive}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      width: '100%',
                      py: 2,
                      px: 3,
                      borderRadius: '10px',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    <ListItemText 
                      primary={p.title}
                      sx={{
                        '& .MuiTypography-root': {
                          fontFamily: linkFont,
                          fontWeight: isActive ? 700 : 400,
                          fontSize: '1rem',
                          color: isActive 
                            ? (darkMode ? '#FFD700' : '#000000')
                            : (darkMode ? '#FFFFFF' : '#000000'),
                          '&:hover': {
                            color: darkMode ? '#FFD700' : '#000000',
                            opacity: 0.9
                          },
                        }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          
          {/* Mobile Theme Toggle */}
          <Box sx={{ 
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            mt: 6,
            gap: 3
          }}>
            <Tooltip title={darkMode ? 'الوضع الفاتح' : 'الوضع المظلم'}>
              <IconButton
                onClick={handleDarkModeChange}
                className="theme-toggle"
                sx={{ 
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: darkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(5px)',
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  boxShadow: darkMode 
                    ? '0 0 15px rgba(212, 175, 55, 0.3)' 
                    : '0 2px 10px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: darkMode 
                      ? '0 5px 20px rgba(212, 175, 55, 0.4)' 
                      : '0 5px 15px rgba(0, 0, 0, 0.15)',
                    backgroundColor: darkMode 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                  '&:active': {
                    transform: 'translateY(0) scale(0.95)',
                  },
                  '& .theme-icon': {
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'absolute',
                    opacity: 0,
                    transform: 'rotate(0deg) scale(0.8)',
                  },
                  '& .sun-icon': {
                    color: '#FFA500',
                    opacity: darkMode ? 0 : 1,
                    transform: darkMode ? 'scale(0.7) rotate(90deg)' : 'scale(1) rotate(0deg)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: 'drop-shadow(0 0 4px rgba(255, 165, 0, 0.7))',
                  },
                  '& .moon-icon': {
                    color: '#E0E0FF',
                    opacity: darkMode ? 1 : 0,
                    transform: darkMode ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(-90deg)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    filter: 'drop-shadow(0 0 4px rgba(224, 224, 255, 0.5))',
                  }
                }}
              >
                <LightModeIcon className="theme-icon sun-icon" />
                <DarkModeIcon className="theme-icon moon-icon" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
}