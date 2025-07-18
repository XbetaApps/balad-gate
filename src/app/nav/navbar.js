"use client";

import React, { useState, useEffect, useContext } from "react";
import { useTheme } from "./theme/ThemeProvider";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";

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
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { styled, useTheme as useMuiTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import CssBaseline from "@mui/material/CssBaseline";

import logo from "./icons/1111.png";

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

/* إخفاء الـ AppBar عند التمرير */
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

/* Navigation items in Arabic */
const navItems = {
  home: "الرئيسية",
  news: "الأخبار",
  weather: "الطقس",
  car: "حالة الطرق",
  money: "العملات",
  services: "الخدمات",
  auth: "تسجيل الدخول/التسجيل",
  contact: "اتصل بنا",

};

const pageKeys = [
  { key: "home", href: "/" },  // Root page
  { key: "news", href: "/news" },
  { key: "weather", href: "/weather" },
  { key: "car", href: "/car" },
  { key: "money", href: "/money" },
  { key: "services", href: "/services" },
  { key: "auth", href: "/auth" },
  { key: "contact", href: "/contact" },

];


const linkFont = '"Tajawal", "Amiri", serif';

export default function ResponsiveAppBar() {
  const { mode, toggleColorMode, darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const profileSrc = "/1111.png"; // Using existing image from public directory

  const router = useRouter();
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  useEffect(() => {
    setMounted(true);
    // Set Arabic as default
    
  }, []);

  const handleDarkModeChange = () => {
    toggleColorMode();
  };

  // Language is fixed to Arabic

  const handleDrawerToggle = (open) => () => setDrawerOpen(open);

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

  const bgColor = darkMode ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const textColor = darkMode ? '#d4af37' : '#000000';
  const hoverColor = darkMode ? '#f0e68c' : '#333333';

  const drawerList = (
    <Box
      sx={{
        width: 260,
        bgcolor: bgColor,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      role="presentation"
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
        <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: textColor }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {pageKeys.map((p) => (
          <ListItemButton
            key={p.href}
            component={Link}
            href={p.href}
            sx={{ 
              justifyContent: "center", 
              textDecoration: "none", 
              color: "inherit",
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
            onClick={() => setDrawerOpen(false)}
          >
            <ListItemText
              primary={navItems[p.key]}
              primaryTypographyProps={{
                fontFamily: linkFont,
                fontWeight: 700,
                fontSize: "1.1rem",
                color: textColor,
                textAlign: "center",
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
      <HideOnScroll>
        <AppBar
          className="custom-navbar"
          sx={{
            width: "93.5%",
            right: "3.2%",
            borderRadius: "30px",
            backdropFilter: "blur(8px)",
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
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
                  <Avatar sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}>
                    <Image src={logo} alt="logo" fill style={{ objectFit: "contain" }} sizes="40px" />
                  </Avatar>
                </Box>
              </Link>

              {/* Mobile Menu Button */}
              <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" }, justifyContent: 'flex-end' }}>
                <IconButton 
                  size="large" 
                  onClick={() => setDrawerOpen(true)}
                  sx={{ 
                    color: textColor,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
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
                  <Avatar sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}>
                    <Image src={logo} alt="logo" fill style={{ objectFit: "contain" }} sizes="32px" />
                  </Avatar>
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
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "inherit",
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
                    color="inherit"
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="الملف الشخصي" arrow>
                  <Box 
                    component={Link}
                    href="/profile"
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
        </AppBar>
      </HideOnScroll>

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
              border: 'none',
              borderRadius: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }
          }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 4 }}>
            <IconButton 
              onClick={() => setDrawerOpen(false)}
              sx={{ color: textColor, fontSize: '2rem' }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <List sx={{ width: '100%' }}>
            {pageKeys.map((p) => (
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
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    width: '100%',
                    py: 2,
                    px: 3,
                    borderRadius: '10px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    },
                  }}
                >
                  <ListItemText 
                    primary={navItems[p.key]} 
                    primaryTypographyProps={{
                      fontFamily: linkFont,
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      color: 'text.primary',
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
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