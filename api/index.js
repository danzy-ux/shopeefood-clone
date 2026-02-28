require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- KONFIGURASI CLOUDINARY (Membaca dari Environment Variables) ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'di8bpfrsq', 
  api_key: process.env.CLOUDINARY_API_KEY || '131726837168168',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ZZoeUZRkBvMcMnPG2MIYQfpYC4A'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'shopeefood_clone' },
});
const upload = multer({ storage: storage });

const User = require('../models/User'); 
const Product = require('../models/Product'); 
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const app = express();
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI).then(() => console.log(' DATABASE CONNECTED!'));

// API ROUTES (Sama seperti sebelumnya)
app.post('/api/menu', upload.single('gambar'), async (req, res) => {
    try {
        const { nama, harga, deskripsi } = req.body;
        const menuBaru = new Product({ nama, harga, deskripsi, gambar: req.file ? req.file.path : '' });
        await menuBaru.save(); res.json(menuBaru);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/menu', async (req, res) => res.json(await Product.find()));
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) return res.status(401).json({ pesan: 'Salah!' });
    res.json({ user: { id: user._id, nama: user.nama } });
});

app.post('/api/cart', async (req, res) => {
    const { userId, productId, jumlah } = req.body;
    const p = await Product.findById(productId);
    let c = await Cart.findOne({ userId }) || new Cart({ userId, items: [], totalHarga: 0 });
    c.items.push({ productId, nama: p.nama, harga: p.harga, jumlah });
    c.totalHarga = c.items.reduce((a, b) => a + (b.harga * b.jumlah), 0);
    await c.save(); res.json(c);
});

app.get('/api/cart/:userId', async (req, res) => res.json(await Cart.findOne({ userId: req.params.userId }) || { items: [] }));

app.post('/api/checkout', async (req, res) => {
    const c = await Cart.findOne({ userId: req.body.userId });
    const o = new Order({ userId: c.userId, items: c.items, totalHarga: c.totalHarga });
    await o.save(); await Cart.findOneAndDelete({ userId: req.body.userId });
    res.json(o);
});

app.get('/api/orders/:userId', async (req, res) => {
    res.json(await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 }));
});

// --- PENTING: MENGGUNAKAN PORT DINAMIS ---
const PORT = process.env.PORT || 3000;
module.exports = app;

