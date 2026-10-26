import { google } from 'googleapis';
import { encryptToken, decryptToken } from '@/lib/security/encryption';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

/**
 * Returns an initialized OAuth2 client
 */
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates an authorization URL for the administrator to connect their Google Drive
 */
export function getAuthorizationUrl(state: string = 'admin_connect'): string {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured in environment');
  }

  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Requests refresh_token
    prompt: 'consent',     // Forces consent to ensure refresh_token is returned
    scope: SCOPES,
    state,
  });
}

/**
 * Exchanges the authorization code received from Google for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured in environment');
  }

  const { tokens } = await oauth2Client.getToken(code);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    encryptedRefreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
    expiryDate: tokens.expiry_date,
    idToken: tokens.id_token,
  };
}

/**
 * Returns an authenticated Google Drive client using the stored encrypted refresh token
 */
export function getAuthenticatedDriveClient(encryptedRefreshToken: string) {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('Google OAuth credentials not configured');
  }

  const refreshToken = decryptToken(encryptedRefreshToken);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}
