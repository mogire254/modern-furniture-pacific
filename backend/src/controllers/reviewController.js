const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit review (User)
exports.submitReview = async (req, res) => {
    try {
        const { productId, rating, comment, images = [], title = '' } = req.body;

        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Product ID, rating, and comment are required' });
        }

        // Check if product exists
        const product = findById('products', productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if user already reviewed this product
        const reviews = readData('reviews');
        const existingReview = reviews.find(r => r.productId === productId && r.userId === req.user.id);
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        const review = {
            id: uuidv4(),
            productId,
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            rating: parseInt(rating),
            title: title || '',
            comment,
            images: images || [],
            status: 'pending', // pending, approved, rejected
            likes: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('reviews', review);

        res.status(201).json({
            success: true,
            review,
            message: 'Your review has been submitted and is pending approval'
        });
    } catch (error) {
        console.error('❌ Review error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get product reviews (Public)
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = readData('reviews');
        const productReviews = reviews.filter(r => 
            r.productId === productId && r.status === 'approved'
        );

        const averageRating = productReviews.length > 0 
            ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
            : 0;

        res.json({
            success: true,
            reviews: productReviews,
            total: productReviews.length,
            averageRating: Math.round(averageRating * 10) / 10
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all reviews (Admin only)
exports.getReviews = async (req, res) => {
    try {
        const { status } = req.query;
        let reviews = readData('reviews');

        if (status) {
            reviews = reviews.filter(r => r.status === status);
        }

        res.json({
            success: true,
            reviews,
            total: reviews.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's reviews
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = readData('reviews');
        const userReviews = reviews.filter(r => r.userId === req.user.id);
        res.json({
            success: true,
            reviews: userReviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Approve review (Admin only)
exports.approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        review.status = 'approved';
        review.updatedAt = new Date().toISOString();
        review.reviewedBy = req.user.id;
        review.approvedAt = new Date().toISOString();

        updateItem('reviews', id, review);

        // Update product rating
        const product = findById('products', review.productId);
        if (product) {
            const reviews = readData('reviews');
            const productReviews = reviews.filter(r => 
                r.productId === review.productId && r.status === 'approved'
            );
            const averageRating = productReviews.length > 0 
                ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
                : 0;
            product.ratings = {
                average: Math.round(averageRating * 10) / 10,
                count: productReviews.length
            };
            updateItem('products', product.id, product);
        }

        res.json({
            success: true,
            review,
            message: 'Review approved successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject review (Admin only)
exports.rejectReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        review.status = 'rejected';
        review.updatedAt = new Date().toISOString();
        review.reviewedBy = req.user.id;

        updateItem('reviews', id, review);

        res.json({
            success: true,
            review,
            message: 'Review rejected'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete review (Admin only)
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('reviews', id);
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Like review (User)
exports.likeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        review.likes = (review.likes || 0) + 1;
        updateItem('reviews', id, review);

        res.json({
            success: true,
            likes: review.likes,
            message: 'Review liked'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};