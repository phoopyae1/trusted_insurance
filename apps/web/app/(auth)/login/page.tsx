'use client';

import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      setMessage(res.ok ? 'Login successful' : data.message || 'Login failed');
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <Box maxWidth={420}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button onClick={handleSubmit}>Sign in</Button>
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
