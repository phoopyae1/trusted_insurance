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
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Snackbar,
  Container,
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  DirectionsCar as MotorIcon,
  Favorite as LifeIcon,
  FlightTakeoff as TravelIcon,
  LocalFireDepartment as FireIcon,
  AccountBalance as PropertyIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Gavel as LiabilityIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { productsApi, Product } from '../../lib/api/products';

const getProductIcon = (type: string) => {
  switch (type) {
    case 'HEALTH':
      return <HealthIcon sx={{ fontSize: 48 }} />;
    case 'MOTOR':
      return <MotorIcon sx={{ fontSize: 48 }} />;
    case 'LIFE':
      return <LifeIcon sx={{ fontSize: 48 }} />;
    case 'TRAVEL':
      return <TravelIcon sx={{ fontSize: 48 }} />;
    case 'FIRE':
      return <FireIcon sx={{ fontSize: 48 }} />;
    case 'PROPERTY':
      return <PropertyIcon sx={{ fontSize: 48 }} />;
    case 'BUSINESS':
      return <BusinessIcon sx={{ fontSize: 48 }} />;
    case 'HOME':
      return <HomeIcon sx={{ fontSize: 48 }} />;
    case 'LIABILITY':
      return <LiabilityIcon sx={{ fontSize: 48 }} />;
    default:
      return <HealthIcon sx={{ fontSize: 48 }} />;
  }
};

const getProductColor = (type: string) => {
  switch (type) {
    case 'HEALTH':
      return { main: '#10B981', light: 'rgba(16, 185, 129, 0.1)' };
    case 'MOTOR':
      return { main: '#3B82F6', light: 'rgba(59, 130, 246, 0.1)' };
    case 'LIFE':
      return { main: '#EF4444', light: 'rgba(239, 68, 68, 0.1)' };
    case 'TRAVEL':
      return { main: '#8B5CF6', light: 'rgba(139, 92, 246, 0.1)' };
    case 'FIRE':
      return { main: '#F59E0B', light: 'rgba(245, 158, 11, 0.1)' };
    case 'PROPERTY':
      return { main: '#6366F1', light: 'rgba(99, 102, 241, 0.1)' };
    case 'BUSINESS':
      return { main: '#EC4899', light: 'rgba(236, 72, 153, 0.1)' };
    case 'HOME':
      return { main: '#14B8A6', light: 'rgba(20, 184, 166, 0.1)' };
    case 'LIABILITY':
      return { main: '#F97316', light: 'rgba(249, 115, 22, 0.1)' };
    default:
      return { main: '#6B7280', light: 'rgba(107, 114, 128, 0.1)' };
  }
};

const getProductTypeLabel = (type: string) => {
  switch (type) {
    case 'HEALTH':
      return 'Health';
    case 'MOTOR':
      return 'Motor';
    case 'LIFE':
      return 'Life';
    case 'TRAVEL':
      return 'Travel';
    case 'FIRE':
      return 'Fire';
    case 'PROPERTY':
      return 'Property';
    case 'BUSINESS':
      return 'Business';
    case 'HOME':
      return 'Home';
    case 'LIABILITY':
      return 'Liability';
    default:
      return type;
  }
};

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const seedProductsMutation = useMutation({
    mutationFn: () => productsApi.seed(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: data.message || `Successfully restored ${data.count} products!`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to restore products. Please contact an administrator.',
        severity: 'error',
      });
    },
  });

  const handleGetQuote = (productId: number) => {
    router.push(`/quotes?productId=${productId}`);
  };

  const handleViewDetails = (productType: string) => {
    router.push(`/insurance-plans/${productType.toLowerCase()}`);
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
      <Alert severity="error">Failed to load products. Please try again later.</Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
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
            Product catalog
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Insurance products tailored to every life stage.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Explore coverage types, compare base premiums, and review descriptions before requesting a personalized
            quote.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="Motor"
              sx={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                },
              }}
            />
            <Chip
              label="Health"
              sx={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                },
              }}
            />
            <Chip
              label="Life"
              sx={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                },
              }}
            />
            <Chip
              label="Travel"
              sx={{
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: '#8B5CF6',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                },
              }}
            />
            <Chip
              label="Fire"
              sx={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                },
              }}
            />
            <Chip
              label="Property"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366F1',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                },
              }}
            />
            <Chip
              label="Home"
              sx={{
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                color: '#14B8A6',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(20, 184, 166, 0.2)',
                },
              }}
            />
            <Chip
              label="Business"
              sx={{
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                color: '#EC4899',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(236, 72, 153, 0.2)',
                },
              }}
            />
            <Chip
              label="Liability"
              sx={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                color: '#F97316',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(249, 115, 22, 0.2)',
                },
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
            Available plans
          </Typography>
          {products && products.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {products.length} {products.length === 1 ? 'product' : 'products'} available
            </Typography>
          )}
        </Stack>
        <Grid container spacing={3}>
          {products?.map((product: Product) => {
            const colors = getProductColor(product.type);
            return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
                      borderColor: colors.main,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 0,
                          backgroundColor: colors.light,
                          color: colors.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getProductIcon(product.type)}
                      </Box>
                      <Chip
                        label={getProductTypeLabel(product.type)}
                        size="small"
                        sx={{
                          backgroundColor: colors.light,
                          color: colors.main,
                          fontWeight: 600,
                          borderRadius: 0,
                        }}
                      />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {product.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: 48 }}
                    >
                      {product.description}
                    </Typography>
                    <Box
                      sx={{
                        mt: 'auto',
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack direction="row" alignItems="baseline" spacing={1}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                          ${Number(product.basePremium).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          /month
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Base premium
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => handleViewDetails(product.type)}
                      sx={{
                        flex: 1,
                        borderRadius: 0,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        borderColor: 'divider',
                        color: 'text.primary',
                        '&:hover': {
                          borderColor: 'primary.main',
                          color: 'primary.main',
                        },
                      }}
                    >
                      Detail
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => handleGetQuote(product.id)}
                      sx={{
                        flex: 1,
                        borderRadius: 0,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                      }}
                    >
                      Get Quote
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        {products && products.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6" gutterBottom>
              No products available
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Check back later for new insurance products.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => seedProductsMutation.mutate()}
              disabled={seedProductsMutation.isPending}
              sx={{ borderRadius: 0, textTransform: 'none' }}
            >
              {seedProductsMutation.isPending ? 'Restoring Products...' : 'Restore All Products (9)'}
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
              Click to restore all 9 insurance products to the database
      </Typography>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Stack>
    </Container>
  );
}
