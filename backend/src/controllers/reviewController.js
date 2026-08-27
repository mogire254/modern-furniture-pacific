const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ===== FIXED: SUBMIT REVIEW (allow 'general' product) =====
exports.submitReview = async (req, res) => {
    try {
        const { productId, rating, comment, images = [], title = '' } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating and comment are required' 
            });
        }

        // FIXED: Allow 'general' product ID for general reviews
        if (productId && productId !== 'general') {
            const product = findById('products', productId);
            if (!product) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Product not found' 
                });
            }
        }

        // Check if user already reviewed this product
        const reviews = readData('reviews');
        const existingReview = reviews.find(r => r.productId === productId && r.userId === req.user.id);
        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this product' 
            });
        }

        const review = {
            id: uuidv4(),
            productId: productId || 'general',
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            rating: parseInt(rating),
            title: title || '',
            comment: comment.trim(),
            images: images || [],
            branch: req.user.branch || 'all',
            status: 'pending',
            likes: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('reviews', review);

        console.log(`⭐ New review from ${req.user.name} - Rating: ${rating}`);

        res.status(201).json({
            success: true,
            review,
            message: 'Your review has been submitted and is pending approval'
        });
    } catch (error) {
        console.error('❌ Review error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== GET PRODUCT REVIEWS =====
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
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== GET ALL REVIEWS =====
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
        console.error('❌ Get reviews error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== GET USER'S REVIEWS =====
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = readData('reviews');
        const userReviews = reviews.filter(r => r.userId === req.user.id);
        res.json({
            success: true,
            reviews: userReviews
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== APPROVE REVIEW =====
exports.approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }

        review.status = 'approved';
        review.updatedAt = new Date().toISOString();
        review.reviewedBy = req.user.id;
        review.approvedAt = new Date().toISOString();

        updateItem('reviews', id, review);

        // Update product rating if product exists
        if (review.productId && review.productId !== 'general') {
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
        }

        res.json({
            success: true,
            review,
            message: 'Review approved successfully'
        });
    } catch (error) {
        console.error('❌ Approve review error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== REJECT REVIEW =====
exports.rejectReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
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
        console.error('❌ Reject review error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== DELETE REVIEW =====
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }

        deleteItem('reviews', id);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete review error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ===== LIKE REVIEW =====
exports.likeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = findById('reviews', id);

        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Review not found' 
            });
        }

        review.likes = (review.likes || 0) + 1;
        updateItem('reviews', id, review);

        res.json({
            success: true,
            likes: review.likes,
            message: 'Review liked'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};