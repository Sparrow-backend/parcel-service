const express = require('express');
const {
  httpCreatePayment,
  httpGetAllPayments,
  httpGetPaymentById,
  httpGetPaymentsByUser,
  httpUpdatePayment,
  httpDeletePayment,
  httpGetPaymentsByStatus,
} = require('./payment.controller');

const paymentRouter = express.Router();

// Create a new payment
paymentRouter.post('/', httpCreatePayment);

// Get all payments (with optional filters via query params)
paymentRouter.get('/', httpGetAllPayments);

// Get payment by ID
paymentRouter.get('/:id', httpGetPaymentById);

// Get all payments by user
paymentRouter.get('/user/:userId', httpGetPaymentsByUser);

// Get payments by status
paymentRouter.get('/status/:status', httpGetPaymentsByStatus);

// Update payment
paymentRouter.put('/:id', httpUpdatePayment);

// Delete payment
paymentRouter.delete('/:id', httpDeletePayment);

module.exports = paymentRouter;
