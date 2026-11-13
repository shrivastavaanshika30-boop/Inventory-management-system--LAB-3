const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const buildProductQuery = require('../utils/buildProductQuery');

// Fields a client may set; anything else in the body (_id, createdAt, ...) is ignored
const EDITABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];

const pickEditable = (body) =>
  Object.fromEntries(Object.entries(body).filter(([key]) => EDITABLE_FIELDS.includes(key)));

// @route  POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pickEditable(req.body));
  res.status(201).json(product);
});

// @route  GET /api/products
// Query: search, category, supplier, minPrice, maxPrice, minQty, maxQty, inStock, sort, page, limit
const getProducts = asyncHandler(async (req, res) => {
  const { filter, sort, page, limit, skip } = buildProductQuery(req.query);

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sort).skip(skip).limit(limit),
  ]);

  res.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// @route  GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

// @route  PUT /api/products/:id
// Updates only the fields sent; omitted fields keep their current values
const updateProduct = asyncHandler(async (req, res) => {
  const updates = pickEditable(req.body);
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, `Nothing to update. Editable fields: ${EDITABLE_FIELDS.join(', ')}`);
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

// @route  PATCH /api/products/:id/stock
// Body: { "change": 10 } to restock, { "change": -3 } for a sale
const adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;
  const filter = { _id: req.params.id };

  // For a sale, only match the document if enough stock exists.
  // The check and the $inc happen in ONE atomic operation, so two
  // simultaneous sales can never push quantity below zero.
  if (change < 0) filter.quantity = { $gte: -change };

  const product = await Product.findOneAndUpdate(filter, { $inc: { quantity: change } }, { new: true });

  if (!product) {
    const existing = await Product.findById(req.params.id).select('quantity');
    if (!existing) throw new ApiError(404, 'Product not found');
    throw new ApiError(
      400,
      `Insufficient stock: requested ${-change}, only ${existing.quantity} available`
    );
  }

  res.json({ message: 'Stock updated', product });
});

// @route  DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Product deleted', id: product.id });
});

// @route  GET /api/products/low-stock
// Products whose quantity is at or below their own reorderLevel (aggregation pipeline)
const getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: '$_id',
      },
    },
    { $sort: { quantity: 1, name: 1 } },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
});

// @route  GET /api/products/summary
// Category-wise totals (aggregation pipeline)
const getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
  getLowStock,
  getCategorySummary,
};
