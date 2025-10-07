const {
  createPayment,
  getAllPayments,
  getPaymentById,
  getPaymentsByUser,
  getPaymentsByStatus,
  updatePayment,
  deletePayment,
} = require('../../models/payment/payment.model');

/**
 * Create new payment
 */
async function httpCreatePayment(req, res) {
  try {
    const paymentData = req.body;
    const payment = await createPayment(paymentData);

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message,
    });
  }
}

/**
 * Get all payments (with optional query filters)
 */
async function httpGetAllPayments(req, res) {
  try {
    const filters = {};

    if (req.query.status) filters.paymentStatus = req.query.status;
    if (req.query.userId) filters.user = req.query.userId;

    const payments = await getAllPayments(filters);

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message,
    });
  }
}

/**
 * Get payment by ID
 */
async function httpGetPaymentById(req, res) {
  try {
    const { id } = req.params;
    const payment = await getPaymentById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message,
    });
  }
}

/**
 * Get all payments by user
 */
async function httpGetPaymentsByUser(req, res) {
  try {
    const { userId } = req.params;
    const payments = await getPaymentsByUser(userId);

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user payments',
      error: error.message,
    });
  }
}

/**
 * Update payment
 */
async function httpUpdatePayment(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const payment = await updatePayment(id, updateData);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: payment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message,
    });
  }
}

/**
 * Delete payment
 */
async function httpDeletePayment(req, res) {
  try {
    const { id } = req.params;
    const payment = await deletePayment(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: error.message,
    });
  }
}

/**
 * Get payments by status
 */
async function httpGetPaymentsByStatus(req, res) {
  try {
    const { status } = req.params;
    const payments = await getPaymentsByStatus(status);

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments by status',
      error: error.message,
    });
  }
}

module.exports = {
  httpCreatePayment,
  httpGetAllPayments,
  httpGetPaymentById,
  httpGetPaymentsByUser,
  httpUpdatePayment,
  httpDeletePayment,
  httpGetPaymentsByStatus,
};
