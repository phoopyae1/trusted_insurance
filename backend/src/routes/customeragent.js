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
const { validateClaim } = require("../services/claimValidationService");
const { recordAtenxionTransaction } = require("../services/atenxionTransactionService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

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

    res.json({
      success: true,
      data: quotes,
      count: quotes.length,
    });
  })
);

// POST endpoint to request/create new quotes for customers
router.post(
  "/quotes/request",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    validateRequired(req.body, ["productName"]);
    const { productName, userId, ...formData } = req.body;

    // Use userId from request body if provided, otherwise use authenticated user's ID
    const quoteUserId = userId ? validateNumber(userId, "User ID") : req.user.id;

    // Validate product exists by name
    const product = await prisma.product.findFirst({
      where: { 
        name: {
          equals: productName,
          mode: 'insensitive' // Case-insensitive search
        }
      },
    });
    if (!product) {
      throw new NotFoundError(`Product with name "${productName}" not found`);
    }

    // Validate required fields based on product type
    const validationErrors = [];

    // Age is always required for all products
    if (!formData.age || Number(formData.age) < 18 || Number(formData.age) > 100) {
      validationErrors.push({
        field: "age",
        message: "Age is required and must be between 18 and 100"
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
      // Liability insurance requires business type
      if (!formData.businessType || formData.businessType.trim() === "") {
        validationErrors.push({
          field: "businessType",
          message: "Business type is required for liability insurance"
        });
      }
    } else if (product.type === "TRAVEL") {
      // Travel insurance requires trip information
      if (!formData.destination || formData.destination.trim() === "") {
        validationErrors.push({
          field: "destination",
          message: "Travel destination is required for travel insurance"
        });
      }
      if (!formData.tripDuration || Number(formData.tripDuration) <= 0) {
        validationErrors.push({
          field: "tripDuration",
          message: "Trip duration (in days) is required for travel insurance and must be greater than 0"
        });
      }
    }

    // Throw validation errors if any
    if (validationErrors.length > 0) {
      throw new ValidationError("Validation failed", validationErrors);
    }

    // Build metadata object from form fields (exclude productName and userId)
    const metadata = { ...formData };

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

// POST endpoint to list claims for customers
router.post(
  "/claims",
  authenticate,
  requireCustomer,
  asyncHandler(async (req, res) => {
    // STRICT FILTERING: Only show claims for the authenticated customer
    // Example: If user.id = 6, only return claims where userId = 6
    const authenticatedUserId = req.user.id;

    // First, get all policy IDs that belong to this customer
    // This ensures we only query claims for policies owned by the customer
    const customerPolicies = await prisma.policy.findMany({
      where: {
        userId: authenticatedUserId,
      },
      select: {
        id: true,
      },
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

    // Build where clause - ensure claim belongs to user AND policy belongs to user
    const where = {
      userId: authenticatedUserId, // Only claims belonging to this user (e.g., userId = 6)
      policyId: {
        in: customerPolicyIds, // Only claims for policies owned by this user
      },
    };

    // Optional filters from request body
    if (req.body.status) {
      where.status = req.body.status;
    }

    if (req.body.claimType) {
      where.claimType = req.body.claimType;
    }

    if (req.body.policyId) {
      const policyId = Number(req.body.policyId);
      
      // Validate that the policyId belongs to the customer
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

    const claims = await prisma.claim.findMany({
      where,
      include: {
        policy: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assessedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Final security check: Ensure all returned claims belong to the authenticated user
    // This is a defense-in-depth measure to prevent any data leakage
    const filteredClaims = claims.filter((claim) => {
      return (
        claim.userId === authenticatedUserId &&
        customerPolicyIds.includes(claim.policyId)
      );
    });

    res.json({
      success: true,
      data: filteredClaims,
      count: filteredClaims.length,
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
    validateRequired(req.body, ["policyNumber", "claimType", "amount", "incidentDate", "description"]);
    const { policyNumber, userId, claimType, amount, incidentDate, description } = req.body;

    // Normalize claimType to uppercase to accept lowercase input (e.g., "motor" -> "MOTOR")
    const normalizedClaimType = claimType.toUpperCase();

    // Use userId from request body if provided, otherwise use authenticated user's ID
    const claimUserId = userId ? validateNumber(userId, "User ID") : req.user.id;

    // Validate policy exists by policy number and belongs to the customer
    const policy = await prisma.policy.findUnique({
      where: { policyNumber: policyNumber },
      include: { product: true },
    });
    
    if (!policy) {
      throw new NotFoundError(`Policy with number "${policyNumber}" not found`);
    }

    // Ensure the policy belongs to the specified user (or authenticated user if not specified)
    if (policy.userId !== claimUserId) {
      const ForbiddenError = require("../utils/errors").ForbiddenError;
      throw new ForbiddenError("You can only submit claims for policies that belong to you");
    }

    // Validate claim using the validation service
    const errors = validateClaim(policy, policy.product, {
      claimType: normalizedClaimType,
      amount: validateNumber(amount, "Amount"),
      incidentDate,
      description,
    });
    
    if (errors.length > 0) {
      throw new ValidationError("Claim validation failed", errors.map(err => ({
        field: "claim",
        message: err
      })));
    }

    // Handle file attachments if provided
    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    // Create the claim
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
          include: {
            product: true,
          },
        },
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

    // Record Atenxion transaction when claim is submitted
    recordAtenxionTransaction(claimUserId, 'CLAIM_SUBMITTED').catch(err => {
      console.error('Failed to record Atenxion transaction for claim submission:', err);
    });

    res.status(201).json({
      success: true,
      data: claim,
      message: "Claim submitted successfully",
    });
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

    // Get customer profile, create if it doesn't exist
    let profile = await prisma.customerProfile.findUnique({
      where: {
        userId: authenticatedUserId,
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
          userId: authenticatedUserId,
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

    res.json({
      success: true,
      data: profile,
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
