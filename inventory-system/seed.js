// Run with: npm run seed   (wipes the products collection and inserts sample data)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Wireless Mouse', sku: 'ELEC-MS-101', category: 'Electronics', price: 799, quantity: 45, reorderLevel: 15, supplier: 'Logitech India' },
  { name: 'Bluetooth Speaker', sku: 'ELEC-SP-204', category: 'Electronics', price: 2499, quantity: 18, reorderLevel: 10, supplier: 'boAt' },
  { name: 'Mechanical Keyboard', sku: 'ELEC-KB-310', category: 'Electronics', price: 3499, quantity: 6, reorderLevel: 8, supplier: 'Redragon India' },
  { name: '27-inch Monitor', sku: 'ELEC-MN-415', category: 'Electronics', price: 15999, quantity: 12, reorderLevel: 5, supplier: 'LG Electronics' },
  { name: 'Cotton T-Shirt', sku: 'APRL-TS-120', category: 'Apparel', price: 499, quantity: 60, reorderLevel: 20, supplier: 'Jockey' },
  { name: 'Denim Jacket', sku: 'APRL-JK-245', category: 'Apparel', price: 2299, quantity: 15, reorderLevel: 5, supplier: "Levi's" },
  { name: 'Study Table', sku: 'FURN-TB-812', category: 'Furniture', price: 3999, quantity: 2, reorderLevel: 4, supplier: 'IKEA India' },
  { name: 'Office Chair', sku: 'FURN-CH-640', category: 'Furniture', price: 6499, quantity: 9, reorderLevel: 5, supplier: 'Green Soul' },
  { name: 'A4 Notebook Pack', sku: 'STNY-NB-230', category: 'Stationery', price: 250, quantity: 120, reorderLevel: 30, supplier: 'Classmate' },
  { name: 'Highlighter Set', sku: 'STNY-HL-340', category: 'Stationery', price: 180, quantity: 12, reorderLevel: 15, supplier: 'Faber-Castell' },
  { name: 'Basmati Rice 5kg', sku: 'GROC-RC-505', category: 'Grocery', price: 649, quantity: 35, reorderLevel: 10, supplier: 'India Gate' },
  { name: 'Green Tea 100 Bags', sku: 'GROC-TE-118', category: 'Grocery', price: 425, quantity: 8, reorderLevel: 10, supplier: 'Tetley' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.init(); // make sure the unique SKU index exists
    await Product.deleteMany({});
    const inserted = await Product.insertMany(products);
    console.log(`Seeded ${inserted.length} products`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
