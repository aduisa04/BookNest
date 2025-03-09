import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDbConnection } from '../database/db';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const db = await getDbConnection();
      const result = await db.getAllAsync('SELECT * FROM books');
      setBooks(result);
      setLoading(false);
    };

    fetchBooks();
  }, [books]);

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
          <TouchableOpacity
            style={styles.bookCard}
            onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
          >
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>by {item.author}</Text>
          </TouchableOpacity>
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
  bookTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  bookAuthor: { fontSize: 14, color: '#6B7280' },
  addButton: { backgroundColor: '#6B7280', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default HomeScreen;
