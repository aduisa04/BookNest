import React, { useState, useCallback } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, deleteBook, toggleFavorite } from '../database/db';
import CustomAlert from '../context/CustomAlert';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const currentTheme = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: theme.text || newColors.text,
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    buttonBackground: theme.buttonBackground || newColors.buttonBackground,
    buttonText: theme.buttonText || newColors.buttonText,
  };

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  
  // New state: cardSize can be "small", "medium", or "large"
  const [cardSize, setCardSize] = useState("medium");

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

  // Define card dimensions based on cardSize state (used for vertical layouts)
  const cardDimensions = {
    imageHeight: cardSize === "small" ? 140 : cardSize === "large" ? 220 : 180,
    titleFontSize: cardSize === "small" ? 18 : cardSize === "large" ? 24 : 20,
    authorFontSize: cardSize === "small" ? 14 : cardSize === "large" ? 18 : 16,
  };

  const renderItem = ({ item }) => {
    if (cardSize === "small") {
      // Horizontal layout for small card size:
      return (
        <TouchableOpacity
          style={[styles.bookCard, styles.smallCard, { backgroundColor: currentTheme.cardBackground }]}
          onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
        >
          {item.coverImage ? (
            <Image 
              source={{ uri: item.coverImage }} 
              style={styles.coverImageSmall} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.coverPlaceholderSmall, { backgroundColor: currentTheme.background }]}>
              <Ionicons name="image" size={40} color={currentTheme.text} />
            </View>
          )}
          <View style={styles.detailsContainerSmall}>
            <Text style={[styles.bookTitle, { color: currentTheme.text, fontSize: 16 }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: currentTheme.text, fontSize: 14 }]} numberOfLines={1}>
              by {item.author}
            </Text>
            <View style={styles.actionsRowSmall}>
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: currentTheme.secondary }]}
                onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
              >
                <Ionicons name="pencil" size={18} color={currentTheme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: "#FF6B6B" }]}
                onPress={() => handleDeleteBook(item.id)}
              >
                <Ionicons name="trash" size={18} color={currentTheme.buttonText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonSmall, { backgroundColor: currentTheme.secondary }]}
                onPress={() => handleToggleFavorite(item)}
              >
                {item.favorite ? (
                  <Ionicons name="heart" size={18} color="#FF3B30" />
                ) : (
                  <Ionicons name="heart-outline" size={18} color={currentTheme.buttonText} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      // Default vertical layout for medium and large sizes.
      return (
        <TouchableOpacity
          style={[styles.bookCard, { backgroundColor: currentTheme.cardBackground }]}
          onPress={() => navigation.navigate('BookDetails', { bookId: item.id })}
        >
          {item.coverImage ? (
            <Image 
              source={{ uri: item.coverImage }} 
              style={[styles.coverImage, { height: cardDimensions.imageHeight }]} 
              resizeMode="cover" 
            />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: currentTheme.background, height: cardDimensions.imageHeight }]}>
              <Ionicons name="image" size={40} color={currentTheme.text} />
            </View>
          )}
          <View style={styles.detailsContainer}>
            <Text style={[styles.bookTitle, { color: currentTheme.text, fontSize: cardDimensions.titleFontSize }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: currentTheme.text, fontSize: cardDimensions.authorFontSize }]} numberOfLines={1}>
              by {item.author}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.secondary }]}
              onPress={() => navigation.navigate('EditBook', { bookId: item.id })}
            >
              <Ionicons name="pencil" size={22} color={currentTheme.buttonText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
              onPress={() => handleDeleteBook(item.id)}
            >
              <Ionicons name="trash" size={22} color={currentTheme.buttonText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.secondary }]}
              onPress={() => handleToggleFavorite(item)}
            >
              {item.favorite ? (
                <Ionicons name="heart" size={22} color="#FF3B30" />
              ) : (
                <Ionicons name="heart-outline" size={22} color={currentTheme.buttonText} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background, flex: 1 }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color={currentTheme.text} style={styles.searchIcon} />
        <TextInput 
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by title, author, or category"
          style={[
            styles.searchInput, 
            { 
              backgroundColor: currentTheme.background, 
              color: currentTheme.text, 
              borderColor: currentTheme.secondary 
            }
          ]}
          placeholderTextColor={currentTheme.text}
        />
      </View>
      {/* Layout Selector */}
      <View style={styles.layoutSelector}>
        <Text style={[styles.layoutLabel, { color: currentTheme.text }]}>Layout:</Text>
        {["small", "medium", "large"].map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.layoutButton,
              {
                backgroundColor: cardSize === size ? currentTheme.secondary : currentTheme.background,
                borderColor: currentTheme.secondary,
              },
            ]}
            onPress={() => setCardSize(size)}
          >
            <Text style={[styles.layoutButtonText, { color: currentTheme.text }]}>{size.charAt(0).toUpperCase() + size.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContainer, { marginTop: 20, flexGrow: 1, paddingBottom: 120 }]}
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
  layoutSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  layoutLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  layoutButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  layoutButtonText: {
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
  // Styles for vertical layouts (medium and large)
  coverImage: {
    width: '100%',
  },
  coverPlaceholder: {
    width: '100%',
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
  // Styles for small layout (horizontal)
  smallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  coverImageSmall: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  coverPlaceholderSmall: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainerSmall: {
    flex: 1,
    marginLeft: 10,
  },
  actionsRowSmall: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButtonSmall: {
    padding: 6,
    borderRadius: 6,
    marginHorizontal: 3,
  },
});

export default BookListScreen;
