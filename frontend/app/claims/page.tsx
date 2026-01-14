'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Grid, Paper, Snackbar, Stack, TextField, Typography, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface Claim {
  id: number;
  status: string;
  amount: number;
  incidentDate: string;
  description: string;
}

const columns: GridColDef<Claim>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'status', headerName: 'Status', flex: 1 },
  { field: 'amount', headerName: 'Amount', flex: 1, valueFormatter: ({ value }) => `$${value}` },
  { field: 'incidentDate', headerName: 'Incident Date', flex: 1 },
  { field: 'description', headerName: 'Description', flex: 2 }
];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [form, setForm] = useState({ policyId: '', amount: '', incidentDate: '', description: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claims`, { headers: { Authorization: 'Bearer demo-token' } })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setClaims(data));
  }, []);

  const submitClaim = async () => {
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/claims`, {
        method: 'POST',
        headers: { Authorization: 'Bearer demo-token' },
        body
      });
      setToast(res.ok ? 'Claim submitted (requires valid token for live)' : 'Unable to submit claim');
    } catch (err) {
      setToast('Network error');
    }
  };

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
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
          Claims center
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Track incidents and submit claims faster.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Manage claim activity with digital uploads, real-time status updates, and a clear next-step timeline.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label="Average response: 24 hrs" variant="outlined" color="primary" />
          <Chip label="Multi-policy support" variant="outlined" color="primary" />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="h6" gutterBottom>
              Claims overview
            </Typography>
            <Box sx={{ height: 360 }}>
              <DataGrid rows={claims} columns={columns} disableRowSelectionOnClick getRowId={(row) => row.id} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
          >
            <Typography variant="h6" gutterBottom>
              Submit a claim
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Policy ID"
                value={form.policyId}
                onChange={(e) => setForm({ ...form, policyId: e.target.value })}
              />
              <TextField
                label="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
              <TextField
                label="Incident date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Button onClick={submitClaim} variant="contained">
                Submit claim
              </Button>
              <Typography variant="body2" color="text.secondary">
                File uploads supported via multipart/form-data using the API endpoint.
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="info">{toast}</Alert>
      </Snackbar>
    </Stack>
  );
}
