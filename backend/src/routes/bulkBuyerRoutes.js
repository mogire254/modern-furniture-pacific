const express = require('express');
const router = express.Router();
const bulkBuyerController = require('../controllers/bulkBuyerController');

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/register', bulkBuyerController.registerBulkBuyer);

// ============================================
// BULK BUYER ROUTES (Authenticated)
// ============================================
router.get('/my-orders', bulkBuyerController.getMyBulkOrders);
router.post('/place-order', bulkBuyerController.placeBulkOrder);
router.put('/profile', bulkBuyerController.updateProfile);
router.post('/partnership', bulkBuyerController.applyPartnership);
router.get('/partnership/status', bulkBuyerController.getPartnershipStatus);

// ============================================
// ADMIN ROUTES
// ============================================
router.get('/', bulkBuyerController.getBulkBuyers);
router.get('/:id', bulkBuyerController.getBulkBuyer);
router.patch('/:id/approve', bulkBuyerController.approveBulkBuyer);
router.patch('/:id/reject', bulkBuyerController.rejectBulkBuyer);
router.delete('/:id', bulkBuyerController.deleteBulkBuyer);
router.get('/orders/all', bulkBuyerController.getBulkOrders);
router.patch('/orders/:id/status', bulkBuyerController.updateBulkOrderStatus);
router.get('/partnerships', bulkBuyerController.getPartnerships);
router.patch('/partnerships/:id/approve', bulkBuyerController.approvePartnership);
router.patch('/partnerships/:id/reject', bulkBuyerController.rejectPartnership);

module.exports = router;