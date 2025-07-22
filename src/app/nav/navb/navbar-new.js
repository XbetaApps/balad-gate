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

// تحميل SessionVerification (نسخة JS) بلا SSR
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

/* إخفاء الـ AppBar عند التمرير */
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

/* عناصر الملاحة بالعربية */
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

export default function ResponsiveAppBar() {
  // 1. Hooks (useState, useContext, etc.)
  const { mode, toggleColorMode, darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const router = useRouter();
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  
  // 2. State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(null);
  const { user, loading, logout } = useAuth();
  const { isVerified: isSessionVerified } = useSession();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // 3. Effects
  useEffect(() => {
    setMounted(true);
  }, []);

  // 4. Handlers
  const handleLoginSuccess = useCallback(() => {
    if (authAction) {
      authAction();
      setAuthAction(null);
    }
  }, [authAction]);

  const handleProfileClick = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (user) {
      router.push("/profile");
    } else {
      setAuthAction(() => () => {
        router.push("/profile");
      });
      setShowAuthModal(true);
    }
  }, [user, router]);

  // 5. Render Functions
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
          {user ? (
            <div>
              <p style={{ color: 'green', marginBottom: '20px' }}>✓ تم التحقق من الجلسة بنجاح</p>
              <button 
                onClick={() => {
                  console.log('المستخدم مسجل الدخول، توجيه إلى الملف الشخصي');
                  setShowAuthModal(false);
                  setDrawerOpen(false);
                  router.push('/profile');
                }}
                style={{
                  padding: '10px 25px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '250px',
                }}
              >
                المتابعة إلى الملف الشخصي
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px',
                  fontSize: '35px',
                  color: '#666'
                }}>
                  🔒
                </div>
              </div>
              <p style={{ marginBottom: '20px', color: '#666' }}>يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    console.log('توجيه إلى صفحة تسجيل الدخول');
                    setShowAuthModal(false);
                    setDrawerOpen(false);
                    router.push('/auth?redirect=' + encodeURIComponent('/profile'));
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
                    maxWidth: '250px',
                  }}
                >
                  تسجيل الدخول
                </button>
                <button 
                  onClick={() => {
                    console.log('إغلاق نافذة التأكيد');
                    setShowAuthModal(false);
                  }}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    width: '100%',
                    maxWidth: '250px',
                  }}
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <CssBaseline />
      
      {/* نافذة تسجيل الدخول */}
      {renderAuthModal()}
      
      <HideOnScroll>
        <AppBar
          position="fixed"
          className="custom-navbar !bg-[var(--navbar-bg)] text-[var(--navbar-text)]"
          sx={{
            width: "93.5%",
            right: "3.2%",
            borderRadius: "30px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "var(--navbar-bg) !important",
            color: "var(--navbar-text) !important",
            boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            mt: 2,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            },
            [muiTheme.breakpoints.down("sm")]: {
              width: "100%",
              right: 0,
              borderRadius: 0,
              mt: 0,
            },
          }}
        >
          <Container maxWidth={false}>
            <Toolbar
              disableGutters
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: { xs: "60px", md: "70px" },
                px: { xs: 1, sm: 2 },
              }}
            >
              {/* القائمة الجانبية للهواتف */}
              <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="فتح القائمة الجانبية"
                  onClick={() => setDrawerOpen(true)}
                  color="inherit"
                  sx={{
                    p: 1,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>

              {/* الشعار */}
              <Box
                component={Link}
                href="/"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                  mr: { xs: 0, md: 2 },
                }}
              >
                <Image
                  src={logo}
                  alt="Balad Gate Logo"
                  width={45}
                  height={45}
                  style={{
                    objectFit: "contain",
                    marginRight: "10px",
                  }}
                />
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{
                    fontFamily: linkFont,
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", sm: "1.3rem" },
                    letterSpacing: ".1rem",
                    color: "inherit",
                    textDecoration: "none",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  بلد البوابة
                </Typography>
              </Box>

              {/* روابط التنقل لشاشات الكمبيوتر */}
              <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
                {pageKeys.map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    style={{
                      color: "var(--navbar-text)",
                      textDecoration: "none",
                      margin: "0 8px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontFamily: linkFont,
                      fontWeight: pathname === href ? 700 : 500,
                      fontSize: "1rem",
                      transition: "all 0.2s ease-in-out",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transform: "translateY(-2px)",
                      },
                      ...(pathname === href && {
                        color: "var(--accent-color)",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "60%",
                          height: "3px",
                          backgroundColor: "var(--accent-color)",
                          borderRadius: "3px",
                        },
                      }),
                    }}
                  >
                    {navItems[key]}
                  </Link>
                ))}
              </Box>

              {/* الأزرار اليمنى */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {/* زر تبديل الوضع الليلي */}
                <Tooltip title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}>
                  <IconButton
                    onClick={toggleColorMode}
                    color="inherit"
                    sx={{
                      p: 1,
                      mx: 0.5,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transform: "rotate(30deg)",
                      },
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>

                {/* زر الملف الشخصي */}
                <Tooltip title={user ? "الملف الشخصي" : "تسجيل الدخول"}>
                  <IconButton
                    onClick={handleProfileClick}
                    sx={{
                      p: 1,
                      mx: 0.5,
                      color: "inherit",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    <FaUser />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* القائمة الجانبية للهواتف */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onOpen={() => setDrawerOpen(true)}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: "280px",
            backgroundColor: "var(--navbar-bg)",
            color: "var(--navbar-text)",
            borderTopLeftRadius: "20px",
            borderBottomLeftRadius: "20px",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 2,
          }}
        >
          {/* رأس القائمة الجانبية */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              pb: 2,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: linkFont,
                fontWeight: 700,
                color: "var(--navbar-text)",
              }}
            >
              القائمة
            </Typography>
            <IconButton
              onClick={() => setDrawerOpen(false)}
              sx={{
                color: "var(--navbar-text)",
                p: 0.5,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* محتوى القائمة الجانبية */}
          <List sx={{ flexGrow: 1, overflowY: "auto" }}>
            {pageKeys.map(({ key, href }) => (
              <ListItem key={key} disablePadding>
                <ListItemButton
                  component={Link}
                  href={href}
                  selected={pathname === href}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: "var(--accent-color)",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                      },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <ListItemText
                    primary={navItems[key]}
                    primaryTypographyProps={{
                      fontFamily: linkFont,
                      fontWeight: pathname === href ? 700 : 500,
                      fontSize: "1rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {/* تذييل القائمة الجانبية */}
          <Box
            sx={{
              pt: 2,
              mt: "auto",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "var(--navbar-text)",
                opacity: 0.7,
                fontFamily: linkFont,
                fontSize: "0.8rem",
              }}
            >
              © {new Date().getFullYear()} بلد البوابة. جميع الحقوق محفوظة
            </Typography>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* مساحة فارغة تحت شريط التنقل */}
      <Toolbar
        sx={{
          minHeight: { xs: "60px", md: "90px" } !important,
          [muiTheme.breakpoints.down("sm")]: {
            minHeight: "60px" !important,
          },
        }}
      />
    </>
  );
}
