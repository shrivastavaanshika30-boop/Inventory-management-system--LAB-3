const ApiError = require('./ApiError');

const SORTABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier', 'createdAt', 'updatedAt'];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toNumber = (value, name) => {
  const num = Number(value);
  if (value === '' || Number.isNaN(num)) {
    throw new ApiError(400, `Query parameter "${name}" must be a number`);
  }
  return num;
};

const toPositiveInt = (value, name, fallback) => {
  if (value === undefined) return fallback;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(400, `Query parameter "${name}" must be a positive whole number`);
  }
  return num;
};

/**
 * Turns req.query into { filter, sort, page, limit, skip } for Product.find().
 *
 * Supported query params:
 *   search      partial, case-insensitive match on name
 *   category    exact match (case-insensitive)
 *   supplier    partial, case-insensitive match
 *   minPrice / maxPrice
 *   minQty / maxQty
 *   inStock     true -> quantity > 0, false -> quantity = 0
 *   sort        comma-separated fields, "-" prefix for descending, e.g. sort=-price,name
 *   page, limit pagination (limit capped at 100)
 */
const buildProductQuery = (query) => {
  const filter = {};

  if (query.search) {
    filter.name = { $regex: escapeRegex(String(query.search)), $options: 'i' };
  }

  if (query.category) {
    filter.category = { $regex: `^${escapeRegex(String(query.category))}$`, $options: 'i' };
  }

  if (query.supplier) {
    filter.supplier = { $regex: escapeRegex(String(query.supplier)), $options: 'i' };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = toNumber(query.minPrice, 'minPrice');
    if (query.maxPrice !== undefined) filter.price.$lte = toNumber(query.maxPrice, 'maxPrice');
    if (filter.price.$gte > filter.price.$lte) {
      throw new ApiError(400, 'minPrice cannot be greater than maxPrice');
    }
  }

  if (query.minQty !== undefined || query.maxQty !== undefined) {
    filter.quantity = {};
    if (query.minQty !== undefined) filter.quantity.$gte = toNumber(query.minQty, 'minQty');
    if (query.maxQty !== undefined) filter.quantity.$lte = toNumber(query.maxQty, 'maxQty');
    if (filter.quantity.$gte > filter.quantity.$lte) {
      throw new ApiError(400, 'minQty cannot be greater than maxQty');
    }
  }

  if (query.inStock !== undefined) {
    if (query.inStock === 'true') filter.quantity = { ...filter.quantity, $gt: 0 };
    else if (query.inStock === 'false') filter.quantity = 0;
    else throw new ApiError(400, 'Query parameter "inStock" must be true or false');
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (query.sort) {
    sort = {};
    for (const raw of String(query.sort).split(',')) {
      const token = raw.trim();
      if (!token) continue;
      const desc = token.startsWith('-');
      const field = desc ? token.slice(1) : token;
      if (!SORTABLE_FIELDS.includes(field)) {
        throw new ApiError(400, `Cannot sort by "${field}". Allowed: ${SORTABLE_FIELDS.join(', ')}`);
      }
      sort[field] = desc ? -1 : 1;
    }
    if (Object.keys(sort).length === 0) sort = { createdAt: -1 };
  }
  // Tie-breaker so pagination is stable when sort values repeat
  if (!('_id' in sort)) sort._id = 1;

  // Pagination
  const page = toPositiveInt(query.page, 'page', 1);
  const limit = Math.min(toPositiveInt(query.limit, 'limit', DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { filter, sort, page, limit, skip };
};

module.exports = buildProductQuery;
