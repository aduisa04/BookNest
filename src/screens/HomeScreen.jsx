import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDbConnection, deleteBook } from '../database/db'; // import deleteBook function

const HomeScreen = () => {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh books after deletion
  const refreshBooks = async () => {
    const db = await getDbConnection();
    const result = await db.getAllAsync('SELECT * FROM books');
    setBooks(result);
  };

  // Fetch books when component is mounted
  useEffect(() => {
    const fetchBooks = async () => {
      const db = await getDbConnection();
      const result = await db.getAllAsync('SELECT * FROM books');
      setBooks(result);
      setLoading(false);
    };

    fetchBooks();
  }, [books]); // Re-run when books list is updated

  // Handle book deletion
  const handleDeleteBook = (bookId) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteBook(bookId, refreshBooks); // Call the delete function
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6B7280" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📚 My Book Collection</Text>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <TouchableOpacity
              style={styles.bookDetails}
              onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
            >
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>by {item.author}</Text>
            </TouchableOpacity>

            {/* Add Delete Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBook(item.id)} // Trigger delete
            >
              <Text style={styles.deleteButtonText}>❌ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddBook')}>
        <Text style={styles.addButtonText}>➕ Add New Book</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCategory')}>
        <Text style={styles.addButtonText}>📂 Add New Category</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF6EC', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#4B5563', textAlign: 'center', marginBottom: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bookCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  bookDetails: { marginBottom: 10 },
  bookTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  bookAuthor: { fontSize: 14, color: '#6B7280' },
  deleteButton: { backgroundColor: '#EF4444', padding: 10, borderRadius: 10, alignItems: 'center' },
  deleteButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  addButton: { backgroundColor: '#6B7280', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;
