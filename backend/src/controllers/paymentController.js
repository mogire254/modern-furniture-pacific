const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Initialize M-Pesa payment
exports.initiatePayment = async (req, res) => {
    try {
        const { 
            orderId, phoneNumber, amount, 
            paymentMethod = 'mpesa'
        } = req.body;

        if (!orderId || !phoneNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, phone number, and amount are required'
            });
        }

        // Get order
        const order = findById('orders', orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Format phone number (remove leading 0 or +254)
        let formattedPhone = phoneNumber.replace(/^0/, '');
        formattedPhone = formattedPhone.replace(/^\+254/, '');
        if (!formattedPhone.startsWith('254')) {
            formattedPhone = '254' + formattedPhone;
        }

        // Create payment record
        const payment = {
            id: uuidv4(),
            orderId,
            userId: req.user.id,
            userEmail: req.user.email,
            phoneNumber: formattedPhone,
            amount: parseFloat(amount),
            paymentMethod,
            status: 'pending',
            transactionId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('payments', payment);

        // If M-Pesa, initiate STK Push
        if (paymentMethod === 'mpesa') {
            try {
                // This is where you'd call M-Pesa API
                // For now, simulate STK Push
                console.log(`💳 M-Pesa STK Push initiated for ${formattedPhone}`);
                console.log(`💰 Amount: KES ${amount}`);
                
                // Simulate callback after 5 seconds (in production, this comes from M-Pesa)
                setTimeout(async () => {
                    // Simulate successful payment (70% success rate for demo)
                    const success = Math.random() > 0.3;
                    const updatedPayment = findById('payments', payment.id);
                    if (updatedPayment) {
                        updatedPayment.status = success ? 'completed' : 'failed';
                        updatedPayment.transactionId = success ? `MPESA-${Date.now()}` : null;
                        updatedPayment.updatedAt = new Date().toISOString();
                        updateItem('payments', payment.id, updatedPayment);

                        // Update order status
                        if (success) {
                            const order = findById('orders', payment.orderId);
                            if (order) {
                                order.paymentStatus = 'paid';
                                order.status = 'processing';
                                updateItem('orders', order.id, order);
                                console.log(`✅ Payment successful for order ${order.id}`);
                            }
                        } else {
                            console.log(`❌ Payment failed for order ${payment.orderId}`);
                        }
                    }
                }, 5000);

                // Return success with payment pending
                res.json({
                    success: true,
                    payment: {
                        id: payment.id,
                        status: 'pending',
                        message: 'STK Push sent to your phone. Please enter your PIN to complete payment.'
                    }
                });
            } catch (mpesaError) {
                console.error('❌ M-Pesa error:', mpesaError);
                payment.status = 'failed';
                updateItem('payments', payment.id, payment);
                res.status(400).json({
                    success: false,
                    message: 'M-Pesa payment initiation failed. Please try again.'
                });
            }
        } else {
            // Other payment methods (manual)
            res.json({
                success: true,
                payment,
                message: 'Payment recorded. Please complete payment using the provided method.'
            });
        }
    } catch (error) {
        console.error('❌ Payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Verify payment status
exports.verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = findById('payments', id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.json({
            success: true,
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// M-Pesa callback (webhook)
exports.mpesaCallback = async (req, res) => {
    try {
        const { 
            Body: { 
                stkCallback: { 
                    ResultCode, 
                    ResultDesc, 
                    CallbackMetadata 
                } 
            } 
        } = req.body;

        console.log('📞 M-Pesa Callback received:', ResultCode, ResultDesc);

        // Find payment by transaction ID or phone number
        // For demo, we'll update the most recent pending payment
        const payments = readData('payments');
        const pendingPayment = payments
            .filter(p => p.status === 'pending')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (pendingPayment) {
            if (ResultCode === 0) {
                // Success
                const metadata = CallbackMetadata?.Item || [];
                const transactionId = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
                const amount = metadata.find(i => i.Name === 'Amount')?.Value;

                pendingPayment.status = 'completed';
                pendingPayment.transactionId = transactionId || `MPESA-${Date.now()}`;
                pendingPayment.amount = amount || pendingPayment.amount;
                pendingPayment.updatedAt = new Date().toISOString();

                updateItem('payments', pendingPayment.id, pendingPayment);

                // Update order
                const order = findById('orders', pendingPayment.orderId);
                if (order) {
                    order.paymentStatus = 'paid';
                    order.status = 'processing';
                    order.updatedAt = new Date().toISOString();
                    updateItem('orders', order.id, order);
                    
                    console.log(`✅ Payment completed for order ${order.id}`);
                }
            } else {
                // Failed
                pendingPayment.status = 'failed';
                pendingPayment.failureReason = ResultDesc;
                pendingPayment.updatedAt = new Date().toISOString();
                updateItem('payments', pendingPayment.id, pendingPayment);
                console.log(`❌ Payment failed: ${ResultDesc}`);
            }
        }

        res.json({
            success: true,
            message: 'Callback processed'
        });
    } catch (error) {
        console.error('❌ M-Pesa callback error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get payment history (Admin only)
exports.getPayments = async (req, res) => {
    try {
        const payments = readData('payments');
        res.json({
            success: true,
            payments,
            total: payments.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's payments
exports.getMyPayments = async (req, res) => {
    try {
        const payments = readData('payments');
        const userPayments = payments.filter(p => p.userId === req.user.id);
        res.json({
            success: true,
            payments: userPayments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Retry payment
exports.retryPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = findById('payments', id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed'
            });
        }

        // Reset payment status
        payment.status = 'pending';
        payment.updatedAt = new Date().toISOString();
        updateItem('payments', id, payment);

        // Re-initiate payment
        res.json({
            success: true,
            message: 'Payment retry initiated. Please check your phone for STK Push.',
            payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};