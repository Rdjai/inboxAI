const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists with this email'
            });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            role: role || 'agent'
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: error.message || 'Registration failed'
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔍 Login request received:', { email, password });
        console.log('🔍 Request body:', req.body);
        console.log('🔍 Email type:', typeof email);

        // Validate input
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Email is required and must be a string'
            });
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Password is required and must be a string'
            });
        }

        // Safe email formatting
        const normalizedEmail = String(email).trim().toLowerCase();
        console.log('🔍 Normalized email:', normalizedEmail);

        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log('❌ User not found for email:', normalizedEmail);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            console.log('❌ User account inactive:', normalizedEmail);
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('❌ Password mismatch for:', normalizedEmail);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            { expiresIn: '7d' }
        );

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('✅ Login successful for:', normalizedEmail);

        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Login failed'
        });
    }
});
// Get Current User (Protected route - add auth middleware later)
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({
            error: 'Invalid token'
        });
    }
});

// Update User Profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        const { name, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            decoded.id,
            {
                $set: {
                    name,
                    ...(avatar && { avatar })
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: error.message || 'Failed to update profile'
        });
    }
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                error: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: error.message || 'Failed to change password'
        });
    }
});

// Get All Users (Admin only)
router.get('/users', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied. Admin only.'
            });
        }

        const users = await User.find().select('-password');

        res.json({
            success: true,
            users,
            count: users.length
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: error.message || 'Failed to get users'
        });
    }
});

// Update User (Admin only)
router.put('/users/:id', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const { role, isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...(role && { role }),
                    ...(isActive !== undefined && { isActive })
                }
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: error.message || 'Failed to update user'
        });
    }
});

module.exports = router;