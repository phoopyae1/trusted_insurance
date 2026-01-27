const { mongoose } = require('../config/mongodb');

// Check if mongoose is available
if (!mongoose) {
  // Return null if mongoose is not available
  // This allows the routes to handle the error gracefully
  module.exports = null;
} else {
  const integrationSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['context_key', 'script_tag'],
      required: true,
    },
    contextKey: {
      type: String,
      trim: true,
    },
    scriptTag: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Number, // User ID from PostgreSQL
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }, {
    timestamps: true,
  });

  // Update the updatedAt field before saving
  integrationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  const Integration = mongoose.models.Integration || mongoose.model('Integration', integrationSchema);

  module.exports = Integration;
}
