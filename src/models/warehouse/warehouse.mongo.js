const mongoose = require('mongoose')
require('../address/address.mongo')
require('../user/user.mongo');
require('../parcel/parcel.mongo');
 
const WarehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        unique: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    capacity: {
        parcels: Number,
        weightLimit: Number
    },
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'under_maintenance'],
        default: "active"
    },
    receivedParcels: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Parcel"
        }
    ],
    createdTimestamp: {
        type: Date,
        default: Date.now
    },
    updatedTimestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Warehouse", WarehouseSchema)