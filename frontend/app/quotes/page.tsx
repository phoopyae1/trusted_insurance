'use client';

import { useMemo, useState, useEffect } from 'react';
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
  Skeleton,
  Chip,
  Tab,
  Tabs,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '../../lib/api/products';
import { quotesApi, Quote } from '../../lib/api/quotes';
import { useAuth } from '../../contexts/AuthContext';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const steps = ['Choose product', 'Applicant details', 'Review'];

// Unified schema with conditional validation
const quoteSchema = z.object({
  productId: z.number({ required_error: 'Select a product' }).min(1, 'Select a product'),
  age: z.number().min(18, 'Minimum age is 18').max(100, 'Maximum age is 100'),
  smoker: z.boolean().optional(),
  vehicleValue: z.number().optional(),
  tripDuration: z.number().optional(),
  // Life insurance specific fields
  drinker: z.boolean().optional(),
  preExistingConditions: z.string().optional(),
  familyHistory: z.string().optional(),
  occupation: z.string().optional(),
  bmi: z.number().optional(),
  exerciseFrequency: z.string().optional(),
  // Health insurance specific fields
  currentMedications: z.string().optional(),
  // Motor insurance specific fields
  drivingExperience: z.number().optional(),
  accidentHistory: z.string().optional(),
  vehicleUsage: z.string().optional(),
  annualMileage: z.number().optional(),
}).superRefine((data, ctx) => {
  // Get product type from the form context (we'll pass it via metadata)
  // For now, we'll validate based on what's present
  // This will be handled in the component logic
});

type QuoteFormValues = {
  productId: number;
  age: number;
  smoker?: boolean;
  vehicleValue?: number;
  tripDuration?: number;
  // Life insurance specific fields
  drinker?: boolean;
  preExistingConditions?: string;
  familyHistory?: string;
  occupation?: string;
  bmi?: number;
  exerciseFrequency?: string;
  // Health insurance specific fields
  currentMedications?: string;
  // Motor insurance specific fields
  drivingExperience?: number;
  accidentHistory?: string;
  vehicleUsage?: string;
  annualMileage?: number;
};

type TabValue = 'list' | 'create';

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('list');
  const [activeStep, setActiveStep] = useState(0);
  const [toast, setToast] = useState('');
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll()
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: () => quotesApi.getAll(),
    enabled: isAuthenticated,
  });

  const { control, handleSubmit, trigger, watch, formState, reset } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      productId: 0,
      age: 30,
      smoker: false,
      vehicleValue: 0,
      tripDuration: 0,
      drinker: false,
      preExistingConditions: '',
      familyHistory: '',
      occupation: '',
      bmi: undefined,
      exerciseFrequency: '',
      currentMedications: '',
      drivingExperience: undefined,
      accidentHistory: '',
      vehicleUsage: '',
      annualMileage: undefined
    }
  });

  const selectedProductId = watch('productId');
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  // Clear irrelevant fields when product type changes
  useEffect(() => {
    if (selectedProduct?.type) {
      const currentValues = watch();
      const updatedValues: Partial<QuoteFormValues> = { ...currentValues };
      
      // Clear fields that don't apply to the selected product
      if (selectedProduct.type !== 'MOTOR') {
        updatedValues.vehicleValue = undefined;
      }
      if (selectedProduct.type !== 'TRAVEL') {
        updatedValues.tripDuration = undefined;
      }
      // Clear health insurance specific fields if not HEALTH insurance
      if (selectedProduct.type !== 'HEALTH') {
        updatedValues.currentMedications = undefined;
      }
      
      // Clear life insurance specific fields if not LIFE insurance
      if (selectedProduct.type !== 'LIFE') {
        updatedValues.drinker = undefined;
        updatedValues.occupation = undefined;
      }
      
      // Clear shared health/life fields if not HEALTH or LIFE
      if (selectedProduct.type !== 'HEALTH' && selectedProduct.type !== 'LIFE') {
        updatedValues.preExistingConditions = undefined;
        updatedValues.familyHistory = undefined;
        updatedValues.bmi = undefined;
        updatedValues.exerciseFrequency = undefined;
      }
      
      // Clear motor insurance specific fields if not MOTOR insurance
      if (selectedProduct.type !== 'MOTOR') {
        updatedValues.drivingExperience = undefined;
        updatedValues.accidentHistory = undefined;
        updatedValues.vehicleUsage = undefined;
        updatedValues.annualMileage = undefined;
      }
      
      // Only reset if values actually changed
      const hasChanges = 
        updatedValues.vehicleValue !== currentValues.vehicleValue || 
        updatedValues.tripDuration !== currentValues.tripDuration ||
        updatedValues.drinker !== currentValues.drinker ||
        updatedValues.preExistingConditions !== currentValues.preExistingConditions ||
        updatedValues.familyHistory !== currentValues.familyHistory ||
        updatedValues.occupation !== currentValues.occupation ||
        updatedValues.bmi !== currentValues.bmi ||
        updatedValues.exerciseFrequency !== currentValues.exerciseFrequency ||
        updatedValues.currentMedications !== currentValues.currentMedications ||
        updatedValues.drivingExperience !== currentValues.drivingExperience ||
        updatedValues.accidentHistory !== currentValues.accidentHistory ||
        updatedValues.vehicleUsage !== currentValues.vehicleUsage ||
        updatedValues.annualMileage !== currentValues.annualMileage;
        
      if (hasChanges) {
        reset(updatedValues, { keepValues: true });
      }
    }
  }, [selectedProduct?.type, reset, watch]);

  const submitQuoteMutation = useMutation({
    mutationFn: async (values: QuoteFormValues) => {
      if (!isAuthenticated) {
        throw new Error('Please log in to submit a quote');
      }
      // Only include relevant fields in metadata based on product type
      const metadata: any = {
            age: values.age,
      };
      
      if (values.smoker !== undefined) {
        metadata.smoker = values.smoker;
      }
      
      if (selectedProduct?.type === 'MOTOR' && values.vehicleValue) {
        metadata.vehicleValue = values.vehicleValue;
      }
      
      if (selectedProduct?.type === 'TRAVEL' && values.tripDuration) {
        metadata.tripDuration = values.tripDuration;
      }

      // Health insurance specific fields
      if (selectedProduct?.type === 'HEALTH') {
        if (values.preExistingConditions) {
          metadata.preExistingConditions = values.preExistingConditions;
        }
        if (values.familyHistory) {
          metadata.familyHistory = values.familyHistory;
        }
        if (values.currentMedications) {
          metadata.currentMedications = values.currentMedications;
        }
        if (values.bmi) {
          metadata.bmi = values.bmi;
        }
        if (values.exerciseFrequency) {
          metadata.exerciseFrequency = values.exerciseFrequency;
        }
      }

      // Life insurance specific fields
      if (selectedProduct?.type === 'LIFE') {
        if (values.drinker !== undefined) {
          metadata.drinker = values.drinker;
        }
        if (values.preExistingConditions) {
          metadata.preExistingConditions = values.preExistingConditions;
        }
        if (values.familyHistory) {
          metadata.familyHistory = values.familyHistory;
        }
        if (values.occupation) {
          metadata.occupation = values.occupation;
        }
        if (values.bmi) {
          metadata.bmi = values.bmi;
        }
        if (values.exerciseFrequency) {
          metadata.exerciseFrequency = values.exerciseFrequency;
        }
      }

      // Motor insurance specific fields
      if (selectedProduct?.type === 'MOTOR') {
        if (values.drivingExperience) {
          metadata.drivingExperience = values.drivingExperience;
        }
        if (values.accidentHistory) {
          metadata.accidentHistory = values.accidentHistory;
        }
        if (values.vehicleUsage) {
          metadata.vehicleUsage = values.vehicleUsage;
        }
        if (values.annualMileage) {
          metadata.annualMileage = values.annualMileage;
        }
      }

      return quotesApi.create({
        productId: values.productId,
        metadata,
      });
    },
    onSuccess: () => {
      setToast('Quote submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      // Reset form and switch to list view
      setTimeout(() => {
        setActiveTab('list');
        setActiveStep(0);
        reset();
      }, 2000);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to submit quote. Please try again.';
      setToast(errorMessage);
      console.error('Quote submission error:', error);
    }
  });

  const next = async () => {
    if (activeStep === 0) {
      const valid = await trigger(['productId']);
      if (valid) setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } else {
      // Dynamic validation based on product type
      const fields: (keyof QuoteFormValues)[] = ['age'];
      
      // Validate required fields based on product type
      if (selectedProduct?.type === 'MOTOR') {
        fields.push('vehicleValue');
        const vehicleValue = watch('vehicleValue');
        if (!vehicleValue || vehicleValue <= 0) {
          setToast('Vehicle value is required for motor insurance');
          return;
        }
      } else if (selectedProduct?.type === 'TRAVEL') {
        fields.push('tripDuration');
        const tripDuration = watch('tripDuration');
        if (!tripDuration || tripDuration < 1) {
          setToast('Trip duration is required for travel insurance');
          return;
        }
      }
      
      const valid = await trigger(fields);
    if (valid) setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };
  const back = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = (values: QuoteFormValues) => submitQuoteMutation.mutate(values);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const quoteColumns: GridColDef<Quote>[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      valueGetter: (params) => params.row?.product?.name || 'N/A',
    },
    {
      field: 'premium',
      headerName: 'Premium',
      width: 120,
      renderCell: (params) => {
        const value = params.value;
        if (value == null || value === undefined) return <Typography variant="body2">$0.00</Typography>;
        const numValue = typeof value === 'number' ? value : parseFloat(String(value));
        const formatted = isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
        return <Typography variant="body2">{formatted}</Typography>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return <Typography variant="body2">N/A</Typography>;
        return <Typography variant="body2">{new Date(value).toLocaleDateString()}</Typography>;
      },
    },
  ];

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
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 3 }}>
          Insurance Quotes
        </Typography>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Manage your insurance quotes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your quote requests and create new quotes for insurance coverage.
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            if (newValue === 'create') {
              setActiveStep(0);
            }
          }}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`My Quotes (${quotes.length})`} value="list" />
          <Tab label="Request New Quote" value="create" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 'list' && (
            <Stack spacing={2}>
              {!isAuthenticated ? (
                <Alert severity="info">Please log in to view your quotes</Alert>
              ) : quotesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : quotes.length === 0 ? (
                <Alert severity="info">
                  You don't have any quotes yet. Click "Request New Quote" to create your first quote.
                </Alert>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    <Chip
                      label={`Pending: ${quotes.filter((q) => q.status === 'PENDING').length}`}
                      sx={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#F59E0B',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 500,
                      }}
                    />
                    <Chip
                      label={`Approved: ${quotes.filter((q) => q.status === 'APPROVED').length}`}
                      sx={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 500,
                      }}
                    />
                    <Chip
                      label={`Rejected: ${quotes.filter((q) => q.status === 'REJECTED').length}`}
                      sx={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        border: 'none',
                        borderRadius: '16px',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                  <Stack spacing={2}>
                    {quotes.map((quote) => {
                      const statusColor = getStatusColor(quote.status);
                      const statusConfig: Record<string, { 
                        bg: string; 
                        color: string; 
                        border: string;
                      }> = {
                        APPROVED: { 
                          bg: 'rgba(16, 185, 129, 0.08)', 
                          color: '#10B981', 
                          border: '#10B981',
                        },
                        REJECTED: { 
                          bg: 'rgba(239, 68, 68, 0.08)', 
                          color: '#EF4444', 
                          border: '#EF4444',
                        },
                        PENDING: { 
                          bg: 'rgba(245, 158, 11, 0.08)', 
                          color: '#F59E0B', 
                          border: '#F59E0B',
                        },
                        DRAFT: { 
                          bg: 'rgba(107, 114, 128, 0.08)', 
                          color: '#6B7280', 
                          border: '#6B7280',
                        },
                      };
                      const config = statusConfig[quote.status] || statusConfig.DRAFT;
                      
                      return (
                        <Paper
                          key={quote.id}
                          elevation={0}
                          sx={{
                            p: 3,
                            borderRadius: 0,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderLeft: `4px solid ${config.border}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={2}>
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                                Quote #{quote.id}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {new Date(quote.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {quote.product?.name || 'Unknown Product'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {quote.product?.type || 'N/A'}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="h5" fontWeight={700} color="primary.main">
                                ${quote.premium ? Number(quote.premium).toFixed(2) : '0.00'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Monthly Premium
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Chip
                                  label={quote.status}
                                  sx={{
                                    backgroundColor: config.bg,
                                    color: config.color,
                                    border: `1px solid ${config.border}`,
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    minWidth: 100,
                                  }}
                                />
                              </Box>
                              {quote.policy && (
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                  <Chip
                                    label={quote.policy.policyNumber}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      color: '#3B82F6',
                                      borderRadius: '16px',
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    })}
                  </Stack>
                </>
              )}
            </Stack>
          )}

          {activeTab === 'create' && (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 0, border: '1px solid', borderColor: 'divider' }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Request New Quote
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete the steps below to get a personalized insurance quote
              </Typography>
              <Stepper activeStep={activeStep} sx={{ mb: 0 }}>
                {steps.map((label, index) => (
                  <Step key={label} completed={index < activeStep}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': {
                          fontWeight: index === activeStep ? 600 : 400,
                          fontSize: '0.875rem',
                        },
                        '& .MuiStepLabel-iconContainer': {
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.75rem',
                          },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                </Step>
              ))}
            </Stepper>
            </Box>

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
              <Stack spacing={3}>
                {!selectedProduct && (
                  <Alert severity="info">Please select a product first</Alert>
                )}
                {selectedProduct && (
                  <>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                        Applicant Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Provide your details to get an accurate quote for {selectedProduct.name}
                      </Typography>
                    </Box>
                    <Divider />
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
                          required
                          fullWidth
                    />
                  )}
                />
                    {selectedProduct.type === 'HEALTH' && (
                      <>
                <FormControlLabel
                  control={
                    <Controller
                      name="smoker"
                      control={control}
                      render={({ field }) => (
                                <Checkbox 
                                  checked={field.value || false} 
                                  onChange={(e) => field.onChange(e.target.checked)} 
                                />
                      )}
                    />
                  }
                  label="Smoker"
                />
                        <Controller
                          name="preExistingConditions"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Pre-existing medical conditions"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.preExistingConditions)}
                              helperText={formState.errors.preExistingConditions?.message || 'List any existing medical conditions (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., Diabetes, Hypertension, Asthma"
                            />
                          )}
                        />
                        <Controller
                          name="familyHistory"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Family medical history"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.familyHistory)}
                              helperText={formState.errors.familyHistory?.message || 'Any significant family medical history (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., Heart disease, Cancer, Diabetes in family"
                            />
                          )}
                        />
                        <Controller
                          name="currentMedications"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Current medications"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.currentMedications)}
                              helperText={formState.errors.currentMedications?.message || 'List any current medications (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., Blood pressure medication, Insulin"
                            />
                          )}
                        />
                        <Controller
                          name="bmi"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="BMI (Body Mass Index)"
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              error={Boolean(formState.errors.bmi)}
                              helperText={formState.errors.bmi?.message || 'Your Body Mass Index (optional)'}
                              inputProps={{ min: 10, max: 50, step: 0.1 }}
                              placeholder="e.g., 22.5"
                            />
                          )}
                        />
                        <FormControl fullWidth>
                          <InputLabel id="exercise-frequency-health-label">Exercise frequency</InputLabel>
                          <Controller
                            name="exerciseFrequency"
                            control={control}
                            render={({ field }) => (
                              <Select
                                labelId="exercise-frequency-health-label"
                                label="Exercise frequency"
                                value={field.value || ''}
                                onChange={field.onChange}
                              >
                                <MenuItem value="">Not specified</MenuItem>
                                <MenuItem value="NONE">No regular exercise</MenuItem>
                                <MenuItem value="LIGHT">Light (1-2 times per week)</MenuItem>
                                <MenuItem value="MODERATE">Moderate (3-4 times per week)</MenuItem>
                                <MenuItem value="ACTIVE">Active (5+ times per week)</MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                      </>
                    )}
                    {selectedProduct.type === 'TRAVEL' && (
                      <FormControlLabel
                        control={
                          <Controller
                            name="smoker"
                            control={control}
                            render={({ field }) => (
                              <Checkbox 
                                checked={field.value || false} 
                                onChange={(e) => field.onChange(e.target.checked)} 
                              />
                            )}
                          />
                        }
                        label="Smoker"
                      />
                    )}
                    {selectedProduct.type === 'LIFE' && (
                      <>
                        <FormControlLabel
                          control={
                            <Controller
                              name="smoker"
                              control={control}
                              render={({ field }) => (
                                <Checkbox 
                                  checked={field.value || false} 
                                  onChange={(e) => field.onChange(e.target.checked)} 
                                />
                              )}
                            />
                          }
                          label="Smoker"
                        />
                        <FormControlLabel
                          control={
                            <Controller
                              name="drinker"
                              control={control}
                              render={({ field }) => (
                                <Checkbox 
                                  checked={field.value || false} 
                                  onChange={(e) => field.onChange(e.target.checked)} 
                                />
                              )}
                            />
                          }
                          label="Regular drinker"
                        />
                        <Controller
                          name="preExistingConditions"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Pre-existing medical conditions"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.preExistingConditions)}
                              helperText={formState.errors.preExistingConditions?.message || 'List any existing medical conditions (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., Diabetes, Hypertension, Heart disease"
                            />
                          )}
                        />
                        <Controller
                          name="familyHistory"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Family medical history"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.familyHistory)}
                              helperText={formState.errors.familyHistory?.message || 'Any significant family medical history (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., Heart disease, Cancer, Diabetes in family"
                            />
                          )}
                        />
                        <Controller
                          name="occupation"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Occupation"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.occupation)}
                              helperText={formState.errors.occupation?.message || 'Your current occupation'}
                              placeholder="e.g., Software Engineer, Teacher, Construction Worker"
                            />
                          )}
                        />
                        <Controller
                          name="bmi"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="BMI (Body Mass Index)"
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              error={Boolean(formState.errors.bmi)}
                              helperText={formState.errors.bmi?.message || 'Your Body Mass Index (optional)'}
                              inputProps={{ min: 10, max: 50, step: 0.1 }}
                              placeholder="e.g., 22.5"
                            />
                          )}
                        />
                        <FormControl fullWidth>
                          <InputLabel id="exercise-frequency-label">Exercise frequency</InputLabel>
                          <Controller
                            name="exerciseFrequency"
                            control={control}
                            render={({ field }) => (
                              <Select
                                labelId="exercise-frequency-label"
                                label="Exercise frequency"
                                value={field.value || ''}
                                onChange={field.onChange}
                              >
                                <MenuItem value="">Not specified</MenuItem>
                                <MenuItem value="NONE">No regular exercise</MenuItem>
                                <MenuItem value="LIGHT">Light (1-2 times per week)</MenuItem>
                                <MenuItem value="MODERATE">Moderate (3-4 times per week)</MenuItem>
                                <MenuItem value="ACTIVE">Active (5+ times per week)</MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                      </>
                    )}
                    {selectedProduct.type === 'MOTOR' && (
                      <>
                <Controller
                  name="vehicleValue"
                  control={control}
                  render={({ field }) => (
                    <TextField
                              label="Vehicle value ($)"
                      type="number"
                              value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={Boolean(formState.errors.vehicleValue)}
                              helperText={formState.errors.vehicleValue?.message || 'Enter the value of your vehicle'}
                              required
                              inputProps={{ min: 0, step: 100 }}
                            />
                          )}
                        />
                        <Controller
                          name="drivingExperience"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Years of driving experience"
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              error={Boolean(formState.errors.drivingExperience)}
                              helperText={formState.errors.drivingExperience?.message || 'How many years have you been driving?'}
                              inputProps={{ min: 0, max: 80 }}
                              placeholder="e.g., 5"
                    />
                  )}
                />
                        <Controller
                          name="accidentHistory"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Accident history"
                              value={field.value || ''}
                              onChange={field.onChange}
                              error={Boolean(formState.errors.accidentHistory)}
                              helperText={formState.errors.accidentHistory?.message || 'Any accidents in the last 5 years? (leave blank if none)'}
                              multiline
                              rows={2}
                              placeholder="e.g., 1 minor accident in 2022"
                            />
                          )}
                        />
                        <FormControl fullWidth>
                          <InputLabel id="vehicle-usage-label">Vehicle usage</InputLabel>
                          <Controller
                            name="vehicleUsage"
                            control={control}
                            render={({ field }) => (
                              <Select
                                labelId="vehicle-usage-label"
                                label="Vehicle usage"
                                value={field.value || ''}
                                onChange={field.onChange}
                              >
                                <MenuItem value="">Not specified</MenuItem>
                                <MenuItem value="DAILY_COMMUTE">Daily commute</MenuItem>
                                <MenuItem value="BUSINESS">Business use</MenuItem>
                                <MenuItem value="PLEASURE">Pleasure/personal use</MenuItem>
                                <MenuItem value="MIXED">Mixed (business and personal)</MenuItem>
                              </Select>
                            )}
                          />
                        </FormControl>
                        <Controller
                          name="annualMileage"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              label="Annual mileage"
                              type="number"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              error={Boolean(formState.errors.annualMileage)}
                              helperText={formState.errors.annualMileage?.message || 'Estimated miles driven per year'}
                              inputProps={{ min: 0, step: 1000 }}
                              placeholder="e.g., 12000"
                            />
                          )}
                        />
                        <FormControlLabel
                          control={
                            <Controller
                              name="smoker"
                              control={control}
                              render={({ field }) => (
                                <Checkbox 
                                  checked={field.value || false} 
                                  onChange={(e) => field.onChange(e.target.checked)} 
                                />
                              )}
                            />
                          }
                          label="Smoker"
                        />
                      </>
                    )}
                    {selectedProduct.type === 'TRAVEL' && (
                <Controller
                  name="tripDuration"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Trip duration (days)"
                      type="number"
                            value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      error={Boolean(formState.errors.tripDuration)}
                            helperText={formState.errors.tripDuration?.message || 'How many days will you be traveling?'}
                            required
                            inputProps={{ min: 1 }}
                    />
                  )}
                />
                    )}
                  </>
                )}
              </Stack>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                  Review Your Quote Request
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {isAuthenticated 
                    ? 'Please review all the information below. Click Submit to request your quote.'
                    : 'Please log in to submit a quote request.'}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0, 102, 204, 0.02)',
                  }}
                >
                  <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Product:</strong> {selectedProduct?.name || 'Not selected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Type:</strong> {selectedProduct?.type || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Base Premium:</strong> ${selectedProduct?.basePremium?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Age:</strong> {watch('age')}
                  </Typography>
                  {selectedProduct?.type === 'HEALTH' && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Smoker:</strong> {watch('smoker') ? 'Yes' : 'No'}
                      </Typography>
                      {watch('preExistingConditions') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Pre-existing Conditions:</strong> {watch('preExistingConditions')}
                        </Typography>
                      )}
                      {watch('familyHistory') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Family History:</strong> {watch('familyHistory')}
                        </Typography>
                      )}
                      {watch('currentMedications') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Current Medications:</strong> {watch('currentMedications')}
                        </Typography>
                      )}
                      {watch('bmi') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>BMI:</strong> {watch('bmi')}
                        </Typography>
                      )}
                      {watch('exerciseFrequency') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Exercise Frequency:</strong> {watch('exerciseFrequency')}
                        </Typography>
                      )}
                    </>
                  )}
                  {selectedProduct?.type === 'LIFE' && (
                    <>
                <Typography variant="body2" color="text.secondary">
                        <strong>Smoker:</strong> {watch('smoker') ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                        <strong>Drinker:</strong> {watch('drinker') ? 'Yes' : 'No'}
                      </Typography>
                      {watch('preExistingConditions') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Pre-existing Conditions:</strong> {watch('preExistingConditions')}
                        </Typography>
                      )}
                      {watch('familyHistory') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Family History:</strong> {watch('familyHistory')}
                        </Typography>
                      )}
                      {watch('occupation') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Occupation:</strong> {watch('occupation')}
                        </Typography>
                      )}
                      {watch('bmi') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>BMI:</strong> {watch('bmi')}
                        </Typography>
                      )}
                      {watch('exerciseFrequency') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Exercise Frequency:</strong> {watch('exerciseFrequency')}
                        </Typography>
                      )}
                    </>
                  )}
                  {selectedProduct?.type === 'MOTOR' && (
                    <>
                      {watch('vehicleValue') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Vehicle Value:</strong> ${watch('vehicleValue')?.toLocaleString()}
                        </Typography>
                      )}
                      {watch('drivingExperience') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Driving Experience:</strong> {watch('drivingExperience')} years
                        </Typography>
                      )}
                      {watch('accidentHistory') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Accident History:</strong> {watch('accidentHistory')}
                        </Typography>
                      )}
                      {watch('vehicleUsage') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Vehicle Usage:</strong> {watch('vehicleUsage')}
                        </Typography>
                      )}
                      {watch('annualMileage') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Annual Mileage:</strong> {watch('annualMileage')?.toLocaleString()} miles
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        <strong>Smoker:</strong> {watch('smoker') ? 'Yes' : 'No'}
                      </Typography>
                    </>
                  )}
                  {selectedProduct?.type === 'TRAVEL' && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Smoker:</strong> {watch('smoker') ? 'Yes' : 'No'}
                      </Typography>
                      {watch('tripDuration') && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Trip Duration:</strong> {watch('tripDuration')} days
                </Typography>
                      )}
                    </>
                  )}
                  </Stack>
                </Paper>
              </Box>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button 
                onClick={back} 
                disabled={activeStep === 0} 
                variant="outlined"
                sx={{ borderRadius: 0, textTransform: 'none', minWidth: 100 }}
              >
                Back
              </Button>
              {activeStep < steps.length - 1 && (
                <Button 
                  onClick={next}
                  variant="contained"
                  sx={{ borderRadius: 0, textTransform: 'none', minWidth: 100 }}
                >
                  Next
                </Button>
              )}
              {activeStep === steps.length - 1 && (
                <Button 
                  onClick={handleSubmit(onSubmit)} 
                  disabled={submitQuoteMutation.isPending || !isAuthenticated}
                  variant="contained"
                  sx={{ borderRadius: 0, textTransform: 'none', minWidth: 150 }}
                >
                  {submitQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote'}
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
              borderRadius: 0,
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
            )}
        </Box>
      </Paper>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast('')}>
        <Alert severity="info">{toast}</Alert>
      </Snackbar>
    </Stack>
  );
}
