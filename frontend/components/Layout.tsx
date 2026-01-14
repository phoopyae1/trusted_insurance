'use client';

import React, { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Button,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
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
      <AppBar position="fixed" color="primary" elevation={2}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(true)}
            sx={{ mr: 2 }}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Trusted Insurance
          </Typography>
          <IconButton color="inherit" onClick={toggle} aria-label="toggle theme">
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
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
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
            <Button color="inherit" component={Link} href="/login">
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <Typography variant="h6" sx={{ p: 2 }}>
            Navigation
          </Typography>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setOpen(false)}
                sx={{
                  backgroundColor: pathname === link.href ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
          </List>
          {user?.role === 'ADMIN' && (
            <>
              <Divider />
              <List>
                <ListItem
                  component={Link}
                  href="/admin"
                  onClick={() => setOpen(false)}
                >
                  <ListItemText primary="Admin Panel" />
                </ListItem>
              </List>
            </>
          )}
          {(user?.role === 'AGENT' || user?.role === 'UNDERWRITER' || user?.role === 'CLAIMS_OFFICER') && (
            <>
              <Divider />
              <List>
                <ListItem
                  component={Link}
                  href="/staff"
                  onClick={() => setOpen(false)}
                >
                  <ListItemText primary="Staff Panel" />
                </ListItem>
              </List>
            </>
          )}
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
