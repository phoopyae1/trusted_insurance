'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation } from '@tanstack/react-query';
import { claimsApi, Claim } from '../../lib/api/claims';
import { policiesApi, Policy } from '../../lib/api/policies';
import { useAuth } from '../../contexts/AuthContext';

const columns: GridColDef<Claim>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'status', headerName: 'Status', flex: 1 },
  { field: 'claimType', headerName: 'Type', flex: 1 },
  {
    field: 'amount',
    headerName: 'Amount',
    flex: 1,
    valueFormatter: ({ value }) => `$${Number(value)?.toFixed(2) || 0}`,
  },
  { field: 'incidentDate', headerName: 'Incident Date', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 2 },
];

export default function ClaimsPage() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    policyId: '',
    claimType: 'HEALTH',
    amount: '',
    incidentDate: '',
    description: '',
  });
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  const { data: claims = [], isLoading, refetch } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsApi.getAll(),
    enabled: isAuthenticated,
  });

  const { data: policies = [], isLoading: policiesLoading } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getAll(),
    enabled: isAuthenticated,
  });

  const submitClaimMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (!isAuthenticated) {
        throw new Error('Please log in to submit a claim');
      }
      return claimsApi.create({
        policyId: Number(values.policyId),
        claimType: values.claimType,
        amount: Number(values.amount),
        incidentDate: values.incidentDate,
        description: values.description,
      });
    },
    onSuccess: () => {
      setToast({ message: 'Claim submitted successfully!', severity: 'success' });
      setForm({ policyId: '', claimType: 'HEALTH', amount: '', incidentDate: '', description: '' });
      // Refetch claims to show the new one
      refetch();
    },
    onError: (error: Error) => {
      setToast({
        message: error.message || 'Failed to submit claim. Please check your inputs and try again.',
        severity: 'error',
      });
      console.error('Claim submission error:', error);
    },
  });

  const handleSubmit = () => {
    if (!form.policyId || !form.amount || !form.incidentDate || !form.description) {
      setToast({ message: 'Please fill in all required fields', severity: 'error' });
      return;
    }
    if (Number(form.amount) <= 0) {
      setToast({ message: 'Amount must be greater than 0', severity: 'error' });
      return;
    }
    submitClaimMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
          Claims center
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Track incidents and submit claims faster.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage claim activity with digital uploads, real-time status updates, and a clear next-step timeline.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label="Average response: 24 hrs" variant="outlined" color="primary" />
          <Chip label="Multi-policy support" variant="outlined" color="primary" />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Claims overview
            </Typography>
            <Box sx={{ height: 360 }}>
              <DataGrid rows={claims} columns={columns} disableRowSelectionOnClick getRowId={(row) => row.id} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Submit a claim
            </Typography>
            {!isAuthenticated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please log in to submit a claim
              </Alert>
            )}
            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Select Policy</InputLabel>
                {policiesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Select
                    value={form.policyId}
                    label="Select Policy"
                    onChange={(e) => setForm({ ...form, policyId: e.target.value })}
                    disabled={!isAuthenticated || submitClaimMutation.isPending || policies.length === 0}
                  >
                    {policies.length === 0 ? (
                      <MenuItem disabled value="">
                        No active policies available
                      </MenuItem>
                    ) : (
                      policies
                        .filter((policy) => policy.status === 'ACTIVE')
                        .map((policy) => (
                          <MenuItem key={policy.id} value={policy.id.toString()}>
                            {policy.policyNumber} - {policy.product?.name || 'Unknown Product'} (${policy.premium?.toFixed(2) || '0.00'})
                          </MenuItem>
                        ))
                    )}
                  </Select>
                )}
                {policies.length === 0 && !policiesLoading && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    You need an active policy to submit a claim
                  </Typography>
                )}
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Claim Type</InputLabel>
                <Select
                  value={form.claimType}
                  label="Claim Type"
                  onChange={(e) => setForm({ ...form, claimType: e.target.value })}
                  disabled={!isAuthenticated || submitClaimMutation.isPending}
                >
                  <MenuItem value="HEALTH">Health</MenuItem>
                  <MenuItem value="LIFE">Life</MenuItem>
                  <MenuItem value="MOTOR">Motor</MenuItem>
                  <MenuItem value="TRAVEL">Travel</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                disabled={!isAuthenticated || submitClaimMutation.isPending}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Enter the claim amount"
              />
              <TextField
                label="Incident date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                required
                disabled={!isAuthenticated || submitClaimMutation.isPending}
              />
              <TextField
                label="Description"
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                disabled={!isAuthenticated || submitClaimMutation.isPending}
                helperText="Describe the incident in detail"
              />
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={!isAuthenticated || submitClaimMutation.isPending}
                fullWidth
              >
                {submitClaimMutation.isPending ? 'Submitting...' : 'Submit claim'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast?.severity || 'info'}>{toast?.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
