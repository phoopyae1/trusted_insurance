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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi, Claim } from '../../lib/api/claims';
import { policiesApi, Policy } from '../../lib/api/policies';
import { useAuth } from '../../contexts/AuthContext';

export default function ClaimsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    policyId: '',
    claimType: 'HEALTH',
    amount: '',
    incidentDate: '',
    description: '',
  });
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  const { user } = useAuth();
  const { data: claims = [], isLoading, refetch } = useQuery({
    queryKey: ['claims', user?.role],
    queryFn: () => {
      // Use customer-specific endpoint for customers
      if (user?.role === 'CUSTOMER') {
        return claimsApi.getCustomerClaims();
      }
      // Use regular endpoint for staff/admin
      return claimsApi.getAll();
    },
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
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
      
      // For customers, use the customer-specific endpoint with policyNumber
      if (user?.role === 'CUSTOMER') {
        const selectedPolicy = policies.find(p => p.id.toString() === values.policyId);
        if (!selectedPolicy || !selectedPolicy.policyNumber) {
          throw new Error('Selected policy not found or missing policy number');
        }
        return claimsApi.submitCustomerClaim({
          policyNumber: selectedPolicy.policyNumber,
          claimType: values.claimType,
          amount: Number(values.amount),
          incidentDate: values.incidentDate,
          description: values.description,
        });
      }
      
      // For staff/admin, use the regular endpoint with policyId
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
      // Invalidate and refetch claims to show the new one
      queryClient.invalidateQueries({ queryKey: ['claims'] });
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
          <Chip
            label="Average response: 24 hrs"
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3B82F6',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 500,
            }}
          />
          <Chip
            label="Multi-policy support"
            sx={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 500,
            }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              Claims Overview
            </Typography>
            {claims.length === 0 ? (
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
                  No claims found
                </Typography>
                <Typography variant="body2">Submit a claim using the form on the right</Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {claims.map((claim) => {
                  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                    SUBMITTED: { bg: 'rgba(107, 114, 128, 0.08)', color: '#6B7280', border: '#6B7280' },
                    IN_REVIEW: { bg: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', border: '#3B82F6' },
                    APPROVED: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: '#10B981' },
                    PARTIALLY_APPROVED: { bg: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', border: '#F59E0B' },
                    REJECTED: { bg: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: '#EF4444' },
                    PAID: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: '#10B981' },
                  };
                  const config = statusColors[claim.status] || statusColors.SUBMITTED;
                  
                  return (
                    <Paper
                      key={claim.id}
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderLeft: `4px solid ${config.border}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2}>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                            Claim #{claim.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {new Date(claim.incidentDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Chip
                            label={claim.claimType}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#3B82F6',
                              borderRadius: '16px',
                              mb: 1,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {claim.description.length > 50 
                              ? `${claim.description.substring(0, 50)}...` 
                              : claim.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            ${Number(claim.amount).toFixed(2)}
                          </Typography>
                          {claim.approvedAmount != null && (
                            <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                              Approved: ${Number(claim.approvedAmount).toFixed(2)}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={claim.status.replace('_', ' ')}
                              sx={{
                                backgroundColor: config.bg,
                                color: config.color,
                                border: `1px solid ${config.border}`,
                                fontWeight: 600,
                                borderRadius: '20px',
                                minWidth: 100,
                              }}
                            />
            </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                            Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
              Submit a Claim
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill out the form below to submit a new insurance claim
            </Typography>
            {!isAuthenticated && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: 0 }}>
                Please log in to submit a claim
              </Alert>
            )}
            <Stack spacing={3}>
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
                onChange={(e) => {
                      const selectedPolicyId = e.target.value;
                      const selectedPolicy = policies.find(p => p.id.toString() === selectedPolicyId);
                      setForm({
                        ...form,
                        policyId: selectedPolicyId,
                        claimType: selectedPolicy?.product?.type || 'HEALTH' // Auto-set claim type based on policy product
                      });
                    }}
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
                  <MenuItem value="FIRE">Fire</MenuItem>
                  <MenuItem value="PROPERTY">Property</MenuItem>
                  <MenuItem value="HOME">Home</MenuItem>
                  <MenuItem value="BUSINESS">Business</MenuItem>
                  <MenuItem value="LIABILITY">Liability</MenuItem>
                </Select>
                {form.policyId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    Claim type auto-set to match policy product type ({policies.find(p => p.id.toString() === form.policyId)?.product?.type || 'N/A'})
                  </Typography>
                )}
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
                helperText={
                  form.policyId
                    ? (() => {
                        const selectedPolicy = policies.find(p => p.id.toString() === form.policyId);
                        if (selectedPolicy) {
                          const startDate = new Date(selectedPolicy.startDate).toISOString().split('T')[0];
                          const endDate = new Date(selectedPolicy.endDate).toISOString().split('T')[0];
                          return `Must be between ${startDate} and ${endDate}`;
                        }
                        return '';
                      })()
                    : 'Select a policy first to see date range'
                }
                inputProps={{
                  min: form.policyId
                    ? (() => {
                        const selectedPolicy = policies.find(p => p.id.toString() === form.policyId);
                        return selectedPolicy ? new Date(selectedPolicy.startDate).toISOString().split('T')[0] : undefined;
                      })()
                    : undefined,
                  max: form.policyId
                    ? (() => {
                        const selectedPolicy = policies.find(p => p.id.toString() === form.policyId);
                        return selectedPolicy ? new Date(selectedPolicy.endDate).toISOString().split('T')[0] : undefined;
                      })()
                    : undefined,
                }}
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
                sx={{ borderRadius: 0, textTransform: 'none', py: 1.5, fontWeight: 600 }}
              >
                {submitClaimMutation.isPending ? 'Submitting...' : 'Submit Claim'}
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
