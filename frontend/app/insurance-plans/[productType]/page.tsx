'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocalHospital as HospitalIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  LocalHospital as HealthIcon,
  DirectionsCar as MotorIcon,
  Favorite as LifeIcon,
  FlightTakeoff as TravelIcon,
  LocalFireDepartment as FireIcon,
  Business as BusinessIcon,
  AccountBalance as PropertyIcon,
  Home as HomeIcon,
  Gavel as LiabilityIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';

interface Package {
  name: string;
  premium: number;
  benefits: string[];
  hospitals: string[];
  phoneNumber: string;
  popular?: boolean;
}

interface ProductInfo {
  name: string;
  icon: any;
  description: string;
  packages: Package[];
  detailedDescription?: string;
  keyFeatures?: string[];
}

const productData: { [key: string]: ProductInfo } = {
  health: {
    name: 'Health Insurance',
    icon: HealthIcon,
    description: 'Comprehensive health coverage for you and your family',
    detailedDescription: 'Our Health Insurance plans provide extensive medical coverage including inpatient and outpatient services, emergency care, and access to Singapore\'s premier healthcare facilities. Choose from our range of packages designed to meet different healthcare needs and budgets.',
    keyFeatures: [
      'Access to Singapore\'s top hospitals and medical centers',
      'Comprehensive coverage for inpatient and outpatient treatments',
      'Emergency medical services 24/7',
      'Preventive care and annual health checkups',
      'Mental health and wellness support',
      'Maternity and family planning coverage',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 1200,
        benefits: [
          'Inpatient coverage up to $50,000 per year',
          'Outpatient consultation coverage',
          'Emergency room visits',
          'Basic diagnostic tests',
          'Prescription medication coverage',
        ],
        hospitals: [
          'Singapore General Hospital',
          'National University Hospital',
          'Tan Tock Seng Hospital',
        ],
        phoneNumber: '+65 6123 4567',
      },
      {
        name: 'Standard',
        premium: 2400,
        benefits: [
          'Inpatient coverage up to $100,000 per year',
          'Outpatient consultation coverage',
          'Emergency room visits',
          'Comprehensive diagnostic tests',
          'Prescription medication coverage',
          'Dental care (basic)',
          'Maternity coverage',
        ],
        hospitals: [
          'Singapore General Hospital',
          'National University Hospital',
          'Tan Tock Seng Hospital',
          'Mount Elizabeth Hospital',
          'Gleneagles Hospital',
        ],
        phoneNumber: '+65 6123 4568',
      },
      {
        name: 'Premium',
        premium: 3600,
        benefits: [
          'Inpatient coverage up to $200,000 per year',
          'Outpatient consultation coverage',
          'Emergency room visits',
          'Comprehensive diagnostic tests',
          'Prescription medication coverage',
          'Dental care (comprehensive)',
          'Maternity coverage',
          'Mental health coverage',
          'Alternative medicine coverage',
          'Annual health checkup',
        ],
        hospitals: [
          'Singapore General Hospital',
          'National University Hospital',
          'Tan Tock Seng Hospital',
          'Mount Elizabeth Hospital',
          'Gleneagles Hospital',
          'Raffles Hospital',
          'Parkway East Hospital',
        ],
        phoneNumber: '+65 6123 4569',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 6000,
        benefits: [
          'Unlimited inpatient coverage',
          'Outpatient consultation coverage',
          'Emergency room visits',
          'Comprehensive diagnostic tests',
          'Prescription medication coverage',
          'Dental care (comprehensive)',
          'Maternity coverage',
          'Mental health coverage',
          'Alternative medicine coverage',
          'Annual health checkup',
          'International coverage',
          'Private room accommodation',
          'VIP services',
          '24/7 concierge service',
        ],
        hospitals: [
          'Singapore General Hospital',
          'National University Hospital',
          'Tan Tock Seng Hospital',
          'Mount Elizabeth Hospital',
          'Gleneagles Hospital',
          'Raffles Hospital',
          'Parkway East Hospital',
          'Mount Alvernia Hospital',
          'Farrer Park Hospital',
        ],
        phoneNumber: '+65 6123 4570',
      },
    ],
  },
  motor: {
    name: 'Motor Insurance',
    icon: MotorIcon,
    description: 'Complete vehicle protection with flexible coverage options',
    detailedDescription: 'Protect your vehicle with comprehensive motor insurance coverage. Our plans include third-party liability, fire and theft protection, accident coverage, and 24/7 roadside assistance. Choose the level of coverage that suits your needs.',
    keyFeatures: [
      'Comprehensive vehicle protection',
      'Third-party liability coverage',
      'Fire, theft, and accident coverage',
      '24/7 roadside assistance',
      'No-claim discount protection',
      'Rental car coverage options',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 800,
        benefits: [
          'Third-party liability coverage',
          'Fire and theft protection',
          'Roadside assistance',
          '24/7 helpline',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4600',
      },
      {
        name: 'Standard',
        premium: 1500,
        benefits: [
          'Comprehensive coverage',
          'Third-party liability',
          'Fire and theft protection',
          'Accident coverage',
          'Roadside assistance',
          '24/7 helpline',
          'Windscreen coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4601',
      },
      {
        name: 'Premium',
        premium: 2500,
        benefits: [
          'Comprehensive coverage',
          'Third-party liability',
          'Fire and theft protection',
          'Accident coverage',
          'Roadside assistance',
          '24/7 helpline',
          'Windscreen coverage',
          'Personal accident coverage',
          'No-claim discount protection',
          'Rental car coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4602',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 4000,
        benefits: [
          'Comprehensive coverage',
          'Third-party liability',
          'Fire and theft protection',
          'Accident coverage',
          'Roadside assistance',
          '24/7 helpline',
          'Windscreen coverage',
          'Personal accident coverage',
          'No-claim discount protection',
          'Rental car coverage',
          'Key replacement',
          'Towing services',
          'Concierge service',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4603',
      },
    ],
  },
  life: {
    name: 'Life Insurance',
    icon: LifeIcon,
    description: 'Secure your family\'s future with comprehensive life coverage',
    detailedDescription: 'Life insurance provides financial security for your loved ones. Our plans offer death benefits, critical illness coverage, and disability protection to ensure your family is protected in any situation.',
    keyFeatures: [
      'Death benefit coverage',
      'Critical illness protection',
      'Disability coverage',
      'Accidental death benefits',
      'Cash value accumulation options',
      'Estate planning benefits',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 1500,
        benefits: [
          'Death benefit: $100,000',
          'Term coverage',
          'Basic critical illness coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4700',
      },
      {
        name: 'Standard',
        premium: 3000,
        benefits: [
          'Death benefit: $250,000',
          'Term coverage',
          'Critical illness coverage',
          'Disability coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4701',
      },
      {
        name: 'Premium',
        premium: 5000,
        benefits: [
          'Death benefit: $500,000',
          'Term coverage',
          'Critical illness coverage',
          'Disability coverage',
          'Accidental death benefit',
          'Waiver of premium',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4702',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 10000,
        benefits: [
          'Death benefit: $1,000,000+',
          'Term coverage',
          'Critical illness coverage',
          'Disability coverage',
          'Accidental death benefit',
          'Waiver of premium',
          'Cash value accumulation',
          'Estate planning benefits',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4703',
      },
    ],
  },
  travel: {
    name: 'Travel Insurance',
    icon: TravelIcon,
    description: 'Travel with confidence and peace of mind',
    detailedDescription: 'Travel insurance protects you during your trips with coverage for medical emergencies, trip cancellations, lost baggage, and more. Travel worry-free knowing you\'re covered.',
    keyFeatures: [
      'Medical emergency coverage',
      'Trip cancellation protection',
      'Baggage loss coverage',
      'Flight delay compensation',
      '24/7 travel assistance',
      'Adventure sports coverage',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 50,
        benefits: [
          'Trip cancellation coverage',
          'Medical emergency: $50,000',
          'Baggage loss coverage',
          'Flight delay coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4800',
      },
      {
        name: 'Standard',
        premium: 100,
        benefits: [
          'Trip cancellation coverage',
          'Medical emergency: $100,000',
          'Baggage loss coverage',
          'Flight delay coverage',
          'Trip interruption coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4801',
      },
      {
        name: 'Premium',
        premium: 200,
        benefits: [
          'Trip cancellation coverage',
          'Medical emergency: $200,000',
          'Baggage loss coverage',
          'Flight delay coverage',
          'Trip interruption coverage',
          'Adventure sports coverage',
          '24/7 travel assistance',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4802',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 400,
        benefits: [
          'Trip cancellation coverage',
          'Medical emergency: $500,000',
          'Baggage loss coverage',
          'Flight delay coverage',
          'Trip interruption coverage',
          'Adventure sports coverage',
          '24/7 travel assistance',
          'Concierge services',
          'Business travel coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4803',
      },
    ],
  },
  fire: {
    name: 'Fire Insurance',
    icon: FireIcon,
    description: 'Protect your property against fire damage and related perils',
    detailedDescription: 'Fire insurance provides comprehensive protection against fire damage, smoke damage, and related perils. Our plans ensure your property is covered in case of fire emergencies.',
    keyFeatures: [
      'Fire damage coverage',
      'Smoke damage protection',
      'Lightning and explosion coverage',
      'Water damage from firefighting',
      'Temporary accommodation coverage',
      'Business interruption protection',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 600,
        benefits: [
          'Fire damage coverage up to $200,000',
          'Smoke damage protection',
          'Lightning strike coverage',
          'Explosion coverage',
          '24/7 emergency helpline',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4900',
      },
      {
        name: 'Standard',
        premium: 1200,
        benefits: [
          'Fire damage coverage up to $500,000',
          'Smoke damage protection',
          'Lightning strike coverage',
          'Explosion coverage',
          'Water damage from firefighting',
          'Temporary accommodation coverage',
          '24/7 emergency helpline',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4901',
      },
      {
        name: 'Premium',
        premium: 2000,
        benefits: [
          'Fire damage coverage up to $1,000,000',
          'Smoke damage protection',
          'Lightning strike coverage',
          'Explosion coverage',
          'Water damage from firefighting',
          'Temporary accommodation coverage',
          'Contents replacement coverage',
          'Business interruption coverage',
          '24/7 emergency helpline',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4902',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 3500,
        benefits: [
          'Unlimited fire damage coverage',
          'Smoke damage protection',
          'Lightning strike coverage',
          'Explosion coverage',
          'Water damage from firefighting',
          'Temporary accommodation coverage',
          'Contents replacement coverage',
          'Business interruption coverage',
          'Loss of rent coverage',
          'Debris removal coverage',
          '24/7 emergency helpline',
          'Priority claims processing',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 4903',
      },
    ],
  },
  property: {
    name: 'Property Insurance',
    icon: PropertyIcon,
    description: 'Comprehensive protection for your commercial and residential properties',
    detailedDescription: 'Property insurance protects your commercial and residential properties from various risks including theft, vandalism, natural disasters, and more.',
    keyFeatures: [
      'Property damage coverage',
      'Theft and burglary protection',
      'Natural disaster coverage',
      'Liability protection',
      'Loss of rent coverage',
      'Equipment breakdown coverage',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 800,
        benefits: [
          'Property damage coverage up to $300,000',
          'Theft and burglary protection',
          'Vandalism coverage',
          'Natural disaster coverage',
          '24/7 claims support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5000',
      },
      {
        name: 'Standard',
        premium: 1500,
        benefits: [
          'Property damage coverage up to $750,000',
          'Theft and burglary protection',
          'Vandalism coverage',
          'Natural disaster coverage',
          'Liability coverage',
          'Loss of rent coverage',
          '24/7 claims support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5001',
      },
      {
        name: 'Premium',
        premium: 2800,
        benefits: [
          'Property damage coverage up to $1,500,000',
          'Theft and burglary protection',
          'Vandalism coverage',
          'Natural disaster coverage',
          'Liability coverage',
          'Loss of rent coverage',
          'Equipment breakdown coverage',
          'Cyber liability coverage',
          '24/7 claims support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5002',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 5000,
        benefits: [
          'Unlimited property damage coverage',
          'Theft and burglary protection',
          'Vandalism coverage',
          'Natural disaster coverage',
          'Liability coverage',
          'Loss of rent coverage',
          'Equipment breakdown coverage',
          'Cyber liability coverage',
          'Business interruption coverage',
          'Concierge claims service',
          '24/7 claims support',
          'Priority processing',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5003',
      },
    ],
  },
  home: {
    name: 'Home Insurance',
    icon: HomeIcon,
    description: 'Complete protection for your home and personal belongings',
    detailedDescription: 'Home insurance provides comprehensive coverage for your home structure, personal belongings, and liability protection. Keep your home and family safe with our flexible plans.',
    keyFeatures: [
      'Home structure coverage',
      'Personal belongings protection',
      'Liability coverage',
      'Theft and vandalism protection',
      'Natural disaster coverage',
      'Temporary accommodation',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 700,
        benefits: [
          'Home structure coverage up to $400,000',
          'Personal belongings coverage up to $50,000',
          'Liability coverage up to $100,000',
          'Theft protection',
          'Natural disaster coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5100',
      },
      {
        name: 'Standard',
        premium: 1400,
        benefits: [
          'Home structure coverage up to $800,000',
          'Personal belongings coverage up to $150,000',
          'Liability coverage up to $300,000',
          'Theft protection',
          'Natural disaster coverage',
          'Temporary accommodation coverage',
          'Home assistance helpline',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5101',
      },
      {
        name: 'Premium',
        premium: 2500,
        benefits: [
          'Home structure coverage up to $1,500,000',
          'Personal belongings coverage up to $300,000',
          'Liability coverage up to $500,000',
          'Theft protection',
          'Natural disaster coverage',
          'Temporary accommodation coverage',
          'Home assistance helpline',
          'Jewelry and valuables coverage',
          'Identity theft protection',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5102',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 4500,
        benefits: [
          'Unlimited home structure coverage',
          'Personal belongings coverage up to $500,000',
          'Liability coverage up to $1,000,000',
          'Theft protection',
          'Natural disaster coverage',
          'Temporary accommodation coverage',
          'Home assistance helpline',
          'Jewelry and valuables coverage',
          'Identity theft protection',
          'Home maintenance coverage',
          'Concierge service',
          'Priority claims processing',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5103',
      },
    ],
  },
  business: {
    name: 'Business Insurance',
    icon: BusinessIcon,
    description: 'Comprehensive coverage for your business operations and assets',
    detailedDescription: 'Business insurance protects your company from various risks including property damage, liability claims, business interruption, and cyber threats. Keep your business running smoothly.',
    keyFeatures: [
      'Property and equipment coverage',
      'Liability protection',
      'Business interruption coverage',
      'Employee liability coverage',
      'Cyber liability protection',
      'Professional indemnity coverage',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 1500,
        benefits: [
          'Property coverage up to $500,000',
          'Liability coverage up to $1,000,000',
          'Business interruption coverage',
          'Equipment breakdown coverage',
          '24/7 business support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5200',
      },
      {
        name: 'Standard',
        premium: 3000,
        benefits: [
          'Property coverage up to $1,500,000',
          'Liability coverage up to $2,000,000',
          'Business interruption coverage',
          'Equipment breakdown coverage',
          'Employee liability coverage',
          'Cyber liability coverage',
          '24/7 business support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5201',
      },
      {
        name: 'Premium',
        premium: 6000,
        benefits: [
          'Property coverage up to $5,000,000',
          'Liability coverage up to $5,000,000',
          'Business interruption coverage',
          'Equipment breakdown coverage',
          'Employee liability coverage',
          'Cyber liability coverage',
          'Professional indemnity coverage',
          'Directors and officers coverage',
          '24/7 business support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5202',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 12000,
        benefits: [
          'Unlimited property coverage',
          'Liability coverage up to $10,000,000',
          'Business interruption coverage',
          'Equipment breakdown coverage',
          'Employee liability coverage',
          'Cyber liability coverage',
          'Professional indemnity coverage',
          'Directors and officers coverage',
          'International coverage',
          'Concierge business services',
          '24/7 business support',
          'Priority claims processing',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5203',
      },
    ],
  },
  liability: {
    name: 'Liability Insurance',
    icon: LiabilityIcon,
    description: 'Protect your business from third-party claims and legal liabilities',
    detailedDescription: 'Liability insurance protects your business from claims of bodily injury, property damage, and personal injury. Essential coverage for any business operation.',
    keyFeatures: [
      'General liability coverage',
      'Bodily injury protection',
      'Property damage protection',
      'Product liability coverage',
      'Legal defense coverage',
      'Advertising injury protection',
    ],
    packages: [
      {
        name: 'Basic',
        premium: 1000,
        benefits: [
          'General liability coverage up to $1,000,000',
          'Bodily injury protection',
          'Property damage protection',
          'Personal injury protection',
          'Legal defense coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5300',
      },
      {
        name: 'Standard',
        premium: 2000,
        benefits: [
          'General liability coverage up to $2,000,000',
          'Bodily injury protection',
          'Property damage protection',
          'Personal injury protection',
          'Legal defense coverage',
          'Product liability coverage',
          'Completed operations coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5301',
      },
      {
        name: 'Premium',
        premium: 4000,
        benefits: [
          'General liability coverage up to $5,000,000',
          'Bodily injury protection',
          'Property damage protection',
          'Personal injury protection',
          'Legal defense coverage',
          'Product liability coverage',
          'Completed operations coverage',
          'Advertising injury coverage',
          'Medical payments coverage',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5302',
        popular: true,
      },
      {
        name: 'Ultra Premium',
        premium: 8000,
        benefits: [
          'General liability coverage up to $10,000,000',
          'Bodily injury protection',
          'Property damage protection',
          'Personal injury protection',
          'Legal defense coverage',
          'Product liability coverage',
          'Completed operations coverage',
          'Advertising injury coverage',
          'Medical payments coverage',
          'International liability coverage',
          'Crisis management coverage',
          'Priority legal support',
        ],
        hospitals: [],
        phoneNumber: '+65 6123 5303',
      },
    ],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const productType = (params.productType as string)?.toLowerCase();

  const product = productData[productType];
  const IconComponent = product?.icon;

  if (!product) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '80%', width: '100%' }}>
        <Typography variant="h4">Product not found</Typography>
        <Button component={Link} href="/insurance-plans" sx={{ mt: 2 }}>
          Back to Insurance Plans
        </Button>
      </Container>
    );
  }

  const handleGetQuote = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push('/quotes');
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(0, 191, 166, 0.1) 100%)',
          py: { xs: 6, md: 8 },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: '80%', width: '100%' }}>
          <Stack spacing={3}>
            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb">
              <MuiLink component={Link} href="/insurance-plans" color="inherit" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Insurance Plans
              </MuiLink>
              <Typography color="text.primary">{product.name}</Typography>
            </Breadcrumbs>

            {/* Back Button */}
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/insurance-plans')}
              variant="contained"
              sx={{ 
                alignSelf: 'flex-start', 
                textTransform: 'none', 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              Back to All Insurance Plans
            </Button>

            {/* Header */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 80,
                  height: 80,
                }}
              >
                <IconComponent sx={{ fontSize: 48 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                  {product.name}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  {product.description}
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handleGetQuote}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                Get Quote
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ py: { xs: 4, md: 6 }, maxWidth: '80%', width: '100%' }}>
        <Stack spacing={6}>

          {/* Detailed Description */}
          {product.detailedDescription && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 5 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 1) 100%)',
                }}
              >
                <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                  About {product.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.9, fontSize: '1.1rem' }}>
                  {product.detailedDescription}
                </Typography>
                {product.keyFeatures && (
                  <>
                    <Divider sx={{ my: 4 }} />
                    <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                      Key Features
                    </Typography>
                    <Grid container spacing={3}>
                      {product.keyFeatures.map((feature, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="flex-start"
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: 'rgba(25, 118, 210, 0.03)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                transform: 'translateX(4px)',
                              },
                            }}
                          >
                            <CheckIcon sx={{ color: 'success.main', fontSize: 24, mt: 0.5 }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {feature}
                            </Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Paper>
            </Box>
          )}

          {/* Packages Section */}
          <Box>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                Available Packages
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
                Choose the perfect package that fits your needs and budget
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 3,
              }}
            >
              {product.packages.map((pkg, index) => (
                <Card
                  key={pkg.name}
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '2px solid',
                    borderColor: pkg.popular ? 'primary.main' : 'divider',
                    borderRadius: 3,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  {pkg.popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        right: 16,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1}}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {pkg.name}
                    </Typography>
                    <Box sx={{ my: 3 }}>
                      <Typography variant="h3" fontWeight={800} color="primary.main">
                        ${pkg.premium.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        per year
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Benefits:
                    </Typography>
                    <List dense sx={{ mb: 2 }}>
                      {pkg.benefits.map((benefit, idx) => (
                        <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={benefit}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: { fontSize: '0.875rem' },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    {pkg.hospitals.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Network Hospitals:
                        </Typography>
                        <List dense>
                          {pkg.hospitals.map((hospital, idx) => (
                            <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <HospitalIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={hospital}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { fontSize: '0.875rem' },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {pkg.phoneNumber}
                      </Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      onClick={handleGetQuote}
                      // variant={pkg.popular ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                      }}
                    >
                      Get Quote
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Contact Section */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(0, 191, 166, 0.08) 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack spacing={3} alignItems="center" textAlign="center" sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                Ready to Get Started?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', fontWeight: 400, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Contact our insurance experts to find the perfect {product.name.toLowerCase()} package for your needs.
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  mt: 2,
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: 'white',
                  boxShadow: 2,
                }}
              >
                <PhoneIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h5" fontWeight={700} sx={{ color: 'primary.main' }}>
                  +65 6123 4000
                </Typography>
              </Stack>
              <Button
                onClick={handleGetQuote}
                variant="contained"
                size="large"
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 6,
                  py: 2,
                  borderRadius: 3,
                  fontSize: '1.1rem',
                  boxShadow: 4,
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
              >
                Request a Quote
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
