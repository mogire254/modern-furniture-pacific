// In the submitRepair function, update the response message:
res.status(201).json({
    success: true,
    repair,
    message: '✅ Thank you for contacting us! If you need immediate assistance, chat with us via Customer Care in your menu. Thanks again for contacting us!'
});