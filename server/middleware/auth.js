const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account deactivated' });
    }

    req.user = user;
    req.userId = user.id;
    
    // Update last active timestamp
    await User.updateLastActive(user.id);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireSubscription = (requiredTier) => {
  const tierLevels = {
    basic: 1,
    premium: 2,
    elite: 3
  };

  return (req, res, next) => {
    const userTier = req.user.subscription_tier;
    const userLevel = tierLevels[userTier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        required: requiredTier,
        current: userTier
      });
    }

    // Check if subscription is expired
    if (req.user.subscription_expires_at && 
        new Date(req.user.subscription_expires_at) < new Date()) {
      return res.status(403).json({ 
        error: 'Subscription expired',
        expires_at: req.user.subscription_expires_at
      });
    }

    next();
  };
};

module.exports = { auth, requireSubscription };