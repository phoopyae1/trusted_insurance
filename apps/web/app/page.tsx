import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import Link from 'next/link';

const highlights = [
  'Transparent pricing with instant quotes',
  'Secure policy management and documents',
  'Guided claim submissions with status tracking'
];

export default function HomePage() {
  return (
    <Box>
      <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg,#0066cc,#00bfa6)', color: 'white' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Protect what matters with Trusted Insurance
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 3, maxWidth: 640 }}>
          A full-stack insurance experience for customers, staff, and administrators with quotes, policies, and claims in one place.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button component={Link} href="/products" color="inherit" variant="contained">
            Browse products
          </Button>
          <Button component={Link} href="/quotes" variant="outlined" color="inherit">
            Get a quote
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {highlights.map((text) => (
          <Grid item xs={12} md={4} key={text}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">{text}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
