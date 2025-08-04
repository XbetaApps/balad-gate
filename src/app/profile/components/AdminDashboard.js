"use client";

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  People as PeopleIcon,
  Comment as CommentIcon,
  TrendingUp as TrendingUpIcon,
  PersonOutline as VisitorIcon,
  Visibility as ViewsIcon,
  Group as GroupIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

/* ---------------- Mock data (بدّله ببيانات API لاحقاً) ---------------- */
const mockStats = {
  general: {
    totalUsers: 1245,
    activeUsers: 843,
    totalVisitors: 3567,
    totalPosts: 5678,
    totalComments: 12345,
    todayVisitors: 243,
    todayRegisteredUsers: 45,
    visitorStats: { registered: 35, guests: 65 },
    visitorTrend: [
      { name: 'يناير', registered: 400, guests: 800 },
      { name: 'فبراير', registered: 600, guests: 1200 },
      { name: 'مارس', registered: 800, guests: 1500 },
      { name: 'أبريل', registered: 1000, guests: 1800 },
      { name: 'مايو', registered: 1200, guests: 2000 },
      { name: 'يونيو', registered: 1245, guests: 2200 },
    ]
  },
  userGrowth: [
    { name: 'يناير', users: 400 },
    { name: 'فبراير', users: 600 },
    { name: 'مارس', users: 800 },
    { name: 'أبريل', users: 1000 },
    { name: 'مايو', users: 1200 },
    { name: 'يونيو', users: 1245 },
  ],
  contentStats: [
    { name: 'المنشورات', value: 5678 },
    { name: 'التعليقات', value: 12345 },
    { name: 'الإعجابات', value: 34567 },
  ],
  popularCategories: [
    { name: 'أخبار', count: 1245 },
    { name: 'رياضة', count: 980 },
    { name: 'تكنولوجيا', count: 870 },
    { name: 'صحة', count: 650 },
    { name: 'تعليم', count: 430 },
  ],
  activityTrends: [
    { name: '12:00', posts: 40, comments: 120 },
    { name: '15:00', posts: 30, comments: 90 },
    { name: '18:00', posts: 60, comments: 180 },
    { name: '21:00', posts: 80, comments: 200 },
    { name: '00:00', posts: 50, comments: 150 },
    { name: '03:00', posts: 10, comments: 30 },
    { name: '06:00', posts: 20, comments: 60 },
    { name: '09:00', posts: 70, comments: 160 },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/* ---------------- Helpers ---------------- */
function isAdmin(userData) {
  return !!userData && Number(userData.role_id) === 4;
}

async function fetchUserDataFromSession() {
  const res = await fetch('/api/test-session', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) return null;

  const data = await res.json().catch(() => null);
  if (!data?.authenticated || !data?.user) return null;

  const role_id = data?.rawPayload?.role_id ?? data?.user?.role_id ?? null;
  return { ...data.user, role_id };
}

/* ---------------- UI ---------------- */
const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%', bgcolor: color || 'background.paper', color: color ? 'common.white' : 'text.primary' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h6" color="inherit">{title}</Typography>
          <Typography variant="h4" component="div" color="inherit">
            {Number(value || 0).toLocaleString()}
          </Typography>
        </div>
        <Box sx={{ fontSize: 40, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

/**
 * AdminDashboard
 * - يقبل userData من الأب، أو يجلبه من /api/test-session إن لم يُمرَّر.
 */
const AdminDashboard = ({ userData: userDataProp = null }) => {
  const [userData, setUserData] = useState(userDataProp);
  const [authLoading, setAuthLoading] = useState(!userDataProp);

  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);

  // جلب userData إن لم يصل من الأب
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (userDataProp) {
        setUserData(userDataProp);
        setAuthLoading(false);
        return;
      }
      setAuthLoading(true);
      const ud = await fetchUserDataFromSession().catch(() => null);
      if (mounted) {
        setUserData(ud);
        setAuthLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [userDataProp]);

  // جلب الإحصاءات (بدّل mock بالـ API الحقيقي)
  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        // مثال عندما تبني API حقيقي:
        // const res = await fetch(`/api/admin/stats?range=${timeRange}`, { credentials: 'include' });
        // const data = await res.json();
        // if (mounted) setStats(data);

        if (mounted) setLoading(false);
      } catch (e) {
        console.error('Error fetching stats:', e);
        if (mounted) setLoading(false);
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, [timeRange]);

  /* حراسة الوصول */
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">جاري التحقق من الصلاحيات...</Typography>
        </Box>
      </Container>
    );
  }

  if (!isAdmin(userData)) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">غير مصرح لك بالوصول إلى هذه الصفحة</Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">جاري تحميل الإحصائيات...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">لوحة التحكم الإدارية</Typography>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="time-range-label">الفترة الزمنية</InputLabel>
          <Select
            labelId="time-range-label"
            value={timeRange}
            label="الفترة الزمنية"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="day">آخر 24 ساعة</MenuItem>
            <MenuItem value="week">آخر أسبوع</MenuItem>
            <MenuItem value="month">آخر شهر</MenuItem>
            <MenuItem value="year">آخر سنة</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* إحصائيات سريعة */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="إجمالي المستخدمين"
            value={stats.general.totalUsers}
            icon={<PeopleIcon fontSize="inherit" />}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="المستخدمين النشطين"
            value={stats.general.activeUsers}
            icon={<TrendingUpIcon fontSize="inherit" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="إجمالي الزوار"
            value={stats.general.totalVisitors}
            icon={<VisitorIcon fontSize="inherit" />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="زوار اليوم"
            value={stats.general.todayVisitors}
            icon={<ViewsIcon fontSize="inherit" />}
            color="#ff5722"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="مستخدمين جدد اليوم"
            value={stats.general.todayRegisteredUsers}
            icon={<GroupIcon fontSize="inherit" />}
            color="#009688"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            title="إجمالي التعليقات"
            value={stats.general.totalComments}
            icon={<CommentIcon fontSize="inherit" />}
            color="#e91e63"
          />
        </Grid>
      </Grid>

      {/* رسوم بيانية */}
      <Grid container spacing={3}>
        {/* توزيع الزوار */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>توزيع الزوار</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'مسجلين', value: stats.general.visitorStats.registered },
                      { name: 'زوار', value: stats.general.visitorStats.guests }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#3f51b5" />
                    <Cell fill="#9c27b0" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* اتجاهات الزيارات الشهرية */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>اتجاهات الزيارات الشهرية</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.general.visitorTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="registered" name="مستخدمين مسجلين" stroke="#3f51b5" strokeWidth={2} />
                  <Line type="monotone" dataKey="guests" name="زوار" stroke="#9c27b0" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* إحصائيات المحتوى */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>إحصائيات المحتوى</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.contentStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.contentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* الفئات الأكثر شعبية */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>الفئات الأكثر شعبية</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الفئة</TableCell>
                    <TableCell align="right">عدد المنشورات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.popularCategories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CategoryIcon color="action" sx={{ ml: 1 }} />
                          {category.name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{Number(category.count || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* أنماط النشاط */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>أنماط النشاط</Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" name="المنشورات" fill="#8884d8" />
                  <Bar dataKey="comments" name="التعليقات" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
