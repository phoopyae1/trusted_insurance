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
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useColorMode } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import IntegrationWidget from './IntegrationWidget';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Claims', href: '/claims' },
  { label: 'Policies', href: '/insurance-plans' },
];

const customerNavLinks = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Insurance Plans', href: '/insurance-plans' },
  { label: 'My Policies', href: '/my-policies' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Claims', href: '/claims' },
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          backdropFilter: 'none',
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Toolbar sx={{ px: { xs: 3, md: 6 }, py: 1.5, width: '100%', backgroundColor: '#ffffff' }}>
          {/* Logo on the left */}
          <Box
            component={Link}
            href="/"
            sx={{ 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mr: { xs: 2, md: 6 },
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src="/b8496caa-494f-41e7-ad21-c909fa50a14e.png"
                alt="Brillar Insurance Logo"
                width={80}
                height={80}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
                priority
              />
            </Box>
            <Typography
              variant="h6"
              sx={{ 
                color: 'text.primary', 
                fontWeight: 800,
                fontSize: { xs: '1.125rem', md: '1.375rem' },
                letterSpacing: '-0.02em',
              }}
            >
              Brillar Insurance
            </Typography>
          </Box>

          {/* Navigation items */}
          {!isMobile && isAuthenticated && user?.role === 'CUSTOMER' && (
            <Box sx={{ flex: 1, display: 'flex', ml: 4 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                {[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Insurance Plans', href: '/insurance-plans' },
                  { label: 'My Policies', href: '/my-policies' },
                  { label: 'Quotes', href: '/quotes' },
                  { label: 'Claims', href: '/claims' },
                ].map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: pathname === link.href ? 'primary.main' : 'text.primary',
                      textDecoration: 'none',
                      fontWeight: pathname === link.href ? 600 : 400,
                      fontSize: '0.9375rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Claims Officer Navigation */}
          {!isMobile && isAuthenticated && user?.role === 'CLAIMS_OFFICER' && (
            <Box sx={{ flex: 1, display: 'flex', ml: 4 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                {[
                  { label: 'Claims', href: '/claims-officer' },
                  { label: 'Dashboard', href: '/dashboard' },
                ].map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: pathname === link.href ? 'primary.main' : 'text.primary',
                      textDecoration: 'none',
                      fontWeight: pathname === link.href ? 600 : 400,
                      fontSize: '0.9375rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Underwriter Navigation */}
          {!isMobile && isAuthenticated && user?.role === 'UNDERWRITER' && (
            <Box sx={{ flex: 1, display: 'flex', ml: 4 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                {[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Quotes', href: '/quotes' },
                  { label: 'Policies', href: '/my-policies' },
                ].map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: pathname === link.href ? 'primary.main' : 'text.primary',
                      textDecoration: 'none',
                      fontWeight: pathname === link.href ? 600 : 400,
                      fontSize: '0.9375rem',
                      '&:hover': {
                        color: 'primary.main',
                      },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Buttons on the right */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: 'auto' }}>
            <IconButton
              onClick={toggle}
              aria-label="toggle theme"
              sx={{ 
                color: 'text.primary',
                display: { xs: 'none', sm: 'flex' },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                transition: 'all 0.3s ease',
              }}
              size="small"
            >
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={handleMenu}
                  aria-label="account menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  sx={{ 
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                  size="small"
                >
                  <Avatar 
                    sx={{ 
                      width: 38, 
                      height: 38, 
                      backgroundColor: 'primary.main',
                      color: 'common.white', 
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                    }}
                  >
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
                      minWidth: 220,
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      border: '1px solid',
                      borderColor: 'rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#ffffff',
                    }
                  }}
                >
                  <MenuItem disabled sx={{ py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {user?.email}
          </Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    }}
                  >
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/insurance-plans"
                  variant="outlined"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 2.5,
                    py: 1,
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    color: 'text.primary',
                    borderRadius: 3,
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    },
                    display: { xs: 'none', sm: 'flex' },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Insurance Plans
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    px: 3.5,
                    py: 1.25,
                    backgroundColor: 'primary.main',
                    color: 'common.white',
                    borderRadius: 3,
                    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Account Login
          </Button>
              </>
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
          {user?.role === 'CLAIMS_OFFICER' ? (
            <>
              <Button
                component={Link}
                href="/claims-officer"
                sx={{
                  color: pathname === '/claims-officer' ? 'primary.main' : 'text.secondary',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Claims
              </Button>
              <Button
                component={Link}
                href="/dashboard"
                sx={{
                  color: pathname === '/dashboard' ? 'primary.main' : 'text.secondary',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Dashboard
              </Button>
            </>
          ) : user?.role === 'UNDERWRITER' ? (
            <>
              <Button
                component={Link}
                href="/dashboard"
                sx={{
                  color: pathname === '/dashboard' ? 'primary.main' : 'text.secondary',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Dashboard
              </Button>
              <Button
                component={Link}
                href="/quotes"
                sx={{
                  color: pathname === '/quotes' ? 'primary.main' : 'text.secondary',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Quotes
              </Button>
              <Button
                component={Link}
                href="/my-policies"
                sx={{
                  color: pathname === '/my-policies' ? 'primary.main' : 'text.secondary',
                  minWidth: 'auto',
                  flexDirection: 'column',
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                Policies
              </Button>
            </>
          ) : user?.role === 'CUSTOMER' ? (
            customerNavLinks.map((link) => (
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
                {link.label === 'Insurance Plans' ? 'Plans' : link.label === 'My Policies' ? 'Policies' : link.label}
            </Button>
            ))
          ) : (
            navLinks.slice(0, 5).map((link) => (
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
            ))
          )}
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: pathname === '/' ? 0 : { xs: 10, md: 10 },
          pb: { xs: isAuthenticated && isMobile ? 8 : 4, md: 4 },
        }}
      >
        {children}
      </Box>
      
      {/* Integration Widget - Only for CUSTOMER role */}
      <IntegrationWidget />
    </Box>
  );
}
