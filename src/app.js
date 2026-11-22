const express = require('express');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Inventory and Data Management System API' });
});

app.use('/api/products', productRoutes);

app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

module.exports = app;
