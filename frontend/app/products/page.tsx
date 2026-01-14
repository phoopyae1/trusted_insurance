'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { Box, Paper, Typography, CircularProgress, Alert, Stack, Chip } from '@mui/material';
import { productsApi, Product } from '../../lib/api/products';

const columns: GridColDef<Product>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'type', headerName: 'Type', flex: 1 },
  {
    field: 'basePremium',
    headerName: 'Base Premium',
    flex: 1,
    valueFormatter: ({ value }) => `$${value?.toFixed(2) || 0}`,
  },
  { field: 'description', headerName: 'Description', flex: 2 },
];

export default function ProductsPage() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

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
        Failed to load products. Please try again later.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'radial-gradient(circle at top left, rgba(0, 102, 204, 0.12), transparent 55%), radial-gradient(circle at top right, rgba(0, 191, 166, 0.12), transparent 55%)'
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
            <Chip label="Auto" variant="outlined" color="primary" />
            <Chip label="Health" variant="outlined" color="primary" />
            <Chip label="Home" variant="outlined" color="primary" />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="h6" gutterBottom>
          Available plans
        </Typography>
        <Box sx={{ height: 420, mt: 2 }}>
          <DataGrid
            rows={products || []}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
