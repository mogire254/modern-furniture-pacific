const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem, deleteItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// ===== GET ALL REPAIRS =====
router.get('/', protect, (req, res) => {
  try {
    const repairs = readData('repairs');
    
    // Filter by user role
    let filteredRepairs = repairs;
    if (req.user.role === 'branch_admin' && req.user.branch) {
      filteredRepairs = repairs.filter(r => r.branch === req.user.branch);
    } else if (req.user.role === 'user') {
      filteredRepairs = repairs.filter(r => r.userId === req.user.id);
    }
    
    res.json({
      success: true,
      repairs: filteredRepairs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== GET SINGLE REPAIR =====
router.get('/:id', protect, (req, res) => {
  try {
    const repair = findById('repairs', req.params.id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }
    res.json({
      success: true,
      repair
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== CREATE REPAIR REQUEST =====
router.post('/', protect, (req, res) => {
  try {
    const { productId, issue, description, branch } = req.body;
    
    if (!productId || !issue) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and issue are required'
      });
    }

    const newRepair = {
      id: uuidv4(),
      userId: req.user.id,
      userName: req.user.name,
      productId: productId,
      issue: issue,
      description: description || '',
      branch: branch || req.user.branch || 'all',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addItem('repairs', newRepair);

    res.status(201).json({
      success: true,
      repair: newRepair
    });
  } catch (error) {
    console.error('❌ Error creating repair:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== UPDATE REPAIR STATUS =====
router.put('/:id', protect, (req, res) => {
  try {
    const repair = findById('repairs', req.params.id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    const { status, assignedTo, notes } = req.body;
    
    const updatedRepair = {
      ...repair,
      status: status || repair.status,
      assignedTo: assignedTo || repair.assignedTo,
      notes: notes || repair.notes,
      updatedAt: new Date().toISOString()
    };

    updateItem('repairs', req.params.id, updatedRepair);

    res.json({
      success: true,
      repair: updatedRepair
    });
  } catch (error) {
    console.error('❌ Error updating repair:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== DELETE REPAIR =====
router.delete('/:id', protect, (req, res) => {
  try {
    const repair = findById('repairs', req.params.id);
    if (!repair) {
      return res.status(404).json({
        success: false,
        message: 'Repair not found'
      });
    }

    deleteItem('repairs', req.params.id);

    res.json({
      success: true,
      message: 'Repair deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting repair:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
