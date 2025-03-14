// BookNest/src/screens/BookListScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../context/CustomAlert';

const BookListScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // For custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const refreshBooks = async () => {
    try {
      const db = await getDbConnection();
      const result = await db.getAllAsync('SELECT * FROM books');
      setBooks(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching books:", error);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshBooks();
    }, [])
  );

  // Instead of using native Alert, show our custom alert
  const handleDeleteBook = (bookId) => {
    setBookToDelete(bookId);
    setAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (bookToDelete) {
      await deleteBook(bookToDelete, refreshBooks);
    }
    setAlertVisible(false);
    setBookToDelete(null);
  };

  const cancelDelete = () => {
    setAlertVisible(false);
    setBookToDelete(null);
  };

  const handleToggleFavorite = async (book) => {
    await toggleFavorite(book.id, book.favorite, refreshBooks);
  };

  // Render each book item in a vertical card layout.
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: theme.cardBackground }]}
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
    >
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="image" size={40} color={theme.border} />
        </View>
      )}
      <View style={styles.detailsContainer}>
        <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: theme.text }]} numberOfLines={1}>
          by {item.author}
        </Text>
      </View>
      <View style={styles.actionsRow}>
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
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.buttonBackground} />
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer, { marginTop: 20 }]}
      />
      <CustomAlert
        visible={alertVisible}
        title="Delete Book"
        message="Are you sure you want to delete this book?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 20,
  },
  bookCard: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 16,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 5,
  },
});

export default BookListScreen;
