const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { ROLES } = require('../utils/constants');
const { AppError } = require('../middleware/errorHandler.middleware');
const bruteForceProtection = require('../services/bruteForceProtection.service');
const logger = require('../utils/logger');
const { parseJwtExpiresInToSeconds } = require('../utils/jwt');

class AuthController {
    constructor() {
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.getUsers = this.getUsers.bind(this);
    }

    async register(req, res, next) {
        try {
            const { name, email, password, role = ROLES.AGENT } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new AppError('User already exists', 400);
            }

            // Check role permission (only admin can create admin/reviewer)
            if ([ROLES.ADMIN, ROLES.REVIEWER].includes(role) &&
                req.user?.role !== ROLES.ADMIN) {
                throw new AppError('Insufficient permissions to create this role', 403);
            }

            // Create user
            const user = await User.create({
                name,
                email,
                password,
                role
            });

            // Generate token
            const tokenData = this.generateToken(user._id);

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            logger.info(`New user registered: ${email}`);

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user,
                    ...tokenData
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            // Get client identifier
            const clientId = bruteForceProtection.getClientIdentifier(req, email);

            // Check login attempt
            const checkResult = await bruteForceProtection.checkLoginAttempt(req, email);

            if (!checkResult.allowed) {
                // Log the blocked attempt
                logger.warn(`Blocked login attempt: ${checkResult.code}`, {
                    clientId,
                    ip: req.ip,
                    email,
                    timestamp: new Date().toISOString()
                });

                // Return appropriate response
                if (checkResult.code === 'ACCOUNT_LOCKED') {
                    return res.status(423).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                if (checkResult.code === 'RATE_LIMITED') {
                    return res.status(429).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                if (checkResult.code === 'MAX_ATTEMPTS_EXCEEDED') {
                    return res.status(429).json({
                        success: false,
                        message: checkResult.reason,
                        retryAfter: checkResult.retryAfter,
                        code: checkResult.code
                    });
                }

                return res.status(400).json({
                    success: false,
                    message: checkResult.reason,
                    code: checkResult.code
                });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                // Record failed attempt
                bruteForceProtection.recordAttempt(clientId, false, req);

                throw new AppError('Invalid credentials', 401);
            }

            // Check if account is active
            if (!user.isActive) {
                // Record failed attempt
                bruteForceProtection.recordAttempt(clientId, false, req);

                throw new AppError('Account is deactivated', 401);
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // Record failed attempt
                bruteForceProtection.recordAttempt(clientId, false, req);

                throw new AppError('Invalid credentials', 401);
            }

            // Record successful login
            bruteForceProtection.recordAttempt(clientId, true, req);

            // Generate token
            const tokenData = this.generateToken(user._id);

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            logger.info(`User logged in: ${email}`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user,
                    ...tokenData
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res, next) {
        try {
            const user = await User.findById(req.user._id).select('-password');

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { name, preferences } = req.body;
            const userId = req.user._id;

            const updateData = {};
            if (name) updateData.name = name;
            if (preferences) updateData.preferences = preferences;

            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async getUsers(req, res, next) {
        try {
            const users = await User.find({}).select('-password');

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            next(error);
        }
    }

    generateToken(userId) {
        const token = jwt.sign(
            { userId },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const expiresIn = parseJwtExpiresInToSeconds(JWT_EXPIRES_IN);

        return {
            token,
            expiresIn,
            expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
        };
    }
}

module.exports = new AuthController();
