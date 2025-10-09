const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  parcelType: {
    type: String,
    required: true,
    trim: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerKg: {
    type: Number,
    required: true,
    min: 0
  },
  urgentDeliveryMultiplier: {
    type: Number,
    default: 1.5,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
pricingSchema.index({ parcelType: 1, isActive: 1 });

module.exports = mongoose.model('Pricing', pricingSchema);