import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  TextInput
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';
import CustomAlert from '../context/CustomAlert';

// Define new color scheme
const newColors = {
  primary: "#C8B6FF",       // Mauve
  secondary: "#B8C0FF",     // Periwinkle
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const BookListScreen = () => {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const refreshBooks = async () => {
    try {
      const db = await getDbConnection();
      const result = await db.getAllAsync("SELECT * FROM books WHERE status != 'pending'");
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

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    );
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.bookCard, { backgroundColor: newColors.cardBackground }]}
      onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
    >
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: newColors.background }]}>
          <Ionicons name="image" size={40} color={newColors.text} />
        </View>
      )}
      <View style={styles.detailsContainer}>
        <Text style={[styles.bookTitle, { color: newColors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: newColors.text }]} numberOfLines={1}>
          by {item.author}
        </Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: newColors.secondary }]}
          onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
        >
          <Ionicons name="pencil" size={22} color={newColors.buttonText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
          onPress={() => handleDeleteBook(item.id)}
        >
          <Ionicons name="trash" size={22} color={newColors.buttonText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: newColors.secondary }]}
          onPress={() => handleToggleFavorite(item)}
        >
          {item.favorite ? (
            <Ionicons name="heart" size={22} color="#FF3B30" />
          ) : (
            <Ionicons name="heart-outline" size={22} color={newColors.buttonText} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: newColors.background }]}>
        <ActivityIndicator size="large" color={newColors.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: newColors.background }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color={newColors.text} style={styles.searchIcon} />
        <TextInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, author, or category"
          style={[styles.searchInput, { backgroundColor: newColors.background, color: newColors.text, borderColor: newColors.secondary }]}
          placeholderTextColor={newColors.text}
        />
      </View>
      <FlatList
        data={filteredBooks}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
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
