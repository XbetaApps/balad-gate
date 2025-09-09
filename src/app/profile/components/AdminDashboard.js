// file: ./src/app/admin/dashboard/AdminDashboard.js
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip as MuiTooltip,
  Divider,
  Chip,
  Alert,
  Stack,
  Skeleton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PeopleIcon from "@mui/icons-material/People";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ArticleIcon from "@mui/icons-material/Article";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AvTimerIcon from "@mui/icons-material/AvTimer";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TagIcon from "@mui/icons-material/Tag";
import StarIcon from "@mui/icons-material/Star";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import CategoryIcon from "@mui/icons-material/Category";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// 👇 نفس مسار الـ CSS كما في صفحة الدعم الفني المجاورة
import "../profile-styles.css";

/* ======================== قراءة متغيرات CSS من :root ======================== */
function useCssVars() {
  const [vars, setVars] = useState({
    bg: "#ffffff",
    card: "#ffffff",
    border: "rgba(0,0,0,0.12)",
    text: "#111111",
    textSecondary: "#6b7280",
    primary: "#3f51b5",
    chartPrimary: "#3f51b5",
    chartGrid: "rgba(0,0,0,0.08)",
    pie1: "#3f51b5",
    pie2: "#e91e63",
    pie3: "#9e9e9e",
    pie4: "#4caf50",
    pie5: "#ff9800",
    pie6: "#009688",
  });

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const g = (name) => cs.getPropertyValue(name).trim();

      const chartPrimary = g("--chart-primary") || g("--primary") || vars.chartPrimary;
      const chartGrid = g("--chart-grid") || vars.chartGrid;

      setVars({
        bg: g("--background") || vars.bg,
        card: g("--card") || vars.card,
        border: g("--border") || vars.border,
        text: g("--text-primary") || vars.text,
        textSecondary: g("--text-secondary") || vars.textSecondary,
        primary: g("--primary") || vars.primary,
        chartPrimary,
        chartGrid,
        pie1: g("--chart-pie-1") || chartPrimary || vars.pie1,
        pie2: g("--chart-pie-2") || g("--gold-darker") || "#B8902D",
        pie3: g("--chart-pie-3") || g("--gold-dim") || "#8B6B1F",
        pie4: g("--chart-pie-4") || "#C9A227",
        pie5: g("--chart-pie-5") || "#C2A566",
        pie6: g("--chart-pie-6") || "#9B7E2B",
      });
    };

    read();

    // رصد تغيّر الكلاس/الستايل على html (لتبديل الثيم)
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    // في حال لديك حدث مخصص
    window.addEventListener("themechange", read);

    return () => {
      obs.disconnect();
      window.removeEventListener("themechange", read);
    };
  }, []);

  return vars;
}

/* ======================== عناصر مساعدة ======================== */
function StatCard({ title, value, icon, sub, accent }) {
  const vars = useCssVars();
  const accentBorder = accent ? `1px solid ${accent}33` : `1px solid ${vars.border}`;

  return (
    <Card
      sx={{
        height: "100%",
        backgroundColor: vars.card,
        color: vars.text,
        borderRadius: 12,
        border: accentBorder,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="body2" sx={{ color: vars.textSecondary }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ color: vars.text, fontWeight: 700, mt: 0.5 }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </Typography>
            {sub ? (
              <Typography variant="caption" sx={{ color: vars.textSecondary }}>
                {sub}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${vars.border}22`,
              display: "grid",
              placeItems: "center",
              "& svg": { fontSize: 36, color: vars.text },
              color: vars.text,
            }}
          >
            <Box>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/* ======================== جلسة الأدمن (كما هي) ======================== */
function useAdminSession() {
  const [state, setState] = useState({ loading: true, isAdmin: false, error: undefined });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/test-session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!alive) return;
        if (!r.ok) {
          setState({ loading: false, isAdmin: false, error: "تعذر التحقق من الجلسة" });
          return;
        }
        const j = await r.json();
        const roleId = j?.rawPayload?.role_id ?? j?.user?.role_id ?? null;
        const isAdmin = Boolean(j?.authenticated && Number(roleId) === 4);
        setState({ loading: false, isAdmin, error: isAdmin ? undefined : "غير مصرح لك بالوصول" });
      } catch (e) {
        if (!alive) return;
        setState({ loading: false, isAdmin: false, error: e?.message || "خطأ غير متوقع" });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/* ======================== الصفحة الرئيسية ======================== */
export default function AdminDashboard() {
  const session = useAdminSession();
  const vars = useCssVars();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setError(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard-stats", {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || data?.error || "فشل تحميل البيانات");
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (e) {
      setError(e?.message || "حدث خطأ أثناء جلب البيانات");
      setStats(null);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session.loading && session.isAdmin) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.loading, session.isAdmin]);

  const adsPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "نشِطة", value: stats.ads.active },
      { name: "منتهية", value: stats.ads.expired },
      { name: "غير فعّالة", value: stats.ads.inactive },
    ];
  }, [stats]);

  const peakHoursData = useMemo(() => {
    if (!stats) return [];
    return [...stats.ads.peakPeriods]
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        hour: h.hour.toString().padStart(2, "0") + ":00",
        count: h.adCount,
      }));
  }, [stats]);

  const PIE_COLORS = [vars.pie1, vars.pie2, vars.pie3, vars.pie4, vars.pie5, vars.pie6];

  if (session.loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, color: vars.text }}>
        <Box textAlign="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: vars.text }}>جاري التحقق من الصلاحيات…</Typography>
        </Box>
        <LinearProgress sx={{ "& .MuiLinearProgress-bar": { backgroundColor: vars.primary } }} />
      </Container>
    );
  }

  if (!session.isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: "center",
            backgroundColor: vars.card,
            color: vars.text,
            border: `1px solid ${vars.border}`,
          }}
        >
          <LockPersonIcon sx={{ fontSize: 48, mb: 1, color: vars.primary }} />
          <Typography variant="h6" gutterBottom sx={{ color: vars.text }}>
            غير مصرح لك بالوصول إلى هذه الصفحة
          </Typography>
          <Typography variant="body2" sx={{ color: vars.textSecondary }}>
            برجاء تسجيل الدخول بحساب يملك صلاحيات المشرف.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, color: vars.text }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ color: vars.text }}>لوحة التحكم الإدارية</Typography>
        </Box>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ bgcolor: `${vars.border}33` }} />
            </Grid>
          ))}
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={360} sx={{ bgcolor: `${vars.border}33` }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
        color: vars.text,
        backgroundColor: vars.bg,
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: { xs: "start", sm: "center" },
          gap: 2,
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ color: vars.text }}>
            لوحة التحكم الإدارية
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
            <Chip
              size="small"
              icon={<AccessTimeIcon sx={{ color: vars.textSecondary }} />}
              label={stats?.timestamp ? `آخر تحديث: ${new Date(stats.timestamp).toLocaleString()}` : "—"}
              variant="outlined"
              sx={{
                color: vars.textSecondary,
                borderColor: vars.border,
              }}
            />
            <Chip
              size="small"
              icon={<LeaderboardIcon sx={{ color: vars.textSecondary }} />}
              label="بيانات مباشرة من الخادم"
              variant="outlined"
              sx={{
                color: vars.textSecondary,
                borderColor: vars.border,
              }}
            />
          </Stack>
        </Box>
        <Box>
          <MuiTooltip title="تحديث الآن">
            <span>
              <IconButton
                onClick={fetchStats}
                disabled={refreshing}
                sx={{
                  border: `1px solid ${vars.border}`,
                  color: vars.text,
                  backgroundColor: vars.card,
                  "&:hover": { backgroundColor: `${vars.card}` },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>
      </Box>

      {error ? (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            color: vars.text,
            backgroundColor: vars.card,
            border: `1px solid ${vars.border}`,
            "& .MuiAlert-icon": { color: vars.primary },
          }}
        >
          {error}
        </Alert>
      ) : null}

      {/* ===== الإحصائيات السريعة ===== */}
      <Grid container spacing={3} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="إجمالي المستخدمين" value={stats?.users.total ?? 0} icon={<PeopleIcon />} accent="#3f51b5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="أتمّوا التعريف (Onboarding)"
            value={stats?.users.onboarded ?? 0}
            sub={`معدل الإكمال ${stats?.users.onboardingRate ?? 0}%`}
            icon={<TaskAltIcon />}
            accent="#009688"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="مستخدمون جدد اليوم" value={stats?.users.newToday ?? 0} icon={<GroupAddIcon />} accent="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="إجمالي المنشورات" value={stats?.posts.total ?? 0} icon={<ArticleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard title="إجمالي الإعلانات" value={stats?.ads.total ?? 0} icon={<Inventory2Icon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <StatCard
            title="إعلانات نشِطة"
            value={stats?.ads.active ?? 0}
            sub={`منتهية: ${stats?.ads.expired ?? 0} | غير فعّالة: ${stats?.ads.inactive ?? 0}`}
            icon={<AvTimerIcon />}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: vars.border }} />

      {/* ===== الصف الخاص بالمخططات ===== */}
      <Grid container spacing={3}>
        {/* Pie: حالة الإعلانات */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              backgroundColor: vars.card,
              color: vars.text,
              border: `1px solid ${vars.border}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="h6" sx={{ color: vars.text }}>حالة الإعلانات</Typography>
              <Chip
                size="small"
                icon={<LocalOfferIcon sx={{ color: vars.textSecondary }} />}
                label="Active / Expired / Inactive"
                variant="outlined"
                sx={{ color: vars.textSecondary, borderColor: vars.border }}
              />
            </Box>
            <Box sx={{ height: 330 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adsPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {adsPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: vars.card,
                      border: `1px solid ${vars.border}`,
                      color: vars.text,
                    }}
                  />
                  <Legend wrapperStyle={{ color: vars.text }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Bar: ساعات الذروة */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              backgroundColor: vars.card,
              color: vars.text,
              border: `1px solid ${vars.border}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Typography variant="h6" sx={{ color: vars.text }}>ساعات الذروة لإنشاء الإعلانات</Typography>
              <Chip
                size="small"
                icon={<AccessTimeIcon sx={{ color: vars.textSecondary }} />}
                label="Top Hours"
                variant="outlined"
                sx={{ color: vars.textSecondary, borderColor: vars.border }}
              />
            </Box>
            <Box sx={{ height: 330 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={vars.chartGrid} />
                  <XAxis dataKey="hour" stroke={vars.text} tick={{ fill: vars.text }} />
                  <YAxis allowDecimals={false} stroke={vars.text} tick={{ fill: vars.text }} />
                  <Tooltip
                    contentStyle={{
                      background: vars.card,
                      border: `1px solid ${vars.border}`,
                      color: vars.text,
                    }}
                  />
                  <Legend wrapperStyle={{ color: vars.text }} />
                  <Bar dataKey="count" name="عدد الإعلانات" fill={vars.chartPrimary} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ===== الجداول ===== */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        {/* الأكثر نشراً */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: vars.card,
              color: vars.text,
              border: `1px solid ${vars.border}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: vars.text }}>أكثر المستخدمين نشراً</Typography>
              <Chip
                size="small"
                icon={<StarIcon sx={{ color: vars.textSecondary }} />}
                label="Top 5"
                variant="outlined"
                sx={{ color: vars.textSecondary, borderColor: vars.border }}
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: vars.text }}>المستخدم</TableCell>
                    <TableCell align="right" sx={{ color: vars.text }}>عدد المنشورات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.posts.topPosters?.length ? (
                    stats.posts.topPosters.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-start">
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                backgroundColor: "transparent",
                                color: vars.text,
                                border: `1px solid ${vars.border}`,
                                display: "grid",
                                placeItems: "center",
                                fontSize: 12,
                              }}
                              title={p.email || ""}
                            >
                              {p.name?.slice(0, 1) || "?"}
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ color: vars.text }}>
                                {p.name || "مستخدم مجهول"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: vars.textSecondary }}>
                                {p.email || "—"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ color: vars.text }}>
                          {p.postCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: vars.text }}>
                        لا توجد بيانات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* الفئات الأكثر شعبية */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: vars.card,
              color: vars.text,
              border: `1px solid ${vars.border}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: vars.text }}>الفئات الأكثر شعبية</Typography>
              <Chip
                size="small"
                icon={<CategoryIcon sx={{ color: vars.textSecondary }} />}
                label="Top 5"
                variant="outlined"
                sx={{ color: vars.textSecondary, borderColor: vars.border }}
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: vars.text }}>الفئة</TableCell>
                    <TableCell align="right" sx={{ color: vars.text }}>عدد المنشورات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.posts.topCategories?.length ? (
                    stats.posts.topCategories.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell sx={{ color: vars.text }}>{c.name}</TableCell>
                        <TableCell align="right" sx={{ color: vars.text }}>
                          {c.postCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: vars.text }}>
                        لا توجد بيانات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* الأكثر تفضيلاً (إعلانات) */}
      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: vars.card,
              color: vars.text,
              border: `1px solid ${vars.border}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: vars.text }}>الأكثر تفضيلاً (إعلانات)</Typography>
              <Chip
                size="small"
                icon={<StarIcon sx={{ color: vars.textSecondary }} />}
                label="Top 5"
                variant="outlined"
                sx={{ color: vars.textSecondary, borderColor: vars.border }}
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: vars.text }}>العنوان</TableCell>
                    <TableCell align="right" sx={{ color: vars.text }}>
                      عدد الإضافات للمفضلة
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.posts.topFavorited?.length ? (
                    stats.posts.topFavorited.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ color: vars.text }}>{p.title || "—"}</TableCell>
                        <TableCell align="right" sx={{ color: vars.text }}>
                          {p.favoriteCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: vars.text }}>
                        لا توجد بيانات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ height: 32 }} />
    </Container>
  );
}
