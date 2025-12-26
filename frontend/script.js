document.addEventListener("DOMContentLoaded", () => {
    
    /* ===========================
       1. TYPEWRITER EFFECT
       =========================== */
    const typeTextElement = document.getElementById('typewriter');
    const phrases = ["Trade Bitcoin Instantly", "Secure Your Future", "Low Fees, High Speed", "Join 2M+ Traders"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function typeWriter() {
        if (!typeTextElement) return;

        const currentPhrase = phrases[phraseIndex];
        
        // Safety check
        if (charIndex < 0) charIndex = 0;

        if (isDeleting) {
            typeTextElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; 
        } else {
            typeTextElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000; 
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }

        setTimeout(typeWriter, typeSpeed);
    }
    typeWriter();

    /* ===========================
       2. THREE.JS PARTICLES
       =========================== */
    const initThreeJS = () => {
        const container = document.getElementById('three-container');
        if (!container) return;

        // Mobile optimization: fewer particles
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 300 : 800;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        container.appendChild(renderer.domElement);

        const geometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particleCount * 3);

        for(let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0x00ffe7,
            transparent: true,
            opacity: 0.8
        });

        const particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);

        camera.position.z = 3;

        // Mouse Parallax
        let mouseX = 0;
        let mouseY = 0;

        // Throttled event listener
        let timeout;
        window.addEventListener('mousemove', (event) => {
            if (timeout) return;
            timeout = setTimeout(() => {
                mouseX = event.clientX / window.innerWidth - 0.5;
                mouseY = event.clientY / window.innerHeight - 0.5;
                timeout = null;
            }, 10);
        });

        const animate = () => {
            requestAnimationFrame(animate);
            particlesMesh.rotation.y += 0.001;
            
            // Reduced parallax effect on mobile
            const sensitivity = isMobile ? 0.02 : 0.05;
            particlesMesh.rotation.y += sensitivity * (mouseX - particlesMesh.rotation.y);
            particlesMesh.rotation.x += sensitivity * (mouseY - particlesMesh.rotation.x);

            renderer.render(scene, camera);
        };

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };
    initThreeJS();

    /* ===========================
       3. LIVE CRYPTO PRICES
       =========================== */
    const prevPrices = {}; // Store for color comparison

    const updatePrices = async () => {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
            if(!response.ok) throw new Error('API limit');
            
            const data = await response.json();
            
            updateTickerItem('btc', data.bitcoin.usd);
            updateTickerItem('eth', data.ethereum.usd);
            updateTickerItem('sol', data.solana.usd);

        } catch (error) {
            // Quiet failure/fallback
        }
    };

    function updateTickerItem(id, currentPrice) {
        const el = document.getElementById(`${id}-price`);
        if(!el) return;

        const prev = prevPrices[id] || currentPrice;
        const colorClass = currentPrice >= prev ? 'text-green-400' : 'text-red-400';
        
        // Store for next update
        prevPrices[id] = currentPrice;

        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentPrice);
        
        el.textContent = formatted;
        el.className = `font-mono font-bold ${colorClass}`;
    }
    
    updatePrices();
    setInterval(updatePrices, 30000); 

    /* ===========================
       4. MOBILE MENU & UI
       =========================== */
    const hamburger = document.getElementById('hamburger');
    const closeMenu = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('translate-x-full');
        document.body.classList.toggle('overflow-hidden');
    };

    hamburger.addEventListener('click', toggleMenu);
    closeMenu.addEventListener('click', toggleMenu);
    
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target) && !mobileMenu.classList.contains('translate-x-full')) {
            toggleMenu();
        }
    });

    // Newsletter Handling
    document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Thanks for subscribing!"); // Replace with real logic/toast
    });

    /* ===========================
       5. SCROLL REVEAL & STATS
       =========================== */
    
    // Reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

    // Stats Counter
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                const duration = 2000; 
                const increment = target / (duration / 16); 
                
                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    // Prevent overshoot using Math.min
                    if (current < target) {
                        entry.target.innerText = Math.ceil(current).toLocaleString();
                        requestAnimationFrame(updateCounter);
                    } else {
                        entry.target.innerText = target.toLocaleString();
                    }
                };
                updateCounter();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(stat => statsObserver.observe(stat));

    // Back to Top
    const backBtn = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backBtn.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            backBtn.classList.add('opacity-0', 'pointer-events-none');
        }
    });

    backBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
