const express = require('express');
const {
    httpCreateDelivery,
    httpGetAllDeliveries,
    httpGetDeliveryById,
    httpGetDeliveryByNumber,
    httpGetDeliveriesByDriver,
    httpGetDeliveriesByStatus,
    httpGetDeliveriesByType,
    httpGetDeliveriesByWarehouse,
    httpUpdateDelivery,
    httpUpdateDeliveryStatus,
    httpReassignDelivery,
    httpDeleteDelivery
} = require('./deliveries.controller');

const deliveryRouter = express.Router();

// Create a new delivery (staff creates and assigns to driver)
// Supports: address→warehouse, warehouse→warehouse, warehouse→address
deliveryRouter.post('/', httpCreateDelivery);

// Get all deliveries (with optional filters via query params)
// Example: ?status=assigned&driverId=123&deliveryType=warehouse_to_warehouse
deliveryRouter.get('/', httpGetAllDeliveries);

// Get delivery by ID
deliveryRouter.get('/:id', httpGetDeliveryById);

// Get delivery by delivery number
deliveryRouter.get('/number/:deliveryNumber', httpGetDeliveryByNumber);

// Get deliveries by driver
deliveryRouter.get('/driver/:driverId', httpGetDeliveriesByDriver);

// Get deliveries by status
deliveryRouter.get('/status/:status', httpGetDeliveriesByStatus);

// Get deliveries by type (address_to_warehouse, warehouse_to_warehouse, warehouse_to_address)
deliveryRouter.get('/type/:deliveryType', httpGetDeliveriesByType);

// Get deliveries by warehouse (from or to)
deliveryRouter.get('/warehouse/:warehouseId', httpGetDeliveriesByWarehouse);

// Update delivery
deliveryRouter.put('/:id', httpUpdateDelivery);

// Update delivery status
deliveryRouter.patch('/:id/status', httpUpdateDeliveryStatus);

// Reassign delivery to different driver
deliveryRouter.patch('/:id/reassign', httpReassignDelivery);

// Delete delivery
deliveryRouter.delete('/:id', httpDeleteDelivery);

module.exports = deliveryRouter;