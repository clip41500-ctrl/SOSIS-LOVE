import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'sosis_love_db';
const STORE_NAME = 'assets';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
  }
  return dbPromise;
}

export async function setAsset(key: string, value: string) {
  const db = await getDB();
  return db.put(STORE_NAME, value, key);
}

export async function getAsset(key: string): Promise<string | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, key);
}

export async function removeAsset(key: string) {
  const db = await getDB();
  return db.delete(STORE_NAME, key);
}
