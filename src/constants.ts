// API
export const API_PREFIX = '/api';
export const API_AUTHENTICATED_USER_KEY = Symbol('AuthenticatedUser');
export const API_USER_PASSWORD_SALT_LENGTH = 10;
export const API_ACCESS_TOKEN_PREFIX = 'elmo_';
export const API_ACCESS_TOKEN_ALPHABET =
  '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const API_ACCESS_TOKEN_LENGTH = 128;
export const API_ACCESS_TOKEN_EXPIRES_IN_DAYS = 365; // 1 year

// OSCP
export const OSCP_API_PREFIX = '/oscp/2.0';
export const OSCP_API_VERSION = '2.0';
export const OSCP_REQUEST_ID_ALPHABET = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const OSCP_REQUEST_ID_LENGTH = 32;
export const OSCP_TOKEN_ALPHABET =
  '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
export const OSCP_TOKEN_LENGTH = 256;

// Timezone
export const TAIPEI_TZ = 'Asia/Taipei';

// Axios Request
export const HTTP_TIMEOUT_MILLISECONDS = 20000;
