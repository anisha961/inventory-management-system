const Product = require('../models/Product');

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      supplier,
      search,
      minPrice,
      maxPrice,
      lowStock,
      sort = '-createdAt',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (category) filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    if (supplier) filter.supplier = { $regex: supplier.trim(), $options: 'i' };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { sku: regex }, { category: regex }, { supplier: regex }];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const sortBy = sort.split(',').map((f) => f.trim()).filter(Boolean).join(' ');

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sortBy).skip(skip).limit(limitNum),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limitNum);

    res.status(200).json({ total, page: pageNum, totalPages, count: products.length, products });
  } catch (error) {
    next(error);
  }
};

const getLowStockReport = async (req, res, next) => {
  try {
    const lowStockItems = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] },
    }).sort({ quantity: 1, name: 1 });

    res.status(200).json({ count: lowStockItems.length, lowStockItems });
  } catch (error) {
    next(error);
  }
};

const getCategorySummary = async (req, res, next) => {
  try {
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
      {
        $project: {
          _id: 1,
          totalItems: 1,
          totalQuantity: 1,
          totalStockValue: { $round: ['$totalStockValue', 2] },
          avgPrice: { $round: ['$avgPrice', 2] },
        },
      },
      { $sort: { totalStockValue: -1 } },
    ]);

    res.status(200).json({ categories: summary.length, summary });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { change } = req.body;
    const filter =
      change < 0
        ? { _id: req.params.id, quantity: { $gte: Math.abs(change) } }
        : { _id: req.params.id };

    const updatedProduct = await Product.findOneAndUpdate(
      filter,
      { $inc: { quantity: change } },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      const existing = await Product.findById(req.params.id);
      if (!existing) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        return next(err);
      }
      const err = new Error(`Insufficient stock. Current quantity is ${existing.quantity}, requested change is ${change}`);
      err.statusCode = 400;
      return next(err);
    }

    res.status(200).json({ message: 'Stock updated', product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ message: 'Product deleted', id: deleted._id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getLowStockReport,
  getCategorySummary,
  getProductById,
  updateProduct,
  adjustStock,
  deleteProduct,
};
