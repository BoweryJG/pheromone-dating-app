const express = require('express');
const { auth } = require('../middleware/auth');
const db = require('../utils/database');

const router = express.Router();

// Get user's matches
router.get('/', auth, async (req, res) => {
  try {
    const { status = 'active', limit = 20, offset = 0 } = req.query;

    const matches = await db('matches')
      .select(
        'matches.*',
        'users.first_name',
        'users.last_name',
        'users.bio',
        'users.photos',
        'users.city',
        'users.state'
      )
      .join('users', function() {
        this.on('users.id', '=', 'matches.user1_id')
          .andOn('matches.user2_id', '=', db.raw('?', [req.userId]))
          .orOn('users.id', '=', 'matches.user2_id')
          .andOn('matches.user1_id', '=', db.raw('?', [req.userId]));
      })
      .where('matches.status', status)
      .where(function() {
        this.where('matches.user1_id', req.userId)
          .orWhere('matches.user2_id', req.userId);
      })
      .limit(limit)
      .offset(offset)
      .orderBy('matches.matched_at', 'desc');

    // Parse photos JSON
    const formattedMatches = matches.map(match => ({
      ...match,
      photos: match.photos ? JSON.parse(match.photos) : []
    }));

    res.json({ matches: formattedMatches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// Create a new match (like someone)
router.post('/like/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot match with yourself' });
    }

    // Check if already liked/matched
    const existingMatch = await db('matches')
      .where(function() {
        this.where('user1_id', req.userId)
          .andWhere('user2_id', targetUserId);
      })
      .orWhere(function() {
        this.where('user1_id', targetUserId)
          .andWhere('user2_id', req.userId);
      })
      .first();

    if (existingMatch) {
      // Check if it's a mutual match
      if (existingMatch.user1_id === targetUserId && existingMatch.status === 'pending') {
        // Update to active match
        const match = await db('matches')
          .where('id', existingMatch.id)
          .update({
            status: 'active',
            matched_at: new Date()
          })
          .returning('*');

        return res.json({ 
          message: 'It\'s a match!',
          match: match[0],
          mutual: true
        });
      }

      return res.status(400).json({ error: 'Already matched or pending' });
    }

    // Create new pending match
    const match = await db('matches')
      .insert({
        user1_id: req.userId,
        user2_id: targetUserId,
        status: 'pending',
        compatibility_score: 0 // This would be calculated based on scent profiles
      })
      .returning('*');

    res.json({ 
      message: 'Like sent',
      match: match[0],
      mutual: false
    });
  } catch (error) {
    console.error('Like user error:', error);
    res.status(500).json({ error: 'Failed to process like' });
  }
});

// Pass on someone
router.post('/pass/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Check for existing match
    const existingMatch = await db('matches')
      .where(function() {
        this.where('user1_id', req.userId)
          .andWhere('user2_id', targetUserId);
      })
      .orWhere(function() {
        this.where('user1_id', targetUserId)
          .andWhere('user2_id', req.userId);
      })
      .first();

    if (existingMatch && existingMatch.status === 'active') {
      return res.status(400).json({ error: 'Cannot pass on active match' });
    }

    if (existingMatch) {
      // Update existing match to passed
      await db('matches')
        .where('id', existingMatch.id)
        .update({
          status: 'passed',
          updated_at: new Date()
        });
    } else {
      // Create new passed match
      await db('matches')
        .insert({
          user1_id: req.userId,
          user2_id: targetUserId,
          status: 'passed',
          compatibility_score: 0
        });
    }

    res.json({ message: 'Passed successfully' });
  } catch (error) {
    console.error('Pass user error:', error);
    res.status(500).json({ error: 'Failed to process pass' });
  }
});

// Unmatch someone
router.delete('/:matchId', auth, async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Verify user is part of this match
    const match = await db('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', req.userId)
          .orWhere('user2_id', req.userId);
      })
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update match status to unmatched
    await db('matches')
      .where('id', matchId)
      .update({
        status: 'unmatched',
        updated_at: new Date()
      });

    res.json({ message: 'Unmatched successfully' });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ error: 'Failed to unmatch' });
  }
});

// Get match statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [activeMatches, pendingLikes, pendingReceived] = await Promise.all([
      db('matches')
        .where(function() {
          this.where('user1_id', req.userId)
            .orWhere('user2_id', req.userId);
        })
        .andWhere('status', 'active')
        .count('* as count')
        .first(),
      
      db('matches')
        .where('user1_id', req.userId)
        .andWhere('status', 'pending')
        .count('* as count')
        .first(),
      
      db('matches')
        .where('user2_id', req.userId)
        .andWhere('status', 'pending')
        .count('* as count')
        .first()
    ]);

    res.json({
      activeMatches: parseInt(activeMatches.count),
      pendingLikes: parseInt(pendingLikes.count),
      pendingReceived: parseInt(pendingReceived.count)
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;