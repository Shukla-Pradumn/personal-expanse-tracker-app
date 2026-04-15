import AsyncStorage from '@react-native-async-storage/async-storage';
import { Auth } from 'aws-amplify';

const AUTH_TOKEN_KEY = '@auth/idToken';

//this is for save the auth token
export async function saveAuthToken(token: string) {
  const normalized = String(token || '').trim();
  if (!normalized) return;
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, normalized);
}

export async function getAuthToken() {
  const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (stored) return stored;

  try {
    const session = await Auth.currentSession();
    const idToken = session?.getIdToken?.().getJwtToken?.();

    if (idToken) {
      await saveAuthToken(idToken);
      return idToken;
    }
  } catch {
    // Caller will handle auth failure.
  }

  return '';
}

//this is for get the auth headers
export async function getAuthHeaders() {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Unauthorized: token missing.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

//this is for clear the auth session
export async function clearAuthSession() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
