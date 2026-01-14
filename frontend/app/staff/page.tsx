import { Box, Grid, Paper, Typography } from '@mui/material';
import React from 'react';

export default function StaffPage() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Quote review</Typography>
          <Typography variant="body2" color="text.secondary">
            Staff members can approve or reject quotes using the /api/quotes/:id/status endpoint.
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Claim triage</Typography>
          <Typography variant="body2" color="text.secondary">
            Update claim statuses via /api/claims/:id/status and issue policies when quotes are approved.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
