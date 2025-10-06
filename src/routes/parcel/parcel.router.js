const express = require('express');
const {
    httpCreateParcel,
    httpGetAllParcels,
    httpGetParcelById,
    httpGetParcelByTrackingNumber,
    httpUpdateParcel,
    httpUpdateParcelStatus,
    httpAssignDriver,
    httpDeleteParcel,
    httpGetParcelsByStatus,
    httpGetParcelsByWarehouse,
    httpGetParcelsByDriver
} = require('./parcel.controller');

const parcelRouter = express.Router();

// Create a new parcel
parcelRouter.post('/', httpCreateParcel);

// Get all parcels (with optional filters via query params)
parcelRouter.get('/', httpGetAllParcels);

// Get parcel by ID
parcelRouter.get('/:id', httpGetParcelById);

// Get parcel by tracking number
parcelRouter.get('/tracking/:trackingNumber', httpGetParcelByTrackingNumber);

// Get parcels by status
parcelRouter.get('/status/:status', httpGetParcelsByStatus);

// Get parcels by warehouse
parcelRouter.get('/warehouse/:warehouseId', httpGetParcelsByWarehouse);

// Get parcels by driver
parcelRouter.get('/driver/:driverId', httpGetParcelsByDriver);

// Update parcel
parcelRouter.put('/:id', httpUpdateParcel);

// Update parcel status
parcelRouter.patch('/:id/status', httpUpdateParcelStatus);

// Assign driver to parcel
parcelRouter.patch('/:id/assign-driver', httpAssignDriver);

// Delete parcel
parcelRouter.delete('/:id', httpDeleteParcel);

module.exports = parcelRouter;