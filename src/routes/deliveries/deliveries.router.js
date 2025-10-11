const express = require('express');
const {
    httpCreateDelivery,
    httpGetAllDeliveries,
    httpGetDeliveryById,
    httpGetDeliveryByNumber,
    httpGetDeliveriesByDriver,
    httpGetDeliveriesByStatus,
    httpGetDeliveriesByType,
    httpGetDeliveriesByItemType,
    httpGetDeliveriesByWarehouse,
    httpGetDeliveriesByConsolidation,
    httpUpdateDelivery,
    httpUpdateDeliveryStatus,
    httpReassignDelivery,
    httpDeleteDelivery
} = require('./deliveries.controller');

const deliveryRouter = express.Router();

// Create a new delivery (staff creates and assigns to driver)
// Supports: 
// - Parcel deliveries: address→warehouse, warehouse→warehouse, warehouse→address
// - Consolidation deliveries: warehouse→warehouse, warehouse→address
// Request body should include:
// - deliveryItemType: "parcel" or "consolidation"
// - parcels: array of parcel IDs (for parcel deliveries)
// - consolidation: consolidation ID (for consolidation deliveries)
deliveryRouter.post('/', httpCreateDelivery);

// Get all deliveries (with optional filters via query params)
// Example: ?status=assigned&driverId=123&deliveryType=warehouse_to_warehouse&deliveryItemType=parcel
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

// Get deliveries by item type (parcel or consolidation)
deliveryRouter.get('/item-type/:itemType', httpGetDeliveriesByItemType);

// Get deliveries by warehouse (from or to)
deliveryRouter.get('/warehouse/:warehouseId', httpGetDeliveriesByWarehouse);

// Get deliveries by consolidation ID
deliveryRouter.get('/consolidation/:consolidationId', httpGetDeliveriesByConsolidation);

// Update delivery
deliveryRouter.put('/:id', httpUpdateDelivery);

// Update delivery status
deliveryRouter.patch('/:id/status', httpUpdateDeliveryStatus);

// Reassign delivery to different driver
deliveryRouter.patch('/:id/reassign', httpReassignDelivery);

// Delete delivery
deliveryRouter.delete('/:id', httpDeleteDelivery);

module.exports = deliveryRouter;