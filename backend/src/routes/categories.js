const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getCategories);
router.post('/', protect, isAdmin, categoryController.createCategory);
router.put('/:id', protect, isAdmin, categoryController.updateCategory);
router.delete('/:id', protect, isAdmin, categoryController.deleteCategory);

module.exports = router;