"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Container, Box, Typography, TextField, Button, Tabs, Tab, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel, Alert, Snackbar, Tooltip, Stack, CircularProgress,
  MenuItem, Select, InputLabel, FormControl, TableSortLabel
} from "@mui/material";
import {
  Edit, Delete, Visibility, Refresh, Image as ImageIcon, Inbox as InboxIcon
} from "@mui/icons-material";
import axios from "axios";

/* ---------------- Helpers: auth ---------------- */
async function fetchUserDataFromSession() {
  const res = await fetch("/api/test-session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.authenticated || !data?.user) return null;
  const role_id = data?.rawPayload?.role_id ?? data?.user?.role_id ?? null;
  return { ...data.user, role_id };
}

function getAccessToken() {
  try {
    if (typeof window === "undefined") return null;
    const direct = localStorage.getItem("token");
    if (direct && direct.length > 20) return direct;
    const keys = [
      "sb-access-token","sb:token","sb-rtk","sb:auth-token",
      "auth-token","jwt-token","next-auth.session-token","session-token"
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v && v.length > 20) return v;
    }
  } catch {}
  return null;
}

/* ----------------------- Sorting helpers --------------------- */
function descendingComparator(a, b, orderBy) {
  const va = a?.[orderBy];
  const vb = b?.[orderBy];
  if (va === null || va === undefined) return 1;
  if (vb === null || vb === undefined) return -1;

  if (orderBy === "start_date" || orderBy === "end_date" || orderBy === "created_at") {
    const da = new Date(va).getTime();
    const db = new Date(vb).getTime();
    if (db < da) return -1;
    if (db > da) return 1;
    return 0;
  }

  if (orderBy === "price" || orderBy === "sort_order") {
    const na = Number(va ?? 0);
    const nb = Number(vb ?? 0);
    if (nb < na) return -1;
    if (nb > na) return 1;
    return 0;
  }

  const sa = String(va).toLowerCase();
  const sb = String(vb).toLowerCase();
  if (sb < sa) return -1;
  if (sb > sa) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilized = array.map((el, idx) => [el, idx]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}

/* --------------------------- Tabs ---------------------------- */
const STATUS_TABS = [
  { key: "all", label: "الكل" },
  { key: "active", label: "النشطة" },
  { key: "inactive", label: "غير النشطة" },
  { key: "expired", label: "المنتهية" },
  { key: "upcoming", label: "القادمة" },
];

/* ----------------------- Component --------------------------- */
export default function AdsManagement() {
  /* Auth */
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* Data */
  const [ads, setAds] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [tags, setTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  /* UI */
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("created_at");

  /* Edit dialog */
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", image_url: "",
    price: "0.00", start_date: "", end_date: "",
    is_active: true, position: "top", sort_order: 0, tag_ids: []
  });

  /* Delete dialog */
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  /* Snackbar */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  /* Load session once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthLoading(true);
      const ud = await fetchUserDataFromSession().catch(() => null);
      if (mounted) {
        setUserData(ud);
        setAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* Fetch ads */
  const fetchAds = useCallback(async () => {
    setFetching(true);
    try {
      const token = getAccessToken();
      const res = await axios.get(`/api/ads/my-ads`, {
        withCredentials: true,
        params: { page: 1, limit: 300 },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = res.data;
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setAds(list);
    } catch (err) {
      console.error("Error fetching ads:", err);
      showSnack("فشل في تحميل الإعلانات", "error");
      setAds([]);
    } finally {
      setFetching(false);
    }
  }, []);

  /* Fetch tags (for edit dialog) */
  const fetchTags = useCallback(async () => {
    if (loadingTags || tags.length > 0) return;
    try {
      setLoadingTags(true);
      const token = getAccessToken();
      const res = await axios.get(`/api/tags`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const t = Array.isArray(res.data) ? res.data : [];
      setTags(t);
    } catch (err) {
      console.error("Error fetching tags:", err);
      // صامتة؛ مو ضروري نوقف الصفحة
    } finally {
      setLoadingTags(false);
    }
  }, [loadingTags, tags.length]);

  useEffect(() => {
    if (userData) {
      fetchAds();
      fetchTags();
    }
  }, [userData, fetchAds, fetchTags]);

  /* Helpers: ad status */
  const now = Date.now();
  const computeStatus = (ad) => {
    const start = new Date(ad.start_date).getTime();
    const end = new Date(ad.end_date).getTime();
    if (end < now) return "expired";
    if (start > now) return "upcoming";
    if (!!ad.is_active) return "active";
    return "inactive";
  };

  /* Filter + search + sort */
  const filteredSorted = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const preliminary = ads.filter((ad) => {
      if (tab !== "all") {
        const st = computeStatus(ad);
        if (st !== tab) return false;
      }
      if (!q) return true;
      const title = String(ad?.title || "").toLowerCase();
      const desc = String(ad?.description || "").toLowerCase();
      const pos = String(ad?.position || "").toLowerCase();
      const price = String(ad?.price ?? "").toLowerCase();
      return (
        title.includes(q) ||
        desc.includes(q) ||
        pos.includes(q) ||
        price.includes(q)
      );
    });

    return stableSort(preliminary, getComparator(order, orderBy));
  }, [ads, search, order, orderBy, tab]);

  /* Handlers */
  const handleRequestSort = (property) => {
    if (property === "actions" || property === "is_active" || property === "status") return;
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const openAddDialog = () => {
    setCurrent(null);
    setForm({
      title: "", description: "", image_url: "",
      price: "0.00",
      start_date: new Date().toISOString().slice(0,16),
      end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,16),
      is_active: true, position: "top", sort_order: 0, tag_ids: []
    });
    setOpenEdit(true);
  };

  const openEditDialog = (ad) => {
    setCurrent(ad);
    setForm({
      title: ad.title || "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      price: (ad.price != null ? Number(ad.price).toFixed(2) : "0.00"),
      start_date: ad.start_date ? new Date(ad.start_date).toISOString().slice(0,16) : new Date().toISOString().slice(0,16),
      end_date: ad.end_date ? new Date(ad.end_date).toISOString().slice(0,16) : new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,16),
      is_active: !!ad.is_active,
      position: ad.position || "top",
      sort_order: ad.sort_order ?? 0,
      tag_ids: Array.isArray(ad.tags) ? ad.tags.map(t => ({ id: t.id, name: t.name })) : []
    });
    setOpenEdit(true);
  };

  const closeEdit = () => { setOpenEdit(false); setCurrent(null); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const token = getAccessToken();
      const payload = {
        title: form.title,
        description: form.description,
        image_url: form.image_url,
        price: parseFloat(form.price || "0"),
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        is_active: !!form.is_active,
        position: form.position,
        sort_order: Number(form.sort_order) || 0,
        tags: (form.tag_ids || []).map(t => ({ id: t.id || null, name: t.name || "" }))
      };

      if (current?.id) {
        await axios.put(`/api/ads/${current.id}`, payload, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        showSnack("تم تحديث الإعلان بنجاح", "success");
      } else {
        await axios.post(`/api/ads`, payload, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        showSnack("تم إضافة الإعلان بنجاح", "success");
      }

      await fetchAds();
      closeEdit();
    } catch (err) {
      console.error("Error saving ad:", err);
      showSnack("حدث خطأ أثناء الحفظ", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteDialog = (ad) => { setToDelete(ad); setOpenDelete(true); };
  const closeDelete = () => { setOpenDelete(false); setToDelete(null); };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setDeleteLoading(true);
    try {
      const token = getAccessToken();
      await axios.delete(`/api/ads/${toDelete.id}`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      showSnack("تم حذف الإعلان بنجاح", "success");
      await fetchAds();
      closeDelete();
    } catch (err) {
      console.error("Error deleting ad:", err);
      showSnack("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (ad) => {
    try {
      const token = getAccessToken();
      await axios.put(`/api/ads/${ad.id}/status`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      showSnack(`تم ${ad.is_active ? "تعطيل" : "تفعيل"} الإعلان`, "success");
      await fetchAds();
    } catch (err) {
      console.error("Error toggling ad status:", err);
      showSnack("تعذّر تغيير الحالة", "error");
    }
  };

  const showSnack = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnack = () => setSnackbar((s) => ({ ...s, open: false }));

  /* Auth gates */
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>جاري التحقق من الحساب...</Typography>
        </Box>
      </Container>
    );
  }
  if (!userData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Alert severity="warning">يجب تسجيل الدخول للوصول إلى إدارة الإعلانات</Alert>
        </Box>
      </Container>
    );
  }

  const headCells = [
    { id: "title", label: "العنوان" },
    { id: "position", label: "الموقع" },
    { id: "price", label: "السعر" },
    { id: "start_date", label: "تاريخ البداية" },
    { id: "end_date", label: "تاريخ النهاية" },
    { id: "sort_order", label: "الترتيب" },
    { id: "is_active", label: "الحالة", sortable: false },
    { id: "status", label: "التصنيف", sortable: false },
    { id: "actions", label: "الإجراءات", sortable: false },
  ].map(cell => ({
    ...cell,
    label: (
      <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {cell.label}
      </Typography>
    )
  }));

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString("ar-EG") : "-";

  const positionLabel = (p) =>
    p === "top" ? "أعلى الصفحة" :
    p === "sidebar" ? "الشريط الجانبي" :
    p === "middle" ? "منتصف الصفحة" : "أسفل الصفحة";

  const statusChip = (ad) => {
    const st = computeStatus(ad);
    const map = {
      active: { label: "نشط", color: "success" },
      inactive: { label: "غير نشط", color: "default" },
      expired: { label: "منتهي", color: "error" },
      upcoming: { label: "قادِم", color: "warning" },
    };
    const cfg = map[st];
    return <Chip size="small" label={cfg.label} color={cfg.color} />;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          إدارة الإعلانات
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchAds}
            variant="outlined"
            sx={{
              color: 'var(--text-primary)',
              borderColor: 'var(--primary)',
              '&:hover': { borderColor: 'var(--gold-border)', backgroundColor: 'var(--muted)' },
              fontWeight: 500,
            }}
          >
            تحديث
          </Button>
          <Button
            startIcon={<Edit />}
            onClick={openAddDialog}
            variant="contained"
          >
            إعلان جديد
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: 'var(--primary)', height: 2 },
            '& .MuiTab-root': {
              fontWeight: 600,
              color: 'var(--text-secondary)',
              '&.Mui-selected': { color: 'var(--primary)' },
              '&:hover': { color: 'var(--primary)', opacity: 0.9 },
            },
            borderBottom: '1px solid var(--border)',
            width: '100%',
          }}
        >
          {STATUS_TABS.map((t) => (
            <Tab
              key={t.key}
              label={t.label}
              value={t.key}
              sx={{ minWidth: 'unset', px: 2, fontSize: '0.95rem' }}
            />
          ))}
        </Tabs>

        <TextField
          label="ابحث في العنوان/الوصف/السعر/الموقع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: 'var(--border)', borderRadius: '8px' },
              '&:hover fieldset': { borderColor: 'var(--primary)' },
              '&.Mui-focused fieldset': { borderColor: 'var(--primary)' },
              color: 'var(--text-primary)', backgroundColor: 'var(--card)',
            },
            '& .MuiInputLabel-root': {
              color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--primary)' },
            },
            '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
          }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'var(--card)',
          border: '1px solid', borderColor: 'var(--border)',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {headCells.map((cell) => (
                  <TableCell
                    key={cell.id}
                    sortDirection={orderBy === cell.id ? order : false}
                    sx={{
                      '& .MuiTableSortLabel-root': {
                        color: 'var(--text-primary)',
                        '&:hover': { color: 'var(--primary)' },
                        '&.Mui-active': { color: 'var(--primary)' },
                      },
                      '& .MuiTableSortLabel-icon': { color: 'var(--primary) !important' },
                    }}
                  >
                    {cell.sortable === false ? (
                      cell.label
                    ) : (
                      <TableSortLabel
                        active={orderBy === cell.id}
                        direction={orderBy === cell.id ? order : "asc"}
                        onClick={() => handleRequestSort(cell.id)}
                        sx={{ '&:hover': { color: 'var(--primary)' } }}
                      >
                        {cell.label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {fetching ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Box sx={{ py: 4 }}><CircularProgress /></Box>
                  </TableCell>
                </TableRow>
              ) : filteredSorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headCells.length} align="center">
                    <Box sx={{ py: 6, textAlign: 'center', opacity: 0.8 }}>
                      <InboxIcon sx={{ fontSize: 46, mb: 1 }} />
                      <Typography>لا توجد إعلانات مطابقة</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSorted.map((ad) => (
                  <TableRow
                    key={ad.id}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'var(--muted)' },
                      '& .MuiTableCell-root': { color: 'var(--text-primary)', borderBottomColor: 'var(--border)' },
                    }}
                  >
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>{ad.title}</Typography>
                        {ad.description && (
                          <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }} noWrap>
                            {ad.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                          <ImageIcon fontSize="small" sx={{ opacity: 0.7 }} />
                          <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                            {ad.image_url || "—"}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>

                    <TableCell>{positionLabel(ad.position)}</TableCell>
                    <TableCell>{ad.price != null ? Number(ad.price).toLocaleString("ar-EG") : "-"}</TableCell>
                    <TableCell>{formatDate(ad.start_date)}</TableCell>
                    <TableCell>{formatDate(ad.end_date)}</TableCell>
                    <TableCell>{ad.sort_order ?? 0}</TableCell>

                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!ad.is_active && new Date(ad.end_date).getTime() > now}
                            onChange={() => toggleActive(ad)}
                            color="primary"
                            disabled={new Date(ad.end_date).getTime() <= now}
                          />
                        }
                        label={!!ad.is_active ? "نشط" : "غير نشط"}
                      />
                    </TableCell>

                    <TableCell>{statusChip(ad)}</TableCell>

                    <TableCell align="center">
                      <Tooltip title="تعديل">
                        <IconButton color="primary" onClick={() => openEditDialog(ad)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton color="error" onClick={() => openDeleteDialog(ad)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="عرض (رابط الصورة)">
                        <span>
                          <IconButton
                            color="info"
                            component="a"
                            href={ad.image_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            disabled={!ad.image_url}
                          >
                            <Visibility />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openEdit}
        onClose={closeEdit}
        maxWidth="sm"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            backgroundColor: 'var(--card)',
            backgroundImage: 'none',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            py: 2, px: 3, fontWeight: 600, fontSize: '1.1rem',
          }}
        >
          {current ? "تعديل الإعلان" : "إضافة إعلان"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="العنوان"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="الوصف"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="رابط الصورة"
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              fullWidth
              required
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="السعر"
                value={form.price}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) {
                    setForm((f) => ({ ...f, price: v }));
                  }
                }}
                onBlur={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n)) {
                    setForm((f) => ({ ...f, price: n.toFixed(2) }));
                  }
                }}
                fullWidth
                inputProps={{ inputMode: "decimal", pattern: "[0-9]*(\\.[0-9]{0,2})?" }}
                required
              />
              <FormControl fullWidth>
                <InputLabel id="position-label">الموقع</InputLabel>
                <Select
                  labelId="position-label"
                  label="الموقع"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                >
                  <MenuItem value="top">أعلى الصفحة</MenuItem>
                  <MenuItem value="sidebar">الشريط الجانبي</MenuItem>
                  <MenuItem value="middle">منتصف الصفحة</MenuItem>
                  <MenuItem value="bottom">أسفل الصفحة</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="تاريخ البداية"
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="تاريخ النهاية"
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                fullWidth
                required
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <TextField
                label="ترتيب العرض"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    color="primary"
                  />
                }
                label={form.is_active ? "نشط" : "غير نشط"}
              />
            </Stack>

            {/* ملاحظة: لو عندك أوتوكومبليت للتاغات أضفه هنا بنفس نمطك الحالي */}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>إلغاء</Button>
          <Button onClick={saveEdit} variant="contained" disabled={editLoading}>
            {editLoading ? "جارٍ الحفظ..." : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={openDelete}
        onClose={closeDelete}
        dir="rtl"
        PaperProps={{
          sx: {
            backgroundColor: 'var(--card)',
            backgroundImage: 'none',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            py: 2, px: 3, fontWeight: 600, fontSize: '1.1rem',
          }}
        >
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف الإعلان "{toDelete?.title}"؟ لا يمكن التراجع عن هذه العملية.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>إلغاء</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "جارٍ الحذف..." : "حذف"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
