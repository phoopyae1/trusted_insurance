'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography, Grid, Card, CardContent, Alert, Snackbar } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '../../lib/api/products';

const columns: GridColDef<Product>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'type', headerName: 'Type', flex: 1 },
  {
    field: 'basePremium',
    headerName: 'Premium',
    flex: 1,
    valueFormatter: ({ value }) => `$${Number(value)?.toFixed(2) || 0}`,
  },
  { field: 'description', headerName: 'Description', flex: 2 },
];

export default function AdminPage() {
  const [form, setForm] = useState({ name: '', type: 'HEALTH', basePremium: '', description: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(),
  });

  const seedProductsMutation = useMutation({
    mutationFn: () => productsApi.seed(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: data.message || `Successfully added ${data.count} products!`,
        severity: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to seed products',
        severity: 'error',
      });
    },
  });

  const createProduct = async () => {
    // This would need proper API integration with authentication
    console.log('Create product:', { ...form, basePremium: Number(form.basePremium), exclusions: [] });
  };

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
            Admin Panel
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Product Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage insurance products for your platform.
          </Typography>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Create New Product
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => seedProductsMutation.mutate()}
            disabled={seedProductsMutation.isPending}
            sx={{ borderRadius: 0, textTransform: 'none' }}
          >
            {seedProductsMutation.isPending ? 'Seeding...' : 'Seed All Products (9)'}
          </Button>
        </Stack>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            fullWidth
          />
          <TextField
            label="Base premium"
            value={form.basePremium}
            onChange={(e) => setForm({ ...form, basePremium: e.target.value })}
            type="number"
            fullWidth
          />
          <Button onClick={createProduct} variant="contained" sx={{ borderRadius: 0, textTransform: 'none' }}>
            Create
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Note: Product creation requires proper authentication and API integration.
        </Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          All Products
        </Typography>
        <Box sx={{ height: 400, width: '100%', mt: 2 }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography>Loading products...</Typography>
            </Box>
          ) : (
            <DataGrid
              rows={products}
              columns={columns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
            />
          )}
        </Box>
      </Paper>

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
  );
}
