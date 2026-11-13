# Lab 3 – Inventory and Data Management System

Node.js + Express + MongoDB (Mongoose) + dotenv. No other packages.

## Run it

```bash
npm install
cp .env.example .env        # edit MONGO_URI if not using local MongoDB
npm run seed                # optional: loads 12 sample products
npm start                   # http://localhost:5000
```

## Project structure

```
server.js                     app entry, middleware, routes
config/db.js                  MongoDB connection
models/Product.js             schema + validation + stockValue virtual
controllers/productController.js
routes/productRoutes.js
middleware/validate.js        ObjectId / body / stock-change validation
middleware/errorHandler.js    404 + centralized error handler
utils/buildProductQuery.js    filtering, sorting, pagination
utils/ApiError.js, utils/asyncHandler.js
seed.js                       sample data
```

## Endpoints (base: `/api/products`)

| Method | Path | What it does |
|---|---|---|
| POST | `/` | Create product → 201 |
| GET | `/` | List with filters, sort, pagination |
| GET | `/:id` | Single product |
| PUT | `/:id` | Update fields sent (others unchanged) |
| PATCH | `/:id/stock` | `{ "change": 10 }` restock, `{ "change": -3 }` sale |
| DELETE | `/:id` | Delete → `{ message, id }` |
| GET | `/low-stock` | quantity ≤ reorderLevel (aggregation) |
| GET | `/summary` | Category-wise totals (aggregation) |

### Query parameters for `GET /api/products`

| Param | Example | Meaning |
|---|---|---|
| `search` | `search=table` | name contains (case-insensitive) |
| `category` | `category=Electronics` | exact category |
| `supplier` | `supplier=ikea` | supplier contains |
| `minPrice`, `maxPrice` | `minPrice=500&maxPrice=5000` | price range |
| `minQty`, `maxQty` | `maxQty=10` | quantity range |
| `inStock` | `inStock=true` | quantity > 0 (`false` → out of stock) |
| `sort` | `sort=-price,name` | `-` = descending |
| `page`, `limit` | `page=2&limit=5` | default limit 10, max 100 |

## Product fields

| Field | Rules |
|---|---|
| `name` | required, 2–100 chars |
| `sku` | required, unique, auto-uppercased, letters/digits/hyphens |
| `category` | required, one of: Electronics, Apparel, Furniture, Stationery, Grocery, Home & Kitchen, Sports, Other |
| `price` | required, ≥ 0 |
| `quantity` | required, whole number ≥ 0 |
| `reorderLevel` | whole number ≥ 0, default 10 |
| `supplier` | optional, ≤ 100 chars |
| `stockValue` | computed: price × quantity (virtual, not stored) |

## Postman test sequence

1. `POST /api/products`
   `{ "name": "Gel Pen Pack of 15", "sku": "STNY-PN-713", "category": "Stationery", "price": 120, "quantity": 40, "reorderLevel": 20, "supplier": "Cello Pens" }` → 201
2. Send the same body again → 409 (duplicate SKU)
3. `POST` with `"price": -5` → 400 with field errors
4. `GET /api/products?category=Stationery&sort=-price&page=1&limit=5`
5. `GET /api/products/<id>` · `GET /api/products/123` → 400 invalid id
6. `PUT /api/products/<id>` `{ "price": 140, "quantity": 60 }`
7. `PATCH /api/products/<id>/stock` `{ "change": 10 }` → quantity +10
8. `PATCH /api/products/<id>/stock` `{ "change": -1000 }` → 400 insufficient stock
9. `GET /api/products/low-stock`
10. `GET /api/products/summary`
11. `DELETE /api/products/<id>` → `{ "message": "Product deleted", "id": "..." }`

## Error format

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "price", "message": "Price cannot be negative" }] }
```

| Status | When |
|---|---|
| 400 | validation error, bad id, bad query param, bad JSON, insufficient stock |
| 404 | product or route not found |
| 409 | duplicate SKU |
| 500 | anything unexpected |
