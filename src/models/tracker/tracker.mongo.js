

const mongoose = require('mongoose')

const TrackerSchema = new mongoose.Schema({
    parcelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parcel",
        required: true
    },
    status: {
        type: String,
        enum: [
            "created",
            "received_at_warehouse",
            "consolidated",
            "in_transit",
            "out_for_delivery",
            "delivered",
            "delayed",
            "exception"
        ],
        required: true
    },
    location: String,
    timestamp: {
        type: Date,
        default: Date.now
    },
    note: String,
    updateddBy: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

module.exports = mongoose.model("TrackerSchema", TrackerSchema)