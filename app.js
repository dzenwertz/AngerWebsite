// ANGER® Streetwear Engine - Ultra Refined V7
// Contact: Luis Angel Cachay (+51 910 255 019)

let productsData = [];
let cart = JSON.parse(localStorage.getItem('anger_cart_v7')) || [];
let wishlist = JSON.parse(localStorage.getItem('anger_wishlist_v7')) || [];
let activeCategory = 'all';
let activeSize = 'all';
let activeSort = 'default';
let currentSlide = 0;
let slideInterval = null;
let toastTimeout = null;

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartBadge = document.getElementById('cartBadge');
const wishlistBadge = document.getElementById('wishlistBadge');

const cartDrawer = document.getElementById('cartDrawer');
const cartBody = document.getElementById('cartBody');
const cartTotalVal = document.getElementById('cartTotalVal');
const checkoutWhatsappBtn = document.getElementById('checkoutWhatsappBtn');

const wishlistDrawer = document.getElementById('wishlistDrawer');
const wishlistBody = document.getElementById('wishlistBody');

const quickModal = document.getElementById('quickModal');
const modalContent = document.getElementById('modalContent');

const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchResultsList = document.getElementById('searchResultsList');

const toastBanner = document.getElementById('toastBanner');
const floatingCartPill = document.getElementById('floatingCartPill');
const floatingCartCount = document.getElementById('floatingCartCount');
const floatingCartTotal = document.getElementById('floatingCartTotal');

const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

// Initialize on Load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts();
    setupFilters();
    setupEventListeners();
    setupHeroSlider();
    updateUI();
});

// Global Drawer Controls
window.openCart = function() {
    if (cartDrawer) cartDrawer.classList.add('active');
};

window.closeCart = function() {
    if (cartDrawer) cartDrawer.classList.remove('active');
};

window.openWishlist = function() {
    if (wishlistDrawer) wishlistDrawer.classList.add('active');
};

window.closeWishlist = function() {
    if (wishlistDrawer) wishlistDrawer.classList.remove('active');
};

window.openSearchModal = function() {
    if (searchModal) {
        searchModal.classList.add('active');
        setTimeout(() => searchInput?.focus(), 100);
    }
};

window.closeSearchModal = function() {
    if (searchModal) searchModal.classList.remove('active');
};

window.closeQuickModal = function() {
    if (quickModal) quickModal.classList.remove('active');
};

// Hero Slider
function setupHeroSlider() {
    startSlideTimer();
}

function startSlideTimer() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        const slides = document.querySelectorAll('.slide');
        if (!slides.length) return;
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }, 5000);
}

window.goToSlide = function(index) {
    currentSlide = index;
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot-btn');

    slides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === index);
    });

    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
    });

    startSlideTimer();
};

async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        productsData = await response.json();
    } catch (err) {
        console.error('Error fetching products.json:', err);
    }
    renderProducts();
}

function renderProducts() {
    if (!productsGrid) return;

    let items = [...productsData];

    if (activeCategory !== 'all') {
        items = items.filter(p => p.category === activeCategory);
    }

    if (activeSize !== 'all') {
        items = items.filter(p => p.sizes.includes(activeSize));
    }

    if (activeSort === 'low-high') {
        items.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'high-low') {
        items.sort((a, b) => b.price - a.price);
    }

    if (items.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; font-family: var(--font-heading); font-weight: 800; color: #888;">
                NO SE ENCONTRARON PRODUCTOS CON ESOS FILTROS.
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = items.map(p => {
        const isWished = wishlist.includes(p.id);
        const hasHoverDiff = p.secondaryImage && p.secondaryImage !== p.image;
        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-image-box">
                    <span class="badge-tag">${p.badge}</span>
                    <button class="wish-btn ${isWished ? 'active' : ''}" onclick="toggleWishlist('${p.id}')">
                        <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <img src="${p.image}" alt="${p.title}" class="p-img p-img-main">
                    ${hasHoverDiff ? `<img src="${p.secondaryImage}" alt="${p.title}" class="p-img p-img-hover">` : ''}
                    <button class="quick-btn" onclick="openQuickModal('${p.id}')">VISTA RÁPIDA</button>
                </div>
                <div class="product-info">
                    <span class="p-cat">${p.category}</span>
                    <h3 class="p-title">${p.title}</h3>
                    <div class="p-price-row">
                        <span class="p-price">S/ ${Number(p.price).toFixed(2)}</span>
                        <button class="add-btn" onclick="addToCart('${p.id}')">
                            <i class="fa-solid fa-plus"></i> AGREGAR
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupFilters() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.getAttribute('data-cat');
            renderProducts();
        });
    });

    document.getElementById('sizeFilter')?.addEventListener('change', (e) => {
        activeSize = e.target.value;
        renderProducts();
    });

    document.getElementById('sortFilter')?.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderProducts();
    });
}

window.filterByCategory = function(catName) {
    activeCategory = catName;
    document.querySelectorAll('.chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-cat') === catName);
    });
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    renderProducts();
};

window.openQuickModal = function(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    let selectedSize = product.sizes[0];

    modalContent.innerHTML = `
        <div style="aspect-ratio: 3/4; border-radius: 8px; overflow: hidden; background: #f8f8f8;">
            <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div>
            <span class="p-cat">${product.category}</span>
            <h3 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 900; text-transform: uppercase; margin: 6px 0;">${product.title}</h3>
            <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 900; color: var(--accent-red); margin-bottom: 16px;">S/ ${Number(product.price).toFixed(2)}</div>
            <p style="color: #444; font-size: 0.95rem; margin-bottom: 20px;">${product.description}</p>
            
            <div style="margin-bottom: 20px;">
                <label style="font-family: var(--font-heading); font-size: 0.8rem; font-weight: 900; text-transform: uppercase; display: block; margin-bottom: 8px;">SELECCIONAR TALLA:</label>
                <div style="display: flex; gap: 8px;">
                    ${product.sizes.map(s => `
                        <button class="chip ${s === selectedSize ? 'active' : ''}" onclick="selectModalSize('${s}')">${s}</button>
                    `).join('')}
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <h5 style="font-family: var(--font-heading); font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">ESPECIFICACIONES TÉCNICAS:</h5>
                <ul style="padding-left: 18px; font-size: 0.85rem; color: #555;">
                    ${product.specs.map(spec => `<li>${spec}</li>`).join('')}
                </ul>
            </div>

            <button class="btn btn-white" style="background: #111; color: #fff; width: 100%; border-radius: 30px;" onclick="addFromModal('${product.id}')">
                <i class="fa-solid fa-bag-shopping"></i> AGREGAR AL CARRITO
            </button>
        </div>
    `;

    quickModal.classList.add('active');

    window.selectModalSize = function(size) {
        selectedSize = size;
        modalContent.querySelectorAll('.chip').forEach(btn => {
            btn.classList.toggle('active', btn.innerText === size);
        });
    };

    window.addFromModal = function(id) {
        addToCart(id, selectedSize);
        closeQuickModal();
    };
};

window.toggleWishlist = function(id) {
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(i => i !== id);
    } else {
        wishlist.push(id);
    }
    localStorage.setItem('anger_wishlist_v7', JSON.stringify(wishlist));
    updateUI();
    renderProducts();
};

window.addToCart = function(id, customSize = null) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    const size = customSize || product.sizes[0];
    const key = `${id}-${size}`;

    const existing = cart.find(item => item.key === key);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            key,
            id: product.id,
            title: product.title,
            price: Number(product.price),
            image: product.image,
            size: size,
            qty: 1
        });
    }

    saveCart();
    updateUI();
    showToastNotification(product);
    triggerPillPulse();
};

function showToastNotification(product) {
    if (!toastBanner) return;

    toastBanner.innerHTML = `
        <img src="${product.image}" class="toast-img">
        <div class="toast-info">
            <div><strong>✓ AGREGADO AL CARRITO</strong></div>
            <div style="font-size: 0.75rem; color: #ccc;">${product.title}</div>
        </div>
        <button class="toast-view-btn" onclick="openCart(); hideToast();">VER CARRITO</button>
    `;

    toastBanner.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        hideToast();
    }, 3500);
}

window.hideToast = function() {
    toastBanner?.classList.remove('active');
};

function triggerPillPulse() {
    if (!floatingCartPill) return;
    floatingCartPill.classList.remove('pulse');
    void floatingCartPill.offsetWidth; // force browser layout recalculation
    floatingCartPill.classList.add('pulse');
}

function saveCart() {
    localStorage.setItem('anger_cart_v7', JSON.stringify(cart));
}

function updateUI() {
    const totalQty = cart.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const grandTotal = cart.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0);

    if (cartBadge) cartBadge.innerText = totalQty;
    if (wishlistBadge) wishlistBadge.innerText = wishlist.length;

    if (floatingCartCount) floatingCartCount.innerText = totalQty;
    if (floatingCartTotal) floatingCartTotal.innerText = `S/ ${grandTotal.toFixed(2)}`;

    // Update Wishlist Body
    if (wishlistBody) {
        if (wishlist.length === 0) {
            wishlistBody.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; font-family: var(--font-heading); font-weight: 800; color: #888;">
                    NO TIENES FAVORITOS GUARDADOS.
                </div>
            `;
        } else {
            const wishedProducts = productsData.filter(p => wishlist.includes(p.id));
            wishlistBody.innerHTML = wishedProducts.map(p => `
                <div class="drawer-item">
                    <img src="${p.image}" alt="${p.title}" class="drawer-item-img">
                    <div class="drawer-item-info">
                        <div>
                            <div class="drawer-item-title">${p.title}</div>
                            <div style="font-size: 0.8rem; color: #666;">${p.category}</div>
                        </div>
                        <div class="drawer-item-price">S/ ${Number(p.price).toFixed(2)}</div>
                        <button class="add-btn" style="padding: 4px 10px; font-size: 0.7rem;" onclick="addToCart('${p.id}'); toggleWishlist('${p.id}');">
                            <i class="fa-solid fa-bag-shopping"></i> MOVER AL CARRITO
                        </button>
                    </div>
                    <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #888;" onclick="toggleWishlist('${p.id}')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `).join('');
        }
    }

    // Update Cart Body
    if (!cartBody) return;

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; font-family: var(--font-heading); font-weight: 800; color: #888;">
                TU CARRITO ESTÁ VACÍO.
            </div>
        `;
        if (cartTotalVal) cartTotalVal.innerText = 'S/ 0.00';
        return;
    }

    cartBody.innerHTML = cart.map(item => {
        const itemPrice = Number(item.price) || 0;
        const itemQty = Number(item.qty) || 0;
        const subtotal = itemPrice * itemQty;

        return `
            <div class="drawer-item">
                <img src="${item.image}" alt="${item.title}" class="drawer-item-img">
                <div class="drawer-item-info">
                    <div>
                        <div class="drawer-item-title">${item.title}</div>
                        <div style="font-size: 0.8rem; color: #666;">Talla: <strong>${item.size}</strong></div>
                    </div>
                    <div class="drawer-item-price">S/ ${subtotal.toFixed(2)}</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="add-btn" style="padding: 2px 8px;" onclick="changeQty('${item.key}', -1)">-</button>
                        <span style="font-family: var(--font-heading); font-weight: 900;">${itemQty}</span>
                        <button class="add-btn" style="padding: 2px 8px;" onclick="changeQty('${item.key}', 1)">+</button>
                    </div>
                </div>
                <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #888;" onclick="removeCartItem('${item.key}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;
    }).join('');

    if (cartTotalVal) cartTotalVal.innerText = `S/ ${grandTotal.toFixed(2)}`;
}

window.changeQty = function(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.key !== key);
    }
    saveCart();
    updateUI();
};

window.removeCartItem = function(key) {
    cart = cart.filter(i => i.key !== key);
    saveCart();
    updateUI();
};

function setupEventListeners() {
    mobileToggle?.addEventListener('click', () => navLinks?.classList.toggle('active'));

    // Live Instant Search Engine
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            searchResultsList.innerHTML = '';
            return;
        }

        const matches = productsData.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.category.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            searchResultsList.innerHTML = `<div style="padding: 20px; text-align: center; color: #888; font-family: var(--font-heading); font-weight: 800;">NO SE ENCONTRARON PRODUCTOS COINCIDENTES</div>`;
            return;
        }

        searchResultsList.innerHTML = matches.map(m => `
            <div class="search-result-item" onclick="openQuickModal('${m.id}'); closeSearchModal();">
                <img src="${m.image}" class="search-result-img">
                <div class="search-result-info">
                    <div class="search-result-title">${m.title}</div>
                    <div style="font-size: 0.75rem; color: #666;">${m.category}</div>
                </div>
                <div class="search-result-price">S/ ${Number(m.price).toFixed(2)}</div>
            </div>
        `).join('');
    });

    checkoutWhatsappBtn?.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Agrega al menos un producto al carrito para continuar.');
            return;
        }

        let msg = `¡Hola Luis Angel! ⚡ Vengo de la tienda web oficial de *ANGER® STREETWEAR* y quiero realizar este pedido:\n\n`;
        let total = 0;

        cart.forEach((i, index) => {
            const sub = (Number(i.price) || 0) * (Number(i.qty) || 0);
            total += sub;
            msg += `${index + 1}. *${i.title}*\n   • Talla: ${i.size}\n   • Cantidad: ${i.qty}\n   • Subtotal: S/ ${sub.toFixed(2)}\n\n`;
        });

        msg += `*TOTAL ESTIMADO:* S/ ${total.toFixed(2)}\n\n`;
        msg += `Por favor compárteme la información de pago (Yape / Plin / BCP) para coordinar el envío vía Shalom / Olva. ¡Muchas gracias!`;

        const encoded = encodeURIComponent(msg);
        const phone = "51910255019"; // Luis Angel Cachay
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    });
}
