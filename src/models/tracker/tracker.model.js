const Tracker = require('./tracker.mongo');
const Parcel = require('../parcel/parcel.mongo');

async function createTrackerEvent(trackerData) {
    try {
        const tracker = new Tracker(trackerData);
        await tracker.save();
        
        // Also update the parcel's status history
        const parcel = await Parcel.findById(trackerData.parcelId);
        if (parcel) {
            parcel.status = trackerData.status;
            parcel.statusHistory.push({
                status: trackerData.status,
                service: 'tracker-service',
                location: trackerData.location || '',
                timestamp: trackerData.timestamp || new Date(),
                note: trackerData.note || ''
            });
            await parcel.save();
        }
        
        return tracker;
    } catch (error) {
        throw error;
    }
}

async function getAllTrackerEvents(filters = {}) {
    try {
        const events = await Tracker.find(filters)
            .populate('parcelId')
            .populate('updateddBy')
            .sort({ timestamp: -1 });
        return events;
    } catch (error) {
        throw error;
    }
}

async function getTrackerEventById(trackerId) {
    try {
        const event = await Tracker.findById(trackerId)
            .populate('parcelId')
            .populate('updateddBy');
        return event;
    } catch (error) {
        throw error;
    }
}

async function getTrackerEventsByParcel(parcelId) {
    try {
        const events = await Tracker.find({ parcelId })
            .populate('updateddBy')
            .sort({ timestamp: -1 });
        return events;
    } catch (error) {
        throw error;
    }
}

async function getTrackerEventsByStatus(status) {
    try {
        const events = await Tracker.find({ status })
            .populate('parcelId')
            .populate('updateddBy')
            .sort({ timestamp: -1 });
        return events;
    } catch (error) {
        throw error;
    }
}

async function updateTrackerEvent(trackerId, updateData) {
    try {
        const event = await Tracker.findByIdAndUpdate(
            trackerId,
            updateData,
            { new: true, runValidators: true }
        );
        return event;
    } catch (error) {
        throw error;
    }
}

async function deleteTrackerEvent(trackerId) {
    try {
        const event = await Tracker.findByIdAndDelete(trackerId);
        return event;
    } catch (error) {
        throw error;
    }
}

async function getLatestTrackerEventByParcel(parcelId) {
    try {
        const event = await Tracker.findOne({ parcelId })
            .sort({ timestamp: -1 })
            .populate('updateddBy');
        return event;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createTrackerEvent,
    getAllTrackerEvents,
    getTrackerEventById,
    getTrackerEventsByParcel,
    getTrackerEventsByStatus,
    updateTrackerEvent,
    deleteTrackerEvent,
    getLatestTrackerEventByParcel
};