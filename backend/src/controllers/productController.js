const { readData, findById } = require('../utils/fileHandler');

exports.getProducts = async (req, res) => {
  try {
    const products = readData('products.json');
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const products = readData('products.json');
    const product = findById(products, id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
