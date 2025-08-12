"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container, Box, Typography, TextField, Button, Tabs, Tab, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel, Alert, Snackbar, Tooltip, Stack, CircularProgress,
  TableSortLabel, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
import { Edit, Delete, Visibility, Refresh } from "@mui/icons-material";
import axios from "axios";

/* ---------- Govs ---------- */
const PALESTINIAN_GOVS = [
  "القدس","رام الله والبيرة","الخليل","نابلس","جنين",
  "أريحا والأغوار","طوباس","طولكرم","قلقيلية","سلفيت",
  "بيت لحم","غزة","شمال غزة","دير البلح","خان يونس","رفح",
];

/* ---------- Session helper ---------- */
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

/* ---------- Sorting helpers ---------- */
function descendingComparator(a, b, orderBy) {
  const va = a?.[orderBy];
  const vb = b?.[orderBy];
  if (va == null) return 1;
  if (vb == null) return -1;

  if (orderBy === "created_at") {
    const da = new Date(va).getTime();
    const db = new Date(vb).getTime();
    if (db < da) return -1;
    if (db > da) return 1;
    return 0;
  }

  if (orderBy === "price") {
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

/* ---------- Tabs ---------- */
const STATUS_TABS = [
  { key: "all", label: "الكل" },
  { key: "approved", label: "المعتمدة" },
  { key: "pending", label: "قيد المراجعة" },
  { key: "rejected", label: "المرفوضة" },
];

/* ========================= PAGE ============================== */
export default function MyPosts() {
  const router = useRouter();

  /* Auth */
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* Data */
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(false);

  /* UI state */
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("created_at");

  /* Edit dialog */
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [current, setCurrent] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  /* Tags (search-only existing) */
  const [tagQuery, setTagQuery] = useState("");
  const [tagOptions, setTagOptions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagAbort, setTagAbort] = useState(null);

  /* Delete dialog */
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  /* Snackbar (تعريف واحد فقط) */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showSnack = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });
  const closeSnack = () => setSnackbar((s) => ({ ...s, open: false }));

  /* Load session */
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAuthLoading(true);
      const ud = await fetchUserDataFromSession().catch(() => null);
      if (mounted) {
        setUser(ud);
        setAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* Fetch my posts */
  const fetchMyPosts = useCallback(async () => {
    setFetching(true);
    try {
      const params = { page: 1, limit: 300 };
      if (tab !== "all") params.status = tab;
      const res = await axios.get(`/api/my/posts`, {
        params,
        withCredentials: true,
      });
      const data = res.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [];
      setPosts(items);
    } catch (err) {
      console.error("Error fetching my posts:", err);
      showSnack("فشل في تحميل منشوراتك", "error");
    } finally {
      setFetching(false);
    }
  }, [tab]);

  useEffect(() => {
    if (user) fetchMyPosts();
  }, [user, tab, fetchMyPosts]);

  /* Search + sort (client-side) */
  const filteredSorted = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const filtered = posts.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const gov = String(p?.governorate || "").toLowerCase();
      const cat = String(p?.category_name || "").toLowerCase();
      const tags = Array.isArray(p?.tags) ? p.tags.join(",").toLowerCase() : "";
      return (
        title.includes(q) ||
        desc.includes(q) ||
        gov.includes(q) ||
        cat.includes(q) ||
        tags.includes(q)
      );
    });
    return stableSort(filtered, getComparator(order, orderBy));
  }, [posts, search, order, orderBy]);

  /* Tags search (existing only) with debounce */
  useEffect(() => {
    const q = tagQuery.trim();
    if (!q) {
      setTagOptions([]);
      if (tagAbort) tagAbort.abort?.();
      return;
    }
    const controller = new AbortController();
    setTagAbort(controller);
    const t = setTimeout(async () => {
      setTagLoading(true);
      try {
        const res = await fetch(`/api/tags?search=${encodeURIComponent(q)}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const list = await res.json().catch(() => []);
          setTagOptions(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        // ignore
      } finally {
        setTagLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagQuery]);

  const addTagByName = (name) => {
    const n = String(name || "").trim();
    if (!n) return;
    if (!selectedTags.includes(n)) setSelectedTags((prev) => [...prev, n]);
    setTagQuery("");
    setTagOptions([]);
  };
  const removeTag = (name) => {
    setSelectedTags((prev) => prev.filter((t) => t !== name));
  };

  /* Actions */
  const openEditDialog = (post) => {
    setCurrent(post);
    setTitle(post?.title || "");
    setDescription(post?.description || "");
    setPrice(post?.price ?? "");
    setGovernorate(post?.governorate || "");
    setIsVisible(!!post?.is_visible);
    setSelectedTags(Array.isArray(post?.tags) ? post.tags : []);
    setOpenEdit(true);
  };
  const closeEdit = () => {
    setOpenEdit(false);
    setCurrent(null);
    setTagQuery("");
    setTagOptions([]);
  };

  const saveEdit = async () => {
    if (!current?.id) return;
    setEditLoading(true);
    try {
      const payload = {
        title: title?.trim(),
        description: description?.trim(),
        governorate: governorate || null,
        price: (price === "" || price === null) ? null : Number(price),
        tags: selectedTags,          // أسماء لتاغات موجودة فقط
        is_visible: isVisible,
      };
      await axios.patch(`/api/my/posts/${current.id}`, payload, { withCredentials: true });
      showSnack("تم حفظ التعديلات", "success");
      await fetchMyPosts();
      closeEdit();
    } catch (err) {
      console.error("Error saving post:", err);
      const msg = err?.response?.data?.message || "تعذّر حفظ التعديلات";
      showSnack(msg, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const toggleVisibility = async (post) => {
    try {
      await axios.patch(`/api/my/posts/${post.id}`, { is_visible: !post.is_visible }, { withCredentials: true });
      showSnack("تم تحديث الظهور", "success");
      await fetchMyPosts();
    } catch (err) {
      console.error("Error toggling visibility:", err);
      showSnack("تعذّر تحديث الظهور", "error");
    }
  };

  const openDeleteDialog = (post) => {
    setToDelete(post);
    setOpenDelete(true);
  };
  const closeDelete = () => {
    setOpenDelete(false);
    setToDelete(null);
  };
  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/my/posts/${toDelete.id}`, { withCredentials: true });
      showSnack("تم حذف المنشور بنجاح", "success");
      await fetchMyPosts();
      closeDelete();
    } catch (err) {
      console.error("Error deleting post:", err);
      showSnack("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

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
  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Alert severity="info">
            يجب تسجيل الدخول للوصول إلى منشوراتك.
            <Button href="/auth" variant="text" sx={{ ml: 1 }}>تسجيل الدخول</Button>
          </Alert>
        </Box>
      </Container>
    );
  }

  /* Table header cells with sorting */
  const headCells = [
    { id: "title", label: "العنوان" },
    { id: "category_name", label: "التصنيف" },
    { id: "governorate", label: "المحافظة" },
    { id: "price", label: "السعر" },
    { id: "created_at", label: "تاريخ الإنشاء" },
    { id: "status", label: "الحالة" },
    { id: "is_visible", label: "الظهور" },
    { id: "actions", label: "الإجراءات", sortable: false },
  ].map(cell => ({
    ...cell,
    label: (
      <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {cell.label}
      </Typography>
    )
  }));
  const handleRequestSort = (property) => {
    if (property === "actions" || property === "is_visible" || property === "status") return;
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
          منشوراتي
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button 
            startIcon={<Refresh />} 
            onClick={fetchMyPosts} 
            variant="outlined"
            sx={{
              color: 'var(--text-primary)',
              borderColor: 'var(--primary)',
              '&:hover': {
                borderColor: 'var(--gold-border)',
                backgroundColor: 'var(--muted)',
              },
              fontWeight: 500,
            }}
          >
            تحديث
          </Button>
          <Button 
            startIcon={<Visibility />} 
            onClick={() => router.push('/services')} 
            variant="contained"
            sx={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              '&:hover': {
                backgroundColor: 'var(--gold-border)',
              },
              fontWeight: 500,
            }}
          >
            إضافة منشور جديد
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
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--primary)',
              height: 2,
            },
            '& .MuiTab-root': { 
              fontWeight: 600,
              color: 'var(--text-secondary)',
              '&.Mui-selected': {
                color: 'var(--primary)',
              },
              '&:hover': {
                color: 'var(--primary)',
                opacity: 0.9,
              },
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
              sx={{
                minWidth: 'unset',
                px: 2,
                fontSize: '0.95rem',
              }}
            />
          ))}
        </Tabs>

        <TextField
          label="ابحث في العنوان/الوصف/التاغات/التصنيف/المحافظة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'var(--border)',
                borderRadius: '8px',
              },
              '&:hover fieldset': {
                borderColor: 'var(--primary)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--primary)',
              },
              color: 'var(--text-primary)',
              backgroundColor: 'var(--card)',
            },
            '& .MuiInputLabel-root': {
              color: 'var(--text-secondary)',
              '&.Mui-focused': {
                color: 'var(--primary)',
              },
            },
            '& .MuiSvgIcon-root': {
              color: 'var(--text-secondary)',
            },
          }}
        />
      </Box>

      <Paper 
        elevation={0}
        sx={{
          backgroundColor: 'var(--card)',
          border: '1px solid',
          borderColor: 'var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
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
                        '&:hover': {
                          color: 'var(--primary)',
                        },
                        '&.Mui-active': {
                          color: 'var(--primary)',
                        },
                      },
                      '& .MuiTableSortLabel-icon': {
                        color: 'var(--primary) !important',
                      },
                    }}
                  >
                    {cell.sortable === false ? (
                      cell.label
                    ) : (
                      <TableSortLabel
                        active={orderBy === cell.id}
                        direction={orderBy === cell.id ? order : "asc"}
                        onClick={() => handleRequestSort(cell.id)}
                        sx={{
                          '&:hover': {
                            color: 'var(--primary)',
                          },
                        }}
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
                    لا توجد منشورات مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                filteredSorted.map((post) => (
                  <TableRow 
                    key={post.id} 
                    hover 
                    sx={{ 
                      '&:hover': {
                        backgroundColor: 'var(--muted)',
                      },
                      '&.MuiTableRow-root': {
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'var(--muted)',
                        },
                      },
                      '& .MuiTableCell-root': {
                        color: 'var(--text-primary)',
                        borderBottomColor: 'var(--border)',
                      },
                    }}
                  >
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography fontWeight={700}>{post.title}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {post.description}
                        </Typography>
                        {Array.isArray(post.tags) && post.tags.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: "wrap" }}>
                            {post.tags.slice(0, 6).map((t, idx) => (
                              <Chip key={idx} label={t} size="small" />
                            ))}
                            {post.tags.length > 6 && (
                              <Chip label={`+${post.tags.length - 6}`} size="small" />
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>{post.category_name || "-"}</TableCell>
                    <TableCell>{post.governorate || "-"}</TableCell>
                    <TableCell>{post.price != null ? Number(post.price).toLocaleString("ar-EG") : "-"}</TableCell>
                    <TableCell>
                      {post.created_at ? new Date(post.created_at).toLocaleString("ar-EG") : "-"}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          post.status === "approved"
                            ? "معتمدة"
                            : post.status === "pending"
                            ? "قيد المراجعة"
                            : "مرفوضة"
                        }
                        color={
                          post.status === "approved"
                            ? "success"
                            : post.status === "pending"
                            ? "warning"
                            : "error"
                        }
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!post.is_visible}
                            onChange={() => toggleVisibility(post)}
                            color="primary"
                          />
                        }
                        label={post.is_visible ? "ظاهر" : "مخفي"}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="تعديل">
                        <IconButton color="primary" onClick={() => openEditDialog(post)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton color="error" onClick={() => openDeleteDialog(post)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="عرض عام">
                        <IconButton color="info" component="a" href={`/posts/${post.id}`} target="_blank">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={openEdit} 
        onClose={closeEdit} 
        maxWidth="md" 
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
        <DialogTitle sx={{ 
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          py: 2,
          px: 3,
          fontWeight: 600,
          fontSize: '1.1rem',
        }}>
          تعديل المنشور
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="العنوان"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
            />

            <TextField
              label="الوصف"
              fullWidth
              multiline
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="السعر (اختياري)"
                type="number"
                inputMode="decimal"
                fullWidth
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />

              <FormControl fullWidth>
                <InputLabel id="gov-label">المحافظة</InputLabel>
                <Select
                  labelId="gov-label"
                  label="المحافظة"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                >
                  {PALESTINIAN_GOVS.map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    color="primary"
                  />
                }
                label={isVisible ? "ظاهر" : "مخفي"}
              />
            </Stack>

            {/* Tags: select from existing only */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>التاغات (من الموجودة فقط)</Typography>
              <TextField
                placeholder="ابحث عن تاغ ثم اضغط Enter للإضافة"
                fullWidth
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const match = tagOptions.find((t) => t.name === tagQuery.trim());
                    if (match) addTagByName(match.name);
                  }
                }}
              />
              {tagLoading && <Typography variant="caption">جارٍ البحث...</Typography>}
              {!!tagOptions.length && (
                <Paper variant="outlined" sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                  {tagOptions.map((t) => (
                    <Button
                      key={t.id}
                      onClick={() => addTagByName(t.name)}
                      sx={{ justifyContent: "flex-start", width: "100%", px: 2, py: 1 }}
                    >
                      {t.name}
                    </Button>
                  ))}
                </Paper>
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {selectedTags.map((n) => (
                  <Chip key={n} label={n} onDelete={() => removeTag(n)} />
                ))}
              </Stack>
            </Box>
          </Box>
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
        <DialogTitle sx={{ 
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          py: 2,
          px: 3,
          fontWeight: 600,
          fontSize: '1.1rem',
        }}>
          تأكيد الحذف
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography color="var(--text-primary)">هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع.</Typography>
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
