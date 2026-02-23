'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Container,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi, Claim } from '../../lib/api/claims';
import { useAuth } from '../../contexts/AuthContext';
import { Snackbar } from '@mui/material';

const columns: GridColDef<Claim>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  {
    field: 'policyNumber',
    headerName: 'Policy Number',
    flex: 1,
    valueGetter: (params) => params.row?.policy?.policyNumber || 'N/A',
  },
  {
    field: 'customer',
    headerName: 'Customer',
    flex: 1,
    valueGetter: (params) => params.row?.user?.name || 'N/A',
  },
  {
    field: 'claimType',
    headerName: 'Type',
    flex: 1,
    renderCell: (params) => (
      <Chip label={params.value as string} size="small" variant="outlined" color="primary" />
    ),
  },
  {
    field: 'amount',
    headerName: 'Claimed Amount',
    flex: 1,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight={600}>
        ${Number(params.value)?.toFixed(2) || '0.00'}
      </Typography>
    ),
  },
  {
    field: 'approvedAmount',
    headerName: 'Approved Amount',
    flex: 1,
    renderCell: (params) => {
      const amount = params.value;
      if (!amount) return <Typography variant="body2" color="text.secondary">-</Typography>;
      return (
        <Typography variant="body2" fontWeight={600} color="success.main">
          ${Number(amount)?.toFixed(2)}
        </Typography>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => {
      const status = params.value as string;
      const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
        SUBMITTED: 'default',
        IN_REVIEW: 'primary',
        APPROVED: 'success',
        PARTIALLY_APPROVED: 'warning',
        REJECTED: 'error',
        PAID: 'success',
      };
      return (
        <Chip
          label={status.replace('_', ' ')}
          color={statusColors[status] || 'default'}
          size="small"
          variant="filled"
        />
      );
    },
  },
  {
    field: 'incidentDate',
    headerName: 'Incident Date',
    flex: 1,
    renderCell: (params) => {
      if (!params.value) return 'N/A';
      const date = new Date(params.value as string);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 150,
    getActions: (params) => {
      const claim = params.row as Claim;
      const actions = [];

      if (claim.status === 'SUBMITTED') {
        actions.push(
          <GridActionsCellItem
            key="assess"
            icon={<AssessmentIcon />}
            label="Start Assessment"
            onClick={() => handleAssess(claim.id)}
            showInMenu
          />
        );
      }

      if (claim.status === 'IN_REVIEW') {
        actions.push(
          <GridActionsCellItem
            key="approve"
            icon={<CheckCircleIcon />}
            label="Make Decision"
            onClick={() => handleOpenDecisionDialog(claim)}
            showInMenu
          />
        );
      }

      if ((claim.status === 'APPROVED' || claim.status === 'PARTIALLY_APPROVED') && !claim.paidAt) {
        actions.push(
          <GridActionsCellItem
            key="pay"
            icon={<AttachMoneyIcon />}
            label="Process Payment"
            onClick={() => handleProcessPayment(claim.id)}
            showInMenu
          />
        );
      }

      actions.push(
        <GridActionsCellItem
          key="view"
          icon={<VisibilityIcon />}
          label="View Details"
          onClick={() => handleViewDetails(claim)}
          showInMenu
        />
      );

      return actions;
    },
  },
];

let handleAssess: (id: number) => void;
let handleOpenDecisionDialog: (claim: Claim) => void;
let handleProcessPayment: (id: number) => void;
let handleViewDetails: (claim: Claim) => void;

export default function ClaimsOfficerPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [decisionForm, setDecisionForm] = useState({
    status: 'APPROVED' as 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED',
    decisionReason: '',
    eligibleAmount: '',
    deductible: '',
    approvedAmount: '',
  });
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

  // Check if user is claims officer or admin
  const isClaimsOfficer = user?.role === 'CLAIMS_OFFICER' || user?.role === 'ADMIN';

  const { data: claims = [], isLoading, refetch } = useQuery({
    queryKey: ['claims'],
    queryFn: () => claimsApi.getAll(),
    enabled: isClaimsOfficer,
  });

  const assessMutation = useMutation({
    mutationFn: (id: number) => claimsApi.assess(id),
    onSuccess: () => {
      setToast({ message: 'Claim assessment started', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      refetch();
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to start assessment', severity: 'error' });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: (data: { id: number; decision: any }) => claimsApi.makeDecision(data.id, data.decision),
    onSuccess: () => {
      setToast({ message: 'Claim decision recorded successfully', severity: 'success' });
      setDecisionDialogOpen(false);
      setDecisionForm({
        status: 'APPROVED',
        decisionReason: '',
        eligibleAmount: '',
        deductible: '',
        approvedAmount: '',
      });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      refetch();
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to record decision', severity: 'error' });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (id: number) => claimsApi.processPayment(id),
    onSuccess: () => {
      setToast({ message: 'Payment processed successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      refetch();
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to process payment', severity: 'error' });
    },
  });

  handleAssess = (id: number) => {
    if (window.confirm('Start assessment for this claim?')) {
      assessMutation.mutate(id);
    }
  };

  handleOpenDecisionDialog = (claim: Claim) => {
    setSelectedClaim(claim);
    setDecisionForm({
      status: 'APPROVED',
      decisionReason: '',
      eligibleAmount: claim.amount.toString(),
      deductible: '', // Start empty so user can type the deductible amount
      approvedAmount: claim.amount.toString(),
    });
    setDecisionDialogOpen(true);
  };

  handleProcessPayment = (id: number) => {
    if (window.confirm('Process payment for this claim?')) {
      paymentMutation.mutate(id);
    }
  };

  handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setViewDialogOpen(true);
  };

  const handleDecisionSubmit = () => {
    if (!decisionForm.decisionReason.trim()) {
      setToast({ message: 'Please provide a decision reason', severity: 'error' });
      return;
    }

    const decision: any = {
      status: decisionForm.status,
      decisionReason: decisionForm.decisionReason,
    };

    if (decisionForm.status === 'APPROVED' || decisionForm.status === 'PARTIALLY_APPROVED') {
      if (decisionForm.eligibleAmount) {
        decision.eligibleAmount = Number(decisionForm.eligibleAmount);
      }
      // Deductible: if provided, use it; otherwise default to 0
      if (decisionForm.deductible && decisionForm.deductible.trim() !== '') {
        decision.deductible = Number(decisionForm.deductible);
      } else {
        decision.deductible = 0;
      }
      // Approved amount: use provided value or calculate from eligible - deductible
      if (decisionForm.approvedAmount && decisionForm.approvedAmount.trim() !== '') {
        decision.approvedAmount = Number(decisionForm.approvedAmount);
      } else if (decisionForm.eligibleAmount) {
        const eligible = Number(decisionForm.eligibleAmount) || 0;
        const deductible = Number(decisionForm.deductible) || 0;
        decision.approvedAmount = Math.max(0, eligible - deductible);
      }
    }

    if (selectedClaim) {
      decisionMutation.mutate({ id: selectedClaim.id, decision });
    }
  };

  const calculateApprovedAmount = () => {
    if (decisionForm.eligibleAmount && decisionForm.deductible) {
      const eligible = Number(decisionForm.eligibleAmount) || 0;
      const deductible = Number(decisionForm.deductible) || 0;
      const approved = Math.max(0, eligible - deductible);
      setDecisionForm({ ...decisionForm, approvedAmount: approved.toString() });
    }
  };

  if (!isClaimsOfficer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">Access denied. This page is for Claims Officers only.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = {
    total: claims.length,
    submitted: claims.filter((c) => c.status === 'SUBMITTED').length,
    inReview: claims.filter((c) => c.status === 'IN_REVIEW').length,
    approved: claims.filter((c) => c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED').length,
    paid: claims.filter((c) => c.status === 'PAID').length,
    rejected: claims.filter((c) => c.status === 'REJECTED').length,
  };

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, maxWidth: '80%', width: '100%' }}>
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
            Claims Management
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Insurance Claim Process & Assessment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review claims, assess eligibility, make decisions, and process payments.
          </Typography>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Claims
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="default.main">
                {stats.submitted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main">
                {stats.inReview}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.paid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          All Claims
        </Typography>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={claims}
            columns={columns}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>
      </Paper>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Claim Details</DialogTitle>
        <DialogContent>
          {selectedClaim && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Claim ID
                  </Typography>
                  <Typography variant="body1">{selectedClaim.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      label={selectedClaim.status.replace('_', ' ')}
                      size="small"
                      color={
                        selectedClaim.status === 'APPROVED' || selectedClaim.status === 'PAID'
                          ? 'success'
                          : selectedClaim.status === 'REJECTED'
                          ? 'error'
                          : selectedClaim.status === 'PARTIALLY_APPROVED'
                          ? 'warning'
                          : 'default'
                      }
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Policy Number
                  </Typography>
                  <Typography variant="body1">{selectedClaim.policy?.policyNumber || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">{selectedClaim.user?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Claim Type
                  </Typography>
                  <Typography variant="body1">{selectedClaim.claimType}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Claimed Amount
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ${Number(selectedClaim.amount).toFixed(2)}
                  </Typography>
                </Grid>
                {selectedClaim.eligibleAmount != null && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Eligible Amount
                    </Typography>
                    <Typography variant="body1">${Number(selectedClaim.eligibleAmount).toFixed(2)}</Typography>
                  </Grid>
                )}
                {selectedClaim.deductible != null && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Deductible
                    </Typography>
                    <Typography variant="body1">${Number(selectedClaim.deductible).toFixed(2)}</Typography>
                  </Grid>
                )}
                {selectedClaim.approvedAmount != null && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Approved Amount
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      ${Number(selectedClaim.approvedAmount).toFixed(2)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Incident Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedClaim.incidentDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                {selectedClaim.assessedAt && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Assessed At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedClaim.assessedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
                {selectedClaim.assessedByUser && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Assessed By
                    </Typography>
                    <Typography variant="body1">{selectedClaim.assessedByUser.name}</Typography>
                  </Grid>
                )}
                {selectedClaim.paidAt && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Paid At
                    </Typography>
                    <Typography variant="body1">{new Date(selectedClaim.paidAt).toLocaleDateString()}</Typography>
                  </Grid>
                )}
              </Grid>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2">{selectedClaim.description}</Typography>
              {selectedClaim.decisionReason && (
                <>
                  <Divider />
                  <Typography variant="caption" color="text.secondary">
                    Decision Reason
                  </Typography>
                  <Typography variant="body2">{selectedClaim.decisionReason}</Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialogOpen} onClose={() => setDecisionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make Claim Decision</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedClaim && (
              <>
                <Alert severity="info">
                  Claim Amount: <strong>${Number(selectedClaim.amount).toFixed(2)}</strong>
                </Alert>
                <FormControl fullWidth required>
                  <InputLabel>Decision</InputLabel>
                  <Select
                    value={decisionForm.status}
                    label="Decision"
                    onChange={(e) =>
                      setDecisionForm({ ...decisionForm, status: e.target.value as any })
                    }
                  >
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="PARTIALLY_APPROVED">Partially Approved</MenuItem>
                    <MenuItem value="REJECTED">Rejected</MenuItem>
                  </Select>
                </FormControl>
                {(decisionForm.status === 'APPROVED' || decisionForm.status === 'PARTIALLY_APPROVED') && (
                  <>
                    <TextField
                      label="Eligible Amount"
                      type="number"
                      value={decisionForm.eligibleAmount}
                      onChange={(e) => {
                        setDecisionForm({ ...decisionForm, eligibleAmount: e.target.value });
                        setTimeout(calculateApprovedAmount, 100);
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Total amount eligible for coverage"
                    />
                    <TextField
                      label="Deductible"
                      type="text"
                      value={decisionForm.deductible}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string, numbers, and decimal point
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setDecisionForm({ ...decisionForm, deductible: value });
                          // Calculate approved amount after a short delay
                          setTimeout(() => {
                            if (decisionForm.eligibleAmount && value) {
                              const eligible = Number(decisionForm.eligibleAmount) || 0;
                              const deductible = Number(value) || 0;
                              const approved = Math.max(0, eligible - deductible);
                              setDecisionForm(prev => ({ ...prev, approvedAmount: approved.toString() }));
                            }
                          }, 100);
                        }
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Amount to be deducted (type the deductible amount)"
                      fullWidth
                      required={decisionForm.status === 'APPROVED' || decisionForm.status === 'PARTIALLY_APPROVED'}
                    />
                    <TextField
                      label="Approved Amount"
                      type="number"
                      value={decisionForm.approvedAmount}
                      onChange={(e) => setDecisionForm({ ...decisionForm, approvedAmount: e.target.value })}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Final amount to be paid (Eligible - Deductible)"
                    />
                  </>
                )}
                <TextField
                  label="Decision Reason"
                  multiline
                  minRows={3}
                  value={decisionForm.decisionReason}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decisionReason: e.target.value })}
                  required
                  helperText="Explain the reasoning for this decision"
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecisionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDecisionSubmit}
            variant="contained"
            disabled={decisionMutation.isPending || !decisionForm.decisionReason.trim()}
          >
            {decisionMutation.isPending ? 'Processing...' : 'Submit Decision'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast?.severity || 'info'}>{toast?.message}</Alert>
      </Snackbar>
      </Stack>
    </Container>
  );
}
