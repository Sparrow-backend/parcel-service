const express = require('express');
const cors = require('cors');

const parcelRouter = require('./routes/parcel/parcel.router');
const trackerRouter = require('./routes/tracker/tracker.router');
const trackingRouter = require('./routes/tracking/tracking.router');
const invoiceRouter = require('./routes/invoice/invoice.router');
const paymentRouter = require('./routes/payment/payment.router');
const deliveryRouter = require('./routes/deliveries/deliveries.router');

const app = express();

app.use(cors({
    origin: [
        'https://sparrow.nivakaran.dev',
        'http://localhost:3000',
        'http://nivakaran.dev'
    ]
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "Sparrow: Parcel Service"});
});

app.get('/health', (req, res) => {
    res.json({message: "Parcel Service is running.."});
});

// Mount routers
app.use('/api/parcels', parcelRouter);
app.use('/api/tracker', trackerRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/invoice', invoiceRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/deliveries', deliveryRouter);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

module.exports = app;