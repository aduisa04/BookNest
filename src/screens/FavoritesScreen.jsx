// BookNest/src/screens/FavoritesScreen.jsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Image 
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

  if (favoriteBooks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>No favorite books found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <FlatList
        data={favoriteBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
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
  },
});

export default FavoritesScreen;
