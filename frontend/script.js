document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const navAuth = document.getElementById('navAuth');

    // --- SHARED AUTH STATE LOGIC ---
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('email');

    if (navAuth) {
        if (token) {
            navAuth.innerHTML = `<span>Welcome, ${userEmail}</span> <a href="#" id="logoutBtn">Logout</a>`;
            document.getElementById('logoutBtn').addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'login.html';
            });
        } else {
            navAuth.innerHTML = `<a href="login.html">Login</a> <a href="register.html">Register</a>`;
        }
    }

    // --- SIGN UP SUBMIT ---
    const regForm = document.getElementById('regForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                alert(data.error || 'Registration failed');
            }
        });
    }

    // --- LOGIN SUBMIT ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('email', data.email);
                window.location.href = 'index.html';
            } else {
                alert(data.error || 'Login failed');
            }
        });
    }

    // --- FETCH PRODUCTS CATALOG ---
    if (productsContainer) {
        fetch('/api/products')
            .then(res => res.json())
            .then(products => {
                productsContainer.innerHTML = '';
                if (products.length === 0) {
                    productsContainer.innerHTML = '<p>No products dynamically synced yet.</p>';
                    return;
                }
                products.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p class="price">$${Number(product.price).toFixed(2)}</p>
                        <button class="btn">Add to Cart</button>
                    `;
                    productsContainer.appendChild(card);
                });
            })
            .catch(err => {
                productsContainer.innerHTML = '<p style="color:red;">Error syncing catalog from backend.</p>';
            });
    }
});
