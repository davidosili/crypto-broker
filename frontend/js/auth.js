// frontend/js/auth.js

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

  window.alert = function(message) {
  console.warn("🔔 ALERT:", message);
};

// Detect if running locally or on production
const API_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000/api'
  : 'https://krypt-broker.onrender.com/api';  // ✅ only one /api

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      username: registerForm.username.value,
      email: registerForm.email.value,
      password: registerForm.password.value,
      role: registerForm.role?.value || 'user'
    };

    const res = await fetch(`${API_URL}/auth/register`, {  // ✅ use API_URL directly
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);

    if (res.ok) {
      const role = result.user?.role;
      window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
    }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading screen
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const data = {
      username: loginForm.username.value,
      password: loginForm.password.value,
    };

    try {
      const res = await fetch(`${API_URL}/auth/login`, {  // ✅ use API_URL directly
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await res.json();
      alert(result.message);

      if (res.ok) {
        const role = result.user?.role;

        // Wait 3 seconds before redirecting
        setTimeout(() => {
          window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 3000);
      } else {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      alert('Login failed. Try again.');
    }
  });
}

console.log("auth.js loaded");

