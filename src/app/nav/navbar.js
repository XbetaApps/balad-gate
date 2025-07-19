"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "./theme/ThemeProvider";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";
import { useSession } from "../../contexts/SessionContext";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";

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
  profile: "الملف الشخصي",
  auth: "تسجيل الدخول/التسجيل",
  about: "من نحن",
  car: "احوال الطرق"  ,
};

const pageKeys = [
  { key: "home", href: "/" },
  { key: "departments", href: "/departments" },
  { key: "news", href: "/news" },
  { key: "weather", href: "/weather" },
  { key: "money", href: "/money" },
  { key: "services", href: "/services" },
  { key: "profile", href: "/profile" }, // سيكون محميًا
  { key: "auth", href: "/auth" },
  { key: "about", href: "/about" },
  { key: "car", href: "/car" },
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
  
  // لا حاجة للتحقق من صحة الجلسة هنا، حيث يتم التحقق في SessionVerification
  
  // 3. Callbacks
  const handleLoginSuccess = useCallback(() => {
    console.log('تم تسجيل الدخول بنجاح، تنفيذ الإجراء');
    setShowAuthModal(false);
    if (typeof authAction === 'function') {
      authAction();
    } else {
      console.error('authAction ليس دالة:', authAction);
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
  
  // 4. Handle profile click
  const handleProfileClick = useCallback((e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('handleProfileClick called, user:', user ? 'موجود' : 'غير موجود');
    
    if (user) {
      console.log('توجيه إلى صفحة الملف الشخصي');
      router.push("/profile");
    } else {
      console.log('فتح نافذة تسجيل الدخول');
      setAuthAction(() => () => {
        console.log('تنفيذ الإجراء بعد تسجيل الدخول');
        router.push("/profile");
      });
      setShowAuthModal(true);
    }
  }, [user, router]);
  
  // 5. Effects
  useEffect(() => {
    setMounted(true);
    
    // لا حاجة للاستماع لتغييرات حالة المصادقة هنا، حيث يتم التعامل معها في SessionContext
    // التحقق الأولي من حالة المصادقة
    if (user) {
      console.log('تم تحميل شريط التنقل مع مستخدم مسجل الدخول');
    } else {
      console.log('تم تحميل شريط التنقل بدون مستخدم مسجل الدخول');
    }
  }, [user]);
  
  // 6. Callbacks
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // إعادة التوجيه إلى الصفحة الرئيسية
      router.push("/");
    } catch (error) {
      console.error('حدث خطأ أثناء تسجيل الخروج:', error);
    }
  }, [logout, router]);

  const handleDrawerToggle = useCallback((open) => () => {
    setDrawerOpen(open);
  }, []);

  // تنقّل عام للروابط غير المحمية
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

  // 7. Constants
  const profileSrc = "/1111.png";
  const bgColor = "#000000";
  const textColor = "#ffd700";
  const hoverColor = "#f0e68c";
  
  if (!mounted) return null;



  /* عنصر زر الملف الشخصي المحمي (سطح المكتب) */
  const ProfileAvatarProtected = (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center',
      padding: '0 16px',
      cursor: 'pointer',
      ':hover': {
        color: hoverColor,
      }
    }}>
      <div 
        onClick={(e) => {
          console.log('تم النقر على زر الملف الشخصي');
          e.stopPropagation();
          
          if (user) {
            console.log('توجيه إلى الملف الشخصي');
            router.push('/profile');
          } else {
            console.log('فتح نافذة تسجيل الدخول');
            setShowAuthModal(true);
            setAuthAction(() => () => {
              console.log('بعد تسجيل الدخول، التوجيه إلى الملف الشخصي');
              router.push('/profile');
            });
          }
        }}
        style={{
          fontFamily: linkFont,
          fontSize: '1.1rem',
          color: 'var(--navbar-text)',
          fontWeight: 700,
          lineHeight: 'normal',
          transition: 'all 0.2s',
          ':hover': {
            color: hoverColor,
            transform: 'translateY(-2px)',
          },
        }}
      >
        الملف الشخصي
      </div>

      {showAuthModal && (
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
            <h3 style={{ color: 'black', marginBottom: '20px' }}>تأكيد الجلسة</h3>
            <p style={{ marginBottom: '20px' }}>يجب تأكيد هويتك للوصول إلى الملف الشخصي</p>
            
            {user ? (
              <div>
                <p style={{ color: 'green', marginBottom: '20px' }}>✓ تم التحقق من الجلسة بنجاح</p>
                <button 
                  onClick={() => {
                    console.log('المستخدم مسجل الدخول، توجيه إلى الملف الشخصي');
                    setShowAuthModal(false);
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
                  }}
                >
                  المتابعة إلى الملف الشخصي
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: '40px',
                    color: '#666'
                  }}>
                    🔒
                  </div>
                </div>
                <p style={{ marginBottom: '20px', color: '#666' }}>يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => {
                      console.log('توجيه إلى صفحة تسجيل الدخول');
                      setShowAuthModal(false);
                      router.push('/auth?redirect=' + encodeURIComponent('/profile'));
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1,
                      maxWidth: '150px'
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
                      padding: '10px 20px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1,
                      maxWidth: '150px'
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // أنماط CSS المخصصة للنافذة المنبثقة
  const modalStyles = {
    modalOverlay: {
      position: 'fixed',
      top: '64px', // ارتفاع شريط التنقل
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '20px',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '0 0 12px 12px',
      maxWidth: '420px',
      width: '100%',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 5px 25px rgba(0, 0, 0, 0.2)',
      margin: '0 15px',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto'
    }
  };

  // نافذة تأكيد الجلسة (يتم مشاركتها بين سطح المكتب والموبايل)
  const SessionConfirmationModal = () => {
    // كشف إذا كان الجهاز جوالاً أم لا
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
    
    return (
    <div 
      style={modalStyles.modalOverlay}
      onClick={() => setShowAuthModal(false)}
    >
      <div 
        style={modalStyles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: 'black', marginBottom: '20px' }}>تأكيد الجلسة</h3>
        <p style={{ marginBottom: '20px' }}>يجب تأكيد هويتك للوصول إلى الملف الشخصي</p>
        
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
                  width: '100%',
                  maxWidth: '250px',
                  fontSize: '1rem'
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
                  width: '100%',
                  maxWidth: '250px',
                  fontSize: '1rem'
                }}
              >
                إلغاء
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )};

  /* عنصر قائمة الملف الشخصي المحمي (داخل Drawer) */
  const ProfileDrawerItemProtected = (
    <div>
      <ListItemButton
        component="div"
        onClick={(e) => {
          e.preventDefault();
          console.log('تم النقر على الملف الشخصي من القائمة الجانبية');
          setShowAuthModal(true);
        }}
        sx={{
          width: "100%",
          py: 2,
          px: 3,
          borderRadius: "10px",
          "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
        }}
      >
        <ListItemText
          primary={navItems.profile}
          primaryTypographyProps={{
            fontFamily: linkFont,
            fontWeight: 600,
            fontSize: "1.1rem",
            color: "var(--navbar-text)",
          }}
        />
      </ListItemButton>
      
      {showAuthModal && <SessionConfirmationModal />}
    </div>
  );

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
          <ListItem key={p.href} disablePadding>
            {p.key === "profile" ? (
              ProfileDrawerItemProtected
            ) : (
              <ListItemButton
                component={Link}
                href={p.href}
                sx={{
                  justifyContent: "center",
                  py: 2,
                  px: 3,
                  borderRadius: "10px",
                  "&:hover": { backgroundColor: hoverColor },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  router.push(p.href);
                }}
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
            )}
          </ListItem>
        ))}
      </List>

      {/* زر تسجيل خروج (موبايل) */}
      {user && (
        <Box sx={{ px: 2, pb: 2, width: "100%" }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              justifyContent: "center",
              borderRadius: "10px",
              backgroundColor: "#ffebee",
              color: "#d32f2f",
              fontWeight: 700,
              fontSize: "1.1rem",
              "&:hover": {
                backgroundColor: "#ffcdd2",
                color: "#b71c1c",
              },
            }}
          >
            تسجيل خروج
          </ListItemButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <CssBaseline />
      <HideOnScroll>
        <AppBar
          position="fixed"
          className="custom-navbar !bg-[var(--navbar-bg)] text-[var(--navbar-text)]"
          sx={{
            width: "93.5%",
            right: "3.2%",
            borderRadius: "30px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(255, 255, 255, 0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ width: "100%" }}>
              {/* شعار سطح المكتب */}
              <Link href="/" passHref style={{ textDecoration: "none" }}>
                <Box
                  component="div"
                  sx={{
                    mr: 2,
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    fontFamily: linkFont,
                    fontWeight: 800,
                    letterSpacing: ".3rem",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <Avatar sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}>
                    <Image
                      src={logo}
                      alt="logo"
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="40px"
                    />
                  </Avatar>
                </Box>
              </Link>

              {/* زر قائمة الموبايل */}
              <Box
                sx={{
                  flexGrow: 1,
                  display: { xs: "flex", md: "none" },
                  justifyContent: "flex-end",
                }}
              >
                <IconButton
                  size="large"
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    color: textColor,
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
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
                    <Image
                      src={logo}
                      alt="logo"
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="32px"
                    />
                  </Avatar>
                </Typography>
              </Link>

              {/* روابط سطح المكتب */}
              {!isMobile && (
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    justifyContent: "space-evenly",
                    width: "100%",
                  }}
                >
                  {pageKeys.map((p) =>
                    p.key === "profile" ? (
                      // ملف شخصي محمي
                      <Tooltip key={p.href} title={navItems[p.key]} arrow placement="bottom">
                        <span>{ProfileAvatarProtected}</span>
                      </Tooltip>
                    ) : (
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
                              color: "var(--navbar-text)",
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
                    )
                  )}
                </Box>
              )}

              {/* تبديل الوضع + الملف */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mx: 2 }}>
                <button
                  onClick={toggleColorMode}
                  className="p-2 rounded-full text-gold-500 dark:text-gold-400 hover:bg-dark-700 dark:hover:bg-dark-600"
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </button>

                {/* ملف شخصي محمي (سطح المكتب) */}
                {isMobile ? null : (
                  <Tooltip title="الملف الشخصي" arrow>
                    <span>{ProfileAvatarProtected}</span>
                  </Tooltip>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Drawer للموبايل */}
      <SwipeableDrawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: "100vw",
            backgroundColor: bgColor,
            color: textColor,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
              border: "none",
              borderRadius: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            },
          },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "500px", mx: "auto" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              mb: 4,
            }}
          >
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: textColor, fontSize: "2rem" }}>
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>

          <List sx={{ width: "100%" }}>
            {pageKeys.map((p) => (
              <ListItem
                key={p.href}
                disablePadding
                sx={{ mb: 2, "&:last-child": { mb: 0 } }}
              >
                {p.key === "profile" ? (
                  ProfileDrawerItemProtected
                ) : (
                  <ListItemButton
                    component={Link}
                    href={p.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setDrawerOpen(false);
                      router.push(p.href);
                    }}
                    sx={{
                      width: "100%",
                      py: 2,
                      px: 3,
                      borderRadius: "10px",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={navItems[p.key]}
                      primaryTypographyProps={{
                        fontFamily: linkFont,
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        color: "var(--navbar-text)",
                      }}
                    />
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>

          {/* مبدّل الوضع (موبايل) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              justifyContent: "center",
              mt: 6,
              gap: 3,
            }}
          >
            <button
              onClick={toggleColorMode}
              className="p-2 rounded-full text-gold-500 dark:text-gold-400 hover:bg-dark-700 dark:hover:bg-dark-600"
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </button>
          </Box>

          {/* تسجيل خروج (موبايل) */}
          {user && (
            <ListItemButton
              onClick={handleLogout}
              sx={{
                mt: 2,
                mb: 2,
                justifyContent: "center",
                borderRadius: "10px",
                backgroundColor: "#ffebee",
                color: "#d32f2f",
                fontWeight: 700,
                fontSize: "1.1rem",
                "&:hover": {
                  backgroundColor: "#ffcdd2",
                  color: "#b71c1c",
                },
              }}
            >
              تسجيل خروج
            </ListItemButton>
          )}
        </Box>
      </SwipeableDrawer>
    </>
  );
}
