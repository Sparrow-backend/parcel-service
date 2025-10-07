const Invoice = require('./invoice.mongo');
const Payment = require('../payment/payment.mongo');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Create a new invoice
 */
async function createInvoice(invoiceData) {
  try {
    const invoice = new Invoice(invoiceData);

    // Auto-calculate totals if not provided
    if (!invoice.subtotal) {
      invoice.subtotal = invoice.items?.reduce((acc, item) => acc + (item.total || 0), 0) || 0;
    }

    if (!invoice.totalAmount) {
      invoice.totalAmount =
        invoice.subtotal + (invoice.tax || 0) + (invoice.serviceFee || 0) - (invoice.discount || 0);
    }

    await invoice.save();

    // Send notification to user
    if (invoice.user) {
      await sendNotification({
        userId: invoice.user,
        type: 'invoice_update',
        title: 'New Invoice Created',
        message: `Invoice ${invoice.invoiceNumber || invoice._id} has been created.`,
        entityType: 'Invoice',
        entityId: invoice._id,
        channels: ['in_app'],
      });
    }

    return invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Get all invoices (optionally filtered)
 */
async function getAllInvoices(filters = {}) {
  try {
    const invoices = await Invoice.find(filters)
      .populate('user', 'userName email')
      .populate('payment')
      .populate('parcels')
      .populate('consolidatedShipmentId')
      .sort({ createdAt: -1 });
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
}

/**
 * Get invoice by ID
 */
async function getInvoiceById(invoiceId) {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate('user', 'userName email')
      .populate('payment')
      .populate('parcels')
      .populate('consolidatedShipmentId');
    return invoice;
  } catch (error) {
    console.error('Error fetching invoice by ID:', error);
    throw error;
  }
}

/**
 * Get invoice by payment ID
 */
async function getInvoiceByPayment(paymentId) {
  try {
    const invoice = await Invoice.findOne({ payment: paymentId })
      .populate('user', 'userName email')
      .populate('payment')
      .populate('parcels');
    return invoice;
  } catch (error) {
    console.error('Error fetching invoice by payment ID:', error);
    throw error;
  }
}

/**
 * Get invoices by user
 */
async function getInvoicesByUser(userId) {
  try {
    const invoices = await Invoice.find({ user: userId })
      .populate('payment')
      .populate('parcels')
      .sort({ createdAt: -1 });
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices by user:', error);
    throw error;
  }
}

/**
 * Update an invoice
 */
async function updateInvoice(invoiceId, updateData) {
  try {
    const invoice = await Invoice.findByIdAndUpdate(invoiceId, updateData, {
      new: true,
      runValidators: true,
    });

    // Send notification if status changed
    if (updateData.status) {
      await sendNotification({
        userId: invoice.user,
        type: 'invoice_update',
        title: 'Invoice Status Updated',
        message: `Invoice ${invoice.invoiceNumber} status changed to ${updateData.status}`,
        entityType: 'Invoice',
        entityId: invoice._id,
        channels: ['in_app'],
      });
    }

    return invoice;
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

/**
 * Delete an invoice
 */
async function deleteInvoice(invoiceId) {
  try {
    const invoice = await Invoice.findByIdAndDelete(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

/**
 * Get invoices by status
 */
async function getInvoicesByStatus(status) {
  try {
    const invoices = await Invoice.find({ status })
      .populate('user')
      .populate('payment')
      .sort({ createdAt: -1 });
    return invoices;
  } catch (error) {
    console.error('Error fetching invoices by status:', error);
    throw error;
  }
}

/**
 * Helper function: send notification
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
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByPayment,
  getInvoicesByUser,
  getInvoicesByStatus,
  updateInvoice,
  deleteInvoice,
};
