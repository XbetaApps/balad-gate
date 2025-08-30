"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Container, Box, Typography, TextField, Button, Tabs, Tab, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, FormControlLabel, Alert, Snackbar, Tooltip, Stack, CircularProgress,
  MenuItem, Select, InputLabel, FormControl, TableSortLabel
} from "@mui/material";
import { Edit, Delete, Visibility, Refresh } from "@mui/icons-material";
import axios from "axios";

/* ---------------- Helpers: auth & admin check ---------------- */
function isAdmin(userData) {
  return !!userData && Number(userData.role_id) === 4;
}
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

/* --------------- Notifications hook (future-ready) ------------ */
async function notifyUserAction(/* { userId, postId, action, payload } */) {
  // TODO: لاحقاً اربطه بنقطة نهاية للإشعارات (web push / email / in-app)
  // console.log("notifyUserAction", { userId, postId, action, payload });
}

/* ----------------------- Sorting helpers --------------------- */
function descendingComparator(a, b, orderBy) {
  const va = a?.[orderBy];
  const vb = b?.[orderBy];
  if (va === null || va === undefined) return 1;
  if (vb === null || vb === undefined) return -1;

  // تاريخ
  if (orderBy === "created_at") {
    const da = new Date(va).getTime();
    const db = new Date(vb).getTime();
    if (db < da) return -1;
    if (db > da) return 1;
    return 0;
  }

  // رقمي (السعر)
  if (orderBy === "price") {
    const na = Number(va ?? 0);
    const nb = Number(vb ?? 0);
    if (nb < na) return -1;
    if (nb > na) return 1;
    return 0;
  }

  // نصي
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

/* --------------------------- Page ---------------------------- */
const STATUS_TABS = [
  { key: "approved", label: "المعتمدة" },
  { key: "pending", label: "قيد المراجعة" },
  { key: "rejected", label: "المرفوضة" },
];

export default function PostsManagement({ userData: userDataProp = null, userId = null }) {
  /* Auth */
  const [userData, setUserData] = useState(userDataProp);
  const [currentUserId, setCurrentUserId] = useState(userId);
  const [authLoading, setAuthLoading] = useState(!userDataProp);

  /* Data state */
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(false);

  /* UI state */
  const [tab, setTab] = useState("approved"); // افتراضي: المعتمدة
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("created_at");

  /* Edit dialog */
  const [openEdit, setOpenEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [current, setCurrent] = useState(null); // post object
  const [editStatus, setEditStatus] = useState("approved");
  const [editVisible, setEditVisible] = useState(true);
  const [editReason, setEditReason] = useState("");

  /* Delete dialog */
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  /* Snackbar */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  /* Load session */
  useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => { mounted = false; };
  }, [userDataProp]);

  /* Fetch posts when tab changes or after actions */
  const fetchPosts = useCallback(async () => {
    setFetching(true);
    try {
      const res = await axios.get(`/api/admin/posts`, {
        withCredentials: true,
        params: { status: tab, page: 1, limit: 300 }, // نجيب كمية معقولة ونفرز/نبحث عميلًا
      });
      const data = res.data;
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      showSnack("فشل في تحميل المنشورات", "error");
    } finally {
      setFetching(false);
    }
  }, [tab]);

  useEffect(() => {
    if (isAdmin(userData)) fetchPosts();
  }, [userData, tab, fetchPosts]);

  /* Search + sort (client-side) */
  const filteredSorted = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    const filtered = posts.filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const gov = String(p?.governorate || "").toLowerCase();
      const cat = String(p?.category_name || "").toLowerCase();
      const userName = String(p?.user_name || "").toLowerCase();
      const userEmail = String(p?.user_email || "").toLowerCase();
      const tags = Array.isArray(p?.tags) ? p.tags.join(",").toLowerCase() : "";
      return (
        title.includes(q) ||
        desc.includes(q) ||
        gov.includes(q) ||
        cat.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        tags.includes(q)
      );
    });
    return stableSort(filtered, getComparator(order, orderBy));
  }, [posts, search, order, orderBy]);

  /* Actions */
  const openEditDialog = (post) => {
    setCurrent(post);
    setEditStatus(post?.status || "pending");
    setEditVisible(!!post?.is_visible);
    setEditReason(post?.rejection_reason || "");
    setOpenEdit(true);
  };
  const closeEdit = () => {
    setOpenEdit(false);
    setCurrent(null);
    setEditReason("");
  };
  const saveEdit = async () => {
    if (!current?.id) return;
    setEditLoading(true);
    try {
      const payload = {
        status: editStatus,
        is_visible: editVisible,
        ...(editStatus === "rejected" && editReason.trim()
          ? { rejection_reason: editReason.trim() }
          : {}),
      };
      await axios.patch(`/api/admin/posts?id=${current.id}`, payload, { withCredentials: true });
      showSnack("تم تحديث المنشور بنجاح", "success");

      // إشعار مستقبلي (غير مفعّل الآن)
      notifyUserAction(/* {
        userId: current.user_id,
        postId: current.id,
        action: 'status_changed',
        payload: payload
      } */);

      await fetchPosts();
      closeEdit();
    } catch (err) {
      console.error("Error updating post:", err);
      showSnack("حدث خطأ أثناء التحديث", "error");
    } finally {
      setEditLoading(false);
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
      await axios.delete(`/api/admin/posts?id=${toDelete.id}`, { withCredentials: true });
      showSnack("تم حذف المنشور بنجاح", "success");
      // إشعار مستقبلي ممكن هنا أيضًا
      await fetchPosts();
      closeDelete();
    } catch (err) {
      console.error("Error deleting post:", err);
      showSnack("حدث خطأ أثناء الحذف", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleVisibility = async (post) => {
    try {
      await axios.patch(
        `/api/admin/posts/${post.id}`,
        { is_visible: !post.is_visible },
        { withCredentials: true }
      );
      showSnack("تم تحديث الظهور", "success");
      await fetchPosts();
    } catch (err) {
      console.error("Error toggling visibility:", err);
      showSnack("تعذّر تحديث الظهور", "error");
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
          <Typography sx={{ mt: 2 }}>جاري التحقق من الصلاحيات...</Typography>
        </Box>
      </Container>
    );
  }
  if (!isAdmin(userData)) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Alert severity="warning">غير مصرح لك بالوصول إلى هذه الصفحة</Alert>
        </Box>
      </Container>
    );
  }

  /* Table header cells with sorting */
  const headCells = [
    { id: "title", label: "العنوان" },
    { id: "user_name", label: "اسم المستخدم" },
    { id: "category_name", label: "التصنيف" },
    { id: "governorate", label: "المحافظة" },
    { id: "price", label: "السعر" },
    { id: "created_at", label: "تاريخ الإنشاء" },
    { id: "is_visible", label: "الظهور" },
    { id: "status", label: "الحالة" },
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

  /* UI */
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>إدارة المنشورات</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            startIcon={<Refresh />}
            onClick={fetchPosts}
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
          label="ابحث في العنوان/الوصف/التاغات/التصنيف/المحافظة/اسم المستخدم..."
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
                    لا توجد نتائج مطابقة
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
                        <Typography variant="body2" sx={{ color: 'var(--muted-foreground)' }} noWrap>
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

                    <TableCell>{post.user_name || post.user_email || '—'}</TableCell>
                    <TableCell>{post.category_name || '—'}</TableCell>
                    <TableCell>{post.governorate || '—'}</TableCell>
                    <TableCell>{post.price != null ? Number(post.price).toLocaleString("ar-EG") : "-"}</TableCell>
                    <TableCell>
                      {post.created_at ? new Date(post.created_at).toLocaleString("ar-EG") : "-"}
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

                    <TableCell align="center">
                      <Tooltip title="إدارة">
                        <IconButton color="primary" onClick={() => openEditDialog(post)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="حذف">
                        <IconButton color="error" onClick={() => openDeleteDialog(post)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="عرض">
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

      {/* Edit/Moderate Dialog */}
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
        <DialogTitle sx={{ 
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          py: 2,
          px: 3,
          fontWeight: 600,
          fontSize: '1.1rem',
        }}>إدارة المنشور</DialogTitle>
        <DialogContent>
          {current && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {current.title}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">الحالة</InputLabel>
                  <Select
                    labelId="status-label"
                    value={editStatus}
                    label="الحالة"
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <MenuItem value="approved">معتمدة</MenuItem>
                    <MenuItem value="pending">قيد المراجعة</MenuItem>
                    <MenuItem value="rejected">مرفوضة</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={editVisible}
                      onChange={(e) => setEditVisible(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={editVisible ? "ظاهر" : "مخفي"}
                />
              </Stack>

              {editStatus === "rejected" && (
                <TextField
                  label="سبب الرفض (اختياري)"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mt: 2 }}
                />
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  التصنيف: {current.category_name || "-"} &nbsp;•&nbsp; المحافظة: {current.governorate || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  السعر: {current.price != null ? Number(current.price).toLocaleString("ar-EG") : "-"}
                </Typography>
              </Box>
            </Box>
          )}
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
        }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف المنشور "{toDelete?.title}"؟ لا يمكن التراجع عن هذه العملية.
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
