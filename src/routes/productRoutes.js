const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getLowStockReport,
  getCategorySummary,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
} = require('../controllers/productController');
const {
  validateObjectId,
  validateCreateProduct,
  validateStockAdjustment,
} = require('../middleware/validateRequest');

router.get('/low-stock', getLowStockReport);
router.get('/summary', getCategorySummary);

router.route('/').get(getProducts).post(validateCreateProduct, createProduct);

router
  .route('/:id')
  .get(validateObjectId, getProductById)
  .put(validateObjectId, updateProduct)
  .delete(validateObjectId, deleteProduct);

router.patch('/:id/stock', validateObjectId, validateStockAdjustment, adjustStock);

module.exports = router;
