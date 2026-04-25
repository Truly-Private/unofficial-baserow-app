// Simple in-memory storage fallback for token persistence during development.
// In a real React Native app this should be swapped with AsyncStorage or secure storage.
type Store = Map<string, string>;

const store: Store = new Map();

export async function getItem(key: string): Promise<string | null> {
  return store.has(key) ? (store.get(key) ?? null) : null;
}

export async function setItem(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function removeItem(key: string): Promise<void> {
  store.delete(key);
}
