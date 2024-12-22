// models/asset.js
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    realEstateProperties: [{
        propertyName: { type: String, required: true },
        location: { type: String, required: true },
        estimatedValue: { type: Number, required: true },
        ownershipType: { type: String, required: true }
    }],
    bankAccounts: [{
        bankName: { type: String, required: true },
        accountType: { type: String, required: true },
        accountNumber: { type: String, required: true },
        currentBalance: { type: Number, required: true }
    }],
    investments: [{
        investmentType: {
            type: String,
            enum: ['stocks', 'bonds', 'mutualFunds', 'crypto', 'other'],
            required: true
        },
        investmentName: { type: String, required: true },
        currentValue: { type: Number, required: true },
        details: String
    }],
    otherAssets: [{
        description: { type: String, required: true },
        estimatedValue: { type: Number, required: true },
        additionalDetails: String
    }],
    totalValue: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);