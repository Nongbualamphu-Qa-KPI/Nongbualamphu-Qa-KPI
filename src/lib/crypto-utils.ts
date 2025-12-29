/**
 * LINE Security Utilities
 * เข้ารหัส/ถอดรหัส Channel Access Token ด้วย AES-256-CBC
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// ================= Key Management =================

/**
 * Get or create encryption key
 * Key จะถูกเก็บใน .env.local หรือใช้ default key
 */
function getEncryptionKey(): Buffer {
    // Try to get from environment variable first
    const envKey = process.env.LINE_ENCRYPTION_KEY;

    if (envKey && envKey.length === 64) { // 32 bytes = 64 hex chars
        return Buffer.from(envKey, 'hex');
    }

    // Generate a deterministic key based on a secret (สำหรับ development)
    // ในการใช้งานจริงควรใช้ environment variable
    const secretBase = process.env.NEXTAUTH_SECRET || 'qa-hospital-nbh-line-security-key-2024';
    const hash = crypto.createHash('sha256').update(secretBase).digest();
    return hash;
}

// ================= Encryption Functions =================

/**
 * เข้ารหัส plaintext token
 * @param plainText Token ที่ยังไม่เข้ารหัส
 * @returns Token ที่เข้ารหัสแล้ว (format: iv:encrypted)
 */
export function encryptToken(plainText: string): string {
    if (!plainText || plainText.trim() === '') {
        return '';
    }

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key as unknown as crypto.CipherKey, iv as unknown as crypto.BinaryLike);

        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Return format: iv:encrypted
        return `ENC:${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt token');
    }
}

/**
 * ถอดรหัส encrypted token
 * @param encryptedText Token ที่เข้ารหัสแล้ว
 * @returns Token ที่ถอดรหัสแล้ว
 */
export function decryptToken(encryptedText: string): string {
    if (!encryptedText || encryptedText.trim() === '') {
        return '';
    }

    // ถ้าไม่ได้เข้ารหัส (plaintext เดิม) ให้ return กลับไปเลย
    if (!encryptedText.startsWith('ENC:')) {
        return encryptedText;
    }

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            console.warn('Invalid encrypted format, returning as-is');
            return encryptedText;
        }

        const iv = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key as unknown as crypto.CipherKey, iv as unknown as crypto.BinaryLike);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        // ถ้าถอดรหัสไม่ได้ อาจเป็น plaintext เดิม
        return encryptedText;
    }
}

/**
 * ตรวจสอบว่า token เข้ารหัสแล้วหรือยัง
 */
export function isEncrypted(token: string): boolean {
    return token.startsWith('ENC:');
}

// ================= LINE Signature Verification =================

/**
 * ตรวจสอบ LINE webhook signature
 * @param body Request body as string
 * @param signature X-Line-Signature header
 * @param channelSecret Channel Secret from LINE
 * @returns true if signature is valid
 */
export function verifyLineSignature(
    body: string,
    signature: string,
    channelSecret: string
): boolean {
    if (!channelSecret || !signature) {
        return false;
    }

    try {
        const hash = crypto
            .createHmac('SHA256', channelSecret)
            .update(body)
            .digest('base64');

        return hash === signature;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

// ================= Helper Functions =================

/**
 * Mask token สำหรับแสดงผล (ไม่เปิดเผยข้อมูลทั้งหมด)
 * @param token Token (encrypted or plain)
 * @param visibleChars จำนวน characters ที่แสดง
 */
export function maskToken(token: string, visibleChars: number = 10): string {
    if (!token || token.length <= visibleChars) {
        return token;
    }

    // ถ้าเป็น encrypted token
    if (token.startsWith('ENC:')) {
        return '🔒 เข้ารหัสแล้ว';
    }

    return '●●●●●●●●' + token.slice(-visibleChars);
}

/**
 * สร้าง encryption key ใหม่ (ใช้สำหรับ setup)
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

// ================= Auto-Migration =================

/**
 * ตรวจสอบและ migrate token เดิมให้เป็น encrypted
 * เรียกตอน save settings
 */
export function migrateTokenIfNeeded(token: string): string {
    // ถ้าว่าง ไม่ต้องทำอะไร
    if (!token || token.trim() === '') {
        return '';
    }

    // ถ้าเข้ารหัสแล้ว ไม่ต้องทำอะไร
    if (isEncrypted(token)) {
        return token;
    }

    // ถ้าเป็น masked token (●●●) ไม่ต้องทำอะไร
    if (token.includes('●')) {
        return token;
    }

    // Encrypt token ใหม่
    console.log('Migrating plaintext token to encrypted format...');
    return encryptToken(token);
}
