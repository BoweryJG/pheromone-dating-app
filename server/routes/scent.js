const express = require('express');
const Joi = require('joi');
const { auth, requireSubscription } = require('../middleware/auth');
const db = require('../utils/database');

const router = express.Router();

// Validation schemas
const createScentProfileSchema = Joi.object({
  scentNotes: Joi.array().items(Joi.string()).min(3).max(10).required(),
  intensity: Joi.number().min(1).max(10).required(),
  preferredNotes: Joi.array().items(Joi.string()).min(3).max(10).required(),
  avoidNotes: Joi.array().items(Joi.string()).max(5).optional()
});

const rateScentSchema = Joi.object({
  sampleId: Joi.string().uuid().required(),
  rating: Joi.number().min(1).max(5).required(),
  notes: Joi.string().max(500).optional()
});

// Get user's scent profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await db('scent_profiles')
      .where('user_id', req.userId)
      .first();

    if (!profile) {
      return res.status(404).json({ error: 'Scent profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Get scent profile error:', error);
    res.status(500).json({ error: 'Failed to get scent profile' });
  }
});

// Create or update scent profile
router.post('/profile', auth, async (req, res) => {
  try {
    const { error, value } = createScentProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingProfile = await db('scent_profiles')
      .where('user_id', req.userId)
      .first();

    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await db('scent_profiles')
        .where('user_id', req.userId)
        .update({
          scent_notes: JSON.stringify(value.scentNotes),
          intensity: value.intensity,
          preferred_notes: JSON.stringify(value.preferredNotes),
          avoid_notes: JSON.stringify(value.avoidNotes || []),
          updated_at: new Date()
        })
        .returning('*');
    } else {
      // Create new profile
      profile = await db('scent_profiles')
        .insert({
          user_id: req.userId,
          scent_notes: JSON.stringify(value.scentNotes),
          intensity: value.intensity,
          preferred_notes: JSON.stringify(value.preferredNotes),
          avoid_notes: JSON.stringify(value.avoidNotes || [])
        })
        .returning('*');
    }

    res.json({ 
      message: existingProfile ? 'Profile updated' : 'Profile created',
      profile: profile[0] 
    });
  } catch (error) {
    console.error('Create/update scent profile error:', error);
    res.status(500).json({ error: 'Failed to save scent profile' });
  }
});

// Order scent sample kit
router.post('/sample/order', auth, requireSubscription('premium'), async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address required' });
    }

    // Check if user already has a pending order
    const pendingOrder = await db('sample_orders')
      .where('user_id', req.userId)
      .whereIn('status', ['pending', 'processing', 'shipped'])
      .first();

    if (pendingOrder) {
      return res.status(400).json({ 
        error: 'You already have a pending sample order',
        order: pendingOrder
      });
    }

    const order = await db('sample_orders')
      .insert({
        user_id: req.userId,
        shipping_address: JSON.stringify(shippingAddress),
        status: 'pending'
      })
      .returning('*');

    res.json({ 
      message: 'Sample kit ordered successfully',
      order: order[0]
    });
  } catch (error) {
    console.error('Order sample kit error:', error);
    res.status(500).json({ error: 'Failed to order sample kit' });
  }
});

// Submit scent sample rating
router.post('/sample/rate', auth, async (req, res) => {
  try {
    const { error, value } = rateScentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verify sample belongs to user
    const sample = await db('scent_samples')
      .where('id', value.sampleId)
      .where('user_id', req.userId)
      .first();

    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Check if already rated
    const existingRating = await db('scent_ratings')
      .where('sample_id', value.sampleId)
      .where('user_id', req.userId)
      .first();

    if (existingRating) {
      return res.status(400).json({ error: 'Sample already rated' });
    }

    const rating = await db('scent_ratings')
      .insert({
        user_id: req.userId,
        sample_id: value.sampleId,
        rating: value.rating,
        notes: value.notes
      })
      .returning('*');

    res.json({ 
      message: 'Rating submitted successfully',
      rating: rating[0]
    });
  } catch (error) {
    console.error('Rate sample error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get scent compatibility with another user
router.get('/compatibility/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Get both users' scent profiles
    const [myProfile, theirProfile] = await Promise.all([
      db('scent_profiles').where('user_id', req.userId).first(),
      db('scent_profiles').where('user_id', otherUserId).first()
    ]);

    if (!myProfile || !theirProfile) {
      return res.status(404).json({ error: 'Scent profiles not found' });
    }

    // Calculate compatibility score (simplified algorithm)
    const myNotes = JSON.parse(myProfile.scent_notes);
    const theirNotes = JSON.parse(theirProfile.scent_notes);
    const myPreferred = JSON.parse(myProfile.preferred_notes);
    const theirPreferred = JSON.parse(theirProfile.preferred_notes);

    let score = 0;
    let maxScore = 0;

    // Check if their scent matches my preferences
    myPreferred.forEach(note => {
      maxScore += 10;
      if (theirNotes.includes(note)) {
        score += 10;
      }
    });

    // Check if my scent matches their preferences
    theirPreferred.forEach(note => {
      maxScore += 10;
      if (myNotes.includes(note)) {
        score += 10;
      }
    });

    const compatibility = maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;

    res.json({ 
      compatibility,
      myProfile: {
        scentNotes: myNotes,
        preferredNotes: myPreferred
      },
      theirProfile: {
        scentNotes: theirNotes,
        preferredNotes: theirPreferred
      }
    });
  } catch (error) {
    console.error('Get compatibility error:', error);
    res.status(500).json({ error: 'Failed to calculate compatibility' });
  }
});

module.exports = router;