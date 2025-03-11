// BookNest/src/screens/HomeScreen.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TextInput 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshBooks = async () => {
    const db = await getDbConnection();
    const result = await db.getAllAsync('SELECT * FROM books');
    setBooks(result);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      refreshBooks();
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
          onPress: async () => await deleteBook(bookId, refreshBooks),
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleFavorite = async (book) => {
    await toggleFavorite(book.id, book.favorite, refreshBooks);
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
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
      {/* Header with Settings button */}
      <View style={[styles.header, { backgroundColor: theme.buttonBackground }]}>
        <Text style={[styles.headerText, { color: theme.buttonText }]}>BookNest</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.buttonText} />
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.text} style={{ marginHorizontal: 8 }} />
        <TextInput
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: theme.text }]}
          placeholderTextColor={theme.text}
        />
      </View>
      
      {/* Book List */}
      <FlatList
        data={filteredBooks}
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
                style={styles.actionButton}
                onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
              >
                <Ionicons name="create-outline" size={24} color={theme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteBook(item.id)}
              >
                <Ionicons name="trash-outline" size={24} color={theme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
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
  outerContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
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
    backgroundColor: '#A67C52',
    padding: 10,
    borderRadius: 10,
  },
});

export default HomeScreen;
