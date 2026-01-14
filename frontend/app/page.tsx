import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import Link from 'next/link';

const highlights = [
  {
    title: 'Instant coverage clarity',
    description: 'Compare plans with transparent pricing and bundled savings in seconds.'
  },
  {
    title: 'All policies in one place',
    description: 'Organize documents, payments, and renewals in a single secure hub.'
  },
  {
    title: 'Claims without the chaos',
    description: 'Submit and track claims with guided steps and real-time updates.'
  }
];

export default function HomePage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(120deg, rgba(0,102,204,0.12), rgba(0,191,166,0.12))',
          border: '1px solid rgba(0,102,204,0.15)'
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ letterSpacing: 3, color: 'primary.main' }}>
              Trusted Insurance Platform
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              Design coverage that feels effortless.
            </Typography>
            <Typography variant="subtitle1" sx={{ maxWidth: 640, color: 'text.secondary' }}>
              All-in-one quotes, policies, and claims with a calmer, smarter experience for customers, staff, and administrators.
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button component={Link} href="/products" variant="contained" size="large">
              Explore products
            </Button>
            <Button component={Link} href="/quotes" variant="outlined" size="large">
              Start a quote
            </Button>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                24/7
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Policy access with smart alerts and renewals.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                15 min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average quote completion time for new customers.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                98%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Claims submitted digitally without extra paperwork.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {highlights.map((highlight) => (
          <Grid item xs={12} md={4} key={highlight.title}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h6" fontWeight={700}>
                  {highlight.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {highlight.description}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
