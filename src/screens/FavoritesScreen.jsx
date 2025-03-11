// BookNest/src/screens/FavoritesScreen.jsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Text 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';
import { useTheme } from '../context/ThemeContext';

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = async () => {
    try {
      const db = await getDbConnection();
      const result = await db.getAllAsync('SELECT * FROM books WHERE favorite = 1');
      console.log("Favorites query result:", result);
      setFavoriteBooks(result || []);
      setLoading(false);
    } catch (error) {
      console.error("Error refreshing favorites:", error);
      setLoading(false);
    }
  };

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
          onPress: async () => await deleteBook(bookId, refreshFavorites),
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleFavorite = async (book) => {
    await toggleFavorite(book.id, book.favorite, refreshFavorites);
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  if (favoriteBooks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>No favorite books found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={favoriteBooks}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={[styles.bookCard, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={styles.bookDetails}
              onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
            >
              <Text style={[styles.bookTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.bookAuthor, { color: theme.text }]}>by {item.author}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
              >
                <Ionicons name="create-outline" size={24} color={theme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => handleDeleteBook(item.id)}
              >
                <Ionicons name="trash-outline" size={24} color={theme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => handleToggleFavorite(item)}
              >
                {item.favorite ? (
                  <Ionicons name="star" size={24} color="#FFD700" />
                ) : (
                  <Ionicons name="star-outline" size={24} color={theme.buttonText} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bookDetails: { 
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
  },
});

export default FavoritesScreen;
