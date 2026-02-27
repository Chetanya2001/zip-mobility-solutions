import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode, JwtPayload } from "jwt-decode"; // better import (supports types)

// Optional: import * as Keychain from 'react-native-keychain';

interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  role?: string;
  // add other claims your backend includes
}

const TOKEN_KEY = "authToken";
const EXP_KEY = "tokenExp";

export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);

    const decoded = jwtDecode<DecodedToken>(token);
    if (decoded.exp) {
      await AsyncStorage.setItem(EXP_KEY, decoded.exp.toString());
    }
  } catch (error) {
    console.error("Failed to store token:", error);
  }
};

export interface TokenResult {
  token: string | null;
  isExpired: boolean;
}

export const getToken = async (): Promise<TokenResult> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      return { token: null, isExpired: true };
    }

    const expStr = await AsyncStorage.getItem(EXP_KEY);
    if (!expStr) {
      // No exp → treat as expired (defensive)
      await removeTokenSilently();
      return { token: null, isExpired: true };
    }

    const exp = parseInt(expStr, 10);
    const now = Math.floor(Date.now() / 1000); // Unix seconds

    if (now >= exp) {
      await removeTokenSilently();
      return { token: null, isExpired: true };
    }

    return { token, isExpired: false };
  } catch (error) {
    console.error("Failed to read token:", error);
    return { token: null, isExpired: true };
  }
};

/**
 * Removes token from storage **without navigation**
 * Navigation should be handled by caller (interceptor / component)
 */
export const removeTokenSilently = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, EXP_KEY]);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
};

// Optional: if you want to force logout + redirect from a component
// Usage: in interceptor → if (expired || 401) { removeTokenSilently(); navigation.reset(...); }
