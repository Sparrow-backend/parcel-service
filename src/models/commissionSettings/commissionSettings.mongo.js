const mongoose = require('mongoose');

const CommissionSettingsSchema = new mongoose.Schema({
    deliveryType: {
        type: String,
        enum: [
            "address_to_warehouse",
            "warehouse_to_warehouse", 
            "warehouse_to_address",
            "default"
        ],
        required: true,
        unique: true
    },
    commissionRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10
    },
    baseAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdTimestamp: {
        type: Date,
        default: Date.now
    },
    updatedTimestamp: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
CommissionSettingsSchema.pre('save', function(next) {
    this.updatedTimestamp = new Date();
    next();
});

module.exports = mongoose.model("CommissionSettings", CommissionSettingsSchema);