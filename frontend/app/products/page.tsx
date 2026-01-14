'use client';

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Product {
  id: number;
  name: string;
  type: string;
  description: string;
  basePremium: number;
}

const columns: GridColDef<Product>[] = [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'type', headerName: 'Type', flex: 1 },
  { field: 'basePremium', headerName: 'Base Premium', flex: 1, valueFormatter: ({ value }) => `$${value}` },
  { field: 'description', headerName: 'Description', flex: 2 }
];

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setRows(data));
  }, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Products
      </Typography>
      <Box sx={{ height: 400 }}>
        <DataGrid rows={rows} columns={columns} disableRowSelectionOnClick />
      </Box>
    </Paper>
  );
}
