const router = require('express').Router();
const User = require('../models/User');

// Get all users (Admin only - in production, add authentication middleware)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Search for users
router.get('/search', async (req, res) => {
    const query = req.query.q;
    const currentUserId = req.query.currentUserId;

    try {
        const users = await User.find({
            name: { $regex: query, $options: 'i' }, // case-insensitive search
            _id: { $ne: currentUserId } // exclude current user
        }).limit(10);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});


// Get a user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Update user profile (name and avatar)
router.put('/:id', async (req, res) => {
    try {
        const { name, avatar } = req.body;
        
        // Validate input
        if (!name && !avatar) {
            return res.status(400).json({ message: 'Please provide at least one field to update' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (avatar) updateData.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Make a user admin by email
router.post('/make-admin', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Update user role to admin
        user.role = 'admin';
        await user.save();

        res.status(200).json({ 
            message: 'User successfully promoted to admin',
            user: user 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
