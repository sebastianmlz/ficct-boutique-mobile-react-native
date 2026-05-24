import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ficct.mobile.token';
const EXP_KEY = 'ficct.mobile.exp';
const USER_KEY = 'ficct.mobile.user';

// SecureStore is unavailable on web; fall back to AsyncStorage there.
const isSecureAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

async function setItem(key: string, value: string): Promise<void> {
  if (isSecureAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isSecureAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isSecureAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'staff' | 'customer' | 'system';
}

export const tokenStorage = {
  async save(token: string, expiresAtIso: string, user: StoredUser): Promise<void> {
    await setItem(TOKEN_KEY, token);
    await setItem(EXP_KEY, expiresAtIso);
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async load(): Promise<{ token: string; expiresAt: number; user: StoredUser } | null> {
    const [token, exp, userRaw] = await Promise.all([
      getItem(TOKEN_KEY),
      getItem(EXP_KEY),
      getItem(USER_KEY),
    ]);
    if (!token || !exp || !userRaw) return null;
    const expiresAt = new Date(exp).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      await tokenStorage.clear();
      return null;
    }
    try {
      const user = JSON.parse(userRaw) as StoredUser;
      return { token, expiresAt, user };
    } catch {
      await tokenStorage.clear();
      return null;
    }
  },

  async clear(): Promise<void> {
    await Promise.all([deleteItem(TOKEN_KEY), deleteItem(EXP_KEY), deleteItem(USER_KEY)]);
  },
};

let memoryToken: string | null = null;

export const inMemoryToken = {
  set(token: string | null): void {
    memoryToken = token;
  },
  get(): string | null {
    return memoryToken;
  },
};
