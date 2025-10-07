const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },

    parcels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parcel',
        required: true,
      },
    ],

    consolidatedShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consolidation',
    },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    serviceFee: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'],
      default: 'issued',
    },

    notes: {
      type: String,
      trim: true,
    },
  },
);


module.exports = mongoose.model('Invoice', invoiceSchema);
