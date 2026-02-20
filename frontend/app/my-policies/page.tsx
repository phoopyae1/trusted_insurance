'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { policiesApi, Policy } from '../../lib/api/policies';
import {
  Policy as PolicyIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

export default function MyPoliciesPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: policies = [], isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: () => policiesApi.getAll(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Alert severity="info">Please log in to view your policies</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Alert severity="error">Failed to load policies. Please try again later.</Alert>
      </Container>
    );
  }

  // Calculate statistics
  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.status === 'ACTIVE').length,
    totalPremium: policies.reduce((sum, p) => sum + (p.premium || 0), 0),
    paid: policies.filter((p) => p.premiumPaid).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'LAPSED':
        return 'error';
      case 'CANCELLED':
        return 'default';
      case 'RENEWED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={4}>
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
              Policy Management
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              Your Insurance Policies
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View all your active and expired policies, track premium payments, and manage your coverage.
            </Typography>
          </Stack>
        </Paper>

        {/* Statistics Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PolicyIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Policies
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'success.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Policies
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'info.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MoneyIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      ${stats.totalPremium.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Premium
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 0,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'warning.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PendingIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>
                      {stats.paid}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Policies Paid
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Policies Table */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 0,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
            All Policies
          </Typography>
          {policies.length === 0 ? (
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
              <PolicyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                No policies found
              </Typography>
              <Typography variant="body2">You don't have any policies yet. Request a quote to get started.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Policy Number</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Premium</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Coverage Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {policy.policyNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {policy.product?.name || 'N/A'}
                          </Typography>
                          <Chip
                            label={policy.product?.type || 'N/A'}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, fontSize: '0.75rem' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight={700} color="primary.main">
                          ${Number(policy.premium).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(policy.startDate)} - {formatDate(policy.endDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={policy.status}
                          color={getStatusColor(policy.status) as any}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={policy.premiumPaid ? 'Paid' : 'Pending'}
                          color={policy.premiumPaid ? 'success' : 'warning'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
