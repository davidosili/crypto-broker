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
  const googleBtn = document.getElementById('googleLogin');
if (googleBtn) {
  googleBtn.addEventListener('click', () => {
    // Redirect user to backend Google auth route
    window.location.href = `${API_URL}/auth/google`;
  });
}
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset previous errors
    loginForm.querySelectorAll("input").forEach(input => {
      input.classList.remove("error-input");
    });
    loginForm.querySelectorAll(".error").forEach(err => {
      err.style.display = "none";
      err.textContent = "";
    });

    // Show loading screen
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const data = {
      username: loginForm.username.value.trim(),
      password: loginForm.password.value.trim(),
    };

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        const role = result.user?.role;

        setTimeout(() => {
          window.location.href = role === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 2000);
      } else {
        // ❌ Show errors inline
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        if (result.message.toLowerCase().includes("username")) {
          const input = loginForm.username;
          input.classList.add("error-input");
          input.parentElement.querySelector(".error").textContent = result.message;
          input.parentElement.querySelector(".error").style.display = "block";
        } else if (result.message.toLowerCase().includes("password")) {
          const input = loginForm.password;
          input.classList.add("error-input");
          input.parentElement.querySelector(".error").textContent = result.message;
          input.parentElement.querySelector(".error").style.display = "block";
        } else {
          // General error under password field
          const input = loginForm.password;
          input.classList.add("error-input");
          input.parentElement.querySelector(".error").textContent = result.message;
          input.parentElement.querySelector(".error").style.display = "block";
        }
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      const input = loginForm.password;
      input.classList.add("error-input");
      input.parentElement.querySelector(".error").textContent = "Login failed. Try again.";
      input.parentElement.querySelector(".error").style.display = "block";
    }
  });
}

console.log("auth.js loaded");

