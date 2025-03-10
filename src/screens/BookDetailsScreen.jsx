import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDbConnection, toggleFavorite } from '../database/db';

export default function BookDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  const [book, setBook] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      const db = await getDbConnection();
      const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
      setBook(result);
    };
    fetchBook();
  }, [bookId]);

  if (!book) return <Text>Loading...</Text>;

  const handleToggleFavorite = async () => {
    await toggleFavorite(book.id, book.favorite, () => {
      // Refresh book details after toggle
      const refresh = async () => {
        const db = await getDbConnection();
        const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
        setBook(result);
      };
      refresh();
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>📖 Author: {book.author}</Text>
      <Text style={styles.category}>🎭 Category: {book.category}</Text>
      <Text style={styles.status}>📌 Status: {book.status}</Text>
      <Text style={styles.header}>📝 Notes:</Text>
      <Text style={styles.notes}>{book.notes ? book.notes : 'No notes added yet.'}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditBook', { bookId: book.id })}>
          <Text style={styles.buttonText}>✏️ Edit Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Text style={[styles.buttonText, { color: book.favorite ? '#FFD700' : '#888' }]}>
            {book.favorite ? '★ Unfavorite' : '☆ Favorite'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FAF3E3' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4B3E3E', marginBottom: 10 },
  author: { fontSize: 18, color: '#555', marginBottom: 5 },
  category: { fontSize: 18, color: '#555', marginBottom: 5 },
  status: { fontSize: 18, color: '#555', marginBottom: 15 },
  header: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  notes: { fontSize: 16, color: '#444', fontStyle: 'italic', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { backgroundColor: '#A67C52', padding: 10, borderRadius: 5 },
  favoriteButton: { backgroundColor: '#A67C52', padding: 10, borderRadius: 5 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
});

