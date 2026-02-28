const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    deskripsi: { type: String },
    kategori: { type: String, default: 'Makanan' },
    gambar: { type: String, default: 'https://via.placeholder.com/150' },
    stok: { type: Number, default: 10 }
});

module.exports = mongoose.model('Product', ProductSchema);
