import { Box, Button, Grid, Paper, Stack, Typography, Chip, Container } from '@mui/material';
import Link from 'next/link';
import {
  DirectionsCar as AutoIcon,
  LocalHospital as HealthIcon,
  Home as HomeIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

const highlightCards = [
  {
    title: 'Auto insurance',
    description: 'Build coverage with clear pricing, roadside support, and flexible deductibles.',
    icon: AutoIcon,
    number: '01',
  },
  {
    title: 'Health insurance',
    description: 'Access network insights, wellness benefits, and fast claims from any device.',
    icon: HealthIcon,
    number: '02',
  },
  {
    title: 'Home insurance',
    description: 'Protect property and valuables with renewal reminders and damage support.',
    icon: HomeIcon,
    number: '03',
  },
];

const trustPoints = [
  {
    title: 'Coverage tailored to you',
    description: 'Plans are built around your lifestyle, from vehicle protection to home and health essentials.',
    icon: CheckIcon,
  },
  {
    title: 'Transparent policy language',
    description: 'Simple, readable terms so you always know what is protected and why.',
    icon: SecurityIcon,
  },
  {
    title: 'Fast digital claims',
    description: 'Upload documents, track progress, and receive updates without paperwork.',
    icon: SpeedIcon,
  },
];

export default function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            py: { xs: 6, md: 10 },
            textAlign: 'center',
          }}
        >
          <Chip
            label="Modern Tech Insurance"
            color="secondary"
            sx={{
              mb: 3,
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
              px: 2,
            }}
          />
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{
              fontSize: { xs: '2rem', md: '3.5rem' },
              lineHeight: 1.2,
              mb: 3,
              maxWidth: 900,
              mx: 'auto',
            }}
          >
            Insurance built for fast digital teams.
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1rem', md: '1.25rem' },
              maxWidth: 700,
              mx: 'auto',
              mb: 4,
              fontWeight: 400,
            }}
          >
            Launch policies, quotes, and claims workflows from a modern platform that keeps customers informed at every step.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              component={Link}
              href="/quotes"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Start a quote
            </Button>
            <Button
              component={Link}
              href="/products"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Explore products
            </Button>
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              icon={<CheckIcon />}
              label="24/7 digital policy access"
              variant="outlined"
              color="info"
              sx={{ fontWeight: 500 }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1" color="text.secondary" fontWeight={500}>
                +380 (68) 293 38 38
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Container>

      {/* Insurance Products Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
              Our Insurance Products
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Comprehensive coverage options designed for modern lifestyles
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {highlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <Grid item xs={12} md={4} key={card.title}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      height: '100%',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            backgroundColor: 'primary.main',
                            color: 'common.white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.125rem',
                          }}
                        >
                          {card.number}
                        </Box>
                        <Icon sx={{ fontSize: 32, color: 'primary.main' }} />
                      </Stack>
                      <Box>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {card.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Why Trust Us Section */}
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{ mb: 3, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
              >
                Why can you trust us?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.125rem' }}>
                Our insurance policies cover a wide range of risks, from protecting your property to safeguarding your
                health and well-being. We offer comprehensive solutions to ensure you are fully protected.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                {trustPoints.map((point) => {
                  const Icon = point.icon;
                  return (
                    <Paper
                      key={point.title}
                      elevation={0}
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={3} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            backgroundColor: 'primary.main',
                            color: 'common.white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={700} gutterBottom>
                            {point.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {point.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ backgroundColor: 'background.paper', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}
            >
              How does the insurance process work?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Understanding how insurance works is simple with us.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {[
              {
                title: 'Consultation & selection',
                description: 'Share your goals and compare options in minutes.',
                label: '01',
              },
              {
                title: 'Policy issuance',
                description: 'Review coverage details and confirm instantly online.',
                label: '02',
              },
              {
                title: 'Support & claims',
                description: 'File claims and get support from your dashboard anytime.',
                label: '03',
              },
            ].map((step) => (
              <Grid item xs={12} md={4} key={step.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Stack spacing={3} alignItems="center">
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        backgroundColor: 'primary.main',
                        color: 'common.white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.5rem',
                      }}
                    >
                      {step.label}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} gutterBottom>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {step.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
