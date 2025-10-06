const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    parcelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel"
    },
    consolidationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consolidation"
    },
    currentStatus: {
        type: String,
        enum: [
            "created",
            "at_warehouse",
            "consolidated",
            "assigned_to_driver",
            "in_transit",
            "out_for_delivery",
            "delivered",
            "cancelled"
        ],
        default: "created"
    },
    currentLocation: {
        latitude: Number,
        longitude: Number,
        address: String,
        timestamp: Date
    },
    estimatedDelivery: Date,
    actualDelivery: Date,
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    events: [{
        status: String,
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        description: String,
        service: String
    }],
    sender: {
        name: String,
        address: String,
        phoneNumber: String
    },
    receiver: {
        name: String,
        address: String,
        phoneNumber: String
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

module.exports = mongoose.model("Tracking", TrackingSchema);
