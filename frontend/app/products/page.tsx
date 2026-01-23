'use client';

import { useQuery } from '@tanstack/react-query';
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
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  DirectionsCar as MotorIcon,
  Favorite as LifeIcon,
  FlightTakeoff as TravelIcon,
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
    default:
      return type;
  }
};

export default function ProductsPage() {
  const router = useRouter();
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const handleGetQuote = (productId: number) => {
    router.push(`/quotes?productId=${productId}`);
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
              label="Auto"
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
              label="Home"
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
          </Stack>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Available plans
        </Typography>
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
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleGetQuote(product.id)}
                      sx={{
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
            <Typography variant="body2">Check back later for new insurance products.</Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
