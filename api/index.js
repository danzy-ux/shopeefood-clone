require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- 1. KONFIGURASI CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'shopeefood_clone' },
});
const upload = multer({ storage: storage });

// --- 2. IMPORT MODELS (Huruf kecil sesuai GitHub kamu) ---
const User = require('../models/user'); 
const Product = require('../models/product'); 
const Cart = require('../models/cart');
const Order = require('../models/order');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- 3. KONEKSI DATABASE ---
// Gunakan variabel agar koneksi tidak dibuat berulang kali (Best practice Vercel)
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGO_URI);
  cachedDb = db;
  console.log('✅ DATABASE CONNECTED!');
  return db;
}

// Middleware untuk memastikan DB konek setiap ada request
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// --- 4. API ROUTES ---

// Tambah Menu
app.post('/api/menu', upload.single('gambar'), async (req, res) => {
    try {
        const { nama, harga, deskripsi } = req.body;
        const menuBaru = new Product({ 
            nama, 
            harga, 
            deskripsi, 
            gambar: req.file ? req.file.path : '' 
        });
        await menuBaru.save(); 
        res.json(menuBaru);
    } catch (e) { res.status(500).send(e.message); }
});

// Ambil Menu
app.get('/api/menu', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (e) { res.status(500).send(e.message); }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(401).json({ pesan: 'Email atau Password Salah!' });
        res.json({ user: { id: user._id, nama: user.nama } });
    } catch (e) { res.status(500).send(e.message); }
});

// Tambah ke Keranjang
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, productId, jumlah } = req.body;
        const p = await Product.findById(productId);
        let c = await Cart.findOne({ userId }) || new Cart({ userId, items: [], totalHarga: 0 });
        c.items.push({ productId, nama: p.nama, harga: p.harga, jumlah });
        c.totalHarga = c.items.reduce((a, b) => a + (b.harga * b.jumlah), 0);
        await c.save(); 
        res.json(c);
    } catch (e) { res.status(500).send(e.message); }
});

// Ambil Keranjang
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        res.json(cart || { items: [] });
    } catch (e) { res.status(500).send(e.message); }
});

// Checkout
app.post('/api/checkout', async (req, res) => {
    try {
        const c = await Cart.findOne({ userId: req.body.userId });
        if(!c) return res.status(400).json({ pesan: "Keranjang kosong" });
        const o = new Order({ userId: c.userId, items: c.items, totalHarga: c.totalHarga });
        await o.save(); 
        await Cart.findOneAndDelete({ userId: req.body.userId });
        res.json(o);
    } catch (e) { res.status(500).send(e.message); }
});

// Ambil Status Pesanan
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (e) { res.status(500).send(e.message); }
});

// --- 5. EXPORT UNTUK VERCEL ---
module.exports = app;
