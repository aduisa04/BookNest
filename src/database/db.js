// BookNest/src/database/db.js
import * as SQLite from 'expo-sqlite';

// Cache the database connection
let dbInstance = null;

// Use the asynchronous API (openDatabaseAsync) and cache the result
export const getDbConnection = async () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabaseAsync('books.db');
    console.log('✅ Database opened successfully (async, cached)');
    return dbInstance;
  } catch (error) {
    console.error('❌ Error opening database:', error);
    return null;
  }
};

// Setup Database: Create tables if they don't exist.
export const setupDatabase = async () => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    // Create the books table with the correct schema
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
        rating INTEGER DEFAULT 0,
        dueDate TEXT
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

// Add Book: Inserts a new book into the books table.
export const addBook = async (title, author, category, status, dueDate = null) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    await db.runAsync(
      'INSERT INTO books (title, author, category, status, dueDate) VALUES (?, ?, ?, ?, ?);',
      [title, author, category, status, dueDate || new Date().toISOString()]
    );
    console.log(`✅ Book '${title}' added!`);
  } catch (error) {
    console.error('❌ Error adding book:', error);
  }
};

// Fetch All Books: Returns all books from the books table.
export const getBooksFromDatabase = async () => {
  const db = await getDbConnection();
  if (!db) return [];
  try {
    const results = await db.getAllAsync('SELECT * FROM books;');
    return results || [];
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    return [];
  }
};

// Add Category: Inserts a new category.
export const addCategory = async (categoryName, refreshCategories) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    await db.runAsync('INSERT INTO categories (name) VALUES (?);', [categoryName]);
    console.log(`✅ Category '${categoryName}' added!`);
    if (refreshCategories) {
      await refreshCategories();
    }
  } catch (error) {
    console.error('❌ Error adding category:', error);
  }
};

// Fetch All Categories: Returns all categories.
export const getCategories = async () => {
  const db = await getDbConnection();
  if (!db) return [];
  try {
    const results = await db.getAllAsync('SELECT * FROM categories;');
    return results || [];
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
};

// Delete Book: Deletes a book by its ID.
export const deleteBook = async (bookId, refreshBooks) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM books WHERE id = ?;', [bookId]);
    console.log(`✅ Book with ID ${bookId} deleted!`);
    if (refreshBooks) {
      await refreshBooks();
    }
  } catch (error) {
    console.error('❌ Error deleting book:', error);
  }
};

// Toggle Favorite: Updates the favorite status for a book.
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

// Delete Category: Deletes a category by its ID.
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

// Update Book Rating: Updates a book's rating.
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

// Update Book Deadline: Updates the dueDate (deadline) for a book.
// This updates both the date and time.
export const updateBookDeadline = async (bookId, newDeadline) => {
  const db = await getDbConnection();
  if (!db) return;
  try {
    await db.runAsync('UPDATE books SET dueDate = ? WHERE id = ?;', [newDeadline, bookId]);
    console.log(`✅ Updated deadline for book ${bookId} to ${newDeadline}`);
  } catch (error) {
    console.error('❌ Error updating deadline:', error);
  }
};
