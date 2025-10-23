const mongoose = require('mongoose');
require('../user/user.mongo');
require('../deliveries/deliveries.mongo');

const EarningsSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Delivery",
        required: true
    },
    baseAmount: {
        type: Number,
        required: true,
        min: 0
    },
    commissionRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10 // Default 10% commission
    },
    commissionAmount: {
        type: Number,
        required: true,
        min: 0
    },
    bonusAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    deductions: {
        type: Number,
        default: 0,
        min: 0
    },
    totalEarnings: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'cancelled'],
        default: 'pending'
    },
    deliveryCompletedAt: {
        type: Date,
        required: true
    },
    paidAt: Date,
    notes: String,
    createdTimestamp: {
        type: Date,
        default: Date.now
    },
    updatedTimestamp: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
EarningsSchema.index({ driver: 1, status: 1 });
EarningsSchema.index({ driver: 1, deliveryCompletedAt: -1 });
EarningsSchema.index({ status: 1, createdTimestamp: -1 });

// Update timestamp on save
EarningsSchema.pre('save', function(next) {
    this.updatedTimestamp = new Date();
    next();
});

// Calculate commission and total earnings before saving
EarningsSchema.pre('save', function(next) {
    if (this.isModified('baseAmount') || this.isModified('commissionRate') || 
        this.isModified('bonusAmount') || this.isModified('deductions')) {
        
        this.commissionAmount = (this.baseAmount * this.commissionRate) / 100;
        this.totalEarnings = this.commissionAmount + this.bonusAmount - this.deductions;
    }
    next();
});

module.exports = mongoose.model("Earnings", EarningsSchema);