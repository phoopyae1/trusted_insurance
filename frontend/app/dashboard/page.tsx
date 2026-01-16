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
  Stack,
  Chip,
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
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'radial-gradient(circle at top left, rgba(0, 102, 204, 0.12), transparent 55%), radial-gradient(circle at top right, rgba(0, 191, 166, 0.12), transparent 55%)'
        }}
      >
        <Stack spacing={1.5}>
          <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
            Dashboard
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your insurance needs from one place with quick access to your most important actions.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label="Policy renewals this month" variant="outlined" color="primary" />
            <Chip label="Claims updates ready" variant="outlined" color="primary" />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2
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
                  <Button size="small" onClick={() => router.push(card.href)} fullWidth variant="outlined">
                    View {card.title}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
