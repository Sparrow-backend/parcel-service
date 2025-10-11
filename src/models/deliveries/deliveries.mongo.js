const mongoose = require('mongoose');
require('../user/user.mongo');
require('../parcel/parcel.mongo');
require('../consolidation/consolidation.mongo');
require('../warehouse/warehouse.mongo');

const DeliverySchema = new mongoose.Schema({
    deliveryNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deliveryItemType: {
        type: String,
        enum: ["parcel", "consolidation"],
        required: true
    },
    parcels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel"
    }],
    consolidation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consolidation"
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fromLocation: {
        type: {
            type: String,
            enum: ["warehouse", "address"],
            required: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse"
        },
        address: String,
        latitude: Number,
        longitude: Number,
        locationName: String
    },
    toLocation: {
        type: {
            type: String,
            enum: ["warehouse", "address"],
            required: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse"
        },
        address: String,
        latitude: Number,
        longitude: Number,
        locationName: String
    },
    deliveryType: {
        type: String,
        enum: [
            "address_to_warehouse",
            "warehouse_to_warehouse", 
            "warehouse_to_address"
        ],
        required: true
    },
    status: {
        type: String,
        enum: [
            "assigned",
            "accepted",
            "in_progress",
            "picked_up",
            "in_transit",
            "near_destination",
            "delivered",
            "failed",
            "cancelled"
        ],
        default: "assigned"
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        }
    }],
    priority: {
        type: String,
        enum: ["low", "normal", "high", "urgent"],
        default: "normal"
    },
    estimatedPickupTime: Date,
    actualPickupTime: Date,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    distance: {
        type: Number,
        min: 0
    },
    deliveryInstructions: String,
    recipientSignature: String,
    deliveryProof: [{
        type: String,
        url: String
    }],
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

// Index for efficient queries
DeliverySchema.index({ assignedDriver: 1, status: 1 });
DeliverySchema.index({ status: 1, createdTimestamp: -1 });
DeliverySchema.index({ deliveryType: 1 });
DeliverySchema.index({ deliveryItemType: 1 });

// Update timestamp on save
DeliverySchema.pre('save', function(next) {
    this.updatedTimestamp = new Date();
    next();
});

module.exports = mongoose.model("Delivery", DeliverySchema);