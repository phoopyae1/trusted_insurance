'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Insurance Products
      </Typography>
      <Box sx={{ height: 400, mt: 2 }}>
        <DataGrid
          rows={products || []}
          columns={columns}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Paper>
  );
}
