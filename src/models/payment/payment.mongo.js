
const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parcels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parcel',
        required: true,
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'cash', 'bank_transfer'],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'successful', 'failed', 'refunded'],
      default: 'pending',
    },
    consolidatedShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consolidation', // optional if you have a consolidation entity
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId, // link to generated invoice or receipt
      ref: 'Invoice'
    },
    notes: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);


module.exports= mongoose.model('Payment', paymentSchema);
