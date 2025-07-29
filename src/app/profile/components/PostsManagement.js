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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar
} from '@mui/material';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/app/auth/AuthProvider';

const PostsManagement = () => {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState({
    id: '',
    title: '',
    content: '',
    isPublished: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role_id === 4) { // 4 for admin
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showSnackbar('فشل في تحميل المنشورات', 'error');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (post) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      content: post.content,
      isPublished: post.isPublished
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (post) => {
    setSelectedPost(post);
    setOpenDeleteDialog(true);
  };

  const handleSavePost = async () => {
    try {
      if (editingPost.id) {
        await axios.put(`/api/posts/${editingPost.id}`, editingPost);
        showSnackbar('تم تحديث المنشور بنجاح', 'success');
      } else {
        await axios.post('/api/posts', editingPost);
        showSnackbar('تمت إضافة المنشور بنجاح', 'success');
      }
      fetchPosts();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving post:', error);
      showSnackbar('حدث خطأ أثناء حفظ المنشور', 'error');
    }
  };

  const handleDeletePost = async () => {
    try {
      await axios.delete(`/api/posts/${selectedPost.id}`);
      showSnackbar('تم حذف المنشور بنجاح', 'success');
      fetchPosts();
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      showSnackbar('حدث خطأ أثناء حذف المنشور', 'error');
    }
  };

  const togglePublishStatus = async (post) => {
    try {
      await axios.put(`/api/posts/${post.id}/toggle-publish`, {
        isPublished: !post.isPublished
      });
      showSnackbar('تم تحديث حالة النشر بنجاح', 'success');
      fetchPosts();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showSnackbar('حدث خطأ أثناء تحديث حالة النشر', 'error');
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
          <Typography variant="h5" component="h2">إدارة المنشورات</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            onClick={() => {
              setEditingPost({
                id: '',
                title: '',
                content: '',
                isPublished: true
              });
              setOpenDialog(true);
            }}
          >
            إضافة منشور جديد
          </Button>
        </Box>

        <TextField
          fullWidth
          label="بحث في المنشورات..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ mb: 3 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>العنوان</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>تاريخ الإنشاء</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={post.isPublished}
                          onChange={() => togglePublishStatus(post)}
                          color="primary"
                        />
                      }
                      label={post.isPublished ? 'منشور' : 'مسودة'}
                    />
                  </TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleEditClick(post)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(post)} color="error">
                      <Delete />
                    </IconButton>
                    <IconButton 
                      component="a" 
                      href={`/posts/${post.id}`} 
                      target="_blank" 
                      color="info"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Post Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingPost.id ? 'تعديل منشور' : 'إضافة منشور جديد'}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, minWidth: '100%' }}>
              <TextField
                fullWidth
                label="عنوان المنشور"
                value={editingPost.title}
                onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                margin="normal"
              />
              <TextField
                fullWidth
                label="محتوى المنشور"
                multiline
                rows={8}
                value={editingPost.content}
                onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPost.isPublished}
                    onChange={(e) => setEditingPost({...editingPost, isPublished: e.target.checked})}
                    color="primary"
                  />
                }
                label="نشر المنشور"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
            <Button onClick={handleSavePost} variant="contained" color="primary">
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <Typography>هل أنت متأكد من رغبتك في حذف المنشور "{selectedPost?.title}"؟</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
            <Button onClick={handleDeletePost} color="error" variant="contained">
              حذف
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

export default PostsManagement;
