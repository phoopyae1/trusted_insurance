'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, Quote } from '../../lib/api/quotes';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCardIcon from '@mui/icons-material/AddCard';
import { policiesApi } from '../../lib/api/policies';

type TabValue = 'quotes' | 'claims';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('quotes');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    startDate: '',
    endDate: '',
    premiumPaid: false,
  });
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isUnderwriter = user?.role === 'UNDERWRITER' || user?.role === 'ADMIN';

  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () => quotesApi.getAll(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      quotesApi.updateStatus(id, status),
    onSuccess: () => {
      setToast({ message: 'Quote status updated successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setDetailOpen(false);
      setSelectedQuote(null);
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to update quote status', severity: 'error' });
    },
  });

  const handleApprove = (quote: Quote) => {
    updateStatusMutation.mutate({ id: quote.id, status: 'APPROVED' });
  };

  const handleReject = (quote: Quote) => {
    updateStatusMutation.mutate({ id: quote.id, status: 'REJECTED' });
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setDetailOpen(true);
  };

  const handleCreatePolicy = (quote: Quote) => {
    setSelectedQuote(quote);
    // Set default dates: start today, end 1 year from now
    const today = new Date();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(today.getFullYear() + 1);
    
    setPolicyForm({
      startDate: today.toISOString().split('T')[0],
      endDate: oneYearLater.toISOString().split('T')[0],
      premiumPaid: false,
    });
    setPolicyDialogOpen(true);
  };

  const createPolicyMutation = useMutation({
    mutationFn: (data: { quoteId: number; startDate: string; endDate: string; premiumPaid: boolean }) =>
      policiesApi.create(data),
    onSuccess: () => {
      setToast({ message: 'Policy created successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setPolicyDialogOpen(false);
      setSelectedQuote(null);
      setPolicyForm({ startDate: '', endDate: '', premiumPaid: false });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to create policy', severity: 'error' });
    },
  });

  const createMissingPoliciesMutation = useMutation({
    mutationFn: () => policiesApi.createMissing(),
    onSuccess: (data) => {
      setToast({ 
        message: `Successfully created ${data.count || 0} policies for approved quotes`, 
        severity: 'success' 
      });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to create policies', severity: 'error' });
    },
  });

  const handleSubmitPolicy = () => {
    if (!selectedQuote) return;
    if (!policyForm.startDate || !policyForm.endDate) {
      setToast({ message: 'Please fill in both start and end dates', severity: 'error' });
      return;
    }
    createPolicyMutation.mutate({
      quoteId: selectedQuote.id,
      startDate: policyForm.startDate,
      endDate: policyForm.endDate,
      premiumPaid: policyForm.premiumPaid,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };


  const filteredQuotes = quotes.filter((quote) => {
    if (activeTab === 'quotes') return true;
    // Add claims filtering logic here if needed
    return false;
  });

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
            Staff Management
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {isUnderwriter ? 'Underwriter Dashboard' : 'Staff Dashboard'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isUnderwriter
              ? 'Review and approve quotes, manage policies'
              : 'Manage quotes and claims'}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Quotes" value="quotes" />
          <Tab label="Claims" value="claims" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 'quotes' && (
            <>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  All Quotes ({filteredQuotes.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip
                    label={`Pending: ${quotes.filter((q) => q.status === 'PENDING').length}`}
                    sx={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      color: '#F59E0B',
                      border: 'none',
                      borderRadius: '16px',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={`Approved: ${quotes.filter((q) => q.status === 'APPROVED').length}`}
                    sx={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981',
                      border: 'none',
                      borderRadius: '16px',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={`Rejected: ${quotes.filter((q) => q.status === 'REJECTED').length}`}
                    sx={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: 'none',
                      borderRadius: '16px',
                      fontWeight: 500,
                    }}
                  />
                  {isUnderwriter && quotes.filter((q) => q.status === 'APPROVED' && !q.policy).length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => createMissingPoliciesMutation.mutate()}
                      disabled={createMissingPoliciesMutation.isPending}
                      sx={{ borderRadius: 0, textTransform: 'none' }}
                    >
                      {createMissingPoliciesMutation.isPending 
                        ? 'Creating...' 
                        : `Create Policies for ${quotes.filter((q) => q.status === 'APPROVED' && !q.policy).length} Approved Quote${quotes.filter((q) => q.status === 'APPROVED' && !q.policy).length !== 1 ? 's' : ''}`}
                    </Button>
                  )}
                </Box>
              </Box>
              {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                  <CircularProgress />
                </Box>
              ) : filteredQuotes.length === 0 ? (
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
                    No quotes found
                  </Typography>
                  <Typography variant="body2">There are no quotes to display.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {filteredQuotes.map((quote) => {
                    const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                      APPROVED: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10B981', border: '#10B981' },
                      REJECTED: { bg: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', border: '#EF4444' },
                      PENDING: { bg: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', border: '#F59E0B' },
                      DRAFT: { bg: 'rgba(107, 114, 128, 0.08)', color: '#6B7280', border: '#6B7280' },
                    };
                    const config = statusColors[quote.status] || statusColors.DRAFT;
                    
                    return (
                      <Paper
                        key={quote.id}
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
                              Quote #{quote.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {new Date(quote.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {quote.product?.name || 'Unknown Product'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {quote.product?.type || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                              Customer
                            </Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                              {quote.user?.name || quote.user?.email || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                              ${quote.premium ? Number(quote.premium).toFixed(2) : '0.00'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Monthly Premium
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={quote.status}
                                sx={{
                                  backgroundColor: config.bg,
                                  color: config.color,
                                  border: `1px solid ${config.border}`,
                                  fontWeight: 600,
                                  borderRadius: '20px',
                                  minWidth: 100,
                                }}
                              />
                              {quote.policy && (
                                <Chip
                                  label={quote.policy.policyNumber}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3B82F6',
                                    borderRadius: '16px',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewDetails(quote)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                {isUnderwriter && quote.status === 'PENDING' && (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleApprove(quote)}
                                      sx={{ color: 'success.main' }}
                                    >
                                      <CheckCircleIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleReject(quote)}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                                {isUnderwriter && quote.status === 'APPROVED' && !quote.policy && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCreatePolicy(quote)}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <AddCardIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </>
          )}

          {activeTab === 'claims' && (
            <Alert severity="info">
              Claims management coming soon. Use the Claims page to review claims.
            </Alert>
          )}
        </Box>
        </Paper>

      {/* Quote Details Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedQuote(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Quote Details</Typography>
            {selectedQuote && (
              <Chip
                label={selectedQuote.status}
                color={getStatusColor(selectedQuote.status) as any}
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quote ID
                  </Typography>
                  <Typography variant="body1">{selectedQuote.id}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Premium
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ${selectedQuote.premium?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Product
                  </Typography>
                  <Typography variant="body1">
                    {selectedQuote.product?.name || 'N/A'} ({selectedQuote.product?.type || 'N/A'})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedQuote.user?.name || 'N/A'} ({selectedQuote.user?.email || 'N/A'})
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedQuote.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedQuote.status}
                    color={getStatusColor(selectedQuote.status) as any}
                    size="small"
                  />
                </Grid>
      </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer Information & Risk Factors
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 0,
                  }}
                >
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {JSON.stringify(selectedQuote.metadata, null, 2)}
          </Typography>
        </Paper>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailOpen(false);
            setSelectedQuote(null);
          }}>
            Close
          </Button>
          {isUnderwriter && selectedQuote?.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleReject(selectedQuote)}
                color="error"
                variant="outlined"
                disabled={updateStatusMutation.isPending}
                startIcon={<CancelIcon />}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleApprove(selectedQuote)}
                color="success"
                variant="contained"
                disabled={updateStatusMutation.isPending}
                startIcon={<CheckCircleIcon />}
              >
                Approve
              </Button>
            </>
          )}
          {isUnderwriter && selectedQuote?.status === 'APPROVED' && !selectedQuote.policy && (
            <Button
              onClick={() => {
                setDetailOpen(false);
                handleCreatePolicy(selectedQuote);
              }}
              color="primary"
              variant="contained"
              startIcon={<AddCardIcon />}
            >
              Create Policy
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Policy Dialog */}
      <Dialog
        open={policyDialogOpen}
        onClose={() => {
          setPolicyDialogOpen(false);
          setSelectedQuote(null);
          setPolicyForm({ startDate: '', endDate: '', premiumPaid: false });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Create Policy from Quote</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedQuote && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                Creating policy for quote #{selectedQuote.id} - {selectedQuote.product?.name}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Premium Amount
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    ${selectedQuote.premium?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    value={policyForm.startDate}
                    onChange={(e) => setPolicyForm({ ...policyForm, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    value={policyForm.endDate}
                    onChange={(e) => setPolicyForm({ ...policyForm, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={policyForm.premiumPaid}
                        onChange={(e) => setPolicyForm({ ...policyForm, premiumPaid: e.target.checked })}
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
          <Button
            onClick={() => {
              setPolicyDialogOpen(false);
              setSelectedQuote(null);
              setPolicyForm({ startDate: '', endDate: '', premiumPaid: false });
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPolicy}
            variant="contained"
            disabled={createPolicyMutation.isPending || !policyForm.startDate || !policyForm.endDate}
            startIcon={<AddCardIcon />}
          >
            {createPolicyMutation.isPending ? 'Creating...' : 'Create Policy'}
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
