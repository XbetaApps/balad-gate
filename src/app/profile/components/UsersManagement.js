"use client";

import React, { useState, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar
} from '@mui/material';
import { Edit, Delete, Refresh, Add } from '@mui/icons-material';
import axios from 'axios';

// helpers
function isAdmin(userData) {
  return !!userData && Number(userData.role_id) === 4;
}

function roleIdToString(role_id) {
  // عدّل حسب خريطتك إن كانت لديك أدوار أخرى
  if (Number(role_id) === 4) return 'admin';
  return 'user';
}

function roleStringToId(roleStr) {
  return roleStr === 'admin' ? 4 : 1; // user العادي = 1 (بدّلها إن لزم)
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

  const role_id =
    data?.rawPayload?.role_id ??
    data?.user?.role_id ??
    null;

  // نعيد userData بصيغة موحّدة
  return { ...data.user, role_id };
}

const UsersManagement = ({ userData: userDataProp = null }) => {
  // حالة المصادقة/الدور
  const [userData, setUserData] = useState(userDataProp);
  const [authLoading, setAuthLoading] = useState(!userDataProp);

  // بيانات الأدمن الحالي (لتجنّب حذف نفسه)
  const currentUserId = userData?.id ?? null;

  // حالة الجدول
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // حوارات
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);

  // عناصر مختارة/تحرير
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user', // نخزّن الدور هنا كنص "user"/"admin"
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // 1) احصل على userData من /api/test-session إن لم يصل من الأب
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

  // 2) جلب المستخدمين لو المستخدم أدمن
  useEffect(() => {
    if (isAdmin(userData)) {
      fetchUsers();
    }
  }, [userData]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users', { withCredentials: true });
      const list = Array.isArray(response.data) ? response.data : [];

      // توحيد الحقول التي نعرضها
      const normalized = list.map((u) => {
        const rid = u.role_id ?? (u.role ? roleStringToId(u.role) : null);
        const rstr = u.role ?? (rid != null ? roleIdToString(rid) : 'user');
        return {
          ...u,
          role_id: rid,
          role: rstr,
        };
      });

      setUsers(normalized);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('فشل في تحميل المستخدمين', 'error');
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredUsers = users.filter((row) => {
    const name = (row?.name || '').toLowerCase();
    const email = (row?.email || '').toLowerCase();
    const q = (searchTerm || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleEditClick = (row) => {
    setEditingUser({
      id: row.id,
      name: row.name || '',
      email: row.email || '',
      role: row.role || roleIdToString(row.role_id), // نحفظه كنص
    });
    setOpenDialog(true);
  };

  const handleResetPassword = (row) => {
    setSelectedUser(row);
    setOpenResetDialog(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedUser(row);
    setOpenDeleteDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      // نجهّز الحمولة كما يحب API لديك:
      // إن كان API يعتمد الدور كنص:
      const payload = { ...editingUser };
      // وإن كان يعتمد role_id بدلاً من role:
      // payload.role_id = roleStringToId(editingUser.role);

      if (editingUser.id) {
        await axios.put(`/api/users/${editingUser.id}`, payload, { withCredentials: true });
        showSnackbar('تم تحديث المستخدم بنجاح', 'success');
      } else {
        await axios.post('/api/users', payload, { withCredentials: true });
        showSnackbar('تمت إضافة المستخدم بنجاح', 'success');
      }
      await fetchUsers();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('حدث خطأ أثناء حفظ المستخدم', 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      if (!selectedUser?.id) return;
      await axios.delete(`/api/users/${selectedUser.id}`, { withCredentials: true });
      showSnackbar('تم حذف المستخدم بنجاح', 'success');
      await fetchUsers();
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('حدث خطأ أثناء حذف المستخدم', 'error');
    }
  };

  const handleResetPasswordConfirm = async () => {
    try {
      if (!selectedUser?.id) return;
      await axios.post(`/api/users/${selectedUser.id}/reset-password`, {}, { withCredentials: true });
      showSnackbar('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم', 'success');
      setOpenResetDialog(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      showSnackbar('حدث خطأ أثناء إعادة تعيين كلمة المرور', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // لا نحكم قبل انتهاء التحميل
  if (authLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6">جاري التحقق من الصلاحيات...</Typography>
        </Box>
      </Container>
    );
  }

  // ليس أدمن؟
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
          <Typography variant="h5" component="h2">إدارة المستخدمين</Typography>
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

        <TextField
          fullWidth
          label="بحث عن مستخدم..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mb: 3 }}
        />

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
              {filteredUsers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role === 'admin' ? 'مدير' : 'مستخدم'}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEditClick(row)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleResetPassword(row)} color="secondary">
                      <Refresh />
                    </IconButton>
                    {/* لا تسمح بحذف نفسك */}
                    {row.id !== currentUserId && (
                      <IconButton onClick={() => handleDeleteClick(row)} color="error">
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    لا توجد نتائج مطابقة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
            <Button onClick={handleSaveUser} variant="contained" color="primary">
              حفظ
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

        {/* Reset Password Confirmation Dialog */}
        <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogContent>
            <Typography>
              سيتم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني: {selectedUser?.email}
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
