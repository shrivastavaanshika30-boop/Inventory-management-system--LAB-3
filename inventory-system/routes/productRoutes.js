const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
} = require('../controllers/productController');
const { validateObjectId, requireBody, validateStockChange } = require('../middleware/validate');

const router = express.Router();

// Report routes MUST come before "/:id", otherwise Express treats
// "low-stock" and "summary" as product ids
router.get('/low-stock', getLowStock);
router.get('/summary', getCategorySummary);

router.route('/')
  .get(getProducts)
  .post(requireBody, createProduct);

router.route('/:id')
  .get(validateObjectId, getProductById)
  .put(validateObjectId, requireBody, updateProduct)
  .delete(validateObjectId, deleteProduct);

router.patch('/:id/stock', validateObjectId, validateStockChange, adjustStock);

module.exports = router;
