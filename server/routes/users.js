const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(500).optional(),
  photos: Joi.array().items(Joi.string().uri()).max(6).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional()
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedUser = await User.updateProfile(req.userId, value);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get nearby users for discovery
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const users = await User.findNearbyUsers(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(radius),
      req.userId
    );

    res.json({ users });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({ error: 'Failed to get nearby users' });
  }
});

// Get user by ID (for viewing profiles)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive information for profile viewing
    const publicProfile = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      bio: user.bio,
      photos: user.photos,
      city: user.city,
      state: user.state,
      country: user.country,
      gender: user.gender,
      age: new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()
    };

    res.json({ user: publicProfile });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Delete user account
router.delete('/profile', auth, async (req, res) => {
  try {
    await User.delete(req.userId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;