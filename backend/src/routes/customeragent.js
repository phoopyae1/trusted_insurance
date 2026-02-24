const express = require("express");
const prisma = require("../prisma");
const {
  authenticate,
  authorize,
  requireCustomer,
} = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { NotFoundError, ValidationError } = require("../utils/errors");
const { validateRequired, validateNumber } = require("../utils/validation");
const { calculatePremium } = require("../services/premiumService");
const { logAudit } = require("../services/auditLogService");
const { validateClaim, determinePlan, getCoverageLimit } = require("../services/claimValidationService");
const { recordAtenxionTransaction } = require("../services/atenxionTransactionService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Helper function to get detailed status information for a claim
function getClaimStatusInfo(claim) {
  const status = claim.status;
  const statusMessages = {
    SUBMITTED: {
      label: "Submitted",
      message: "Your claim has been submitted and is awaiting review",
      color: "info",
      nextStep: "Our claims team will review your claim within 24-48 hours",
    },
    IN_REVIEW: {
      label: "In Review",
      message: "Your claim is currently being reviewed by our claims team",
      color: "warning",
      nextStep: "We are verifying the details and documentation. You will be notified once the review is complete",
    },
    APPROVED: {
      label: "Approved",
      message: claim.approvedAmount
        ? `Your claim has been approved for $${claim.approvedAmount.toLocaleString()}`
        : "Your claim has been approved",
      color: "success",
      nextStep: claim.paidAt
        ? "Payment has been processed"
        : "Payment will be processed within 5-7 business days",
    },
    PARTIALLY_APPROVED: {
      label: "Partially Approved",
      message: claim.approvedAmount
        ? `Your claim has been partially approved for $${claim.approvedAmount.toLocaleString()} out of $${claim.amount.toLocaleString()}`
        : "Your claim has been partially approved",
      color: "warning",
      nextStep: claim.decisionReason
        ? `Reason: ${claim.decisionReason}`
        : "Please contact us for more details about the partial approval",
    },
    REJECTED: {
      label: "Rejected",
      message: "Your claim has been rejected",
      color: "error",
      nextStep: claim.decisionReason
        ? `Reason: ${claim.decisionReason}. You can contact us to appeal this decision`
        : "Please contact us for more information about the rejection",
    },
    PAID: {
      label: "Paid",
      message: claim.approvedAmount
        ? `Your claim has been paid. Amount: $${claim.approvedAmount.toLocaleString()}`
        : "Your claim has been paid",
      color: "success",
      nextStep: claim.paidAt
        ? `Payment was processed on ${new Date(claim.paidAt).toLocaleDateString()}`
        : "Payment has been processed",
    },
  };

  const baseStatusInfo = statusMessages[status] || {
    label: status,
    message: `Claim status: ${status}`,
    color: "default",
    nextStep: "Please contact us for more information",
  };

  return {
    ...baseStatusInfo,
    status: status,
    submittedAt: claim.createdAt,
    assessedAt: claim.assessedAt || null,
    paidAt: claim.paidAt || null,
    assessedBy: claim.assessedByUser
      ? {
          name: claim.assessedByUser.name,
          email: claim.assessedByUser.email,
        }
      : null,
    amountDetails: {
      claimedAmount: `$${claim.amount.toFixed(2)}`,
      claimedAmountNumeric: claim.amount,
      eligibleAmount: claim.eligibleAmount ? `$${claim.eligibleAmount.toFixed(2)}` : null,
      eligibleAmountNumeric: claim.eligibleAmount || null,
      deductible: claim.deductible ? `$${claim.deductible.toFixed(2)}` : null,
      deductibleNumeric: claim.deductible || null,
      approvedAmount: claim.approvedAmount ? `$${claim.approvedAmount.toFixed(2)}` : null,
      approvedAmountNumeric: claim.approvedAmount || null,
      rejectedAmount: claim.status === "REJECTED"
          ? `$${claim.amount.toFixed(2)}`
          : claim.status === "PARTIALLY_APPROVED" && claim.approvedAmount
          ? `$${(claim.amount - claim.approvedAmount).toFixed(2)}`
          : null,
      rejectedAmountNumeric: claim.status === "REJECTED"
          ? claim.amount
          : claim.status === "PARTIALLY_APPROVED" && claim.approvedAmount
          ? claim.amount - claim.approvedAmount
          : null,
    },
    decisionReason: claim.decisionReason || null,
  };
}

// POST endpoint to list quotes for customers
router.post(
  "/quotes",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // Use userId from request body if provided, otherwise use authenticated user's ID
    const authenticatedUserId = req.user.id;
    const quoteUserId = req.body.userId ? validateNumber(req.body.userId, "User ID") : authenticatedUserId;

    // If userId is provided, it must match the authenticated user
    if (req.body.userId) {
      if (quoteUserId !== authenticatedUserId) {
        const { ForbiddenError } = require("../utils/errors");
        throw new ForbiddenError("You are not allowed to view quotes for another user");
      }
    }

    // List all quotes that the authenticated customer has requested/bought
    // Only shows quotes belonging to the authenticated customer
    const where = {
      userId: quoteUserId,
    };

    // Optional filters from request body
    if (req.body.status) {
      where.status = req.body.status;
    }

    if (req.body.productId) {
      where.productId = Number(req.body.productId);
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        policy: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add coverage information and payment status for quotes with policies
    // Also extract plan information from metadata or product name
    const quotesWithCoverage = quotes.map((quote) => {
      const quoteData = { 
        ...quote,
        premium: `$${quote.premium.toFixed(2)}`,
        premiumNumeric: quote.premium, // Keep numeric value for calculations
      };
      
      // Extract plan information from metadata (planName, paymentFrequency, totalAmount)
      const planName = quote.metadata?.planName;
      const paymentFrequency = quote.metadata?.paymentFrequency;
      const totalAmount = quote.metadata?.totalAmount;
      
      // If planName is not in metadata, try to extract from product name
      // Product names are now in format "Product Name - Plan" (e.g., "Health Shield - Basic")
      let extractedPlanName = planName;
      if (!extractedPlanName && quote.product) {
        const productNameParts = quote.product.name.split(' - ');
        if (productNameParts.length === 2) {
          extractedPlanName = productNameParts[1]; // Extract "Basic", "Standard", etc.
        }
      }
      
      // Add plan information to quote data
      if (extractedPlanName || paymentFrequency || totalAmount) {
        const planTotalAmount = totalAmount || quote.premium;
        quoteData.planInfo = {
          planName: extractedPlanName || null,
          paymentFrequency: paymentFrequency || null,
          totalAmount: `$${planTotalAmount.toFixed(2)}`,
          totalAmountNumeric: planTotalAmount, // Keep numeric value for calculations
        };
      }
      
      // If quote has a policy, determine coverage based on premium and product type
      if (quote.policy && quote.product) {
        // Use the policy premium to determine plan
        const plan = determinePlan(quote.product.type, quote.policy.premium);
        
        quoteData.policy = {
          ...quote.policy,
          premium: `$${quote.policy.premium.toFixed(2)}`,
          premiumNumeric: quote.policy.premium, // Keep numeric value for calculations
          premiumPaid: quote.policy.premiumPaid, // Explicitly include payment status
          paymentStatus: quote.policy.premiumPaid ? 'PAID' : 'PENDING', // Human-readable status
        };
        
        if (plan) {
          quoteData.policy.coverage = {
            plan: plan.name,
            limits: plan.limits,
          };
        }
        
        // Also include plan name from product if available
        if (extractedPlanName) {
          quoteData.policy.coverage = {
            ...quoteData.policy.coverage,
            planName: extractedPlanName,
          };
        }
      }
      
      return quoteData;
    });

    res.json({
      success: true,
      data: quotesWithCoverage,
      count: quotesWithCoverage.length,
    });
  })
);

// POST endpoint to list all policies for the authenticated customer
router.post(
  "/policies",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // Use userId from request body if provided, otherwise use authenticated user's ID
    const authenticatedUserId = req.user.id;
    const policyUserId = req.body.userId ? validateNumber(req.body.userId, "User ID") : authenticatedUserId;

    // If userId is provided, it must match the authenticated user
    if (req.body.userId) {
      if (policyUserId !== authenticatedUserId) {
        const { ForbiddenError } = require("../utils/errors");
        throw new ForbiddenError("You are not allowed to view policies for another user");
      }
    }

    // List all policies that belong to the customer
    const where = {
      userId: policyUserId,
    };

    // Optional filters from request body
    if (req.body.status) {
      where.status = req.body.status;
    }

    if (req.body.productId) {
      where.productId = Number(req.body.productId);
    }

    if (req.body.productType) {
      // Filter by product type - need to join with product table
      where.product = {
        type: req.body.productType,
      };
    }

    const policies = await prisma.policy.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            basePremium: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quote: {
          select: {
            id: true,
            metadata: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format policies with additional information
    const formattedPolicies = policies.map((policy) => {
      // Extract plan name from product name or quote metadata
      let planName = null;
      if (policy.product) {
        const productNameParts = policy.product.name.split(' - ');
        if (productNameParts.length === 2) {
          planName = productNameParts[1]; // Extract "Basic", "Standard", etc.
        }
      }
      
      // Also check quote metadata for plan name
      if (!planName && policy.quote?.metadata?.planName) {
        planName = policy.quote.metadata.planName;
      }

      // Format coverage period
      const startDate = policy.startDate ? new Date(policy.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : null;
      
      const endDate = policy.endDate ? new Date(policy.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : null;

      const coveragePeriod = startDate && endDate ? `${startDate} - ${endDate}` : null;

      // Determine payment status
      const paymentStatus = policy.premiumPaid ? 'Paid' : 'Pending';

      return {
        id: policy.id,
        policyNumber: policy.policyNumber,
        product: {
          id: policy.product?.id,
          name: policy.product?.name,
          type: policy.product?.type,
          description: policy.product?.description,
        },
        premium: `$${policy.premium.toFixed(2)}`,
        premiumNumeric: policy.premium, // Keep numeric value for calculations
        startDate: policy.startDate,
        endDate: policy.endDate,
        coveragePeriod: coveragePeriod,
        status: policy.status,
        premiumPaid: policy.premiumPaid,
        paymentStatus: paymentStatus,
        planName: planName,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt,
      };
    });

    res.json({
      success: true,
      data: formattedPolicies,
      count: formattedPolicies.length,
    });
  })
);

// POST endpoint to request/create new quotes for customers
router.post(
  "/quotes/request",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // Accept productName, planName, paymentFrequency, userId (optional), and either metadata object or flat form fields
    const { productName, planName, paymentFrequency, userId, metadata: metadataObj, ...flatFormData } = req.body;
    
    // Validate that productName is provided
    if (!productName || productName.trim() === "") {
      throw new ValidationError("Product name is required", [
        { field: "productName", message: "Product name is required" }
      ]);
    }
    
    // Validate that planName is provided
    if (!planName || planName.trim() === "") {
      throw new ValidationError("Plan name is required", [
        { field: "planName", message: "Plan name is required (e.g., Basic, Standard, Premium, Ultra Premium)" }
      ]);
    }
    
    // Validate that paymentFrequency is provided
    if (!paymentFrequency || !['MONTHLY', 'YEARLY'].includes(paymentFrequency.toUpperCase())) {
      throw new ValidationError("Payment frequency is required", [
        { field: "paymentFrequency", message: "Payment frequency is required and must be either 'MONTHLY' or 'YEARLY'" }
      ]);
    }
    
    // Normalize payment frequency to uppercase
    const normalizedPaymentFrequency = paymentFrequency.toUpperCase();
    
    // Use metadata object if provided, otherwise use flat form data
    const formData = metadataObj || flatFormData;

    // Validate and use userId from request body if provided, otherwise use authenticated user's ID
    let quoteUserId = req.user.id; // Default to authenticated user
    if (userId !== undefined && userId !== null) {
      quoteUserId = validateNumber(userId, "User ID");
    }

    // Fetch customer profile to get dateOfBirth for age calculation
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: quoteUserId },
      select: { dateOfBirth: true }
    });

    // Calculate age from dateOfBirth
    let calculatedAge = null;
    if (customerProfile?.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(customerProfile.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      calculatedAge = age;
    }

    // Construct full product name with plan (e.g., "Health Shield - Basic")
    const fullProductName = `${productName.trim()} - ${planName.trim()}`;
    
    // Find product by full name with plan
    let product = await prisma.product.findFirst({
      where: { 
        name: {
          equals: fullProductName,
          mode: 'insensitive' // Case-insensitive search
        }
      },
    });
    
    if (!product) {
      // If not found with plan, try to find by product name only (for backward compatibility)
      const productWithoutPlan = await prisma.product.findFirst({
        where: { 
          name: {
            equals: productName.trim(),
            mode: 'insensitive' // Case-insensitive search
          }
        },
      });
      
      if (!productWithoutPlan) {
        throw new NotFoundError(`Product "${productName}" with plan "${planName}" not found. Please provide a valid product name and plan.`);
      }
      
      // Plan premium mapping for common products (fallback for old products without plan suffix)
      const planPremiumMap = {
        'Health Shield': { Basic: 1200, Standard: 2400, Premium: 3600, 'Ultra Premium': 6000 },
        'Motor Protect': { Basic: 800, Standard: 1500, Premium: 2500, 'Ultra Premium': 4000 },
        'Life Secure': { Basic: 1500, Standard: 3000, Premium: 5000, 'Ultra Premium': 10000 },
        'Travel Guard': { Basic: 50, Standard: 100, Premium: 200, 'Ultra Premium': 400 },
        'Fire Shield': { Basic: 600, Standard: 1200, Premium: 2000, 'Ultra Premium': 3500 },
        'Property Guard': { Basic: 800, Standard: 1500, Premium: 2800, 'Ultra Premium': 5000 },
        'Home Secure': { Basic: 700, Standard: 1400, Premium: 2500, 'Ultra Premium': 4500 },
        'Business Protect': { Basic: 1500, Standard: 3000, Premium: 6000, 'Ultra Premium': 12000 },
        'Liability Shield': { Basic: 1000, Standard: 2000, Premium: 4000, 'Ultra Premium': 8000 },
      };
      
      const productKey = productName.trim();
      const planKey = planName.trim();
      
      // If we have a premium mapping for this product and plan, use it
      if (planPremiumMap[productKey] && planPremiumMap[productKey][planKey]) {
        // Override basePremium with the correct plan premium
        product = {
          ...productWithoutPlan,
          basePremium: planPremiumMap[productKey][planKey],
          name: `${productKey} - ${planKey}` // Update name to include plan
        };
        console.warn(`Using plan premium mapping for "${productKey}" plan "${planKey}": $${product.basePremium}`);
      } else {
        // If no mapping exists, reject the request
        throw new NotFoundError(`Product "${productName}" with plan "${planName}" not found. Found product "${productWithoutPlan.name}" without plan suffix. Please use the full product name with plan (e.g., "Health Shield - Basic") or ensure products are seeded with plan suffixes.`);
      }
    } else {
      // Verify plan matches if product name includes plan
      const productNameParts = product.name.split(' - ');
      if (productNameParts.length === 2) {
        const productPlanName = productNameParts[1].trim();
        if (productPlanName.toLowerCase() !== planName.trim().toLowerCase()) {
          throw new ValidationError("Plan mismatch", [
            { field: "planName", message: `Selected plan "${planName}" does not match product plan "${productPlanName}"` }
          ]);
        }
      }
    }

    // Validate required fields based on product type
    const validationErrors = [];

    // Age validation - must be calculated from customer profile
    if (!calculatedAge) {
      validationErrors.push({
        field: "dateOfBirth",
        message: "Date of birth is required in your profile to request a quote. Please update your profile with your date of birth."
      });
    } else if (calculatedAge < 18 || calculatedAge > 100) {
      validationErrors.push({
        field: "age",
        message: `Your age (${calculatedAge}) must be between 18 and 100 to request a quote`
      });
    }

    // Product-specific required fields
    if (product.type === "MOTOR") {
      // Motor insurance requires vehicleValue
      if (!formData.vehicleValue || Number(formData.vehicleValue) <= 0) {
        validationErrors.push({
          field: "vehicleValue",
          message: "Vehicle value is required for motor insurance and must be greater than 0"
        });
      }
    } else if (product.type === "LIFE") {
      // Life insurance requires health-related fields
      if (!formData.preExistingConditions || formData.preExistingConditions.trim() === "") {
        validationErrors.push({
          field: "preExistingConditions",
          message: "Pre-existing medical conditions are required for life insurance (enter 'None' if applicable)"
        });
      }
      if (!formData.familyHistory || formData.familyHistory.trim() === "") {
        validationErrors.push({
          field: "familyHistory",
          message: "Family medical history is required for life insurance (enter 'None' if applicable)"
        });
      }
    } else if (product.type === "HEALTH") {
      // Health insurance - health fields are optional but recommended
      // Only age is required
      // Smoker and drinker are optional but will affect premium calculation
    } else if (product.type === "TRAVEL") {
      if (!formData.destination || formData.destination.trim() === "") {
        validationErrors.push({
          field: "destination",
          message: "Destination is required for travel insurance"
        });
      }
      if (!formData.tripDuration || Number(formData.tripDuration) <= 0) {
        validationErrors.push({
          field: "tripDuration",
          message: "Trip duration is required for travel insurance and must be greater than 0 days"
        });
      }
    } else if (product.type === "FIRE" || product.type === "PROPERTY" || product.type === "HOME") {
      // Fire, Property, and Home insurance require propertyValue
      if (!formData.propertyValue || Number(formData.propertyValue) <= 0) {
        validationErrors.push({
          field: "propertyValue",
          message: `Property value is required for ${product.type.toLowerCase()} insurance and must be greater than 0`
        });
      }
    } else if (product.type === "BUSINESS") {
      // Business insurance requires business information
      if (!formData.businessRevenue || Number(formData.businessRevenue) <= 0) {
        validationErrors.push({
          field: "businessRevenue",
          message: "Business annual revenue is required for business insurance and must be greater than 0"
        });
      }
      if (!formData.employeeCount || Number(formData.employeeCount) < 0) {
        validationErrors.push({
          field: "employeeCount",
          message: "Number of employees is required for business insurance"
        });
      }
    } else if (product.type === "LIABILITY") {
      // Liability insurance requires business type and revenue
      if (!formData.businessType || formData.businessType.trim() === "") {
        validationErrors.push({
          field: "businessType",
          message: "Business type is required for liability insurance"
        });
      }
      if (!formData.businessRevenue || Number(formData.businessRevenue) <= 0) {
        validationErrors.push({
          field: "businessRevenue",
          message: "Business annual revenue is required for liability insurance and must be greater than 0"
        });
      }
    }

    // Throw validation errors if any
    if (validationErrors.length > 0) {
      throw new ValidationError("Validation failed", validationErrors);
    }

    // Build metadata object from form fields
    // Use the formData we extracted earlier (already excludes productName, planName, paymentFrequency, userId, metadata)
    // Add calculated age, planName, and paymentFrequency to metadata
    const metadata = {
      ...formData,
      age: calculatedAge, // Always use calculated age from profile
      planName: planName.trim(), // Store selected plan name
      paymentFrequency: normalizedPaymentFrequency, // Store payment frequency (MONTHLY or YEARLY)
    };

    // Calculate pricing based on plan and payment frequency
    // Use product.basePremium as the yearly premium for the selected plan
    const yearlyPremium = product.basePremium; // Yearly premium if paid once (e.g., $1200)
    const monthlyPremium = (yearlyPremium / 12) + 10; // Monthly premium: (yearly / 12) + $10 extra per month (e.g., $110)
    const totalYearlyIfMonthly = monthlyPremium * 12; // Total cost if paying monthly for a year (e.g., $1320)
    
    // Determine the total amount based on selected payment frequency
    let totalAmount;
    if (normalizedPaymentFrequency === 'MONTHLY') {
      // Monthly payment: (yearly premium / 12) + $10 per month
      totalAmount = monthlyPremium;
    } else {
      // Yearly payment: full yearly premium (one-time payment)
      totalAmount = yearlyPremium;
    }
    
    // Add pricing information to metadata
    metadata.totalAmount = totalAmount;
    metadata.yearlyPremium = yearlyPremium;
    metadata.monthlyPremium = monthlyPremium;
    metadata.totalYearlyIfMonthly = totalYearlyIfMonthly;

    // Use totalAmount as the premium (based on selected payment frequency)
    const premium = totalAmount;

    // Create quote with PENDING status (customers can't set status)
    // Store all form fields as metadata
    const quote = await prisma.quote.create({
      data: {
        productId: product.id,
        userId: quoteUserId,
        metadata: metadata, // Store all form fields (age, smoker, vehicleValue, etc.)
        premium,
        status: "PENDING", // Always PENDING for customer requests
        version: 1,
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log audit event
    await logAudit({
      actorId: req.user.id,
      action: "QUOTE_CREATED",
      entityType: "Quote",
      entityId: quote.id,
      metadata: {
        productId: product.id,
        productName: product.name,
        premium: quote.premium,
        status: quote.status,
      },
    });

    // Calculate savings (always the difference between monthly yearly total and yearly premium)
    const savingsAmount = totalYearlyIfMonthly - yearlyPremium;
    
    // Prepare response with pricing breakdown (all currency values formatted with $)
    const responseData = {
      ...quote,
      pricing: {
        yearlyPremium: `$${yearlyPremium.toFixed(2)}`,
        monthlyPremium: `$${monthlyPremium.toFixed(2)}`,
        totalYearlyIfMonthly: `$${totalYearlyIfMonthly.toFixed(2)}`,
        selectedFrequency: normalizedPaymentFrequency,
        totalAmount: `$${totalAmount.toFixed(2)}`,
        savings: `$${savingsAmount.toFixed(2)}`,
        description: normalizedPaymentFrequency === 'MONTHLY' 
          ? `$${monthlyPremium.toFixed(2)} per month (Total: $${totalYearlyIfMonthly.toFixed(2)} per year. Save $${savingsAmount.toFixed(2)} by paying yearly: $${yearlyPremium.toFixed(2)})`
          : `$${yearlyPremium.toFixed(2)} per year (one-time payment). Monthly option: $${monthlyPremium.toFixed(2)}/month (Total: $${totalYearlyIfMonthly.toFixed(2)} per year)`,
        // Also include numeric values for calculations if needed
        yearlyPremiumNumeric: yearlyPremium,
        monthlyPremiumNumeric: monthlyPremium,
        totalYearlyIfMonthlyNumeric: totalYearlyIfMonthly,
        totalAmountNumeric: totalAmount,
        savingsNumeric: savingsAmount
      }
    };

    res.status(201).json({
      success: true,
      data: responseData,
      message: "Quote request submitted successfully",
    });
  })
);

// List claims for the authenticated customer
router.post(
  "/claims",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // STRICT FILTERING: Only show claims for the authenticated customer
    const authenticatedUserId = req.user.id;

    // Extra safety: ensure userId is present
    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Authentication failed. User ID not found in token.",
          code: "AUTHENTICATION_FAILED",
        },
      });
    }

    // Use userId from request body if provided, otherwise use authenticated user's ID
    const claimUserId = req.body.userId ? validateNumber(req.body.userId, "User ID") : authenticatedUserId;

    // If userId is provided, it must match the authenticated user
    if (req.body.userId) {
      if (claimUserId !== authenticatedUserId) {
        const { ForbiddenError } = require("../utils/errors");
        throw new ForbiddenError("You are not allowed to view claims for another user");
      }
    }

    // Get all policy IDs that belong to this customer
    const customerPolicies = await prisma.policy.findMany({
      where: { userId: claimUserId },
      select: { id: true },
    });

    const customerPolicyIds = customerPolicies.map((p) => p.id);

    // If customer has no policies, return empty array
    if (customerPolicyIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // Base filter: only this user's claims for their policies
    const where = {
      userId: claimUserId,
      policyId: { in: customerPolicyIds },
    };

    // Optional filters from request body
    if (req.body.status) {
      where.status = req.body.status; // e.g. "APPROVED"
    }

    if (req.body.claimType) {
      where.claimType = req.body.claimType; // e.g. "HEALTH"
    }

    if (req.body.policyId) {
      const policyId = Number(req.body.policyId);

      // Ensure the policyId belongs to this customer
      if (!customerPolicyIds.includes(policyId)) {
        return res.status(403).json({
          success: false,
          error: {
            message: "Policy not found or does not belong to you",
            code: "FORBIDDEN",
          },
        });
      }

      where.policyId = policyId;
    }

    // Query claims
    const claims = await prisma.claim.findMany({
      where,
      include: {
        policy: { include: { product: true } },
        user: {
          select: { id: true, name: true, email: true },
        },
        assessedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Final defense-in-depth check
    const filteredClaims = claims.filter(
      (claim) =>
        claim.userId === claimUserId &&
        customerPolicyIds.includes(claim.policyId)
    );

    // Enhance claims with detailed status information
    const enhancedClaims = filteredClaims.map((claim) => {
      const statusInfo = getClaimStatusInfo(claim);
      return {
        ...claim,
        statusInfo: statusInfo,
      };
    });

    res.json({
      success: true,
      data: enhancedClaims,
      count: enhancedClaims.length,
    });
  })
);
// POST endpoint to submit/create new claims for customers
router.post(
  "/claims/submit",
  authenticate,
  requireCustomer,
  upload.array("attachments"),
  asyncHandler(async (req, res) => {
    // Required fields in body
    validateRequired(req.body, ["policyNumber", "claimType", "amount", "incidentDate", "description"]);
    const { policyNumber, userId, claimType, amount, incidentDate, description } = req.body;

    // Normalize claimType to uppercase (e.g. "motor" -> "MOTOR")
    const normalizedClaimType = claimType.toUpperCase();

    // Use userId from body if provided, otherwise use authenticated user's ID
    const claimUserId = userId ? validateNumber(userId, "User ID") : req.user.id;

    // If userId is provided, it must match the authenticated user
    if (userId) {
      if (claimUserId !== req.user.id) {
        const { ForbiddenError } = require("../utils/errors");
        throw new ForbiddenError("You are not allowed to submit claims for another user");
      }
    }

    // Find policy by policyNumber and ensure it belongs to this customer
    const policy = await prisma.policy.findUnique({
      where: { policyNumber: policyNumber },
      include: { product: true },
    });

    if (!policy) {
      throw new NotFoundError(`Policy with number "${policyNumber}" not found`);
    }

    if (policy.userId !== claimUserId) {
      const { ForbiddenError } = require("../utils/errors");
      throw new ForbiddenError("You can only submit claims for policies that belong to you");
    }

    // Determine plan based on premium
    const plan = determinePlan(policy.product.type, policy.premium);
    let coverageLimit = null;
    let planName = null;
    
    if (plan) {
      planName = plan.name.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      coverageLimit = getCoverageLimit(plan, policy.product.type, normalizedClaimType);
    }

    // Business validation using validation service
    const errors = validateClaim(policy, policy.product, {
      claimType: normalizedClaimType,
      amount: validateNumber(amount, "Amount"),
      incidentDate,
      description,
    });

    if (errors.length > 0) {
      throw new ValidationError(
        "Claim validation failed",
        errors.map((err) => ({
          field: "claim",
          message: err,
        }))
      );
    }

    // Map file attachments (if any)
    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    // Create claim in database
    const claim = await prisma.claim.create({
      data: {
        policyId: policy.id,
        userId: claimUserId,
        claimType: normalizedClaimType,
        amount: Number(amount),
        incidentDate: new Date(incidentDate),
        description,
        attachments: attachments.length > 0 ? attachments : null,
        status: "SUBMITTED",
      },
      include: {
        policy: {
          include: { product: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit log
    await logAudit({
      actorId: req.user.id,
      action: "CLAIM_SUBMITTED",
      entityType: "Claim",
      entityId: claim.id,
      metadata: {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        amount: claim.amount,
        claimType: claim.claimType,
        userId: claimUserId,
      },
    });

    // Record Atenxion transaction (non-blocking)
    recordAtenxionTransaction(claimUserId, "CLAIM_SUBMITTED").catch((err) => {
      console.error("Failed to record Atenxion transaction for claim submission:", err);
    });

    // Format claim data with currency symbols
    const formattedClaim = {
      ...claim,
      amount: `$${claim.amount.toFixed(2)}`,
      amountNumeric: claim.amount,
      eligibleAmount: claim.eligibleAmount ? `$${claim.eligibleAmount.toFixed(2)}` : null,
      eligibleAmountNumeric: claim.eligibleAmount || null,
      deductible: claim.deductible ? `$${claim.deductible.toFixed(2)}` : null,
      deductibleNumeric: claim.deductible || null,
      approvedAmount: claim.approvedAmount ? `$${claim.approvedAmount.toFixed(2)}` : null,
      approvedAmountNumeric: claim.approvedAmount || null,
    };

    // Response with coverage information
    const response = {
      success: true,
      data: formattedClaim,
      message: "Claim submitted successfully",
    };

    // Include coverage limit information in response
    if (plan && coverageLimit !== null) {
      response.coverageInfo = {
        plan: planName,
        premium: `$${policy.premium.toFixed(2)}`,
        premiumNumeric: policy.premium,
        coverageLimit: `$${coverageLimit.toFixed(2)}`,
        coverageLimitNumeric: coverageLimit,
        claimAmount: `$${claim.amount.toFixed(2)}`,
        claimAmountNumeric: claim.amount,
        remainingCoverage: `$${(coverageLimit - claim.amount).toFixed(2)}`,
        remainingCoverageNumeric: coverageLimit - claim.amount,
      };
    } else if (plan && coverageLimit === null) {
      response.coverageInfo = {
        plan: planName,
        premium: `$${policy.premium.toFixed(2)}`,
        premiumNumeric: policy.premium,
        coverageLimit: "Unlimited",
        claimAmount: `$${claim.amount.toFixed(2)}`,
        claimAmountNumeric: claim.amount,
      };
    }

    res.status(201).json(response);
  })
);
// // GET/POST endpoint to get customer profile
// router.get(
//   "/profile",
//   authenticate,
//   requireCustomer,
//   asyncHandler(async (req, res) => {
//     const authenticatedUserId = req.user.id;

//     // Get customer profile, create if it doesn't exist
//     let profile = await prisma.customerProfile.findUnique({
//       where: {
//         userId: authenticatedUserId,
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//             createdAt: true,
//           },
//         },
//       },
//     });

//     // If profile doesn't exist, create an empty one
//     if (!profile) {
//       profile = await prisma.customerProfile.create({
//         data: {
//           userId: authenticatedUserId,
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               role: true,
//               createdAt: true,
//             },
//           },
//         },
//       });
//     }

//     res.json({
//       success: true,
//       data: profile,
//     });
//   })
// );

// POST endpoint to get customer profile (alternative method)
router.post(
  "/profile",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    const authenticatedUserId = req.user.id;

    // Use userId from request body if provided, otherwise use authenticated user's ID
    const profileUserId = req.body.userId ? validateNumber(req.body.userId, "User ID") : authenticatedUserId;

    // If userId is provided, it must match the authenticated user
    if (req.body.userId) {
      if (profileUserId !== authenticatedUserId) {
        const { ForbiddenError } = require("../utils/errors");
        throw new ForbiddenError("You are not allowed to view profiles for another user");
      }
    }

    // Get customer profile, create if it doesn't exist
    let profile = await prisma.customerProfile.findUnique({
      where: {
        userId: profileUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    // If profile doesn't exist, create an empty one
    if (!profile) {
      profile = await prisma.customerProfile.create({
        data: {
          userId: profileUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });
    }

    // Calculate age from dateOfBirth if available
    let age = null;
    if (profile.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(profile.dateOfBirth);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      age = calculatedAge;
    }

    // Prepare response with age included
    const responseData = {
      ...profile,
      age: age,
    };

    res.json({
      success: true,
      data: responseData,
    });
  })
);

// POST endpoint to get available products (e.g., Motor Protect, Health Shield, Life Secure)
router.post(
  "/products",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // Get all available products
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });

    // Transform products to match UI structure
    // Group products by base name and create packages array
    const productMap = new Map();
    
    // Phone number mapping based on product type
    const phoneNumberMap = {
      HEALTH: { base: '+65 6123 4567', increment: 1 },
      MOTOR: { base: '+65 6123 4600', increment: 1 },
      LIFE: { base: '+65 6123 4700', increment: 1 },
      TRAVEL: { base: '+65 6123 4800', increment: 1 },
      FIRE: { base: '+65 6123 4900', increment: 1 },
      PROPERTY: { base: '+65 6123 5000', increment: 1 },
      HOME: { base: '+65 6123 5100', increment: 1 },
      BUSINESS: { base: '+65 6123 5200', increment: 1 },
      LIABILITY: { base: '+65 6123 5300', increment: 1 },
    };

    // Icon mapping (for reference, UI handles icons)
    const productIcons = {
      HEALTH: 'LocalHospital',
      MOTOR: 'DirectionsCar',
      LIFE: 'Favorite',
      TRAVEL: 'FlightTakeoff',
      FIRE: 'LocalFireDepartment',
      PROPERTY: 'AccountBalance',
      HOME: 'Home',
      BUSINESS: 'Business',
      LIABILITY: 'Gavel',
    };

    // Description mapping
    const productDescriptions = {
      HEALTH: 'Comprehensive health coverage for you and your family',
      MOTOR: 'Complete vehicle protection with flexible coverage options',
      LIFE: 'Secure your family\'s future with comprehensive life coverage',
      TRAVEL: 'Travel with confidence and peace of mind',
      FIRE: 'Protect your property against fire damage and related perils',
      PROPERTY: 'Comprehensive protection for your commercial and residential properties',
      HOME: 'Complete protection for your home and personal belongings',
      BUSINESS: 'Comprehensive coverage for your business operations and assets',
      LIABILITY: 'Protect your business from third-party claims and legal liabilities',
    };

    // Process each product
    products.forEach((product) => {
      const nameParts = product.name.split(' - ');
      const baseName = nameParts[0];
      const planName = nameParts.length > 1 ? nameParts[1] : 'Basic';
      
      if (!productMap.has(baseName)) {
        productMap.set(baseName, {
          name: baseName,
          type: product.type,
          icon: productIcons[product.type] || 'Security',
          description: productDescriptions[product.type] || product.description,
          packages: [],
        });
      }

      const productGroup = productMap.get(baseName);
      
      // Extract benefits from coverageLimits
      const benefits = [];
      if (product.coverageLimits) {
        const limits = product.coverageLimits;
        
        if (product.type === 'HEALTH') {
          if (limits.inpatient) {
            if (limits.inpatient >= 999999999) {
              benefits.push('Unlimited inpatient coverage');
            } else {
              benefits.push(`Inpatient coverage up to $${limits.inpatient.toLocaleString()} per year`);
            }
          }
          if (limits.outpatient) {
            benefits.push('Outpatient consultation coverage');
          }
          if (limits.annualLimit) {
            benefits.push('Emergency room visits');
          }
          if (planName === 'Standard' || planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Comprehensive diagnostic tests');
          }
          if (planName === 'Basic' || planName === 'Standard' || planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Prescription medication coverage');
          }
          if (planName === 'Standard' || planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Dental care (basic)');
            benefits.push('Maternity coverage');
          }
          if (planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Dental care (comprehensive)');
            benefits.push('Mental health coverage');
            benefits.push('Alternative medicine coverage');
            benefits.push('Annual health checkup');
          }
          if (planName === 'Ultra Premium') {
            benefits.push('International coverage');
            benefits.push('Private room accommodation');
            benefits.push('VIP services');
            benefits.push('24/7 concierge service');
          }
        } else if (product.type === 'MOTOR') {
          if (limits.thirdPartyLiability) {
            benefits.push('Third-party liability coverage');
          }
          if (limits.fireTheft) {
            benefits.push('Fire and theft protection');
          }
          if (limits.roadsideAssistance) {
            benefits.push('Roadside assistance');
          }
          benefits.push('24/7 helpline');
          if (limits.comprehensive) {
            benefits.push('Comprehensive coverage');
            benefits.push('Accident coverage');
            benefits.push('Windscreen coverage');
          }
          if (limits.personalAccident) {
            benefits.push('Personal accident coverage');
            benefits.push('No-claim discount protection');
          }
          if (limits.rentalCar) {
            benefits.push('Rental car coverage');
          }
          if (planName === 'Ultra Premium') {
            benefits.push('Key replacement');
            benefits.push('Towing services');
            benefits.push('Concierge service');
          }
        } else if (product.type === 'LIFE') {
          if (limits.term) {
            if (limits.term >= 1000000) {
              benefits.push(`Death benefit: $${limits.term.toLocaleString()}+`);
            } else {
              benefits.push(`Death benefit: $${limits.term.toLocaleString()}`);
            }
          }
          benefits.push('Term coverage');
          if (limits.criticalIllness) {
            if (planName === 'Basic') {
              benefits.push('Basic critical illness coverage');
            } else {
              benefits.push('Critical illness coverage');
            }
          }
          if (planName === 'Standard' || planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Disability coverage');
          }
          if (planName === 'Premium' || planName === 'Ultra Premium') {
            benefits.push('Accidental death benefit');
            benefits.push('Waiver of premium');
          }
          if (planName === 'Ultra Premium') {
            benefits.push('Cash value accumulation');
            benefits.push('Estate planning benefits');
          }
        } else if (product.type === 'TRAVEL') {
          if (limits.medical) {
            benefits.push(`Medical emergency: $${limits.medical.toLocaleString()}`);
          }
          if (limits.tripCancellation) {
            benefits.push('Trip cancellation coverage');
          }
          if (limits.baggage) {
            benefits.push('Baggage loss coverage');
          }
          if (limits.flightDelay) {
            benefits.push('Flight delay coverage');
          }
          if (limits.tripInterruption) {
            benefits.push('Trip interruption coverage');
          }
          if (limits.adventureSports) {
            benefits.push('Adventure sports coverage');
            benefits.push('24/7 travel assistance');
          }
          if (limits.concierge) {
            benefits.push('Concierge services');
            benefits.push('Business travel coverage');
          }
        } else if (product.type === 'FIRE') {
          if (limits.building) {
            if (limits.building >= 999999999) {
              benefits.push('Unlimited fire damage coverage');
            } else {
              benefits.push(`Fire damage coverage up to $${limits.building.toLocaleString()}`);
            }
          }
          if (limits.smokeDamage) {
            benefits.push('Smoke damage protection');
          }
          if (limits.lightning) {
            benefits.push('Lightning strike coverage');
          }
          if (limits.explosion) {
            benefits.push('Explosion coverage');
          }
          benefits.push('24/7 emergency helpline');
          if (limits.temporaryAccommodation) {
            benefits.push('Water damage from firefighting');
            benefits.push('Temporary accommodation coverage');
          }
          if (limits.contentsReplacement) {
            benefits.push('Contents replacement coverage');
            benefits.push('Business interruption coverage');
          }
          if (limits.lossOfRent) {
            benefits.push('Loss of rent coverage');
            benefits.push('Debris removal coverage');
            benefits.push('Priority claims processing');
          }
        } else if (product.type === 'PROPERTY') {
          if (limits.building) {
            if (limits.building >= 999999999) {
              benefits.push('Unlimited property damage coverage');
            } else {
              benefits.push(`Property damage coverage up to $${limits.building.toLocaleString()}`);
            }
          }
          if (limits.theft) {
            benefits.push('Theft and burglary protection');
          }
          if (limits.vandalism) {
            benefits.push('Vandalism coverage');
          }
          if (limits.naturalDisaster) {
            benefits.push('Natural disaster coverage');
          }
          benefits.push('24/7 claims support');
          if (limits.liability) {
            benefits.push('Liability coverage');
          }
          if (limits.lossOfRent) {
            benefits.push('Loss of rent coverage');
          }
          if (limits.equipmentBreakdown) {
            benefits.push('Equipment breakdown coverage');
            if (planName === 'Premium' || planName === 'Ultra Premium') {
              benefits.push('Cyber liability coverage');
            }
          }
          if (limits.businessInterruption && planName === 'Ultra Premium') {
            benefits.push('Business interruption coverage');
            benefits.push('Concierge claims service');
            benefits.push('Priority processing');
          }
        } else if (product.type === 'HOME') {
          if (limits.dwelling) {
            if (limits.dwelling >= 999999999) {
              benefits.push('Unlimited home structure coverage');
            } else {
              benefits.push(`Home structure coverage up to $${limits.dwelling.toLocaleString()}`);
            }
          }
          if (limits.personalProperty) {
            benefits.push(`Personal belongings coverage up to $${limits.personalProperty.toLocaleString()}`);
          }
          if (limits.liability) {
            benefits.push(`Liability coverage up to $${limits.liability.toLocaleString()}`);
          }
          if (limits.theft) {
            benefits.push('Theft protection');
          }
          if (limits.naturalDisaster) {
            benefits.push('Natural disaster coverage');
          }
          if (limits.temporaryAccommodation) {
            benefits.push('Temporary accommodation coverage');
            benefits.push('Home assistance helpline');
          }
          if (limits.jewelry) {
            benefits.push('Jewelry and valuables coverage');
            benefits.push('Identity theft protection');
          }
          if (planName === 'Ultra Premium') {
            benefits.push('Home maintenance coverage');
            benefits.push('Concierge service');
            benefits.push('Priority claims processing');
          }
        } else if (product.type === 'BUSINESS') {
          if (limits.property) {
            if (limits.property >= 999999999) {
              benefits.push('Unlimited property coverage');
            } else {
              benefits.push(`Property coverage up to $${limits.property.toLocaleString()}`);
            }
          }
          if (limits.liability) {
            benefits.push(`Liability coverage up to $${limits.liability.toLocaleString()}`);
          }
          if (limits.businessInterruption) {
            benefits.push('Business interruption coverage');
          }
          if (limits.equipment) {
            benefits.push('Equipment breakdown coverage');
          }
          benefits.push('24/7 business support');
          if (limits.employeeLiability) {
            benefits.push('Employee liability coverage');
            benefits.push('Cyber liability coverage');
          }
          if (limits.professionalIndemnity) {
            benefits.push('Professional indemnity coverage');
            benefits.push('Directors and officers coverage');
          }
          if (limits.international) {
            benefits.push('International coverage');
            benefits.push('Concierge business services');
            benefits.push('Priority claims processing');
          }
        } else if (product.type === 'LIABILITY') {
          if (limits.generalLiability) {
            benefits.push(`General liability coverage up to $${limits.generalLiability.toLocaleString()}`);
          }
          benefits.push('Bodily injury protection');
          benefits.push('Property damage protection');
          benefits.push('Personal injury protection');
          if (limits.legalDefense) {
            benefits.push('Legal defense coverage');
          }
          if (limits.productLiability) {
            benefits.push('Product liability coverage');
          }
          if (limits.completedOperations) {
            benefits.push('Completed operations coverage');
          }
          if (limits.advertisingInjury) {
            benefits.push('Advertising injury coverage');
            benefits.push('Medical payments coverage');
          }
          if (limits.international) {
            benefits.push('International liability coverage');
            benefits.push('Crisis management coverage');
            benefits.push('Priority legal support');
          }
        }
      }

      // Get phone number based on plan index
      const planOrder = ['Basic', 'Standard', 'Premium', 'Ultra Premium'];
      const planIndex = planOrder.indexOf(planName);
      const phoneConfig = phoneNumberMap[product.type] || { base: '+65 6123 4000', increment: 1 };
      const basePhone = phoneConfig.base;
      const lastDigit = parseInt(basePhone.slice(-1));
      const phoneNumber = basePhone.slice(0, -1) + (lastDigit + planIndex);

      // Hospitals array (only for HEALTH type)
      const hospitals = [];
      if (product.type === 'HEALTH') {
        const hospitalLists = {
          Basic: [
            'Singapore General Hospital',
            'National University Hospital',
            'Tan Tock Seng Hospital',
          ],
          Standard: [
            'Singapore General Hospital',
            'National University Hospital',
            'Tan Tock Seng Hospital',
            'Mount Elizabeth Hospital',
            'Gleneagles Hospital',
          ],
          Premium: [
            'Singapore General Hospital',
            'National University Hospital',
            'Tan Tock Seng Hospital',
            'Mount Elizabeth Hospital',
            'Gleneagles Hospital',
            'Raffles Hospital',
            'Parkway East Hospital',
          ],
          'Ultra Premium': [
            'Singapore General Hospital',
            'National University Hospital',
            'Tan Tock Seng Hospital',
            'Mount Elizabeth Hospital',
            'Gleneagles Hospital',
            'Raffles Hospital',
            'Parkway East Hospital',
            'Mount Alvernia Hospital',
            'Farrer Park Hospital',
          ],
        };
        hospitals.push(...(hospitalLists[planName] || []));
      }

      productGroup.packages.push({
        name: planName,
        premium: `$${product.basePremium.toFixed(2)}`,
        premiumNumeric: product.basePremium, // Keep numeric value for calculations
        benefits,
        hospitals,
        phoneNumber,
        popular: planName === 'Premium',
      });
    });

    // Convert map to array and sort packages within each product
    const transformedProducts = Array.from(productMap.values()).map((product) => {
      // Sort packages: Basic, Standard, Premium, Ultra Premium
      const planOrder = ['Basic', 'Standard', 'Premium', 'Ultra Premium'];
      product.packages.sort((a, b) => {
        return planOrder.indexOf(a.name) - planOrder.indexOf(b.name);
      });
      return product;
    });

    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
    });
  })
);

module.exports = router;
