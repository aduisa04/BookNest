// FavoritesScreen.jsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = async () => {
    const db = await getDbConnection();
    const result = await db.getAllAsync('SELECT * FROM books WHERE favorite = 1');
    setFavoriteBooks(result);
    setLoading(false);
  };

  // Refresh favorites every time the screen comes into focus.
  useFocusEffect(
    useCallback(() => {
      refreshFavorites();
    }, [])
  );

  const handleDeleteBook = (bookId) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteBook(bookId, refreshFavorites);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleFavorite = async (book) => {
    await toggleFavorite(book.id, book.favorite, refreshFavorites);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6B7280" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteBooks}
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
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteBook(item.id)}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>❌</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(item)}
                style={styles.actionButton}
              >
                <Text style={[styles.actionText, { color: item.favorite ? '#FFD700' : '#888' }]}>
                  ★
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6D2', padding: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bookCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookDetails: { marginBottom: 10 },
  bookTitle: { fontSize: 18, fontWeight: 'bold', color: '#4B3E3E' },
  bookAuthor: { fontSize: 14, color: '#6B7280' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 18,
  },
});

export default FavoritesScreen;
