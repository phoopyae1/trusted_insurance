'use client';

import { useState } from 'react';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
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
} from '@mui/material';
import { policiesApi, Policy } from '../../lib/api/policies';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api/client';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
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

  const columns: GridColDef<Policy>[] = [
    { field: 'policyNumber', headerName: 'Policy Number', flex: 1 },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      valueGetter: (params) => params.row?.product?.name || 'N/A',
    },
    {
      field: 'premium',
      headerName: 'Premium',
      flex: 1,
      valueFormatter: ({ value }) => `$${Number(value)?.toFixed(2) || 0}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        const status = params.value as string;
        const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
          ACTIVE: 'success',
          LAPSED: 'warning',
          CANCELLED: 'error',
          RENEWED: 'success',
        };
        return (
          <Chip
            label={status}
            color={colorMap[status] || 'default'}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value),
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      valueFormatter: ({ value }) => formatDate(value),
    },
    {
      field: 'premiumPaid',
      headerName: 'Premium Paid',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Paid' : 'Pending'}
          color={params.value ? 'success' : 'warning'}
          size="small"
          variant="outlined"
        />
      ),
    },
    ...(isStaff ? [{
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: any) => {
        const policy = params.row as Policy;
        const actions = [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleEdit(policy)}
          />,
        ];
        
        // Add "Mark as Paid" action if premium is not paid
        if (!policy.premiumPaid) {
          actions.push(
            <GridActionsCellItem
              key="mark-paid"
              icon={<PaymentIcon />}
              label="Mark as Paid"
              onClick={() => handleMarkAsPaid(policy)}
              showInMenu
            />
          );
        }
        
        return actions;
      },
    } as GridColDef<Policy>] : []),
  ];


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
        <Typography variant="h6" gutterBottom>
          All Policies
        </Typography>
        <Box sx={{ height: 500, mt: 2 }}>
          <DataGrid
            rows={policies || []}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            getRowId={(row) => row.id}
          />
        </Box>
      </Paper>

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
