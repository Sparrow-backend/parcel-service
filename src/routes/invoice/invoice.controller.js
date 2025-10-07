const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoicesByUser,
  updateInvoice,
  deleteInvoice,
  getInvoicesByStatus,
} = require('../../models/invoice/invoice.model');

/**
 * Create new invoice
 */
async function httpCreateInvoice(req, res) {
  try {
    const invoiceData = req.body;
    const invoice = await createInvoice(invoiceData);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
}

/**
 * Get all invoices (with optional filters)
 */
async function httpGetAllInvoices(req, res) {
  try {
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.userId) filters.user = req.query.userId;

    const invoices = await getAllInvoices(filters);

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error.message,
    });
  }
}

/**
 * Get invoice by ID
 */
async function httpGetInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice',
      error: error.message,
    });
  }
}

/**
 * Get invoices by user
 */
async function httpGetInvoicesByUser(req, res) {
  try {
    const { userId } = req.params;
    const invoices = await getInvoicesByUser(userId);

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user invoices',
      error: error.message,
    });
  }
}

/**
 * Update invoice
 */
async function httpUpdateInvoice(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const invoice = await updateInvoice(id, updateData);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update invoice',
      error: error.message,
    });
  }
}

/**
 * Delete invoice
 */
async function httpDeleteInvoice(req, res) {
  try {
    const { id } = req.params;
    const invoice = await deleteInvoice(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete invoice',
      error: error.message,
    });
  }
}

/**
 * Get invoices by status
 */
async function httpGetInvoicesByStatus(req, res) {
  try {
    const { status } = req.params;
    const invoices = await getInvoicesByStatus(status);

    return res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices by status',
      error: error.message,
    });
  }
}

module.exports = {
  httpCreateInvoice,
  httpGetAllInvoices,
  httpGetInvoiceById,
  httpGetInvoicesByUser,
  httpUpdateInvoice,
  httpDeleteInvoice,
  httpGetInvoicesByStatus,
};
