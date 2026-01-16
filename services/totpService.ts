import { TOTP, Secret } from 'otpauth';

/**
 * Generates the current TOTP token and remaining time for a given secret.
 * @param secret The Base32 encoded secret key
 */
export const generateToken = (secret: string) => {
  try {
    // Clean the secret
    const cleanSecret = secret.replace(/[\s-]/g, '').toUpperCase();
    
    // Use the library's built-in robust Base32 parser
    // This handles padding ('=') and common formatting issues better than manual parsing
    const secretObj = Secret.fromBase32(cleanSecret);

    const totp = new TOTP({
      issuer: 'SecureAuth',
      label: 'User',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretObj, 
    });

    const token = totp.generate();
    const period = 30;
    const epoch = Math.floor(Date.now() / 1000);
    const remaining = period - (epoch % period);

    return { token, remaining, period, isValid: true };
  } catch (error) {
    console.error("Token Generation Error", error);
    return { token: 'ERROR', remaining: 0, period: 30, isValid: false };
  }
};