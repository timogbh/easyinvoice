import AsyncStorage from "@react-native-async-storage/async-storage";

const NAMESPACE_USER = "ei_user";
const NAMESPACE_DATA = "ei_data";
const NAMESPACE_PLAN = "ei_plan";

export type Namespace = typeof NAMESPACE_USER | typeof NAMESPACE_DATA | typeof NAMESPACE_PLAN;

export async function getItem<T>(namespace: Namespace, key: string): Promise<T | null> {
  try {
    const fullKey = `${namespace}:${key}`;
    const value = await AsyncStorage.getItem(fullKey);
    console.log(`[Storage] getItem ${fullKey}:`, value ? "found" : "not found");
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`[Storage] Error getting ${namespace}:${key}:`, error);
    return null;
  }
}

export async function setItem<T>(namespace: Namespace, key: string, value: T): Promise<void> {
  try {
    const fullKey = `${namespace}:${key}`;
    await AsyncStorage.setItem(fullKey, JSON.stringify(value));
    console.log(`[Storage] setItem ${fullKey}: saved`);
  } catch (error) {
    console.error(`[Storage] Error setting ${namespace}:${key}:`, error);
    throw error;
  }
}

export async function removeItem(namespace: Namespace, key: string): Promise<void> {
  try {
    const fullKey = `${namespace}:${key}`;
    await AsyncStorage.removeItem(fullKey);
    console.log(`[Storage] removeItem ${fullKey}: removed`);
  } catch (error) {
    console.error(`[Storage] Error removing ${namespace}:${key}:`, error);
  }
}

export async function clearNamespace(namespace: Namespace): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const namespaceKeys = allKeys.filter((key) => key.startsWith(`${namespace}:`));
    await AsyncStorage.multiRemove(namespaceKeys);
    console.log(`[Storage] clearNamespace ${namespace}: ${namespaceKeys.length} keys removed`);
  } catch (error) {
    console.error(`[Storage] Error clearing namespace ${namespace}:`, error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter((key) => 
      key.startsWith(`${NAMESPACE_USER}:`) ||
      key.startsWith(`${NAMESPACE_DATA}:`) ||
      key.startsWith(`${NAMESPACE_PLAN}:`)
    );
    await AsyncStorage.multiRemove(appKeys);
    console.log(`[Storage] clearAllData: ${appKeys.length} keys removed`);
  } catch (error) {
    console.error(`[Storage] Error clearing all data:`, error);
    throw error;
  }
}

export const storageNamespaces = {
  USER: NAMESPACE_USER,
  DATA: NAMESPACE_DATA,
  PLAN: NAMESPACE_PLAN,
} as const;
