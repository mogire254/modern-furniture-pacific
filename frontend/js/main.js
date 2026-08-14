// Video Background
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bgVideo');
    if (video) {
        video.play().catch(() => {
            console.log('Video autoplay prevented. User interaction required.');
        });
    }
});

// Close mobile menu on resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const nav = document.querySelector('.nav-links');
        nav.style.display = 'flex';
        nav.style.flexDirection = 'row';
        nav.style.position = 'static';
        nav.style.background = 'transparent';
        nav.style.backdropFilter = 'none';
        nav.style.padding = '0';
        nav.style.gap = '32px';
        nav.style.borderBottom = 'none';
    }
});
