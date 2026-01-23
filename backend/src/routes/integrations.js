const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { validateRequired } = require('../utils/validation');

let Integration;
try {
  Integration = require('../models/Integration');
} catch (error) {
  console.warn('⚠️ Integration model not available - MongoDB not configured');
}

// Get token and iframe from integration (for Atenxion)
router.get(
  '/token',
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
    const integration = await Integration.findOne({ isActive: true }).sort({ updatedAt: -1 });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No active integration found',
          code: 'NOT_FOUND',
        },
      });
    }
    res.json({
      success: true,
      token: integration.contextKey || null,
      iframe: integration.scriptTag || null,
    });
  })
);

// Get all integrations (public access)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
    const integrations = await Integration.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: integrations,
      count: integrations.length,
    });
  })
);

// Get single integration by ID (public access)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Integration not found',
          code: 'NOT_FOUND',
        },
      });
    }
    res.json({
      success: true,
      data: integration,
    });
  })
);

// Create or update integration (single record - replace existing)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }

    const { contextKey, scriptTag } = req.body;

    // Validate both fields are required
    if (!contextKey || !contextKey.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Context key is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    if (!scriptTag || !scriptTag.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Script tag is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Upsert - replace existing record or create new one
    const integration = await Integration.findOneAndUpdate(
      {}, // Empty filter - find any existing record
      {
        name: 'Integration Settings',
        type: 'script_tag', // Default to script_tag since both are present
        contextKey: contextKey.trim(),
        scriptTag: scriptTag.trim(),
        description: 'Main integration configuration',
        isActive: true,
        createdBy: req.user?.id,
        updatedAt: new Date(),
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        setDefaultsOnInsert: true, // Set defaults on insert
      }
    );

    res.status(200).json({
      success: true,
      data: integration,
      message: 'Integration settings saved successfully',
    });
  })
);

// Update integration
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'AGENT']),
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
    const integration = await Integration.findById(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Integration not found',
          code: 'NOT_FOUND',
        },
      });
    }

    const { name, type, contextKey, scriptTag, description, isActive } = req.body;

    if (name) integration.name = name;
    if (type) integration.type = type;
    if (description !== undefined) integration.description = description;
    if (isActive !== undefined) integration.isActive = isActive;

    // Update type-specific fields
    if (type === 'context_key') {
      if (contextKey) integration.contextKey = contextKey;
      integration.scriptTag = undefined;
    } else if (type === 'script_tag') {
      if (scriptTag) integration.scriptTag = scriptTag;
      integration.contextKey = undefined;
    } else if (contextKey) {
      integration.contextKey = contextKey;
    } else if (scriptTag) {
      integration.scriptTag = scriptTag;
    }

    integration.updatedAt = new Date();
    await integration.save();

    res.json({
      success: true,
      data: integration,
    });
  })
);

// Delete integration
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req, res) => {
    if (!Integration) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'MongoDB not configured. Please install mongoose: npm install mongoose',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
    const integration = await Integration.findByIdAndDelete(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Integration not found',
          code: 'NOT_FOUND',
        },
      });
    }
    res.json({
      success: true,
      message: 'Integration deleted successfully',
    });
  })
);

module.exports = router;
