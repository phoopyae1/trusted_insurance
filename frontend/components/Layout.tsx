'use client';

import React, { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useColorMode } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Claims', href: '/claims' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { mode, toggle } = useColorMode();
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
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
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="transparent" elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(true)}
            sx={{ mr: 2, color: 'common.white' }}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'common.white', fontWeight: 700 }}
          >
            Trusted Insurance
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              color="inherit"
              onClick={toggle}
              aria-label="toggle theme"
              sx={{ color: 'common.white' }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            {isAuthenticated ? (
              <>
                <IconButton
                  size="large"
                  aria-label="account menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  sx={{ color: 'common.white' }}
                >
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'info.main', color: 'primary.main' }}>
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
                >
                  <MenuItem disabled>
                    <Typography variant="body2">{user?.email}</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" component={Link} href="/login" sx={{ color: 'common.white' }}>
                Login
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Navigation
            </Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              IMS Workspace
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {navLinks.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setOpen(false)}
                selected={pathname === link.href}
                sx={{
                  borderRadius: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(15, 185, 177, 0.12)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(15, 185, 177, 0.2)',
                    },
                  },
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
          {user?.role === 'ADMIN' && (
            <>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItemButton component={Link} href="/admin" onClick={() => setOpen(false)}>
                  <ListItemText primary="Admin Panel" />
                </ListItemButton>
              </List>
            </>
          )}
          {(user?.role === 'AGENT' || user?.role === 'UNDERWRITER' || user?.role === 'CLAIMS_OFFICER') && (
            <>
              <Divider sx={{ my: 2 }} />
              <List>
                <ListItemButton component={Link} href="/staff" onClick={() => setOpen(false)}>
                  <ListItemText primary="Staff Panel" />
                </ListItemButton>
              </List>
            </>
          )}
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          mt: { xs: 10, md: 12 },
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}
