require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;

    const lineItems = items.map((item) => {
      return {
        price: item.id,
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: 'https://lacornedabondance-debug.github.io/la-corne-abondance-digital/success.html',
      cancel_url: 'https://lacornedabondance-debug.github.io/la-corne-abondance-digital/cancel.html',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Erreur Stripe :", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✦ Le serveur de la guilde tourne sur le port ${PORT} ✦`);
});
