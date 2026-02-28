const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        nama: String,
        harga: Number,
        jumlah: { type: Number, default: 1 }
    }],
    totalHarga: { type: Number, default: 0 }
});

module.exports = mongoose.model('Cart', CartSchema);
