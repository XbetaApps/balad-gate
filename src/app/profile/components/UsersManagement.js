"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar, Tooltip, Pagination
} from '@mui/material';
import { Edit, Delete, Refresh, Add } from '@mui/icons-material';

// ===== Helpers =====
function isAdmin(userData) {
  return !!userData && Number(userData.role_id) === 4;
}

function roleIdToString(role_id) {
  return Number(role_id) === 4 ? 'admin' : 'user';
}

function roleStringToId(roleStr) {
  return roleStr === 'admin' ? 4 : 1;
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

// ===== Component =====
const UsersManagement = ({ userData: userDataProp = null }) => {
  // Auth state
  const [userData, setUserData] = useState(userDataProp);
  const [authLoading, setAuthLoading] = useState(!userDataProp);

  // Table state
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [page, setPage] = useState(1);          // 1-based
  const [pageSize, setPageSize] = useState(10); // يمكن تغييره من الواجهة
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  // Dialogs / Editing
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user', // للعرض فقط
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Loading flags
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Current admin id (to prevent self delete)
  const currentUserId = userData?.id ?? null;

  // 1) Load session if not provided
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

  // 2) Fetch users when admin / params change (with debounce on search)
  useEffect(() => {
    if (!isAdmin(userData)) return;

    const controller = new AbortController();
    const id = setTimeout(() => {
      fetchUsers({ signal: controller.signal }).catch(() => {});
    }, 300); // debounce
    return () => {
      clearTimeout(id);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, page, pageSize, searchTerm]);

  async function fetchUsers({ signal } = {}) {
    try {
      setListLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (searchTerm.trim()) params.set('q', searchTerm.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      const normalized = list.map(u => ({
        ...u,
        role: roleIdToString(u.role_id),
      }));
      setRows(normalized);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      console.error('fetchUsers error:', e);
      showSnackbar('فشل في تحميل المستخدمين', 'error');
    } finally {
      setListLoading(false);
    }
  }

  // Filter on client (اختياري) — هنا نعتمد بحث السيرفر، لكن نبقي fallback
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(
      (r) => (r?.name || '').toLowerCase().includes(q) || (r?.email || '').toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  // Handlers
  const handleSearch = (e) => {
    setPage(1);
    setSearchTerm(e.target.value);
  };

  const handleEditClick = (row) => {
    setEditingUser({
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      role: row.role || roleIdToString(row.role_id),
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedUser(row);
    setOpenDeleteDialog(true);
  };

  const handleResetPassword = (row) => {
    // لا يوجد endpoint حالياً — نبقيه بصريًا:
    setSelectedUser(row);
    setOpenResetDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);

      const payload = {
        name: editingUser.name || null,
        email: (editingUser.email || '').trim().toLowerCase(),
        role_id: roleStringToId(editingUser.role),
      };

      let res, data;
      if (editingUser.id) {
        // Update
        res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await fetch('/api/admin/users', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      showSnackbar(editingUser.id ? 'تم تحديث المستخدم بنجاح' : 'تمت إضافة المستخدم بنجاح', 'success');
      setOpenDialog(false);
      await fetchUsers();
    } catch (e) {
      console.error('save user error:', e);
      const msg = String(e?.message || '').includes('duplicate')
        ? 'البريد الإلكتروني مستخدم من قبل'
        : 'حدث خطأ أثناء حفظ المستخدم';
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!selectedUser?.id) return;

      if (selectedUser.id === currentUserId) {
        showSnackbar('لا يمكنك حذف حسابك الإداري الحالي', 'error');
        setOpenDeleteDialog(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      showSnackbar('تم حذف المستخدم بنجاح', 'success');
      setOpenDeleteDialog(false);
      await fetchUsers();
    } catch (e) {
      console.error('delete user error:', e);
      showSnackbar('حدث خطأ أثناء حذف المستخدم', 'error');
    }
  };

  const handleResetPasswordConfirm = async () => {
    try {
      if (!selectedUser?.id) return;

      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ newPassword: '123456' })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'فشل في تحديث كلمة المرور');
      }

      setOpenResetDialog(false);
      showSnackbar('تم تعيين كلمة المرور الجديدة إلى 123456', 'success');
    } catch (error) {
      console.error('Error resetting password:', error);
      showSnackbar(error.message || 'حدث خطأ أثناء تعيين كلمة المرور', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Auth gates
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            إدارة المستخدمين {listLoading ? '…' : ''}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => {
              setEditingUser({ id: '', name: '', email: '', role: 'user' });
              setOpenDialog(true);
            }}
          >
            إضافة مستخدم جديد
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            label="بحث عن مستخدم..."
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
          />
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel>حجم الصفحة</InputLabel>
            <Select
              value={pageSize}
              label="حجم الصفحة"
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
            >
              {[10, 20, 50, 100].map(sz => <MenuItem key={sz} value={sz}>{sz}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role === 'admin' ? 'مدير' : 'مستخدم'}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="تعديل">
                      <IconButton onClick={() => handleEditClick(row)} color="primary" sx={{ mr: 0.5 }}>
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="إعادة تعيين كلمة المرور">
                      <IconButton onClick={() => handleResetPassword(row)} color="secondary" sx={{ mr: 0.5 }}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>

                    {row.id !== currentUserId && (
                      <Tooltip title="حذف">
                        <IconButton onClick={() => handleDeleteClick(row)} color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {listLoading ? 'جاري التحميل…' : 'لا توجد نتائج مطابقة'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
          <Typography variant="body2">
            إجمالي: {total} مستخدم
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>{editingUser.id ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, minWidth: 400 }}>
              <TextField
                fullWidth
                label="الاسم"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>الدور</InputLabel>
                <Select
                  value={editingUser.role}
                  label="الدور"
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <MenuItem value="user">مستخدم عادي</MenuItem>
                  <MenuItem value="admin">مدير</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary" disabled={saving}>
              {saving ? 'جارٍ الحفظ…' : 'حفظ'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <Typography>هل أنت متأكد من رغبتك في حذف المستخدم {selectedUser?.name}؟</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
            <Button onClick={handleDeleteUser} color="error" variant="contained">
              حذف
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Confirmation Dialog (واجهة فقط) */}
        <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              سيتم تعيين كلمة المرور الجديدة للمستخدم <strong>{selectedUser?.name}</strong> إلى:
            </Typography>
            <Typography variant="h6" align="center" color="primary" sx={{ my: 2 }}>
              123456
            </Typography>
            <Typography variant="body2" color="text.secondary">
              سيتمكن المستخدم من تسجيل الدخول باستخدام هذه الكلمة ومن ثم تغييرها من إعدادات الحساب.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenResetDialog(false)}>إلغاء</Button>
            <Button onClick={handleResetPasswordConfirm} color="primary" variant="contained">
              تأكيد
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default UsersManagement;
