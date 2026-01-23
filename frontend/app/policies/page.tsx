'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Snackbar,
  IconButton,
  Menu,
} from '@mui/material';
import { policiesApi, Policy } from '../../lib/api/policies';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api/client';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// Date formatting helper
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

export default function PoliciesPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    startDate: '',
    endDate: '',
    premiumPaid: false,
  });
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; policy: Policy } | null>(null);
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const isStaff = user?.role === 'ADMIN' || user?.role === 'UNDERWRITER' || user?.role === 'AGENT' || user?.role === 'CLAIMS_OFFICER';

  const { data: policies, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getAll(),
    enabled: isAuthenticated,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => policiesApi.update(id, updates),
    onSuccess: () => {
      setToast({ message: 'Policy updated successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setEditDialogOpen(false);
      setSelectedPolicy(null);
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to update policy', severity: 'error' });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (policy: Policy) => {
      // Update policy to mark premium as paid
      await policiesApi.update(policy.id, { premiumPaid: true });
      // Also create a payment record
      await apiClient.post('/api/payments', {
        policyId: policy.id,
        amount: policy.premium,
        method: 'MANUAL',
        status: 'PAID',
      });
      return { success: true };
    },
    onSuccess: () => {
      setToast({ message: 'Premium marked as paid successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to mark premium as paid', severity: 'error' });
    },
  });

  const handleMarkAsPaid = (policy: Policy) => {
    if (window.confirm(`Mark premium of $${policy.premium?.toFixed(2) || '0.00'} as paid for policy ${policy.policyNumber}?`)) {
      markAsPaidMutation.mutate(policy);
    }
  };

  const handleEdit = (policy: Policy) => {
    setSelectedPolicy(policy);
    setEditForm({
      status: policy.status || 'ACTIVE',
      startDate: policy.startDate ? new Date(policy.startDate).toISOString().split('T')[0] : '',
      endDate: policy.endDate ? new Date(policy.endDate).toISOString().split('T')[0] : '',
      premiumPaid: policy.premiumPaid || false,
    });
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedPolicy) return;
    updatePolicyMutation.mutate({
      id: selectedPolicy.id,
      updates: {
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        premiumPaid: editForm.premiumPaid,
      },
    });
  };



  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load policies. Please try again later.
      </Alert>
    );
  }

  const activePolicies = policies?.filter((p) => p.status === 'ACTIVE') || [];
  const totalPremium = policies?.reduce((sum, p) => sum + (p.premium || 0), 0) || 0;

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'radial-gradient(circle at top left, rgba(0, 102, 204, 0.12), transparent 55%), radial-gradient(circle at top right, rgba(0, 191, 166, 0.12), transparent 55%)',
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
            Policy management
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Your insurance policies at a glance.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            View all your active and expired policies, track premium payments, and manage your coverage.
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Policies
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {policies?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Policies
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {activePolicies.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Premium
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                ${totalPremium.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
          All Policies
        </Typography>
        {policies && policies.length === 0 ? (
          <Box
            sx={{
              py: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6" gutterBottom>
              No policies found
            </Typography>
            <Typography variant="body2">You don't have any policies yet. Request a quote to get started.</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {policies?.map((policy) => {
              const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                ACTIVE: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: '#10B981' },
                LAPSED: { bg: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', border: '#F59E0B' },
                CANCELLED: { bg: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: '#EF4444' },
                RENEWED: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: '#10B981' },
              };
              const config = statusColors[policy.status] || { bg: 'rgba(107, 114, 128, 0.08)', color: '#6B7280', border: '#6B7280' };
              const menuOpen = Boolean(menuAnchor && menuAnchor.policy.id === policy.id);

              return (
                <Paper
                  key={policy.id}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: `4px solid ${config.border}`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                        Policy Number
                      </Typography>
                      <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                        {policy.policyNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                        Product
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                        {policy.product?.name || 'Unknown Product'}
                      </Typography>
                      <Chip
                        label={policy.product?.type || 'N/A'}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3B82F6',
                          borderRadius: '16px',
                          mt: 0.5,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                        Premium
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                        ${Number(policy.premium).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                        Coverage Period
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {formatDate(policy.startDate)} - {formatDate(policy.endDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={policy.status}
                          sx={{
                            backgroundColor: config.bg,
                            color: config.color,
                            border: `1px solid ${config.border}`,
                            fontWeight: 600,
                            borderRadius: '20px',
                            mb: 0.5,
                          }}
                        />
                        {isStaff && (
                          <IconButton
                            size="small"
                            onClick={(e) => setMenuAnchor({ element: e.currentTarget, policy })}
                            sx={{ ml: 'auto' }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        )}
                      </Box>
                      <Chip
                        label={policy.premiumPaid ? 'Paid' : 'Pending'}
                        size="small"
                        sx={{
                          backgroundColor: policy.premiumPaid 
                            ? 'rgba(16, 185, 129, 0.1)' 
                            : 'rgba(245, 158, 11, 0.1)',
                          color: policy.premiumPaid ? '#10B981' : '#F59E0B',
                          borderRadius: '16px',
                          fontSize: '0.7rem',
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Actions Menu */}
      {isStaff && menuAnchor && (
        <Menu
          anchorEl={menuAnchor.element}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => { handleEdit(menuAnchor.policy); setMenuAnchor(null); }}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            Edit Policy
          </MenuItem>
          {!menuAnchor.policy.premiumPaid && (
            <MenuItem onClick={() => { handleMarkAsPaid(menuAnchor.policy); setMenuAnchor(null); }}>
              <PaymentIcon sx={{ mr: 1, fontSize: 20 }} />
              Mark as Paid
            </MenuItem>
          )}
        </Menu>
      )}

      {/* Edit Policy Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedPolicy(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Policy</DialogTitle>
        <DialogContent>
          {selectedPolicy && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                Editing Policy: {selectedPolicy.policyNumber} - {selectedPolicy.product?.name}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editForm.status}
                      label="Status"
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="LAPSED">LAPSED</MenuItem>
                      <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                      <MenuItem value="RENEWED">RENEWED</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editForm.premiumPaid}
                        onChange={(e) => setEditForm({ ...editForm, premiumPaid: e.target.checked })}
                      />
                    }
                    label="Premium Paid"
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedPolicy(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={updatePolicyMutation.isPending}
          >
            {updatePolicyMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
