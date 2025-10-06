const express = require('express');
const {
    httpGetTrackingByNumber,
    httpAddTrackingEvent,
    httpUpdateTrackingLocation,
    httpGetActiveTrackings,
    httpGetTrackingsByDriver
} = require('./tracking.controller');

const trackingRouter = express.Router();

// Get active trackings (in transit)
trackingRouter.get('/active', httpGetActiveTrackings);

// Get tracking by number
trackingRouter.get('/:trackingNumber', httpGetTrackingByNumber);

// Get trackings by driver
trackingRouter.get('/driver/:driverId', httpGetTrackingsByDriver);

// Add tracking event
trackingRouter.post('/:trackingNumber/event', httpAddTrackingEvent);

// Update tracking location
trackingRouter.patch('/:trackingNumber/location', httpUpdateTrackingLocation);

module.exports = trackingRouter;