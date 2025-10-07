const express = require('express');
const {
  httpCreateInvoice,
  httpGetAllInvoices,
  httpGetInvoiceById,
  httpGetInvoicesByUser,
  httpUpdateInvoice,
  httpDeleteInvoice,
  httpGetInvoicesByStatus,
} = require('./invoice.controller');

const invoiceRouter = express.Router();

// Create a new invoice
invoiceRouter.post('/', httpCreateInvoice);

// Get all invoices (with optional filters via query params)
invoiceRouter.get('/', httpGetAllInvoices);

// Get invoice by ID
invoiceRouter.get('/:id', httpGetInvoiceById);

// Get all invoices by user
invoiceRouter.get('/user/:userId', httpGetInvoicesByUser);

// Get invoices by status
invoiceRouter.get('/status/:status', httpGetInvoicesByStatus);

// Update invoice
invoiceRouter.put('/:id', httpUpdateInvoice);

// Delete invoice
invoiceRouter.delete('/:id', httpDeleteInvoice);

module.exports = invoiceRouter;
