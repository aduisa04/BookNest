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
    // Create the books table with correct schema
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        favorite INTEGER DEFAULT 0,
        coverImage TEXT,
        rating INTEGER DEFAULT 0  -- Added column for rating
      );
    `);

    // Create the categories table if it doesn't exist
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
      await refreshCategories(); // Refresh the categories list after adding
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
    return results || [];
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
};

// ✅ Delete Book by ID
export const deleteBook = async (bookId, refreshBooks) => {
  const db = await getDbConnection();
  if (!db) return;

  try {
    await db.runAsync('DELETE FROM books WHERE id = ?;', [bookId]);
    console.log(`✅ Book with ID ${bookId} deleted!`);

    if (refreshBooks) {
      await refreshBooks(); // Refresh the books list after deleting
    }
  } catch (error) {
    console.error('❌ Error deleting book:', error);
  }
};

// ✅ Toggle Favorite Status for a Book
export const toggleFavorite = async (bookId, currentFavorite, refreshBooks) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    const newFavorite = currentFavorite ? 0 : 1;
    await db.runAsync('UPDATE books SET favorite = ? WHERE id = ?;', [newFavorite, bookId]);
    console.log(`✅ Toggled favorite for book ${bookId} to ${newFavorite}`);
    if (refreshBooks) {
      await refreshBooks();
    }
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
  }
};


// In BookNest/src/database/db.js
export const deleteCategory = async (categoryId, refreshCategories) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM categories WHERE id = ?;', [categoryId]);
    console.log(`✅ Category with ID ${categoryId} deleted!`);
    if (refreshCategories) {
      await refreshCategories();
    }
  } catch (error) {
    console.error('❌ Error deleting category:', error);
  }
};

export const updateBookRating = async (bookId, rating, refreshBooks) => {
  const db = await getDbConnection();
  if (!db) return;
  
  try {
    await db.runAsync('UPDATE books SET rating = ? WHERE id = ?;', [rating, bookId]);
    console.log(`✅ Updated rating for book ${bookId} to ${rating}`);
    if (refreshBooks) {
      await refreshBooks();
    }
  } catch (error) {
    console.error('❌ Error updating rating:', error);
  }
};
