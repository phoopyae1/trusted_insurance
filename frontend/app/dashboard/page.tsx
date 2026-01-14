'use client';

import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  Policy as PolicyIcon,
  Description as QuoteIcon,
  Assignment as ClaimIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

const dashboardCards = [
  {
    title: 'Policies',
    description: 'View and manage your active insurance policies',
    icon: PolicyIcon,
    href: '/policies',
    color: '#1976d2',
  },
  {
    title: 'Quotes',
    description: 'Track your insurance quote requests and approvals',
    icon: QuoteIcon,
    href: '/quotes',
    color: '#2e7d32',
  },
  {
    title: 'Claims',
    description: 'Submit and track your insurance claims',
    icon: ClaimIcon,
    href: '/claims',
    color: '#ed6c02',
  },
  {
    title: 'Products',
    description: 'Browse available insurance products',
    icon: TrendingIcon,
    href: '/products',
    color: '#9c27b0',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back{user?.name ? `, ${user.name}` : ''}!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your insurance needs from one place
      </Typography>

      <Grid container spacing={3}>
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Icon sx={{ fontSize: 40, color: card.color, mr: 2 }} />
                    <Typography variant="h6" component="h2">
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push(card.href)}
                    fullWidth
                  >
                    View {card.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
