const Parcel = require('./parcel.mongo');

async function createParcel(parcelData) {
    try {
        const parcel = new Parcel(parcelData);
        
        // Initialize status history with created status
        parcel.statusHistory.push({
            status: parcel.status,
            service: 'parcel-service',
            location: 'System',
            timestamp: new Date(),
            note: 'Parcel created'
        });
        
        await parcel.save();
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getAllParcels(filters = {}) {
    try {
        const parcels = await Parcel.find(filters)
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelById(parcelId) {
    try {
        const parcel = await Parcel.findById(parcelId)
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy');
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getParcelByTrackingNumber(trackingNumber) {
    try {
        const parcel = await Parcel.findOne({ trackingNumber })
            .populate('warehouseId')
            .populate('consolidationId')
            .populate('createdBy');
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function updateParcel(parcelId, updateData) {
    try {
        const parcel = await Parcel.findByIdAndUpdate(
            parcelId,
            updateData,
            { new: true, runValidators: true }
        );
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function updateParcelStatus(parcelId, statusData) {
    try {
        const parcel = await Parcel.findById(parcelId);
        
        if (!parcel) {
            throw new Error('Parcel not found');
        }
        
        // Update status
        parcel.status = statusData.status;
        
        // Add to status history
        parcel.statusHistory.push({
            status: statusData.status,
            service: statusData.service || 'parcel-service',
            location: statusData.location || '',
            timestamp: new Date(),
            note: statusData.note || ''
        });
        
        await parcel.save();
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function deleteParcel(parcelId) {
    try {
        const parcel = await Parcel.findByIdAndDelete(parcelId);
        return parcel;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByStatus(status) {
    try {
        const parcels = await Parcel.find({ status })
            .populate('warehouseId')
            .populate('consolidationId')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

async function getParcelsByWarehouse(warehouseId) {
    try {
        const parcels = await Parcel.find({ warehouseId })
            .populate('consolidationId')
            .populate('createdBy')
            .sort({ createdTimeStamp: -1 });
        return parcels;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    createParcel,
    getAllParcels,
    getParcelById,
    getParcelByTrackingNumber,
    updateParcel,
    updateParcelStatus,
    deleteParcel,
    getParcelsByStatus,
    getParcelsByWarehouse
};