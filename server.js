const http = require('http');
const app = require('./src/app'); // your app.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8002;
const MONGODB_URI = process.env.MONGODB_URI;

// Create HTTP server
const server = http.createServer(app);

// MongoDB connection events
mongoose.connection.once('open', () => {
  console.log('MongoDB connection is ready!!');
});

mongoose.connection.on('error', (err) => {
  console.error('Error connecting with MongoDB:', err);
});

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Start listening
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}...`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1); // exit process if DB connection fails
  }
}

startServer();
