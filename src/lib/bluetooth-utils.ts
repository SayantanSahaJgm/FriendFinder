import crypto from 'crypto';

/**
 * Bluetooth utility functions for encryption and device ID management
 */

const ENCRYPTION_KEY = process.env.BLUETOOTH_ENCRYPTION_KEY || 'friendfinder-bluetooth-key-32-chars!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt Bluetooth device ID before storing in database
 * @param deviceId - Raw Bluetooth device ID
 * @returns Encrypted device ID string
 */
export function encryptBluetoothDeviceId(deviceId: string): string {
  try {
    // Ensure the key is 32 bytes for AES-256
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Encrypt the device ID
    let encrypted = cipher.update(deviceId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Bluetooth device ID encryption error:', error);
    throw new Error('Failed to encrypt Bluetooth device ID');
  }
}

/**
 * Decrypt Bluetooth device ID from database
 * @param encryptedDeviceId - Encrypted device ID string
 * @returns Decrypted device ID
 */
export function decryptBluetoothDeviceId(encryptedDeviceId: string): string {
  try {
    // Ensure the key is 32 bytes for AES-256
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    
    // Split IV and encrypted data
    const parts = encryptedDeviceId.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted device ID format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Bluetooth device ID decryption error:', error);
    throw new Error('Failed to decrypt Bluetooth device ID');
  }
}

/**
 * Generate a unique anonymous Bluetooth ID for privacy
 * @returns Random Bluetooth ID string
 */
export function generateAnonymousBluetoothId(): string {
  return 'BT-' + crypto.randomBytes(16).toString('hex');
}

/**
 * Hash Bluetooth device ID for quick lookup (one-way, cannot be decrypted)
 * @param deviceId - Raw Bluetooth device ID
 * @returns Hashed device ID
 */
export function hashBluetoothDeviceId(deviceId: string): string {
  return crypto
    .createHash('sha256')
    .update(deviceId)
    .digest('hex');
}

/**
 * Validate Bluetooth device ID format
 * @param deviceId - Device ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidBluetoothDeviceId(deviceId: string): boolean {
  if (!deviceId || typeof deviceId !== 'string') {
    return false;
  }
  
  // Check if it matches typical Bluetooth MAC address format (XX:XX:XX:XX:XX:XX)
  // or our custom BT-xxx format
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  const customRegex = /^BT-[0-9a-f]{32}$/;
  
  return macRegex.test(deviceId) || customRegex.test(deviceId);
}

/**
 * Sanitize Bluetooth device name for safe storage
 * @param name - Raw device name
 * @returns Sanitized device name
 */
export function sanitizeBluetoothName(name: string): string {
  if (!name) return 'Unknown Device';
  
  // Remove any potentially harmful characters
  return name
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 50) // Limit length
    .trim();
}
