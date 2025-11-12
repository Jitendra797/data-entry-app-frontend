import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Keychain from 'react-native-keychain';
import type {
  SetOptions,
  GetOptions,
  BaseOptions,
} from 'react-native-keychain';

const TOKEN_SERVICE = 'data-entry-app-auth-tokens';
const TOKEN_USERNAME = 'googleTokens';

export type StoredAuthTokens = {
  idToken?: string | null;
  accessToken?: string | null;
  serverAuthCode?: string | null;
};

const keychainOptions: SetOptions = {
  service: TOKEN_SERVICE,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const keychainGetOptions: GetOptions = {
  service: TOKEN_SERVICE,
};

const keychainBaseOptions: BaseOptions = {
  service: TOKEN_SERVICE,
};

const sanitizeTokens = (tokens: StoredAuthTokens): StoredAuthTokens | null => {
  const entries = Object.entries(tokens).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );

  if (!entries.length) {
    return null;
  }

  return Object.fromEntries(entries) as StoredAuthTokens;
};

export async function saveAuthTokens(tokens: StoredAuthTokens): Promise<void> {
  try {
    const sanitized = sanitizeTokens(tokens);
    if (!sanitized) {
      return;
    }

    const existing = await getAuthTokens();
    const merged = {
      ...existing,
      ...sanitized,
    };

    await Keychain.setGenericPassword(
      TOKEN_USERNAME,
      JSON.stringify(merged),
      keychainOptions
    );
  } catch (error) {
    console.error('Failed to save auth tokens to secure storage:', error);
    throw error;
  }
}

export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
  try {
    const credentials = await Keychain.getGenericPassword(keychainGetOptions);
    if (!credentials) {
      return null;
    }
    return JSON.parse(credentials.password) as StoredAuthTokens;
  } catch (error) {
    console.error('Failed to load auth tokens from secure storage:', error);
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await Keychain.resetGenericPassword(keychainBaseOptions);
  } catch (error) {
    console.error('Failed to clear auth tokens from secure storage:', error);
  }
}

export async function refreshAuthTokens(): Promise<StoredAuthTokens> {
  const tokens = await GoogleSignin.getTokens();
  await saveAuthTokens(tokens);
  return tokens;
}

export async function getIdToken(
  options: { forceRefresh?: boolean } = {}
): Promise<string | null> {
  const { forceRefresh = false } = options;

  if (!forceRefresh) {
    const stored = await getAuthTokens();
    if (stored?.idToken) {
      return stored.idToken;
    }
  }

  try {
    const freshTokens = await refreshAuthTokens();
    return freshTokens.idToken ?? null;
  } catch (error) {
    console.error('Failed to refresh ID token:', error);
    if (forceRefresh) {
      throw error;
    }
    return null;
  }
}

export async function getAccessToken(
  options: { forceRefresh?: boolean } = {}
): Promise<string | null> {
  const { forceRefresh = false } = options;

  if (!forceRefresh) {
    const stored = await getAuthTokens();
    if (stored?.accessToken) {
      return stored.accessToken;
    }
  }

  try {
    const freshTokens = await refreshAuthTokens();
    return freshTokens.accessToken ?? null;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    if (forceRefresh) {
      throw error;
    }
    return null;
  }
}
