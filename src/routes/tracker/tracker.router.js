const express = require('express');
const {
    httpCreateTrackerEvent,
    httpGetAllTrackerEvents,
    httpGetTrackerEventById,
    httpGetTrackerEventsByParcel,
    httpGetTrackerEventsByStatus,
    httpGetLatestTrackerEventByParcel,
    httpUpdateTrackerEvent,
    httpDeleteTrackerEvent
} = require('./tracker.controller');

const trackerRouter = express.Router();

// Create a new tracker event
trackerRouter.post('/', httpCreateTrackerEvent);

// Get all tracker events (with optional filters via query params)
trackerRouter.get('/', httpGetAllTrackerEvents);

// Get tracker event by ID
trackerRouter.get('/:id', httpGetTrackerEventById);

// Get all tracker events for a specific parcel
trackerRouter.get('/parcel/:parcelId', httpGetTrackerEventsByParcel);

// Get latest tracker event for a specific parcel
trackerRouter.get('/parcel/:parcelId/latest', httpGetLatestTrackerEventByParcel);

// Get tracker events by status
trackerRouter.get('/status/:status', httpGetTrackerEventsByStatus);

// Update tracker event
trackerRouter.put('/:id', httpUpdateTrackerEvent);

// Delete tracker event
trackerRouter.delete('/:id', httpDeleteTrackerEvent);

module.exports = trackerRouter;