const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️  ENCRYPTION_KEY not set. Using random key (data will be lost on restart)');
    }
  }

  encrypt(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('pheromone-app', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedObj) {
    if (!encryptedObj || !encryptedObj.encryptedData) return null;
    
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from('pheromone-app', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error.message);
      return null;
    }
  }

  // For biological data - additional security layer
  encryptBiologicalData(data) {
    const serialized = JSON.stringify(data);
    const encrypted = this.encrypt(serialized);
    
    return {
      ...encrypted,
      dataType: 'biological',
      timestamp: new Date().toISOString()
    };
  }

  decryptBiologicalData(encryptedData) {
    const decrypted = this.decrypt(encryptedData);
    return decrypted ? JSON.parse(decrypted) : null;
  }
}

module.exports = new EncryptionService();