'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocalHospital as HospitalIcon,
  Phone as PhoneIcon,
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
import { useAuth } from '../../contexts/AuthContext';

interface Package {
  name: string;
  premium: number;
  benefits: string[];
  hospitals: string[];
  phoneNumber: string;
  popular?: boolean;
}

interface ProductPackages {
  [key: string]: {
    name: string;
    icon: any;
    description: string;
    packages: Package[];
  };
}

const productPackages: ProductPackages = {
  HEALTH: {
    name: 'Health Insurance',
    icon: HealthIcon,
    description: 'Comprehensive health coverage for you and your family',
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
  MOTOR: {
    name: 'Motor Insurance',
    icon: MotorIcon,
    description: 'Complete vehicle protection with flexible coverage options',
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
  LIFE: {
    name: 'Life Insurance',
    icon: LifeIcon,
    description: 'Secure your family\'s future with comprehensive life coverage',
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
  TRAVEL: {
    name: 'Travel Insurance',
    icon: TravelIcon,
    description: 'Travel with confidence and peace of mind',
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
  FIRE: {
    name: 'Fire Insurance',
    icon: FireIcon,
    description: 'Protect your property against fire damage and related perils',
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
  PROPERTY: {
    name: 'Property Insurance',
    icon: PropertyIcon,
    description: 'Comprehensive protection for your commercial and residential properties',
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
  HOME: {
    name: 'Home Insurance',
    icon: HomeIcon,
    description: 'Complete protection for your home and personal belongings',
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
  BUSINESS: {
    name: 'Business Insurance',
    icon: BusinessIcon,
    description: 'Comprehensive coverage for your business operations and assets',
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
  LIABILITY: {
    name: 'Liability Insurance',
    icon: LiabilityIcon,
    description: 'Protect your business from third-party claims and legal liabilities',
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

const productTypes = Object.keys(productPackages);

export default function PoliciesPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('HEALTH');
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleProductChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedProduct(newValue);
  };

  const handleGetQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      router.push('/quotes');
    }
  };

  const handleProductClick = (productType: string) => {
    if (isAuthenticated) {
      router.push(`/policies/${productType.toLowerCase()}`);
    }
  };

  const currentProduct = productPackages[selectedProduct];
  const IconComponent = currentProduct.icon;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Insurance Policies & Packages
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
            Choose the perfect insurance package tailored to your needs. All packages include comprehensive coverage with access to Singapore's leading healthcare facilities.
          </Typography>
        </Box>

        {/* Product Tabs */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Tabs
            value={selectedProduct}
            onChange={handleProductChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9375rem',
                minHeight: 64,
              },
            }}
          >
            {productTypes.map((type) => {
              const Icon = productPackages[type].icon;
              return (
                <Tab
                  key={type}
                  value={type}
                  label={productPackages[type].name}
                  icon={<Icon sx={{ mb: 0.5 }} />}
                  iconPosition="top"
                />
              );
            })}
          </Tabs>
        </Paper>

        {/* Product Description */}
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <IconComponent sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                {currentProduct.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentProduct.description}
              </Typography>
            </Box>
            {isAuthenticated && (
              <Button
                variant="outlined"
                onClick={() => handleProductClick(selectedProduct)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                View Details
              </Button>
            )}
          </Stack>
        </Box>

        {/* Packages Grid */}
        <Grid container spacing={3}>
          {currentProduct.packages.map((pkg, index) => (
            <Grid item xs={12} sm={6} md={3} key={pkg.name}>
              <Card
                elevation={0}
                onClick={() => isAuthenticated && handleProductClick(selectedProduct)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid',
                  borderColor: pkg.popular ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  cursor: isAuthenticated ? 'pointer' : 'default',
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
                      // top: 16,
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
                    variant={pkg.popular ? 'contained' : 'outlined'}
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
            </Grid>
          ))}
        </Grid>

        {/* Contact Information */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)',
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              Need Help Choosing a Package?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
              Our insurance experts are available 24/7 to help you find the perfect coverage for your needs.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <PhoneIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={600}>
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
                fontWeight: 600,
                px: 4,
              }}
            >
              Request a Custom Quote
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
