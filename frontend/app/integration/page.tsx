'use client';

import { useState } from 'react';
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsApi, Integration, CreateIntegrationData } from '../../lib/api/integrations';
import { useAuth } from '../../contexts/AuthContext';
import AddIcon from '@mui/icons-material/Add';

// Optional auth hook that doesn't throw if context is not available
function useOptionalAuth() {
  try {
    return useAuth();
  } catch {
    return { user: null, isAuthenticated: false };
  }
}
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import KeyIcon from '@mui/icons-material/Key';

export default function IntegrationPage() {
  // Optional auth - page is accessible without login
  const authContext = useOptionalAuth();
  const user = authContext?.user || null;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contextKey: '',
    scriptTag: '',
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT';
  const canManage = isAdmin || isAgent;

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getAll,
  });

  // Load existing integration data into form
  React.useEffect(() => {
    if (integrations.length > 0) {
      const existing = integrations[0]; // Only one record
      setFormData({
        contextKey: existing.contextKey || '',
        scriptTag: existing.scriptTag || '',
      });
    }
  }, [integrations]);

  const createMutation = useMutation({
    mutationFn: integrationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      setSnackbar({ open: true, message: 'Integration settings saved successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error?.response?.data?.error?.message || 'Failed to create integration',
        severity: 'error',
      });
    },
  });



  const handleSubmit = () => {
    if (!formData.contextKey?.trim()) {
      setSnackbar({ open: true, message: 'Context key is required', severity: 'error' });
      return;
    }

    if (!formData.scriptTag?.trim()) {
      setSnackbar({ open: true, message: 'Script tag is required', severity: 'error' });
      return;
    }

    // Use create mutation which now does upsert
    createMutation.mutate({
      contextKey: formData.contextKey.trim(),
      scriptTag: formData.scriptTag.trim(),
    } as CreateIntegrationData);
  };


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard', severity: 'success' });
  };


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Integration Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage API keys, context keys, and script tags for third-party integrations
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                Integration Settings
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  label="Context Key"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  value={formData.contextKey}
                  onChange={(e) => setFormData({ ...formData, contextKey: e.target.value })}
                  placeholder="Enter your context key or API key"
                  helperText="Context key is required for API integrations"
                  error={!formData.contextKey.trim()}
                />

                <TextField
                  label="Script Tag"
                  fullWidth
                  required
                  multiline
                  rows={8}
                  value={formData.scriptTag}
                  onChange={(e) => setFormData({ ...formData, scriptTag: e.target.value })}
                  placeholder="Paste your script tag (e.g., <script>...</script>)"
                  helperText="Script tag is required for third-party integrations"
                  error={!formData.scriptTag.trim()}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFormData({ contextKey: '', scriptTag: '' });
                    }}
                    sx={{ borderRadius: 0, textTransform: 'none' }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    sx={{ borderRadius: 0, textTransform: 'none' }}
                  >
                    {createMutation.isPending ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Saving...
                      </>
                    ) : (
                      'Save Integration'
                    )}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {integrations.length > 0 && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Current Settings
                </Typography>
                <Divider sx={{ my: 2 }} />
                {integrations[0].contextKey && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Context Key
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {integrations[0].contextKey}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(integrations[0].contextKey || '')}
                      sx={{ mt: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {integrations[0].scriptTag && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Script Tag
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {integrations[0].scriptTag}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(integrations[0].scriptTag || '')}
                      sx={{ mt: 1 }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Last updated: {new Date(integrations[0].updatedAt).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
