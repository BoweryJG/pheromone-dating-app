const express = require('express');
const Joi = require('joi');
const { auth } = require('../middleware/auth');
const db = require('../utils/database');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  matchId: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(1000).required()
});

// Get messages for a match
router.get('/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { limit = 50, before } = req.query;

    // Verify user is part of this match
    const match = await db('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', req.userId)
          .orWhere('user2_id', req.userId);
      })
      .andWhere('status', 'active')
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not active' });
    }

    // Get messages
    let query = db('messages')
      .where('match_id', matchId)
      .orderBy('sent_at', 'desc')
      .limit(limit);

    if (before) {
      query = query.where('sent_at', '<', new Date(before));
    }

    const messages = await query;

    // Decrypt messages and format
    const decryptedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.sender_id,
      content: decrypt(msg.content),
      sentAt: msg.sent_at,
      readAt: msg.read_at,
      isMe: msg.sender_id === req.userId
    })).reverse(); // Reverse to get chronological order

    res.json({ messages: decryptedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { matchId, content } = value;

    // Verify user is part of this match and it's active
    const match = await db('matches')
      .where('id', matchId)
      .where(function() {
        this.where('user1_id', req.userId)
          .orWhere('user2_id', req.userId);
      })
      .andWhere('status', 'active')
      .first();

    if (!match) {
      return res.status(404).json({ error: 'Match not found or not active' });
    }

    // Determine receiver
    const receiverId = match.user1_id === req.userId ? match.user2_id : match.user1_id;

    // Encrypt and save message
    const encryptedContent = encrypt(content);
    const message = await db('messages')
      .insert({
        match_id: matchId,
        sender_id: req.userId,
        receiver_id: receiverId,
        content: encryptedContent
      })
      .returning('*');

    // Update match last activity
    await db('matches')
      .where('id', matchId)
      .update({
        last_activity_at: new Date(),
        updated_at: new Date()
      });

    res.json({
      message: {
        id: message[0].id,
        senderId: message[0].sender_id,
        content: content,
        sentAt: message[0].sent_at,
        isMe: true
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/read/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;

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

    // Mark all unread messages as read
    await db('messages')
      .where('match_id', matchId)
      .where('receiver_id', req.userId)
      .whereNull('read_at')
      .update({
        read_at: new Date()
      });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get conversation list
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all active matches with last message
    const conversations = await db('matches')
      .select(
        'matches.*',
        'users.first_name',
        'users.last_name',
        'users.photos',
        'messages.content as last_message',
        'messages.sent_at as last_message_at',
        'messages.sender_id as last_sender_id'
      )
      .leftJoin('messages', function() {
        this.on('messages.match_id', '=', 'matches.id')
          .andOn('messages.sent_at', '=', db.raw('(SELECT MAX(sent_at) FROM messages WHERE match_id = matches.id)'));
      })
      .join('users', function() {
        this.on('users.id', '=', 'matches.user1_id')
          .andOn('matches.user2_id', '=', db.raw('?', [req.userId]))
          .orOn('users.id', '=', 'matches.user2_id')
          .andOn('matches.user1_id', '=', db.raw('?', [req.userId]));
      })
      .where('matches.status', 'active')
      .where(function() {
        this.where('matches.user1_id', req.userId)
          .orWhere('matches.user2_id', req.userId);
      })
      .orderBy('last_message_at', 'desc');

    // Count unread messages for each conversation
    const unreadCounts = await db('messages')
      .select('match_id')
      .count('* as unread_count')
      .where('receiver_id', req.userId)
      .whereNull('read_at')
      .groupBy('match_id');

    const unreadMap = unreadCounts.reduce((map, item) => {
      map[item.match_id] = parseInt(item.unread_count);
      return map;
    }, {});

    // Format conversations
    const formattedConversations = conversations.map(conv => ({
      matchId: conv.id,
      user: {
        id: conv.user1_id === req.userId ? conv.user2_id : conv.user1_id,
        firstName: conv.first_name,
        lastName: conv.last_name,
        photos: conv.photos ? JSON.parse(conv.photos) : []
      },
      lastMessage: conv.last_message ? {
        content: decrypt(conv.last_message),
        sentAt: conv.last_message_at,
        isMe: conv.last_sender_id === req.userId
      } : null,
      unreadCount: unreadMap[conv.id] || 0
    }));

    res.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const result = await db('messages')
      .where('receiver_id', req.userId)
      .whereNull('read_at')
      .count('* as count')
      .first();

    res.json({ unreadCount: parseInt(result.count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;