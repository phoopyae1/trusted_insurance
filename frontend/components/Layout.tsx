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
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Link from 'next/link';
import { useColorMode } from '../lib/theme';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Claims', href: '/claims' },
  { label: 'Dashboard', href: '/dashboard' }
];

export default function Layout({ children }: { children: ReactNode }) {
  const { mode, toggle } = useColorMode();
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="fixed" color="primary">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Trusted Insurance
          </Typography>
          <IconButton color="inherit" onClick={toggle} aria-label="toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button color="inherit" component={Link} href="/login">
            Login
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation" onClick={() => setOpen(false)}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Navigation
          </Typography>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem button component={Link} href={link.href} key={link.href}>
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button fullWidth variant="outlined" component={Link} href="/admin">
              Admin
            </Button>
            <Button fullWidth sx={{ mt: 1 }} variant="outlined" component={Link} href="/staff">
              Staff
            </Button>
          </Box>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
