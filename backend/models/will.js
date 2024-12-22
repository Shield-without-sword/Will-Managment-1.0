const mongoose = require('mongoose');

const willSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    beneficiaries: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true }
        }
    ],
    assets: [
        {
            name: { type: String, required: true },
            value: { type: Number, required: true },
            type: { type: String, required: true }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Will', willSchema);
