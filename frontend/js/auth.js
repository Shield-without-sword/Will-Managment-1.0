// auth.js
function toggleForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

// Check if we should show registration form based on URL hash
window.addEventListener('load', () => {
    if (window.location.hash === '#register') {
        toggleForms();
    }
    checkAuth();
});

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
}

// Handle Login
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.email);
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login failed');
    }
});

// Handle Register
document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            toggleForms();
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration failed');
    }
});