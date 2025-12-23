import { Grid, Paper, Typography } from '@mui/material';
import React from 'react';

const cards = [
  { title: 'Policies', value: 'Manage active and expired policies' },
  { title: 'Quotes', value: 'Track requests and approvals' },
  { title: 'Claims', value: 'Follow claim lifecycle updates' }
];

export default function DashboardPage() {
  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} md={4} key={card.title}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">{card.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {card.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}
