// server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const stream = require('stream');
require('dotenv').config();
const multer = require('multer');
const pinataSDK = require('@pinata/sdk'); 
const FormData = require('form-data');

const app = express();
const authMiddleware = require('./middleware/auth');
const Will = require('./models/Will');
const Asset = require('./models/asset');

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Pinata client
const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
);

// File upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const readableStreamForFile = new stream.Readable();
        readableStreamForFile._read = () => {}; // _read is required but you can noop it
        readableStreamForFile.push(req.file.buffer);
        readableStreamForFile.push(null); // end the stream

        const options = {
            pinataMetadata: {
                name: req.file.originalname // Ensure the filename is provided here
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        res.json(result);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Error uploading file to IPFS', error: err.message });
    }
});


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Routes

// User Registration
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'User registered successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// User Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            email: user.email,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Asset Declaration
app.post('/api/assets/declare', authMiddleware, async (req, res) => {
    try {
        const { realEstateProperties, bankAccounts, investments, otherAssets } = req.body;

        // Calculate total value
        const calculateTotal = (items) => {
            return items.reduce((sum, item) => {
                return sum + (item.estimatedValue || item.currentValue || 0);
            }, 0);
        };

        const totalValue = 
            calculateTotal(realEstateProperties || []) +
            calculateTotal(bankAccounts || []) +
            calculateTotal(investments || []) +
            calculateTotal(otherAssets || []);

        // Find existing asset declaration or create new one
        let assetDeclaration = await Asset.findOneAndUpdate(
            { userId: req.userId },
            {
                userId: req.userId,
                realEstateProperties,
                bankAccounts,
                investments,
                otherAssets,
                totalValue,
                lastUpdated: Date.now()
            },
            { new: true, upsert: true }
        );

        res.status(201).json({
            message: 'Asset declaration saved successfully',
            asset: assetDeclaration
        });
    } catch (error) {
        console.error('Asset declaration error:', error);
        res.status(500).json({ message: 'Failed to save asset declaration', error: error.message });
    }
});

// Get Current Asset Declaration
app.get('/api/assets/current', authMiddleware, async (req, res) => {
    try {
        const assetDeclaration = await Asset.findOne({ userId: req.userId });
        
        if (!assetDeclaration) {
            return res.status(404).json({ message: 'No asset declaration found' });
        }

        res.json({ asset: assetDeclaration });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch asset declaration' });
    }
});

// Update Asset Category
app.patch('/api/assets/update/:category', authMiddleware, async (req, res) => {
    try {
        const { category } = req.params;
        const updateData = req.body;

        if (!['realEstateProperties', 'bankAccounts', 'investments', 'otherAssets'].includes(category)) {
            return res.status(400).json({ message: 'Invalid asset category' });
        }

        const update = {
            [category]: updateData,
            lastUpdated: Date.now()
        };

        const assetDeclaration = await Asset.findOneAndUpdate(
            { userId: req.userId },
            { $set: update },
            { new: true, upsert: true }
        );

        res.json({
            message: `${category} updated successfully`,
            asset: assetDeclaration
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update asset category', error: error.message });
    }
});

// Will Creation
app.post('/api/will/create', authMiddleware, async (req, res) => {
    try {
        const { fullName, beneficiaries, assets } = req.body;

        const will = await Will.create({
            userId: req.userId,
            fullName,
            beneficiaries,
            assets
        });

        res.status(201).json(will);
    } catch (error) {
        console.error('Will creation error:', error);
        res.status(500).json({ message: 'Failed to create will', error });
    }
});

// Get Current Will
app.get('/api/will/current', authMiddleware, async (req, res) => {
    try {
        const will = await Will.findOne({ userId: req.userId }).sort({ createdAt: -1 });
        if (!will) {
            return res.status(404).json({ message: 'No will found' });
        }
        res.json({ will });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch will' });
    }
});

// File Upload to IPFS
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Create a readable stream directly from the buffer in memory
        const readableStreamForFile = new stream.Readable();
        readableStreamForFile._read = () => {}; // _read is required but you can noop it
        readableStreamForFile.push(req.file.buffer);
        readableStreamForFile.push(null); // end the stream

        const options = {
            pinataMetadata: {
                name: req.file.originalname // Ensure the filename is provided here
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        // Upload the file to Pinata
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);

        // Return the result to the client
        res.json(result);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ message: 'Error uploading file to IPFS', error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
