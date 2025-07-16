const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const Stripe = require('stripe');
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json()); // for parsing JSON bodies
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);


app.get('/', (req, res) => {
  res.send('API is running...');
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.post('/create-checkout-session', async (req, res) => {
  const { items } = req.body;

  const line_items = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100), // Stripe expects cents
    },
    quantity: item.qty,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'https://shoppingfrontend-vhf1.onrender.com/success',
      cancel_url: 'https://shoppingfrontend-vhf1.onrender.com/cart',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});



app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
