'use client';

import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { policiesApi } from '../../lib/api/policies';
import { quotesApi } from '../../lib/api/quotes';
import { claimsApi } from '../../lib/api/claims';
import {
  Policy as PolicyIcon,
  Description as QuoteIcon,
  Assignment as ClaimIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: policies = [], isLoading: policiesLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getAll(),
    enabled: !!user,
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => quotesApi.getAll(),
    enabled: !!user,
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims', user?.role],
    queryFn: () => {
      // Use customer-specific endpoint for customers
      if (user?.role === 'CUSTOMER') {
        return claimsApi.getCustomerClaims();
      }
      // Use regular endpoint for staff/admin
      return claimsApi.getAll();
    },
    enabled: !!user,
  });

  const isLoading = policiesLoading || quotesLoading || claimsLoading;

  // Calculate statistics
  const stats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter((p) => p.status === 'ACTIVE').length,
    totalPremium: policies.reduce((sum, p) => sum + (p.premium || 0), 0),
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter((q) => q.status === 'PENDING').length,
    approvedQuotes: quotes.filter((q) => q.status === 'APPROVED').length,
    totalClaims: claims.length,
    pendingClaims: claims.filter((c) => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW').length,
    approvedClaims: claims.filter((c) => c.status === 'APPROVED' || c.status === 'PARTIALLY_APPROVED').length,
    totalClaimAmount: claims.reduce((sum, c) => sum + (c.amount || 0), 0),
    paidClaims: claims.filter((c) => c.status === 'PAID').length,
  };

  // Recent items
  const recentPolicies = policies.slice(0, 5);
  const recentQuotes = quotes.slice(0, 5);
  const recentClaims = claims.slice(0, 5);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 0,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 0,
              backgroundColor: `${color}15`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 28 }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth={false} sx={{ py: { xs: 2, md: 3 }, maxWidth: '80%', width: '100%' }}>
      <Stack spacing={3}>
        {/* Header */}
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
            Dashboard Report
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Insurance Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive report of your insurance portfolio, quotes, and claims as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="Policy renewals this month" variant="outlined" color="primary" />
            <Chip label="Claims updates ready" variant="outlined" color="primary" />
          </Stack>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Key Metrics */}
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
              Key Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Policies"
                  value={stats.totalPolicies}
                  subtitle={`${stats.activePolicies} active`}
                  icon={PolicyIcon}
                  color="#1976d2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Premium"
                  value={`$${stats.totalPremium.toFixed(2)}`}
                  subtitle="Annual coverage"
                  icon={MoneyIcon}
                  color="#2e7d32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Active Quotes"
                  value={stats.totalQuotes}
                  subtitle={`${stats.pendingQuotes} pending`}
                  icon={QuoteIcon}
                  color="#ed6c02"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Claims"
                  value={stats.totalClaims}
                  subtitle={`${stats.pendingClaims} in review`}
                  icon={ClaimIcon}
                  color="#9c27b0"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Detailed Statistics */}
          <Grid container spacing={3}>
            {/* Policies Summary */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PolicyIcon sx={{ fontSize: 24, color: '#1976d2', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Policies Summary
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Policies
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.totalPolicies}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Policies
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {stats.activePolicies}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Premium Value
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${stats.totalPremium.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Policies Paid
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {policies.filter((p) => p.premiumPaid).length}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Quotes Summary */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QuoteIcon sx={{ fontSize: 24, color: '#ed6c02', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Quotes Summary
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Quotes
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.totalQuotes}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Pending Review
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="warning.main">
                      {stats.pendingQuotes}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {stats.approvedQuotes}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="error.main">
                      {quotes.filter((q) => q.status === 'REJECTED').length}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Claims Summary */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ClaimIcon sx={{ fontSize: 24, color: '#9c27b0', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Claims Summary
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Claims
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {stats.totalClaims}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      In Review
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="warning.main">
                      {stats.pendingClaims}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Approved/Partially Approved
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {stats.approvedClaims}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Claim Amount
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${stats.totalClaimAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Paid Claims
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {stats.paidClaims}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingIcon sx={{ fontSize: 24, color: '#1976d2', mr: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    Quick Actions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => router.push('/products')}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Browse Products
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Explore available insurance products
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => router.push('/quotes')}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Request New Quote
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get a personalized insurance quote
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => router.push('/claims')}
                  >
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Submit Claim
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      File a new insurance claim
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activity Tables */}
          <Grid container spacing={3}>
            {/* Recent Policies */}
            {recentPolicies.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Recent Policies
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Policy Number</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Premium</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentPolicies.map((policy) => (
                          <TableRow key={policy.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {policy.policyNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{policy.product?.name || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">${Number(policy.premium).toFixed(2)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={policy.status}
                                size="small"
                                color={policy.status === 'ACTIVE' ? 'success' : 'default'}
                                sx={{ borderRadius: '16px' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
          </Paper>
        </Grid>
            )}

            {/* Recent Claims */}
            {recentClaims.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Recent Claims
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentClaims.map((claim) => (
                          <TableRow key={claim.id} hover>
                            <TableCell>
                              <Typography variant="body2">{claim.claimType}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                ${Number(claim.amount).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={claim.status}
                                size="small"
                                color={
                                  claim.status === 'APPROVED' || claim.status === 'PAID'
                                    ? 'success'
                                    : claim.status === 'REJECTED'
                                    ? 'error'
                                    : 'warning'
                                }
                                sx={{ borderRadius: '16px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(claim.createdAt).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
    </Grid>
        </>
      )}
      </Stack>
    </Container>
  );
}
