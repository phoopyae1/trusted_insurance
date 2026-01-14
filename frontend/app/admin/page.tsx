'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface Product {
  id: number;
  name: string;
  type: string;
  basePremium: number;
}

const columns: GridColDef<Product>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'type', headerName: 'Type', flex: 1 },
  { field: 'basePremium', headerName: 'Premium', flex: 1 }
];

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState({ name: '', type: 'HEALTH', basePremium: '', description: '' });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const createProduct = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer admin-token' },
      body: JSON.stringify({ ...form, basePremium: Number(form.basePremium), exclusions: [] })
    });
    if (res.ok) {
      const item = await res.json();
      setProducts((prev) => [...prev, item]);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Admin product management
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <TextField
            label="Base premium"
            value={form.basePremium}
            onChange={(e) => setForm({ ...form, basePremium: e.target.value })}
          />
          <Button onClick={createProduct}>Create</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Uses admin JWT token. Update with a valid token to persist changes.
        </Typography>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ height: 360 }}>
          <DataGrid rows={products} columns={columns} disableRowSelectionOnClick />
        </Box>
      </Paper>
    </Box>
  );
}
