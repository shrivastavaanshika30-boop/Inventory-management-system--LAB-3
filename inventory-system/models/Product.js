const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Furniture',
  'Stationery',
  'Grocery',
  'Home & Kitchen',
  'Sports',
  'Other',
];

const isWholeNumber = {
  validator: Number.isInteger,
  message: '{PATH} must be a whole number',
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9]+(-[A-Z0-9]+)*$/,
        'SKU may contain only letters, digits and hyphens (e.g. FURN-TB-812)',
      ],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      validate: isWholeNumber,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
      validate: isWholeNumber,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed field: value of stock on hand (not stored in the DB)
productSchema.virtual('stockValue').get(function () {
  return this.price * this.quantity;
});

// Index on the field we filter and group by most often
productSchema.index({ category: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.CATEGORIES = CATEGORIES;
