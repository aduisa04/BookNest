import * as SQLite from 'expo-sqlite';

// ✅ Open database asynchronously
export const getDbConnection = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('books.db');
    console.log('✅ Database opened successfully');
    return db;
  } catch (error) {
    console.error('❌ Error opening database:', error);
    return null;
  }
};

// ✅ Setup Database (Creates Tables)
export const setupDatabase = async () => {
  const db = await getDbConnection();
  if (!db) return;

  try {
    // ❌ Don't drop the books table (data would be lost every time)
    // await db.execAsync(`DROP TABLE IF EXISTS books;`);
    
    // ✅ Create the books table with correct schema
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        favorite INTEGER DEFAULT 0,
        coverImage TEXT
      );
    `);

    // ✅ Create the categories table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );
    `);

    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
};

// ✅ Add Category (Now Triggers UI Refresh)
export const addCategory = async (categoryName, refreshCategories) => {
  const db = await getDbConnection();
  if (!db) return;

  try {
    await db.runAsync('INSERT INTO categories (name) VALUES (?);', [categoryName]);
    console.log(`✅ Category '${categoryName}' added!`);

    if (refreshCategories) {
      await refreshCategories(); // ✅ Refresh the categories list after adding
    }
  } catch (error) {
    console.error('❌ Error adding category:', error);
  }
};

// ✅ Fetch All Categories (Now Updates UI)
export const getCategories = async () => {
  const db = await getDbConnection();
  if (!db) return [];

  try {
    const results = await db.getAllAsync('SELECT * FROM categories');
    return results || []; // ✅ Ensure it returns an empty array if results are undefined
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
};
