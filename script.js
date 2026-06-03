// --- 1. ÉTAT DU PANIER ---
let cart = [];

// --- 2. SÉLECTION DES ÉLÉMENTS ---
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const btnCartToggle = document.getElementById('cart-toggle');
const btnCloseCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total-price');

// --- 3. OUVERTURE / FERMETURE DU TIROIR ---
function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

// Écouteurs d'événements pour le tiroir
btnCartToggle.addEventListener('click', openCart);
btnCloseCart.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// --- 4. LOGIQUE D'AJOUT AU PANIER ---
document.querySelectorAll('.btn-add-cart').forEach(button => {
  button.addEventListener('click', (e) => {
    const id = e.target.getAttribute('data-id');
    const name = e.target.getAttribute('data-name');
    const price = parseFloat(e.target.getAttribute('data-price'));

    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, quantity: 1 });
    }
    
    updateCartUI();
    openCart();
  });
});

// --- 5. MODIFIER LA QUANTITÉ ---
window.updateQuantity = function(productId, delta) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      // Supprimer l'article si la quantité tombe à zéro
      cart = cart.filter(i => i.id !== productId);
    }
  }
  updateCartUI();
};

// --- 6. MISE À JOUR DE L'INTERFACE VISUELLE ---
function updateCartUI() {
  // Mettre à jour la pastille sur le bouton du menu
  cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Vider la liste actuelle du tiroir
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Votre besace est vide pour le moment.</p>';
    cartTotal.textContent = '0.00';
    return;
  }

  let totalPrice = 0;

  // Créer les lignes pour chaque produit dans le panier
  cart.forEach(item => {
    totalPrice += item.price * item.quantity;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} €</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });

  // Mettre à jour le prix total
  cartTotal.textContent = totalPrice.toFixed(2);
}

// --- 7. CONNEXION À STRIPE (LE DÉPART DU COURSIER) ---
document.getElementById('checkout-btn').addEventListener('click', async () => {
  if (cart.length === 0) {
    alert("Votre besace est vide. Remplissez-la d'épices d'abord !");
    return;
  }
  
  const btn = document.getElementById('checkout-btn');
  btn.textContent = "Préparation de l'obole...";
  btn.disabled = true;

  try {
    // Le messager part vers notre serveur Node.js local
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // On envoie un tableau propre avec l'ID Stripe (price_...) et la quantité
      body: JSON.stringify({
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity
        }))
      }),
    });

    const data = await response.json();

    if (data.url) {
      // Si le serveur nous renvoie une URL Stripe, le portail s'ouvre !
      window.location.href = data.url;
    } else {
      console.error("Erreur serveur:", data.error);
      alert("Une erreur est survenue lors de la création du paiement.");
      btn.textContent = "Passer commande ✦";
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Erreur de connexion:", error);
    alert("Le messager n'a pas pu joindre la banque. Vérifiez que la fenêtre noire tourne !");
    btn.textContent = "Passer commande ✦";
    btn.disabled = false;
  }
});