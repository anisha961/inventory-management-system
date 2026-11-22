const mongoose = require('mongoose');

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`Invalid product ID: ${id}`);
    err.statusCode = 400;
    return next(err);
  }
  next();
};

const validateCreateProduct = (req, res, next) => {
  const { name, sku, category, price, quantity, supplier } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name is required');
  if (!sku || typeof sku !== 'string' || !sku.trim()) errors.push('sku is required');
  if (!category || typeof category !== 'string' || !category.trim()) errors.push('category is required');
  if (price === undefined || typeof price !== 'number' || Number.isNaN(price) || price < 0) {
    errors.push('price must be a non-negative number');
  }
  if (quantity === undefined || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
    errors.push('quantity must be a non-negative integer');
  }
  if (!supplier || typeof supplier !== 'string' || !supplier.trim()) errors.push('supplier is required');

  if (errors.length > 0) {
    const err = new Error(errors.join(', '));
    err.statusCode = 400;
    return next(err);
  }
  next();
};

const validateStockAdjustment = (req, res, next) => {
  const { change } = req.body;
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    const err = new Error('change must be a non-zero integer');
    err.statusCode = 400;
    return next(err);
  }
  next();
};

module.exports = { validateObjectId, validateCreateProduct, validateStockAdjustment };
