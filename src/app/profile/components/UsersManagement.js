"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Box, Typography, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, Alert, Snackbar, Tooltip, Pagination, Chip
} from '@mui/material';
import { Edit, Delete, Refresh, Add, CheckCircleOutline, ErrorOutline, WarningAmberOutlined, InfoOutlined } from '@mui/icons-material';

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
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4, 
          p: 3,
          borderRadius: 2,
          bgcolor: 'var(--card-bg)',
          border: '1px solid',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.2s ease-in-out'
        }}>
          <Typography 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 700,
              color: 'var(--text-primary)',
              fontSize: '1.5rem',
              letterSpacing: '0.5px'
            }}
          >
            إدارة المستخدمين {listLoading ? '…' : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchUsers}
              disabled={listLoading}
              sx={{
                color: 'var(--text-primary)',
                borderColor: 'var(--primary)',
                '&:hover': {
                  borderColor: 'var(--gold-border)',
                  backgroundColor: 'var(--muted)',
                },
                '&.Mui-disabled': {
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)'
                },
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
                px: 3,
                py: 1,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              تحديث
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingUser({ id: '', name: '', email: '', role: 'user' });
                setOpenDialog(true);
              }}
              sx={{
                bgcolor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                '&:hover': {
                  bgcolor: 'var(--primary-hover)',
                  boxShadow: '0 4px 12px -1px rgba(255, 213, 0, 0.3)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'var(--muted)',
                  color: 'var(--muted-foreground)'
                },
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1,
                px: 3,
                py: 1,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              إضافة مستخدم جديد
            </Button>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3, 
          alignItems: 'center',
          p: 2,
          borderRadius: 1,
          bgcolor: 'var(--card-bg)',
          border: '1px solid',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <TextField
            fullWidth
            label="بحث عن مستخدم..."
            variant="outlined"
            value={searchTerm}
            onChange={handleSearch}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'var(--border)',
                },
                '&:hover fieldset': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'var(--primary)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'var(--muted-foreground)',
              },
              '& .MuiInputBase-input': {
                color: 'var(--text-primary)',
              },
            }}
          />
          <FormControl size="small" sx={{ width: 140 }}>
            <InputLabel sx={{ color: 'var(--muted-foreground)' }}>حجم الصفحة</InputLabel>
            <Select
              value={pageSize}
              label="حجم الصفحة"
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
              sx={{
                '& .MuiSelect-select': {
                  color: 'var(--text-primary)',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--border)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary)',
                },
              }}
            >
              {[10, 20, 50, 100].map(sz => 
                <MenuItem key={sz} value={sz} sx={{ color: 'var(--text-primary)' }}>{sz}</MenuItem>
              )}
            </Select>
          </FormControl>
        </Box>

        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--card-bg)',
            boxShadow: 'var(--shadow-sm)',
            mb: 3
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                '& th': {
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  borderBottom: '2px solid',
                  borderColor: 'var(--border)',
                  fontSize: '0.95rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  py: 1.5
                },
                '&:hover': {
                  bgcolor: 'transparent !important'
                }
              }}>
                <TableCell>الاسم</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow 
                  key={row.id}
                  sx={{
                    '&:hover': {
                      bgcolor: 'var(--muted)'
                    },
                    '&:last-child td': {
                      borderBottom: 'none'
                    }
                  }}
                >
                  <TableCell sx={{ color: 'var(--text-primary)' }}>{row.name}</TableCell>
                  <TableCell sx={{ color: 'var(--text-secondary)' }}>{row.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.role === 'admin' ? 'مدير' : 'مستخدم'}
                      size="small"
                      sx={{
                        bgcolor: row.role === 'admin' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(30, 136, 229, 0.1)',
                        color: row.role === 'admin' ? 'var(--success)' : 'var(--primary)',
                        fontWeight: 500,
                        px: 1
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="تعديل">
                        <IconButton 
                          onClick={() => handleEditClick(row)} 
                          sx={{ 
                            color: 'var(--text-secondary)',
                            '&:hover': {
                              color: 'var(--primary)',
                              bgcolor: 'var(--muted)'
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="إعادة تعيين كلمة المرور">
                        <IconButton 
                          onClick={() => handleResetPassword(row)}
                          sx={{ 
                            color: 'var(--text-secondary)',
                            '&:hover': {
                              color: 'var(--warning)',
                              bgcolor: 'var(--muted)'
                            }
                          }}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {row.id !== currentUserId && (
                        <Tooltip title="حذف">
                          <IconButton 
                            onClick={() => handleDeleteClick(row)}
                            sx={{ 
                              color: 'var(--text-secondary)',
                              '&:hover': {
                                color: 'var(--destructive)',
                                bgcolor: 'var(--muted)'
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={4} 
                    align="center" 
                    sx={{ 
                      py: 4,
                      color: 'var(--muted-foreground)'
                    }}
                  >
                    {listLoading ? 'جاري التحميل…' : 'لا توجد نتائج مطابقة'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination controls */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderRadius: 1,
          bgcolor: 'var(--card-bg)',
          border: '1px solid',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            إجمالي: {total} مستخدم
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--muted)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-hover)'
                  }
                },
                '&.Mui-disabled': {
                  color: 'var(--muted-foreground)'
                }
              }
            }}
          />
        </Box>

        {/* Add/Edit User Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
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
                  minWidth: '500px',
                  borderRadius: 2,
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border)',
                  '& *': {
                    backgroundColor: 'transparent !important',
                    background: 'transparent !important',
                    backgroundImage: 'none !important',
                    opacity: '1 !important',
                    color: 'var(--foreground) !important',
                    '&::before, &::after': {
                      backgroundColor: 'transparent !important',
                      background: 'transparent !important',
                      opacity: '1 !important',
                    }
                  },
                  '& input, & select, & textarea': {
                    backgroundColor: 'var(--background) !important',
                    background: 'var(--background) !important',
                    color: 'var(--foreground) !important',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--muted-foreground) !important',
                    '&.Mui-focused': {
                      color: 'var(--primary) !important',
                    }
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--input) !important',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary) !important',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary) !important',
                    },
                  },
                  '& .MuiSelect-select': {
                    backgroundColor: 'var(--background) !important',
                    color: 'var(--foreground) !important',
                  },
                  '& .MuiMenuItem-root': {
                    '&:hover': {
                      backgroundColor: 'var(--muted) !important',
                    }
                  }
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
          <DialogTitle sx={{ 
            borderBottom: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--background)',
            color: 'var(--foreground)',
            fontWeight: 700,
            py: 2,
            px: 3,
            fontSize: '1.25rem',
            textAlign: 'center',
            m: 0
          }}>
            {editingUser.id ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
          </DialogTitle>
          <DialogContent sx={{ 
            py: 3, 
            px: 3,
            bgcolor: 'var(--background)',
            color: 'var(--foreground)'
          }}>
            <Box sx={{ 
              minWidth: 400,
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
                borderColor: 'var(--input)'
              },
              '& .MuiSvgIcon-root': {
                color: 'var(--muted-foreground)'
              }
            }}>
              <TextField
                fullWidth
                label="الاسم"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                margin="normal"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--card-bg)'
                  },
                  mb: 2
                }}
              />
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                margin="normal"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'var(--border)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--card-bg)'
                  },
                  mb: 2
                }}
              />
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel 
                  sx={{ 
                    color: 'var(--muted-foreground)',
                    '&.Mui-focused': {
                      color: 'var(--primary)'
                    }
                  }}
                >
                  الدور
                </InputLabel>
                <Select
                  value={editingUser.role}
                  label="الدور"
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  sx={{
                    '& .MuiSelect-select': {
                      color: 'var(--foreground)',
                      backgroundColor: 'var(--background)',
                      '&:focus': {
                        backgroundColor: 'transparent'
                      }
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--input)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'var(--primary)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'var(--muted-foreground)'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'var(--background)',
                        color: 'var(--foreground)',
                        '& .MuiMenuItem-root': {
                          '&:hover': {
                            backgroundColor: 'var(--muted)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'var(--muted)',
                            '&:hover': {
                              backgroundColor: 'var(--muted)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="user" sx={{ color: 'var(--foreground)' }}>مستخدم عادي</MenuItem>
                  <MenuItem value="admin" sx={{ color: 'var(--foreground)' }}>مدير</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            px: 3, 
            py: 2, 
            borderTop: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--background)',
            '& .MuiButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              '&.MuiButton-contained': {
                bgcolor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                '&:hover': {
                  bgcolor: 'var(--primary-hover)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'var(--muted)',
                  color: 'var(--muted-foreground)'
                }
              },
              '&.MuiButton-outlined': {
                color: 'var(--primary)',
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  bgcolor: 'var(--muted)'
                }
              }
            }
          }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--muted)'
                }
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSaveUser} 
              variant="contained" 
              disabled={saving}
              sx={{
                bgcolor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                '&:hover': {
                  bgcolor: 'var(--primary-hover)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'var(--muted)',
                  color: 'var(--muted-foreground)'
                },
                fontWeight: 500,
                px: 3,
                py: 0.5,
                borderRadius: 1
              }}
            >
              {editingUser.id ? 'حفظ التغييرات' : 'إضافة مستخدم'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog 
          open={openResetDialog} 
          onClose={() => setOpenResetDialog(false)}
          PaperProps={{
            sx: {
              bgcolor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              minWidth: '400px',
              borderRadius: 2,
              boxShadow: 'var(--shadow-lg)'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            py: 2
          }}>
            إعادة تعيين كلمة المرور
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography sx={{ color: 'var(--text-primary)', mb: 2 }}>
              سيتم تعيين كلمة المرور الجديدة لـ <strong>{selectedUser?.name}</strong> إلى:
            </Typography>
            <Box 
              sx={{ 
                bgcolor: 'var(--muted)', 
                p: 2, 
                borderRadius: 1,
                textAlign: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'var(--warning)', fontFamily: 'monospace' }}>
                123456
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 1 }}>
              سيتم إرسال بريد إلكتروني إلى المستخدم يحتوي على تعليمات تغيير كلمة المرور.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            px: 3, 
            py: 2, 
            borderTop: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--background)',
            '& .MuiButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              '&.MuiButton-contained': {
                bgcolor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                '&:hover': {
                  bgcolor: 'var(--primary-hover)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'var(--muted)',
                  color: 'var(--muted-foreground)'
                }
              },
              '&.MuiButton-outlined': {
                color: 'var(--primary)',
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  bgcolor: 'var(--muted)'
                }
              }
            }
          }}>
            <Button 
              onClick={() => setOpenResetDialog(false)}
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--muted)'
                }
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleResetPasswordConfirm} 
              variant="contained" 
              sx={{
                bgcolor: 'var(--warning)',
                color: 'var(--warning-foreground)',
                '&:hover': {
                  bgcolor: 'var(--warning-hover)'
                },
                fontWeight: 500,
                px: 3,
                py: 0.5,
                borderRadius: 1
              }}
            >
              تأكيد
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              bgcolor: 'var(--card-bg)',
              color: 'var(--text-primary)',
              minWidth: '400px',
              borderRadius: 2,
              boxShadow: 'var(--shadow-lg)'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            py: 2
          }}>
            تأكيد الحذف
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Typography sx={{ color: 'var(--text-primary)' }}>
              هل أنت متأكد من رغبتك في حذف المستخدم <strong>{selectedUser?.name}</strong>؟
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--destructive)', mt: 1 }}>
              لا يمكن التراجع عن هذا الإجراء.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            px: 3, 
            py: 2, 
            borderTop: '1px solid',
            borderColor: 'var(--border)',
            bgcolor: 'var(--background)',
            '& .MuiButton-root': {
              textTransform: 'none',
              fontWeight: 600,
              '&.MuiButton-contained': {
                bgcolor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                '&:hover': {
                  bgcolor: 'var(--primary-hover)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'var(--muted)',
                  color: 'var(--muted-foreground)'
                }
              },
              '&.MuiButton-outlined': {
                color: 'var(--primary)',
                borderColor: 'var(--border)',
                '&:hover': {
                  borderColor: 'var(--primary)',
                  bgcolor: 'var(--muted)'
                }
              }
            }
          }}>
            <Button 
              onClick={() => setOpenDeleteDialog(false)}
              sx={{
                color: 'var(--text-secondary)',
                '&:hover': {
                  backgroundColor: 'var(--muted)'
                }
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleDeleteUser} 
              variant="contained" 
              color="error"
              sx={{
                bgcolor: 'var(--destructive)',
                color: 'var(--destructive-foreground)',
                '&:hover': {
                  bgcolor: 'var(--destructive-hover)'
                },
                fontWeight: 500,
                px: 3,
                py: 0.5,
                borderRadius: 1
              }}
            >
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
          sx={{
            '& .MuiPaper-root': {
              bgcolor: snackbar.severity === 'error' ? 'var(--destructive)' : 
                       snackbar.severity === 'success' ? 'var(--success)' : 
                       snackbar.severity === 'warning' ? 'var(--warning)' : 'var(--primary)',
              color: 'white',
              fontWeight: 500,
              boxShadow: 'var(--shadow-lg)'
            }
          }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ 
              width: '100%',
              '& .MuiAlert-message': {
                color: 'white',
                fontWeight: 500
              },
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
            iconMapping={{
              success: <CheckCircleOutline fontSize="inherit" />,
              error: <ErrorOutline fontSize="inherit" />,
              warning: <WarningAmberOutlined fontSize="inherit" />,
              info: <InfoOutlined fontSize="inherit" />
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default UsersManagement;
