const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger');

// In-memory user storage (replace with database in production)
const users = new Map();
const tokens = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

class AuthManager {
  /**
   * Register a new user
   */
  static async register(email, password, name) {
    if (users.has(email)) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      role: 'user' // 'user', 'admin'
    };

    users.set(email, user);
    logger.info(`User registered: ${email}`);

    return {
      id: userId,
      email,
      name,
      role: user.role
    };
  }

  /**
   * Login user and generate JWT token
   */
  static async login(email, password) {
    const user = users.get(email);

    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const refreshToken = uuidv4();
    tokens.set(refreshToken, {
      userId: user.id,
      email: user.email,
      created_at: new Date()
    });

    logger.info(`User logged in: ${email}`);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh JWT token
   */
  static refreshToken(refreshToken) {
    const tokenData = tokens.get(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    const newToken = jwt.sign(
      {
        userId: tokenData.userId,
        email: tokenData.email
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    logger.info(`Token refreshed for: ${tokenData.email}`);

    return {
      token: newToken,
      refreshToken
    };
  }

  /**
   * Logout user
   */
  static logout(refreshToken) {
    tokens.delete(refreshToken);
    logger.info('User logged out');
  }

  /**
   * Get user by ID
   */
  static getUser(userId) {
    for (const user of users.values()) {
      if (user.id === userId) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }
    return null;
  }

  /**
   * Change user password
   */
  static async changePassword(userId, oldPassword, newPassword) {
    let userRecord = null;
    for (const user of users.values()) {
      if (user.id === userId) {
        userRecord = user;
        break;
      }
    }

    if (!userRecord) {
      throw new Error('User not found');
    }

    const passwordMatch = await bcrypt.compare(oldPassword, userRecord.password);
    if (!passwordMatch) {
      throw new Error('Current password is incorrect');
    }

    userRecord.password = await bcrypt.hash(newPassword, 10);
    logger.info(`Password changed for: ${userRecord.email}`);
  }
}

module.exports = AuthManager;
