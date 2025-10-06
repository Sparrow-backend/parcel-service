const mongoose = require('mongoose')
require('../parcel/parcel.mongo')
require('../user/user.mongo')
require('../warehouse/warehouse.mongo')

const ConsolidationSchema = new mongoose.Schema({
    masterTrackingNumber: {
        type: String,
        unique: true
    },
    referenceCode: {
        type: String,
        required: true,
        unique: true
    },
    parcels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel"
    }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    warehouseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse"
    },
    status: {
        type: String,
        enum: ["pending", "consolidated", "in_transit", "delivered", "cancelled"],
        default: "pending"
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        }, 
        note: String
    }]
})

module.exports = mongoose.model("Consolidation", ConsolidationSchema)