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
      claimedAmount: claim.amount,
      eligibleAmount: claim.eligibleAmount || null,
      deductible: claim.deductible || null,
      approvedAmount: claim.approvedAmount || null,
      rejectedAmount:
        claim.status === "REJECTED"
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
    // List all quotes that the authenticated customer has requested/bought
    // Only shows quotes belonging to the authenticated customer
    const where = {
      userId: req.user.id,
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
    const quotesWithCoverage = quotes.map((quote) => {
      const quoteData = { ...quote };
      
      // If quote has a policy, determine coverage based on premium and product type
      if (quote.policy && quote.product) {
        const plan = determinePlan(quote.product.type, quote.policy.premium);
        
        quoteData.policy = {
          ...quote.policy,
          premiumPaid: quote.policy.premiumPaid, // Explicitly include payment status
          paymentStatus: quote.policy.premiumPaid ? 'PAID' : 'PENDING', // Human-readable status
        };
        
        if (plan) {
          quoteData.policy.coverage = {
            plan: plan.name,
            limits: plan.limits,
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

// POST endpoint to request/create new quotes for customers
router.post(
  "/quotes/request",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // Accept productName and either metadata object or flat form fields
    const { productName, userId, metadata: metadataObj, ...flatFormData } = req.body;
    
    // Validate that productName is provided
    if (!productName || productName.trim() === "") {
      throw new ValidationError("Product name is required", [
        { field: "productName", message: "Product name is required" }
      ]);
    }
    
    // Use metadata object if provided, otherwise use flat form data
    const formData = metadataObj || flatFormData;

    // Use userId from request body if provided, otherwise use authenticated user's ID
    const quoteUserId = userId ? validateNumber(userId, "User ID") : req.user.id;

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

    // Find product by name (case-insensitive)
    const product = await prisma.product.findFirst({
      where: { 
        name: {
          equals: productName.trim(),
          mode: 'insensitive' // Case-insensitive search
        }
      },
    });
    
    if (!product) {
      throw new NotFoundError(`Product not found. Please provide a valid product name.`);
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
    // Use the formData we extracted earlier (already excludes productName, userId, metadata)
    // Add calculated age to metadata (override if age was provided in request body)
    const metadata = {
      ...formData,
      age: calculatedAge // Always use calculated age from profile
    };

    // Calculate premium based on product and metadata
    const premium = calculatePremium(product.basePremium, metadata);

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

    res.status(201).json({
      success: true,
      data: quote,
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

    // Response with coverage information
    const response = {
      success: true,
      data: claim,
      message: "Claim submitted successfully",
    };

    // Include coverage limit information in response
    if (plan && coverageLimit !== null) {
      response.coverageInfo = {
        plan: planName,
        premium: policy.premium,
        coverageLimit: coverageLimit,
        claimAmount: claim.amount,
        remainingCoverage: coverageLimit - claim.amount,
      };
    } else if (plan && coverageLimit === null) {
      response.coverageInfo = {
        plan: planName,
        premium: policy.premium,
        coverageLimit: "Unlimited",
        claimAmount: claim.amount,
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

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  })
);

module.exports = router;
