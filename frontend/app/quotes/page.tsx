'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert
} from '@mui/material';

const steps = ['Choose product', 'Applicant details', 'Review'];

interface Product {
  id: number;
  name: string;
  type: string;
  basePremium: number;
}

export default function QuotesPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [metadata, setMetadata] = useState({ age: 30, smoker: false, vehicleValue: 0, tripDuration: 0 });
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const next = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const back = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const submitQuote = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo-token' },
        body: JSON.stringify({ productId: selectedProduct, metadata })
      });
      const data = await res.json();
      setToast(res.ok ? 'Quote submitted. Provide a valid token to create real quotes.' : data.message || 'Failed');
    } catch (err) {
      setToast('Network error');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Request a quote
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === 0 && (
        <FormControl fullWidth>
          <InputLabel id="product-label">Product</InputLabel>
          <Select
            labelId="product-label"
            label="Product"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(Number(e.target.value))}
          >
            {products.map((product) => (
              <MenuItem value={product.id} key={product.id}>
                {product.name} — ${product.basePremium}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {activeStep === 1 && (
        <Stack spacing={2}>
          <TextField
            label="Age"
            type="number"
            value={metadata.age}
            onChange={(e) => setMetadata({ ...metadata, age: Number(e.target.value) })}
          />
          <TextField
            label="Vehicle value"
            type="number"
            value={metadata.vehicleValue}
            onChange={(e) => setMetadata({ ...metadata, vehicleValue: Number(e.target.value) })}
          />
          <TextField
            label="Trip duration (days)"
            type="number"
            value={metadata.tripDuration}
            onChange={(e) => setMetadata({ ...metadata, tripDuration: Number(e.target.value) })}
          />
        </Stack>
      )}

      {activeStep === 2 && (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ready to submit your quote request. Provide a JWT token in Authorization header to create live data.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Product ID: {selectedProduct || 'Not selected'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Age: {metadata.age}, Vehicle Value: {metadata.vehicleValue}
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button onClick={back} disabled={activeStep === 0} variant="outlined">
          Back
        </Button>
        {activeStep < steps.length - 1 && <Button onClick={next}>Next</Button>}
        {activeStep === steps.length - 1 && <Button onClick={submitQuote}>Submit quote</Button>}
      </Stack>
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="info">{toast}</Alert>
      </Snackbar>
    </Paper>
  );
}
