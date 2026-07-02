document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('products-container');

    // Dynamic fallback to the current domain to play nice with cluster routing proxies
    const BACKEND_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/products' 
        : '/api/products'; 

    fetch(BACKEND_URL)
        .then(response => response.json())
        .then(products => {
            if(products.length === 0) {
                container.innerHTML = '<p>No products found.</p>';
                return;
            }
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price">$${product.price}</p>
                    <button class="btn">Add to Cart</button>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Error fetching products:', err);
            container.innerHTML = '<p style="color:red;">Failed to load products. Check backend connectivity.</p>';
        });
});
