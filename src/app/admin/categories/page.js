'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  CircularProgress,
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
  TextField,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from '@mui/icons-material';

const AdminCategories = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: null,
    is_active: true,
    sort_order: 0
  });
  const [parentCategories, setParentCategories] = useState([]);

  // Check if user is admin - exactly like in admin dashboard
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (!session || !session.user) {
          router.push('/auth/signin');
          return;
        }

        // Check if user is admin (role_id = 4)
        if (session.user.role_id !== 4) {
          router.push('/');
          return;
        }

        // If we get here, user is admin
        fetchCategories();
        loadParentCategories();
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/auth/signin');
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('حدث خطأ أثناء جلب الأقسام', 'error');
    }
  };

  // Load parent categories for dropdown
  const loadParentCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories/parents');
      if (response.ok) {
        const data = await response.json();
        setParentCategories(data);
      }
    } catch (error) {
      console.error('Error loading parent categories:', error);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategory(null);
    resetForm();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = currentCategory 
        ? `/api/admin/categories/${currentCategory.id}`
        : '/api/admin/categories';
      
      const method = currentCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      const data = await response.json();
      showSnackbar(
        currentCategory ? 'تم تحديث القسم بنجاح' : 'تم إضافة القسم بنجاح',
        'success'
      );
      
      fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar('حدث خطأ أثناء حفظ القسم', 'error');
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id || null,
      is_active: category.is_active,
      sort_order: category.sort_order || 0
    });
    setOpenDialog(true);
  };

  // Handle delete category
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      showSnackbar('تم حذف القسم بنجاح', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar('حدث خطأ أثناء حذف القسم', 'error');
    }
  };

  // Toggle category status
  const toggleStatus = async (category) => {
    try {
      const response = await fetch(`/api/admin/categories/${category.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !category.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category status');
      }

      const updatedCategories = categories.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: !cat.is_active } 
          : cat
      );
      
      setCategories(updatedCategories);
      showSnackbar('تم تحديث حالة القسم بنجاح', 'success');
    } catch (error) {
      console.error('Error toggling category status:', error);
      showSnackbar('حدث خطأ أثناء تحديث حالة القسم', 'error');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: null,
      is_active: true,
      sort_order: 0
    });
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/--+/g, '-') // Replace multiple - with single -
      .trim();
  };

  // Auto-generate slug when name changes
  useEffect(() => {
    if (!currentCategory) {
      const slug = generateSlug(formData.name);
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  }, [formData.name, currentCategory]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          إدارة الأقسام
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          إضافة قسم جديد
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>الرابط</TableCell>
                <TableCell>الوصف</td>
                <TableCell>الحالة</td>
                <TableCell>الترتيب</td>
                <TableCell>الإجراءات</td>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</td>
                  <TableCell>{category.slug}</td>
                  <TableCell>{category.description || '-'}</td>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={category.is_active}
                          onChange={() => toggleStatus(category)}
                          color="primary"
                        />
                      }
                      label={category.is_active ? 'نشط' : 'غير نشط'}
                    />
                  </td>
                  <TableCell>{category.sort_order}</td>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(category)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(category.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Category Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {currentCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="اسم القسم"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="الرابط"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="الوصف"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>القسم الأب</InputLabel>
                <Select
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleInputChange}
                  label="القسم الأب"
                >
                  <MenuItem value="">لا يوجد</MenuItem>
                  {parentCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="ترتيب العرض"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    name="is_active"
                  />
                }
                label={formData.is_active ? 'نشط' : 'غير نشط'}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>إلغاء</Button>
            <Button type="submit" variant="contained" color="primary">
              حفظ
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminCategories;
