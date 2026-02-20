'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Grid, Paper, Stack, Typography, Chip, Container, IconButton } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import {
  DirectionsCar as AutoIcon,
  LocalHospital as HealthIcon,
  Home as HomeIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon,
  FlightTakeoff as TravelIcon,
  LocalFireDepartment as FireIcon,
  Business as BusinessIcon,
  AccountBalance as PropertyIcon,
  Gavel as LiabilityIcon,
  Favorite as LifeIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
} from '@mui/icons-material';

const highlightCards = [
  {
    title: 'Motor Protect',
    description: 'Comprehensive vehicle protection with clear pricing, roadside assistance, and flexible deductibles.',
    icon: AutoIcon,
    number: '01',
  },
  {
    title: 'Health Shield',
    description: 'Health coverage that supports hospital visits, treatment costs, and fast digital claims from any device.',
    icon: HealthIcon,
    number: '02',
  },
  {
    title: 'Life Secure',
    description: 'Life insurance focused on long‑term family protection, predictable premiums, and dependable payouts.',
    icon: LifeIcon,
    number: '03',
  },
  {
    title: 'Travel Guard',
    description: 'Travel insurance covering trip cancellation, medical emergencies abroad, and lost luggage protection.',
    icon: TravelIcon,
    number: '04',
  },
  {
    title: 'Fire Shield',
    description: 'Fire insurance protecting your property against fire damage, smoke damage, and related perils.',
    icon: FireIcon,
    number: '05',
  },
  {
    title: 'Property Guard',
    description: 'Property insurance covering buildings and contents against theft, vandalism, and natural disasters.',
    icon: PropertyIcon,
    number: '06',
  },
  {
    title: 'Home Secure',
    description: 'Homeowners insurance protecting your home, personal belongings, and providing liability coverage.',
    icon: HomeIcon,
    number: '07',
  },
  {
    title: 'Business Protect',
    description: 'Business insurance covering property, liability, business interruption, and equipment protection.',
    icon: BusinessIcon,
    number: '08',
  },
  {
    title: 'Liability Shield',
    description: 'General liability insurance protecting against claims of bodily injury, property damage, and personal injury.',
    icon: LiabilityIcon,
    number: '09',
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

// Hero carousel images
const heroImages = [
  {
    src: '/hero-10-1-1.jpeg',
    alt: 'Insurance Protection',
  },
  {
    src: '/hero-10-5-2.jpeg',
    alt: 'Secure Coverage',
  },
  {
    src: '/insurance3.jpg',
    alt: 'Insurance Solutions',
  },
  {
    src: '/1200x630.jpg',
    alt: 'Comprehensive Coverage',
  },
];

function HeroCarousel({ currentIndex, onPrevious, onNext, onSlideChange }: {
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onSlideChange: (index: number) => void;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      {/* Carousel Images */}
      {heroImages.map((image, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: index === currentIndex ? 1 : 0,
          }}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            style={{
              objectFit: 'cover',
            }}
            priority={index === 0}
          />
          {/* Dark overlay for better text readability */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)',
            }}
          />
        </Box>
      ))}

      {/* Navigation Arrows */}
      <IconButton
        onClick={onPrevious}
        sx={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
        }}
        aria-label="Previous slide"
      >
        <ArrowBackIcon />
      </IconButton>
      <IconButton
        onClick={onNext}
        sx={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
        }}
        aria-label="Next slide"
      >
        <ArrowForwardIcon />
      </IconButton>

      {/* Dots Indicator */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          gap: 1,
        }}
      >
        {heroImages.map((_, index) => (
          <Box
            key={index}
            onClick={() => onSlideChange(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: index === currentIndex ? 'primary.dark' : 'rgba(255, 255, 255, 0.9)',
              },
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + heroImages.length) % heroImages.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <Box>
      {/* Hero Section - Full Screen */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: '100vh', md: '100vh' },
          minHeight: { xs: '600px', md: '700px' },
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Full Screen Carousel Background */}
        <HeroCarousel
          currentIndex={currentIndex}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSlideChange={goToSlide}
        />

        {/* Text Content Overlay */}
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, height: '100%' }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              py: { xs: 4, md: 8 },
            }}
          >
            <Grid container spacing={4} alignItems="center">
              {/* Left Side - Text Content */}
              <Grid item xs={12} md={7}>
                <Stack spacing={3} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                  <Chip
                    label="Welcome bonus on your first policy"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 36,
                      px: 2,
                      width: 'fit-content',
                      mx: { xs: 'auto', md: 0 },
                      backgroundColor: 'primary.main',
                      color: 'common.white',
                    }}
                  />
                  <Typography
                    variant="h1"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                      lineHeight: 1.1,
                      color: 'common.white',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    Insurance built for fast digital teams.
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      fontWeight: 400,
                      lineHeight: 1.6,
                      maxWidth: { xs: '100%', md: '85%' },
                      color: 'rgba(255, 255, 255, 0.95)',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    Discover our comprehensive insurance solutions tailored to your needs. From health coverage to property protection, we have you covered.
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{ 
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      pt: 2,
                    }}
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
                        fontWeight: 600,
                        backgroundColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                    >
                      Get a Quote
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
                        fontWeight: 600,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                        color: 'common.white',
                        '&:hover': {
                          borderColor: 'common.white',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Explore Products
                    </Button>
                  </Stack>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      alignItems: 'center',
                      pt: 1,
                    }}
                  >
                    <Chip
                      icon={<CheckIcon sx={{ color: 'common.white' }} />}
                      label="24/7 digital policy access"
                      sx={{ 
                        fontWeight: 500,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'common.white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                      variant="outlined"
                    />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.9)' }} />
                      <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                        +380 (68) 293 38 38
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

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
