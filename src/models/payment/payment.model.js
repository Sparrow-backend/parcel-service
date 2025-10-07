const Payment = require('./payment.mongo');
const Invoice = require('../invoice/invoice.mongo');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Create a new payment
 */
async function createPayment(paymentData) {
  try {
    const payment = new Payment(paymentData);
    await payment.save();

    // Send notification to user
    if (payment.user) {
      await sendNotification({
        userId: payment.user,
        type: 'payment_update',
        title: 'Payment Created',
        message: `A new payment of $${payment.amount} has been created.`,
        entityType: 'Payment',
        entityId: payment._id,
        channels: ['in_app'],
      });
    }

    return payment;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

/**
 * Get all payments with optional filters
 */
async function getAllPayments(filters = {}) {
  try {
    const payments = await Payment.find(filters)
      .populate('user', 'userName email')
      .populate('parcels')
      .populate('consolidatedShipmentId')
      .populate('invoice')
      .sort({ createdAt: -1 });
    return payments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
}

/**
 * Get a single payment by ID
 */
async function getPaymentById(paymentId) {
  try {
    const payment = await Payment.findById(paymentId)
      .populate('user', 'userName email')
      .populate('parcels')
      .populate('consolidatedShipmentId')
      .populate('invoice');
    return payment;
  } catch (error) {
    console.error('Error fetching payment by ID:', error);
    throw error;
  }
}

/**
 * Get all payments for a specific user
 */
async function getPaymentsByUser(userId) {
  try {
    const payments = await Payment.find({ user: userId })
      .populate('parcels')
      .populate('invoice')
      .sort({ createdAt: -1 });
    return payments;
  } catch (error) {
    console.error('Error fetching payments by user:', error);
    throw error;
  }
}

/**
 * Update a payment (status, amount, etc.)
 */
async function updatePayment(paymentId, updateData) {
  try {
    const payment = await Payment.findById(paymentId).populate('user');

    if (!payment) {
      throw new Error('Payment not found');
    }

    const oldStatus = payment.paymentStatus;
    Object.assign(payment, updateData);
    payment.updatedAt = new Date();
    await payment.save();

    // If status changed to successful — auto-generate an invoice
    if (oldStatus !== 'successful' && payment.paymentStatus === 'successful') {
      const invoice = await createInvoiceForPayment(payment);
      payment.invoice = invoice._id;
      await payment.save();

      await sendNotification({
        userId: payment.user._id,
        type: 'payment_update',
        title: 'Payment Successful',
        message: `Your payment of $${payment.amount} was successful. Invoice ${invoice.invoiceNumber} generated.`,
        entityType: 'Payment',
        entityId: payment._id,
        channels: ['in_app', 'email'],
      });
    }

    return payment;
  } catch (error) {
    console.error('Error updating payment:', error);
    throw error;
  }
}

/**
 * Delete a payment
 */
async function deletePayment(paymentId) {
  try {
    const payment = await Payment.findByIdAndDelete(paymentId);
    return payment;
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
}

/**
 * Get payments by status
 */
async function getPaymentsByStatus(status) {
  try {
    const payments = await Payment.find({ paymentStatus: status })
      .populate('user')
      .populate('parcels')
      .populate('invoice')
      .sort({ createdAt: -1 });
    return payments;
  } catch (error) {
    console.error('Error fetching payments by status:', error);
    throw error;
  }
}

/**
 * Auto-create an invoice when a payment succeeds
 */
async function createInvoiceForPayment(payment) {
  try {
    const invoiceData = {
      user: payment.user,
      payment: payment._id,
      parcels: payment.parcels,
      consolidatedShipmentId: payment.consolidatedShipmentId,
      subtotal: payment.amount,
      totalAmount: payment.amount,
      currency: 'USD',
      status: 'paid',
      issueDate: new Date(),
      items: [
        {
          description: 'Parcel Consolidation & Shipping',
          quantity: payment.parcels.length,
          unitPrice: payment.amount / payment.parcels.length,
          total: payment.amount,
        },
      ],
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    return invoice;
  } catch (error) {
    console.error('Error creating invoice for payment:', error);
    throw error;
  }
}

/**
 * Helper function to send notifications
 */
async function sendNotification(notificationData) {
  try {
    const NOTIFICATION_SERVICE_URL =
      process.env.NOTIFICATION_SERVICE_URL || 'https://notification-service.vercel.app';

    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      console.error('Failed to send notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByUser,
  getPaymentsByStatus,
  updatePayment,
  deletePayment,
};
