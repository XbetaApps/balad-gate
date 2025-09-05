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

const AdminAds = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    target_url: '',
    start_date: '',
    end_date: '',
    is_active: true,
    position: 'top',
    sort_order: 0
  });

  // Check if user is admin
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
        fetchAds();
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/auth/signin');
      }
    };

    checkAdmin();
  }, [router]);

  // Fetch ads from API
  const fetchAds = async () => {
    try {
      const response = await fetch('/api/admin/ads');
      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
      showSnackbar('حدث خطأ أثناء جلب الإعلانات', 'error');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = currentAd 
        ? `/api/admin/ads/${currentAd.id}` 
        : '/api/admin/ads';
      
      const method = currentAd ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('فشل في حفظ الإعلان');
      }

      showSnackbar(
        currentAd ? 'تم تحديث الإعلان بنجاح' : 'تم إضافة الإعلان بنجاح',
        'success'
      );
      
      setOpenDialog(false);
      fetchAds();
    } catch (error) {
      console.error('Error saving ad:', error);
      showSnackbar(error.message || 'حدث خطأ أثناء حفظ الإعلان', 'error');
    }
  };

  // Handle delete ad
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الإعلان');
      }

      showSnackbar('تم حذف الإعلان بنجاح', 'success');
      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      showSnackbar(error.message || 'حدث خطأ أثناء حذف الإعلان', 'error');
    }
  };

  // Open edit dialog
  const handleEdit = (ad) => {
    setCurrentAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      target_url: ad.target_url,
      start_date: ad.start_date.split('T')[0],
      end_date: ad.end_date.split('T')[0],
      is_active: ad.is_active,
      position: ad.position,
      sort_order: ad.sort_order
    });
    setOpenDialog(true);
  };

  // Open new ad dialog
  const handleNewAd = () => {
    setCurrentAd(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      target_url: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      position: 'top',
      sort_order: 0
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            إدارة الإعلانات
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewAd}
          >
            إعلان جديد
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>العنوان</TableCell>
                <TableCell>الرابط</TableCell>
                <TableCell>الموقع</TableCell>
                <TableCell>تاريخ البداية</TableCell>
                <TableCell>تاريخ النهاية</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>الترتيب</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>{ad.title}</TableCell>
                  <TableCell>
                    <a href={ad.target_url} target="_blank" rel="noopener noreferrer">
                      عرض الرابط
                    </a>
                  </TableCell>
                  <TableCell>{ad.position}</TableCell>
                  <TableCell>{new Date(ad.start_date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>{new Date(ad.end_date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={ad.is_active}
                          onChange={() => handleToggleStatus(ad)}
                          color="primary"
                        />
                      }
                      label={ad.is_active ? 'نشط' : 'غير نشط'}
                    />
                  </TableCell>
                  <TableCell>{ad.sort_order}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(ad)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(ad.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {ads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    لا توجد إعلانات متاحة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{currentAd ? 'تعديل الإعلان' : 'إعلان جديد'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="عنوان الإعلان"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
              
              <TextField
                label="وصف الإعلان"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
              
              <TextField
                label="رابط الصورة"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
              
              <TextField
                label="الرابط المستهدف"
                name="target_url"
                value={formData.target_url}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
              
              <Box display="flex" gap={2}>
                <TextField
                  label="تاريخ البداية"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                
                <TextField
                  label="تاريخ النهاية"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>موقع الإعلان</InputLabel>
                <Select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  label="موقع الإعلان"
                  required
                >
                  <MenuItem value="top">أعلى الصفحة</MenuItem>
                  <MenuItem value="sidebar">الشريط الجانبي</MenuItem>
                  <MenuItem value="middle">منتصف الصفحة</MenuItem>
                  <MenuItem value="bottom">أسفل الصفحة</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="ترتيب العرض"
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="نشط"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              إلغاء
            </Button>
            <Button type="submit" color="primary" variant="contained">
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
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminAds;
