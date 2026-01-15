import { Box, Button, Grid, Paper, Stack, Typography, Chip } from '@mui/material';
import Link from 'next/link';

const highlightCards = [
  {
    title: 'Auto insurance',
    description: 'Build coverage with clear pricing, roadside support, and flexible deductibles.'
  },
  {
    title: 'Health insurance',
    description: 'Access network insights, wellness benefits, and fast claims from any device.'
  },
  {
    title: 'Home insurance',
    description: 'Protect property and valuables with renewal reminders and damage support.'
  }
];

const trustPoints = [
  {
    title: 'Coverage tailored to you',
    description:
      'Plans are built around your lifestyle, from vehicle protection to home and health essentials.'
  },
  {
    title: 'Transparent policy language',
    description: 'Simple, readable terms so you always know what is protected and why.'
  },
  {
    title: 'Fast digital claims',
    description: 'Upload documents, track progress, and receive updates without paperwork.'
  }
];

const processSteps = [
  {
    title: 'Consultation & selection',
    description: 'Share your goals and compare options in minutes.',
    label: '01'
  },
  {
    title: 'Policy issuance',
    description: 'Review coverage details and confirm instantly online.',
    label: '02'
  },
  {
    title: 'Support & claims',
    description: 'File claims and get support from your dashboard anytime.',
    label: '03'
  }
];

export default function HomePage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          background:
            'radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 52%), radial-gradient(circle at top right, rgba(15, 185, 177, 0.2), transparent 45%), linear-gradient(135deg, rgba(10, 37, 64, 0.06), rgba(15, 185, 177, 0.08))',
          border: '1px solid rgba(15, 23, 42, 0.08)'
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Chip
                  label="Modern Tech Insurance"
                  color="secondary"
                  variant="outlined"
                  sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                />
                <Typography variant="h2" fontWeight={700} sx={{ lineHeight: 1.1 }}>
                  Insurance built for fast digital teams.
                </Typography>
                <Typography variant="subtitle1" sx={{ maxWidth: 560, color: 'text.secondary' }}>
                  Launch policies, quotes, and claims workflows from a modern platform that keeps customers informed
                  at every step.
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component={Link} href="/quotes" variant="contained" size="large">
                  Start a quote
                </Button>
                <Button component={Link} href="/products" variant="outlined" size="large">
                  Explore products
                </Button>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip label="24/7 digital policy access" color="info" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  +380 (68) 293 38 38
                </Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {highlightCards.map((card, index) => (
                <Paper
                  key={card.title}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    background:
                      'linear-gradient(135deg, rgba(10, 37, 64, 0.04), rgba(56, 189, 248, 0.08))'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Typography variant="overline" color="text.secondary">
                      {String(index + 1).padStart(2, '0')}
                    </Typography>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {card.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4} alignItems="flex-start">
        <Grid item xs={12} md={5}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            Why can you trust us?
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Our insurance policies cover a wide range of risks, from protecting your property to safeguarding your
            health and well-being. We offer comprehensive solutions to ensure you are fully protected.
          </Typography>
        </Grid>
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            {trustPoints.map((point) => (
              <Paper
                key={point.title}
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  {point.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {point.description}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Grid>
      </Grid>

      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          How does the insurance process work?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Understanding how insurance works is simple with us.
        </Typography>
        <Grid container spacing={3}>
          {processSteps.map((step) => (
            <Grid item xs={12} md={4} key={step.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <Stack spacing={2}>
                  <Typography variant="overline" color="text.secondary">
                    {step.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
