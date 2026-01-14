'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Grid,
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
  Alert,
  FormControlLabel,
  Checkbox,
  Skeleton
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';

const steps = ['Choose product', 'Applicant details', 'Review'];

interface Product {
  id: number;
  name: string;
  type: string;
  basePremium: number;
}

const quoteSchema = z.object({
  productId: z.number({ required_error: 'Select a product' }).min(1, 'Select a product'),
  age: z.number().min(18, 'Minimum age is 18').max(100, 'Maximum age is 100'),
  smoker: z.boolean(),
  vehicleValue: z.number().min(0, 'Vehicle value must be positive'),
  tripDuration: z.number().min(0, 'Trip duration must be positive')
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export default function QuotesPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [toast, setToast] = useState('');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
      return res.json();
    }
  });

  const { control, handleSubmit, trigger, watch, formState } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      productId: 0,
      age: 30,
      smoker: false,
      vehicleValue: 0,
      tripDuration: 0
    }
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo-token' },
        body: JSON.stringify({
          productId: values.productId,
          metadata: {
            age: values.age,
            smoker: values.smoker,
            vehicleValue: values.vehicleValue,
            tripDuration: values.tripDuration
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      return data;
    },
    onSuccess: () => setToast('Quote submitted. Provide a valid token to create real quotes.'),
    onError: (error: Error) => setToast(error.message || 'Network error')
  });

  const next = async () => {
    const fields = activeStep === 0 ? ['productId'] : ['age', 'vehicleValue', 'tripDuration', 'smoker'];
    const valid = await trigger(fields as (keyof QuoteFormValues)[]);
    if (valid) setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  const back = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const selectedProductId = watch('productId');
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const onSubmit = (values: QuoteFormValues) => submitQuoteMutation.mutate(values);

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background:
            'radial-gradient(circle at top left, rgba(0, 102, 204, 0.12), transparent 55%), radial-gradient(circle at top right, rgba(0, 191, 166, 0.12), transparent 55%)'
        }}
      >
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
          Quote builder
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Request a quote in a few guided steps.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a product, share a few details, and receive a tailored estimate with instant confirmation.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}
          >
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
              <FormControl fullWidth error={Boolean(formState.errors.productId)}>
                <InputLabel id="product-label">Product</InputLabel>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={56} />
                ) : (
                  <Controller
                    name="productId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        labelId="product-label"
                        label="Product"
                        value={field.value || ''}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      >
                        {products.map((product) => (
                          <MenuItem value={product.id} key={product.id}>
                            {product.name} — ${product.basePremium}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                )}
                {formState.errors.productId && (
                  <Typography variant="caption" color="error">
                    {formState.errors.productId.message}
                  </Typography>
                )}
              </FormControl>
            )}

            {activeStep === 1 && (
              <Stack spacing={2}>
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Age"
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={Boolean(formState.errors.age)}
                      helperText={formState.errors.age?.message}
                    />
                  )}
                />
                <FormControlLabel
                  control={
                    <Controller
                      name="smoker"
                      control={control}
                      render={({ field }) => (
                        <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      )}
                    />
                  }
                  label="Smoker"
                />
                <Controller
                  name="vehicleValue"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Vehicle value"
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={Boolean(formState.errors.vehicleValue)}
                      helperText={formState.errors.vehicleValue?.message}
                    />
                  )}
                />
                <Controller
                  name="tripDuration"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Trip duration (days)"
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={Boolean(formState.errors.tripDuration)}
                      helperText={formState.errors.tripDuration?.message}
                    />
                  )}
                />
              </Stack>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Ready to submit your quote request. Provide a JWT token in Authorization header to create live data.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Product: {selectedProduct?.name || 'Not selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Age: {watch('age')}, Vehicle Value: {watch('vehicleValue')}
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button onClick={back} disabled={activeStep === 0} variant="outlined">
                Back
              </Button>
              {activeStep < steps.length - 1 && <Button onClick={next}>Next</Button>}
              {activeStep === steps.length - 1 && (
                <Button onClick={handleSubmit(onSubmit)} disabled={submitQuoteMutation.isPending}>
                  {submitQuoteMutation.isPending ? 'Submitting...' : 'Submit quote'}
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%'
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Quote checklist
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep this info handy to speed up approvals and avoid delays.
              </Typography>
              <Box>
                <Typography variant="subtitle2">Needed details</Typography>
                <Typography variant="body2" color="text.secondary">
                  Applicant age, vehicle or trip details, and a selected product.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Average response</Typography>
                <Typography variant="body2" color="text.secondary">
                  15 minutes for a digital estimate, same-day for confirmation.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="info">{toast}</Alert>
      </Snackbar>
    </Stack>
  );
}
