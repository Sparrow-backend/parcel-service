const mongoose = require('mongoose')

const AddressSchema = new mongoose.Schema({
    locationNumber: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    latitude: Number,
    longitude: Number,
    upatedTimeStamp: {
        type: Date,
        default: Date.now
    },
    createdTimestamp: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Address", AddressSchema)