// Krypt Landing Page - JS

// Crypto price ticker fetch (mocked for demo, replace with real API for production)
function updateTicker() {
    // Example: Replace with real API calls for live prices
    document.getElementById('btc-price').textContent = '$67,200';
    document.getElementById('eth-price').textContent = '$3,500';
    document.getElementById('sol-price').textContent = '$145';
}
setInterval(updateTicker, 5000);
updateTicker();

// Newsletter form
const newsletterForm = document.querySelector('.newsletter-form');
if(newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for subscribing to Krypt updates!');
        this.reset();
    });
}

// Contact form
const contactForm = document.getElementById('contact-form');
if(contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for contacting Krypt! We will get back to you soon.');
        this.reset();
    });
}

// 3D Floating Network/Particles (Three.js)
function init3DNetwork() {
    const container = document.getElementById('three-network-container');
    if (!container) return;
    container.innerHTML = '';
    // Make the effect cover the hero section
    const hero = document.querySelector('.hero');
    const width = hero ? hero.offsetWidth : window.innerWidth;
    const height = hero ? hero.offsetHeight : 350;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    container.style.zIndex = '0';
    container.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);
    // Particles only (no lines)
    const particles = new THREE.Group();
    for (let i = 0; i < 60; i++) {
        const geometry = new THREE.SphereGeometry(0.13, 10, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ffe7, opacity: 0.5, transparent: true });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
        );
        particles.add(sphere);
    }
    scene.add(particles);
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    camera.position.z = 18;
    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.0015;
        renderer.render(scene, camera);
    }
    animate();
    // Responsive resize
    window.addEventListener('resize', () => {
        const hero = document.querySelector('.hero');
        const width = hero ? hero.offsetWidth : window.innerWidth;
        const height = hero ? hero.offsetHeight : 350;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        container.style.width = width + 'px';
        container.style.height = height + 'px';
    });
}

// Scroll reveal effect for sections
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    const windowHeight = window.innerHeight;
    reveals.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < windowHeight - 80) {
            section.classList.add('visible');
        } else {
            section.classList.remove('visible');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
// Wait for DOM to be ready and hero to be sized
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(init3DNetwork, 200);
    // Typewriter effect for hero headline
    const typewriter = document.getElementById('hero-typewriter');
    if (typewriter) {
        const text = 'Welcome to Krypt';
        let i = 0;
        function type() {
            if (i <= text.length) {
                typewriter.textContent = text.slice(0, i);
                i++;
                setTimeout(type, 80);
            }
        }
        type();
    }
    revealOnScroll();
    // Back to Top
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    // Scroll Progress Bar
    const scrollProgress = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = percent + '%';
    });
    // Floating Chat Button
    const chatFab = document.getElementById('chat-fab');
    chatFab.addEventListener('click', () => {
        alert('Chat support coming soon!');
    });
    // Animated counters for stats section
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const isPercent = counter.textContent.includes('%') || counter.nextElementSibling?.textContent.includes('Uptime');
            let count = 0;
            let step = Math.max(1, Math.floor(target / 100));
            if (isPercent) step = 0.1;
            function update() {
                if (count < target) {
                    count += step;
                    if (isPercent) {
                        counter.textContent = (count > target ? target : count).toFixed(2);
                    } else {
                        counter.textContent = Math.floor(count).toLocaleString();
                    }
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = isPercent ? target.toFixed(2) : target.toLocaleString();
                }
            }
            update();
        });
    }
    window.addEventListener('scroll', () => {
        const statsSection = document.querySelector('.stats');
        if (statsSection && statsSection.getBoundingClientRect().top < window.innerHeight - 80) {
            animateCounters();
        }
    }, { once: true });
});
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('nav ul');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });
