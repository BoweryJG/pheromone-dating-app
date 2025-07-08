const db = require('../utils/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      interestedIn,
      bio,
      latitude,
      longitude,
      city,
      state,
      country
    } = userData;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await db('users').insert({
      id: uuidv4(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      gender,
      interested_in: interestedIn,
      bio,
      latitude,
      longitude,
      city,
      state,
      country,
      photos: JSON.stringify([])
    }).returning('*');

    return this.sanitizeUser(user[0]);
  }

  static async findByEmail(email) {
    const user = await db('users')
      .where('email', email.toLowerCase())
      .first();
    
    return user ? this.sanitizeUser(user) : null;
  }

  static async findById(id) {
    const user = await db('users')
      .where('id', id)
      .first();
    
    return user ? this.sanitizeUser(user) : null;
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(userId, updates) {
    const allowedUpdates = [
      'first_name', 'last_name', 'bio', 'photos', 
      'latitude', 'longitude', 'city', 'state', 'country'
    ];
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (filteredUpdates.photos) {
      filteredUpdates.photos = JSON.stringify(filteredUpdates.photos);
    }

    const user = await db('users')
      .where('id', userId)
      .update({
        ...filteredUpdates,
        updated_at: new Date()
      })
      .returning('*');

    return this.sanitizeUser(user[0]);
  }

  static async updateSubscription(userId, tier, expiresAt) {
    const user = await db('users')
      .where('id', userId)
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
        updated_at: new Date()
      })
      .returning('*');

    return this.sanitizeUser(user[0]);
  }

  static async updateLastActive(userId) {
    await db('users')
      .where('id', userId)
      .update({
        last_active_at: new Date()
      });
  }

  static async findNearbyUsers(latitude, longitude, radiusKm = 50, userId) {
    // Using Haversine formula for distance calculation
    const users = await db('users')
      .select('*')
      .whereRaw(`
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) <= ?
      `, [latitude, longitude, latitude, radiusKm])
      .whereNot('id', userId)
      .where('is_active', true);

    return users.map(user => this.sanitizeUser(user));
  }

  static sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...sanitized } = user;
    
    // Parse JSON fields
    if (sanitized.photos && typeof sanitized.photos === 'string') {
      sanitized.photos = JSON.parse(sanitized.photos);
    }
    
    return sanitized;
  }

  static async delete(userId) {
    return await db('users')
      .where('id', userId)
      .del();
  }
}

module.exports = User;