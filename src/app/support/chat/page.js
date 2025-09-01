'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Typography, CircularProgress, Box, Paper, Button, useTheme, TextField } from '@mui/material';
import { useAuth } from '@/app/auth/AuthProvider';
import { useColorMode } from '@/app/nav/theme/ThemeProvider';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center', p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            حدث خطأ غير متوقع
          </Typography>
          <Typography variant="body1" paragraph>
            {this.state.error?.message || 'يرجى تحديث الصفحة والمحاولة مرة أخرى'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            تحديث الصفحة
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

function SupportChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { mode } = useColorMode();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const threadId = searchParams.get('threadId');

  useEffect(() => {
    console.log('useEffect triggered', { authLoading, isAuthenticated, threadId });
    
    if (authLoading) {
      console.log('Waiting for auth to load...');
      return;
    }
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login...');
      const redirectUrl = '/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
      console.log('Redirect URL:', redirectUrl);
      router.push(redirectUrl);
      return;
    }

    if (!threadId) {
      console.error('No threadId provided');
      setError('معرف المحادثة غير صالح');
      setLoading(false);
      return;
    }

    const loadThread = async () => {
      console.log('Loading thread with ID:', threadId);
      try {
        setLoading(true);
        const response = await fetch(`/api/support/threads/${threadId}`, {
          credentials: 'include' // Important for sending cookies
        });
        
        console.log('Thread API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`فشل في تحميل المحادثة: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Thread data loaded:', data);
        setThread(data);
        
        // Load messages after thread is loaded
        try {
          await loadMessages();
        } catch (err) {
          console.error('Error loading messages:', err);
          // Continue even if messages fail to load
        }
      } catch (err) {
        console.error('Error in loadThread:', err);
        setError(err.message || 'حدث خطأ أثناء تحميل المحادثة');
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId, isAuthenticated, authLoading, router]);

  const loadMessages = async () => {
    if (!threadId) {
      console.error('Cannot load messages: No threadId');
      return;
    }
    
    console.log('Loading messages for thread:', threadId);
    
    try {
      const response = await fetch(`/api/support/threads/${threadId}/messages`, {
        credentials: 'include' // Important for sending cookies
      });
      
      console.log('Messages API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error loading messages:', errorText);
        throw new Error(`فشل في تحميل الرسائل: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Messages loaded:', data);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error in loadMessages:', err);
      // Don't show error to user, just log it
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch(`/api/support/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          senderType: user?.role_id === 4 ? 'admin' : 'user',
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>جاري التحميل...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  // Debug info
  console.log('Render - SupportChat', {
    loading,
    error,
    threadId,
    thread,
    messages,
    user: { id: user?.id, role_id: user?.role_id },
    isAuthenticated,
    authLoading
  });

  // Styles for dark mode
  const chatContainerStyle = {
    mt: 4,
    mb: 4,
    color: mode === 'dark' ? '#FFD700' : 'inherit',
  };

  const paperStyle = {
    p: 3,
    borderRadius: 2,
    bgcolor: mode === 'dark' ? '#1E1E1E' : 'background.paper',
    color: mode === 'dark' ? '#FFD700' : 'inherit',
  };

  const messageBoxStyle = {
    height: '60vh',
    overflowY: 'auto',
    mb: 2,
    p: 2,
    border: '1px solid',
    borderColor: mode === 'dark' ? '#333' : '#eee',
    borderRadius: 1,
    bgcolor: mode === 'dark' ? '#121212' : 'background.paper',
  };

  const inputSx = {
    flex: 1,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: mode === 'dark' ? '#444' : '#ddd',
      },
      '&:hover fieldset': {
        borderColor: mode === 'dark' ? '#666' : '#aaa',
      },
      '&.Mui-focused fieldset': {
        borderColor: mode === 'dark' ? '#FFD700' : '#1976d2',
        boxShadow: mode === 'dark' 
          ? '0 0 0 2px rgba(255, 215, 0, 0.2)' 
          : '0 0 0 2px rgba(25, 118, 210, 0.2)',
      },
      '& input': {
        color: mode === 'dark' ? '#FFD700' : 'inherit',
        padding: '12px 15px',
        direction: 'rtl',
        '&::placeholder': {
          color: mode === 'dark' ? '#888' : '#999',
          opacity: 1,
        },
      },
      backgroundColor: mode === 'dark' ? '#2A2A2A' : '#ffffff',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
    },
  };

  return (
    <Container maxWidth="md" sx={chatContainerStyle}>
      <Paper elevation={3} sx={paperStyle}>
        <Typography variant="h5" gutterBottom sx={{ color: mode === 'dark' ? '#FFD700' : 'inherit' }}>
          محادثة الدعم الفني
          {thread && ` - ${thread.user_name || 'مستخدم'}`}
        </Typography>
        
        <Box sx={messageBoxStyle}>
          {messages.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ mt: 4 }}>
              لا توجد رسائل بعد. ابدأ المحادثة الآن!
            </Typography>
          ) : (
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.sender_type === 'admin' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    maxWidth: '80%',
                    bgcolor: message.sender_type === 'admin' 
                      ? (mode === 'dark' ? '#2D3748' : '#e3f2fd') 
                      : (mode === 'dark' ? '#2A2A2A' : '#f5f5f5'),
                    color: mode === 'dark' ? '#FFD700' : 'inherit',
                    border: `1px solid ${mode === 'dark' ? '#444' : '#e0e0e0'}`,
                  }}
                >
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      mt: 1,
                      color: mode === 'dark' ? '#FFD700' : 'text.secondary',
                      textAlign: 'left'
                    }}
                  >
                    {new Date(message.created_at).toLocaleString('ar-SA')}
                  </Typography>
                </Paper>
              </Box>
            ))
          )}
        </Box>

        <Box 
          component="form" 
          onSubmit={handleSendMessage} 
          sx={{ 
            display: 'flex', 
            gap: 2,
            p: 2,
            bgcolor: mode === 'dark' ? '#1E1E1E' : '#f8f9fa',
            borderRadius: '12px',
            border: `1px solid ${mode === 'dark' ? '#333' : '#e0e0e0'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            aria-label="نص الرسالة"
            sx={inputSx}
            InputProps={{
              sx: {
                '&.MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: mode === 'dark' ? '#444' : '#ddd',
                  },
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!newMessage.trim() || sending}
            sx={{
              padding: '0 24px',
              borderRadius: '8px',
              minWidth: '100px',
              height: '48px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              bgcolor: mode === 'dark' ? '#FFD700' : '#1976d2',
              color: mode === 'dark' ? '#000' : '#fff',
              opacity: !newMessage.trim() || sending ? 0.5 : 1,
              '&:hover': {
                bgcolor: mode === 'dark' ? '#FFE44D' : '#1565c0',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                bgcolor: mode === 'dark' ? '#444' : '#e0e0e0',
                color: mode === 'dark' ? '#666' : '#999',
                transform: 'none',
              },
            }}
          >
            {sending ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} thickness={4} sx={{ color: mode === 'dark' ? '#000' : '#fff' }} />
                <span>جاري الإرسال...</span>
              </Box>
            ) : (
              'إرسال'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

// Add this to prevent Next.js from trying to pre-render this page
// Wrap the component with ErrorBoundary
export default function SupportChat() {
  return (
    <ErrorBoundary>
      <SupportChatContent />
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
