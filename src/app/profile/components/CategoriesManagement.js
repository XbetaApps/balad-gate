"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '@/app/nav/theme/ThemeProvider';
import {
  Box,
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
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default function CategoriesManagement() {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  
  // Common border colors based on theme
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
  const hoverBorderColor = 'var(--primary, #1976d2)';
  
  // Common styles for form fields
  const formFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: borderColor,
        borderWidth: '1px',
        transition: 'border-color 0.2s ease-in-out',
      },
      '&:hover fieldset': {
        borderColor: hoverBorderColor,
        borderWidth: '1px',
        borderColor: 'var(--primary)',
        borderWidth: '1px',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'var(--primary)',
        borderWidth: '1px',
        boxShadow: '0 0 0 1px var(--primary, #1976d2)'
      },
    },
    '& .MuiInputLabel-root': {
      color: 'var(--muted-foreground)',
      '&.Mui-focused': {
        color: 'var(--primary)'
      }
    },
    '& .MuiInputBase-input': {
      color: 'var(--foreground)',
      backgroundColor: 'var(--background)'
    },
    '& .MuiSvgIcon-root': {
      color: 'var(--muted-foreground)'
    }
  };
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    categoryId: null,
    categoryName: ''
  });
  const [currentCategory, setCurrentCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    is_active: true,  // Default to active
    sort_order: 5  // Default priority is set to 5 (middle of 1-10 scale)
  });
  const [parentCategories, setParentCategories] = useState([]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      setCategories([]);
      setSnackbar({
        open: true,
        message: `حدث خطأ أثناء تحميل الأقسام: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load parent categories (top-level categories only)
  const loadParentCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?parentId=null');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحميل الأقسام الرئيسية');
      }
      
      const data = await response.json();
      const categories = Array.isArray(data) ? data : [];
      
      // Filter out current category if in edit mode
      const filteredCategories = currentCategory 
        ? categories.filter(cat => cat.id !== currentCategory.id)
        : categories;
      
      setParentCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading parent categories:', error);
      setParentCategories([]);
      setSnackbar({
        open: true,
        message: `حدث خطأ أثناء تحميل الأقسام الرئيسية: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'parent_id' ? (value === '' ? null : value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar({
      open: false,
      message: '',
      severity: 'info'
    });

    try {
      const url = currentCategory 
        ? `/api/categories/${currentCategory.id}`
        : '/api/categories';
      
      const method = currentCategory ? 'PATCH' : 'POST';
      
      // Prepare the data to send, ensuring sort_order is a number with default of 5
      const dataToSend = {
        ...formData,
        sort_order: formData.sort_order ? Number(formData.sort_order) : 5
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      // Get response text first to handle both JSON and text responses
      const responseText = await response.text();
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', {
          error: parseError,
          responseText: responseText,
          status: response.status,
          statusText: response.statusText
        });
        throw new Error('حدث خطأ في معالجة الاستجابة من الخادم');
      }
      
      console.log('=== Response Details ===');
      console.log('Status:', response.status, response.statusText);
      console.log('Data:', data);

      if (!response.ok) {
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          url: response.url
        });
        
        // More specific error messages based on status code
        let errorMessage = data?.error || data?.message || `خطأ ${response.status}: ${response.statusText}`;
        if (response.status === 401) {
          errorMessage = 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى';
          // Clear invalid token
          localStorage.removeItem('token');
        } else if (response.status === 403) {
          errorMessage = 'ليس لديك صلاحية للقيام بهذا الإجراء';
        } else if (response.status >= 500) {
          errorMessage = 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً';
        }
        
        throw new Error(errorMessage);
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        description: '',
        parent_id: null,
        is_active: true,
        sort_order: 5  // Set default to 5
      });
      
      // Close dialog and refresh categories
      setOpenDialog(false);
      setCurrentCategory(null);
      await fetchCategories();
      
      // Show success message
      setSnackbar({
        open: true,
        message: currentCategory ? 'تم تحديث القسم بنجاح' : 'تم إضافة القسم بنجاح',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving category:', error);
      setSnackbar({
        open: true,
        message: `حدث خطأ أثناء حفظ القسم: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit category
  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || null,
      is_active: category.is_active !== undefined ? Boolean(category.is_active) : true,
      sort_order: category.sort_order || 5
    });
    loadParentCategories();
    setOpenDialog(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id, name) => {
    setDeleteDialog({
      open: true,
      categoryId: id,
      categoryName: name
    });
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      categoryId: null,
      categoryName: ''
    });
  };

  // Handle delete category confirmation
  const handleConfirmDelete = async () => {
    if (!deleteDialog.categoryId) return;
    
    try {
      const response = await fetch(`/api/categories/${deleteDialog.categoryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      // Close the delete dialog
      handleCloseDeleteDialog();
      
      // Refresh the categories list
      await fetchCategories();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'تم حذف القسم بنجاح',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      setSnackbar({
        open: true,
        message: `حدث خطأ أثناء حذف القسم: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Initialize
  useEffect(() => {
    fetchCategories();
    loadParentCategories();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 0.25, sm: 1, md: 1.5 },
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      '& .MuiPaper-root': {
        boxShadow: 'none',
        borderRadius: 0,
        border: 'none',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        my: { xs: 0.5, sm: 1 },
        mx: 0,
        px: { xs: 0.5, sm: 1 }
      }
    }}>
      {/* Main Content */}
      <Box>
        {/* Your main content here */}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? 'var(--background)' : 'background.paper',
            backgroundImage: 'none',
            '& .MuiDialogTitle-root': {
              textAlign: 'center', 
              pt: 3,
              pb: 1,
              px: { xs: 2, sm: 3 },
              color: isDark ? 'var(--foreground)' : 'inherit',
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              fontWeight: 600
            },
            '& .MuiDialogContent-root': {
              px: { xs: 2, sm: 3 },
              py: 2
            },
            '& .MuiDialogActions-root': {
              px: { xs: 2, sm: 3 },
              py: 2,
              justifyContent: 'space-between'
            },
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 2,
            boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ 
          textAlign: 'center', 
          pt: 3,
          color: isDark ? 'var(--foreground)' : 'inherit'
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            تأكيد الحذف
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <Typography variant="body1" sx={{ color: isDark ? 'var(--foreground)' : 'text.primary', mb: 1 }}>
              هل أنت متأكد من حذف القسم "{deleteDialog.categoryName}"؟
            </Typography>
            <Typography variant="body2" sx={{ 
              color: isDark ? '#ffa726' : 'text.secondary',
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              fontWeight: 500
            }}>
              <span>⚠️</span>
              <span>لا يمكن التراجع عن هذا الإجراء</span>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          pb: 3, 
          px: 3, 
          gap: 2,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            color={isDark ? 'inherit' : 'primary'}
            fullWidth
            sx={{
              color: isDark ? 'var(--foreground)' : 'inherit',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              '&:hover': {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
              }
            }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            fullWidth
            startIcon={<DeleteIcon />}
            sx={{
              bgcolor: isDark ? '#db3a34' : undefined,
              '&:hover': {
                bgcolor: isDark ? '#c12a24' : undefined
              }
            }}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3, md: 4 }, 
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        boxShadow: isDark 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease-in-out'
      }}>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            letterSpacing: '0.5px'
          }}
        >
          إدارة الأقسام
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchCategories}
            disabled={loading}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1,
              transition: 'all 0.2s ease-in-out',
              '& .MuiButton-startIcon': {
                marginRight: 0.5,
                '& > *:nth-of-type(1)': {
                  fontSize: '1.1rem'
                }
              }
            }}
          >
            تحديث
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1,
              transition: 'all 0.2s ease-in-out',
              '& .MuiButton-startIcon': {
                marginRight: 0.5,
                '& > *:nth-of-type(1)': {
                  fontSize: '1.1rem'
                }
              }
            }}
          >
            إضافة قسم
          </Button>
        </Box>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 0, 
          overflow: 'hidden', 
          border: 'none',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          bgcolor: 'transparent',
          boxShadow: 'none',
          width: '100%',
          maxWidth: '100%',
          mx: 0
        }}
      >
        <TableContainer sx={{ 
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            height: '3px',
            width: '3px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '1.5px'
          }
        }}>
          <Table sx={{ minWidth: '100%', tableLayout: 'auto' }}>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: 'transparent',
                '& th': {
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                },
                '&:hover': {
                  bgcolor: 'transparent !important'
                }
              }}>
                <TableCell sx={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  py: { xs: 0.75, sm: 1 },
                  px: { xs: 0.5, sm: 0.75, md: 1.5 },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>الاسم</TableCell>
                <TableCell sx={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  py: { xs: 0.75, sm: 1 },
                  px: { xs: 0.5, sm: 0.75, md: 1.5 },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>القسم الأب</TableCell>
                <TableCell sx={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  py: { xs: 0.75, sm: 1 },
                  px: { xs: 0.5, sm: 0.75, md: 1.5 },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>الحالة</TableCell>
                <TableCell sx={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  py: { xs: 0.75, sm: 1 },
                  px: { xs: 0.5, sm: 0.75, md: 1.5 },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>ترتيب الفرز</TableCell>
                <TableCell sx={{ 
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  py: 1.5,
                  textAlign: 'center',
                  px: { xs: 1, sm: 2 }
                }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      لا توجد أقسام متاحة
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow 
                    key={category.id} 
                    hover 
                    sx={{ 
                      '&:last-child td': { border: 0 },
                      '&:hover': { 
                        bgcolor: isDark ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 215, 0, 0.04)' 
                      },
                      transition: 'all 0.2s ease-in-out',
                      '& td': {
                        borderBottom: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                        '&:first-of-type': {
                          color: isDark ? 'primary.main' : 'primary.dark',
                          fontWeight: 600
                        }
                      },
                      '&:hover td': {
                        color: isDark ? '#fff' : '#000',
                        '&:first-of-type': {
                          color: isDark ? 'primary.light' : 'primary.main'
                        }
                      }
                    }}
                  >
                    <TableCell sx={{ 
                      py: { xs: 0.5, sm: 1 },
                      px: { xs: 0.5, sm: 1 },
                      borderBottom: '1px solid', 
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'
                    }}>
                      <Typography variant="body1" fontWeight={500} sx={{ 
                        color: 'var(--text-primary)',
                        '&:hover': {
                          color: 'var(--primary)',
                          opacity: 0.9
                        },
                        transition: 'color 0.2s ease-in-out'
                      }}>
                        {category.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" sx={{ 
                        color: 'var(--text-secondary)',
                        '&:hover': {
                          color: 'var(--primary)',
                          opacity: 0.9
                        },
                        transition: 'color 0.2s ease-in-out'
                      }}>
                        {category.parent_id ? 
                          (categories.find(c => c.id === category.parent_id)?.name || '--') : 
                          '--'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
                      <Chip
                        label={category.is_active ? 'نشط' : 'غير نشط'}
                        color={category.is_active ? 'success' : 'error'}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          px: 1,
                          bgcolor: category.is_active 
                            ? 'rgba(46, 125, 50, 0.1)' 
                            : 'rgba(211, 47, 47, 0.1)',
                          color: category.is_active 
                            ? 'var(--success)'
                            : 'var(--error)',
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2, borderBottom: '1px solid', borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
                      <Typography variant="body2" sx={{ 
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                        textAlign: 'center'
                      }}>
                        {category.sort_order}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      py: { xs: 0.5, sm: 1 }, 
                      px: { xs: 0.5, sm: 1 },
                      borderBottom: '1px solid', 
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                      '&:last-child': {
                        pr: { xs: 0.5, sm: 1 }
                      }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.5, sm: 1 },
                        '& .MuiIconButton-root': {
                          p: { xs: 0.5, sm: 0.75 },
                          '& svg': {
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }
                        }
                      }}>
                        <Tooltip title="تعديل">
                          <IconButton 
                            onClick={() => handleEdit(category)}
                            size="small"
                            sx={{
                              color: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.light',
                                color: 'primary.dark'
                              },
                              transition: 'all 0.2s',
                              p: 1
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(category.id, category.name);
                            }}
                            color="error"
                            size="small"
                            sx={{
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: 'error.light',
                                color: 'error.dark'
                              },
                              transition: 'all 0.2s',
                              p: 1
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Category Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'div',
          sx: (theme) => ({
            '& .MuiDialog-container': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              '& .MuiPaper-root': {
                backgroundColor: 'var(--background) !important',
                background: 'var(--background) !important',
                backgroundImage: 'none !important',
                opacity: '1 !important',
                borderRadius: 2,
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)'
              }
            },
            '& .MuiBackdrop-root': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7) !important' : 'rgba(0, 0, 0, 0.5) !important',
              backdropFilter: 'blur(2px)'
            },
            '& .MuiDialog-paper': {
              backgroundColor: 'var(--background) !important',
              background: 'var(--background) !important',
              color: 'var(--foreground) !important',
              opacity: '1 !important',
            }
          })
        }}
      >
        <DialogTitle 
          sx={{ 
            p: 2,
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            bgcolor: 'var(--background)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '1.25rem',
            color: 'var(--foreground)'
          }}
        >
          <Box component="span">
            {currentCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </Box>
          <IconButton
            edge="end"
            onClick={() => setOpenDialog(false)}
            aria-label="close"
            size="small"
            sx={{
              color: 'var(--muted-foreground)',
              '&:hover': {
                bgcolor: 'var(--muted)'
              }
            }}
          >
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3,
          bgcolor: 'var(--background)',
          color: 'var(--foreground)',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: borderColor,
              borderWidth: '1px',
              transition: 'border-color 0.2s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: hoverBorderColor,
              borderWidth: '1px',
            },
            '&.Mui-focused fieldset': {
              borderColor: hoverBorderColor,
              borderWidth: '1px',
              boxShadow: '0 0 0 1px var(--primary, #1976d2)'
            }
          },
          '& .MuiInputLabel-root': {
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            '&.Mui-focused': {
              color: 'var(--primary)'
            }
          },
          '& .MuiFormLabel-root': {
            color: 'var(--muted-foreground)'
          },
          '& .MuiInputBase-input': {
            color: 'var(--foreground)',
            '&::placeholder': {
              color: 'var(--muted-foreground)',
              opacity: 0.8
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--border) !important',
            borderWidth: '1px',
            '&:hover': {
              borderColor: 'var(--primary)',
              borderWidth: '1px'
            },
            '&.Mui-focused': {
              borderColor: 'var(--primary)',
              borderWidth: '1px',
              boxShadow: '0 0 0 1px var(--primary)'
            }
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--muted-foreground)'
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--primary)',
            borderWidth: '1px',
            boxShadow: '0 0 0 1px var(--primary)'
          }
        }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="اسم القسم"
              fullWidth
              margin="normal"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              variant="outlined"
              size="small"
              required
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'var(--input)'
                  }
                }
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!formData.parent_id}
                  onChange={(e) => {
                    const isMain = Boolean(e.target.checked);
                    setFormData({
                      ...formData,
                      parent_id: isMain ? null : (parentCategories[0]?.id || null)
                    });
                  }}
                  color="primary"
                />
              }
              label={!formData.parent_id ? 'قسم رئيسي' : 'قسم فرعي'}
              sx={{ mb: 2, display: 'block' }}
            />

            {formData.parent_id !== null && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="parent-category-label">القسم الأب</InputLabel>
                <Select
                  labelId="parent-category-label"
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value || null})}
                  label="القسم الأب"
                >
                  {parentCategories.length > 0 ? (
                    parentCategories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      لا توجد أقسام رئيسية متاحة
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => {
                    const isActive = Boolean(e.target.checked);
                    setFormData(prev => ({
                      ...prev,
                      is_active: isActive
                    }));
                  }}
                  color="primary"
                />
              }
              label={formData.is_active ? 'نشط' : 'غير نشط'}
              sx={{ 
                mb: 2, 
                display: 'block',
                '& .MuiFormControlLabel-label': {
                  color: formData.is_active ? 'success.main' : 'error.main',
                  fontWeight: 600
                }
              }}
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>أولوية الظهور</InputLabel>
              <Select
                value={formData.sort_order || 5}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                label="أولوية الظهور"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} {num === 1 ? '(أعلى أولوية)' : num === 10 ? '(أقل أولوية)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            
            <DialogActions sx={{ px: 0, pb: 0 }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                variant="outlined"
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  textTransform: 'none',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border)',
                  '&:hover': {
                    borderColor: 'var(--primary)',
                    backgroundColor: 'var(--muted)'
                  }
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 1,
                  textTransform: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-hover)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'var(--muted)',
                    color: 'var(--muted-foreground)'
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : (currentCategory ? 'حفظ التغييرات' : 'إضافة')}
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
