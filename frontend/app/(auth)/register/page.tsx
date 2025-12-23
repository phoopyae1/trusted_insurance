'use client';

import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMessage(res.ok ? 'Registration successful' : data.message || 'Registration failed');
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <Box maxWidth={420}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create an account
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
          />
          <Button onClick={handleSubmit}>Register</Button>
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
