// ============================================
// MAIN APPLICATION - 100 YEAR TOKEN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Video background
    const video = document.getElementById('bgVideo');
    if (video) {
        video.play().catch(() => console.log('Video autoplay prevented'));
    }

    // Check authentication with 100-year token support
    checkAuthAndRedirect();

    // Load contact info
    loadContactInfo();
});

// ===== CHECK AUTHENTICATION - 100 YEAR TOKEN =====
function checkAuthAndRedirect() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const expiry = localStorage.getItem('tokenExpiry');
    
    // Protected pages list
    const protectedPages = ['dashboard.html', 'profile.html', 'cart.html', 'checkout.html'];
    const currentPage = window.location.pathname.split('/').pop();
    const isProtectedPage = protectedPages.includes(currentPage);
    
    // If no token or user, redirect if on protected page
    if (!token || !user) {
        if (isProtectedPage) {
            window.location.href = '/pages/login.html';
        }
        return;
    }
    
    // Check if token is marked as 'never' expiring (100 years!)
    if (expiry === 'never') {
        // 100-year token - always valid
        console.log('✅ 100-year token is active');
        updateUserUI();
        return;
    }
    
    // Legacy token - check if expired
    if (expiry) {
        try {
            if (new Date(expiry) < new Date()) {
                // Token expired - logout
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('tokenExpiry');
                if (isProtectedPage) {
                    window.location.href = '/pages/login.html';
                }
                return;
            }
        } catch (e) {
            // Error checking expiry - logout
            localStorage.clear();
            if (isProtectedPage) {
                window.location.href = '/pages/login.html';
            }
            return;
        }
    }
    
    // No expiry set but token exists - assume valid for now
    updateUserUI();
}

// ===== UPDATE USER UI =====
function updateUserUI() {
    if (auth.user) {
        const userName = document.getElementById('userName');
        const welcomeName = document.getElementById('welcomeName');
        const userAvatar = document.getElementById('userAvatar');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');

        if (userName) userName.textContent = auth.user.name || 'User';
        if (welcomeName) welcomeName.textContent = auth.user.name || 'User';
        if (profileName) profileName.value = auth.user.name || '';
        if (profileEmail) profileEmail.value = auth.user.email || '';
        if (profilePhone) profilePhone.value = auth.user.phone || '';
        if (userAvatar && auth.user.profileImage) {
            userAvatar.src = auth.user.profileImage;
        }
    }
}

// ===== LOAD CONTACT INFO =====
function loadContactInfo() {
    const contactData = {
        whatsapp: '+254 716 335 555',
        email: 'info@modernfurniturepacificltd.com',
        location: 'Ruiru, Behind Spur Mall',
        phone: '0716 335555',
        hoursWeek: '9:00AM - 10:00PM',
        hoursSun: '10:00AM - 6:00PM'
    };

    // Update contact elements
    document.querySelectorAll('.contact-whatsapp').forEach(el => el.textContent = contactData.whatsapp);
    document.querySelectorAll('.contact-email').forEach(el => el.textContent = contactData.email);
    document.querySelectorAll('.contact-location').forEach(el => el.textContent = contactData.location);
    document.querySelectorAll('.contact-phone').forEach(el => el.textContent = contactData.phone);
    document.querySelectorAll('.contact-hours-week').forEach(el => el.textContent = contactData.hoursWeek);
    document.querySelectorAll('.contact-hours-sun').forEach(el => el.textContent = contactData.hoursSun);
}