import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit, Delete, Refresh, Add } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/app/auth/AuthProvider';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState({
    id: '',
    name: '',
    email: '',
    role: 'user'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role_id === 4) { // 4 for admin
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('فشل في تحميل المستخدمين', 'error');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    setOpenDialog(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setOpenResetDialog(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser.id) {
        await axios.put(`/api/users/${editingUser.id}`, editingUser);
        showSnackbar('تم تحديث المستخدم بنجاح', 'success');
      } else {
        await axios.post('/api/users', editingUser);
        showSnackbar('تمت إضافة المستخدم بنجاح', 'success');
      }
      fetchUsers();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('حدث خطأ أثناء حفظ المستخدم', 'error');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.id}`);
      showSnackbar('تم حذف المستخدم بنجاح', 'success');
      fetchUsers();
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('حدث خطأ أثناء حذف المستخدم', 'error');
    }
  };

  const handleResetPasswordConfirm = async () => {
    try {
      await axios.post(`/api/users/${selectedUser.id}/reset-password`);
      showSnackbar('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم', 'success');
      setOpenResetDialog(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      showSnackbar('حدث خطأ أثناء إعادة تعيين كلمة المرور', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (user?.role_id !== 4) { // 4 for admin
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
              setEditingUser({
                id: '',
                name: '',
                email: '',
                role: 'user'
              });
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role === 'admin' ? 'مدير' : 'مستخدم'}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEditClick(user)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleResetPassword(user)} color="secondary">
                      <Refresh />
                    </IconButton>
                    {user.id !== user?.id && (
                      <IconButton onClick={() => handleDeleteClick(user)} color="error">
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
                onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                margin="normal"
              />
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>الدور</InputLabel>
                <Select
                  value={editingUser.role}
                  label="الدور"
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
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

        {/* Snackbar for notifications */}
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
