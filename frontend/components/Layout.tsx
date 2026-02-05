'use client';

import React, { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useColorMode } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import IntegrationWidget from './IntegrationWidget';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Claims', href: '/claims' },
  { label: 'Policies', href: '/policies' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { mode, toggle } = useColorMode();
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ 
              textDecoration: 'none', 
              color: 'common.white', 
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.25rem' },
              flexGrow: 1,
            }}
          >
            Brillar Insurance
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
            {isAuthenticated && !isMobile && (
              <Tabs
                value={pathname}
                onChange={(e, newValue) => {
                  router.push(newValue);
                }}
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 80,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      color: 'common.white',
                      fontWeight: 600,
                    },
                    '&:hover': {
                      color: 'common.white',
                    },
                  },
                  '& .MuiTabs-indicator': {
                    display: 'none',
                  },
                }}
              >
                {navLinks.map((link) => (
                  <Tab
                    key={link.href}
                    label={link.label}
                    value={link.href}
                  />
                ))}
                {user?.role === 'ADMIN' && (
                  <Tab
                    label="Admin"
                    value="/admin"
                  />
                )}
                {(user?.role === 'AGENT' || user?.role === 'UNDERWRITER' || user?.role === 'CLAIMS_OFFICER') && (
                  <Tab
                    label="Staff"
                    value="/staff"
                  />
                )}
                {(user?.role === 'CLAIMS_OFFICER' || user?.role === 'ADMIN') && (
                  <Tab
                    label="Claims Officer"
                    value="/claims-officer"
                  />
                )}
              </Tabs>
            )}
            <IconButton
              color="inherit"
              onClick={toggle}
              aria-label="toggle theme"
              sx={{ color: 'common.white' }}
              size="small"
            >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
            {isAuthenticated ? (
              <>
                <IconButton
                  size="small"
                  aria-label="account menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  sx={{ color: 'common.white' }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', color: 'primary.main', fontSize: '0.875rem' }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                      borderRadius: 0,
                    }
                  }}
                >
                  <MenuItem disabled>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => {
                  window.location.href = '/login';
                }}
                sx={{ 
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                  },
                  position: 'relative',
                  zIndex: 10,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
              >
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation */}
      {isAuthenticated && isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            zIndex: 1000,
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'space-around',
            py: 1,
            mt: 'auto',
          }}
        >
          {navLinks.slice(0, 5).map((link) => (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              sx={{
                color: pathname === link.href ? 'primary.main' : 'text.secondary',
                minWidth: 'auto',
                flexDirection: 'column',
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          pt: { xs: 10, md: 10 },
          pb: { xs: isAuthenticated && isMobile ? 8 : 4, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>{children}</Box>
      </Box>
      
      {/* Integration Widget - Only for CUSTOMER role */}
      <IntegrationWidget />
    </Box>
  );
}
