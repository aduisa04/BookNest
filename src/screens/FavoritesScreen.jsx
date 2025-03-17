import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, updateBookRating } from '../database/db';
import { useTheme } from '../context/ThemeContext';

// Fallback default colors
const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const AnimatedStar = ({ filled, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={filled ? "star" : "star-outline"}
          size={32}
          color={filled ? "#FFD700" : "#CCCCCC"}
          style={{ marginHorizontal: 6 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const FavoritesScreen = () => {
  const { theme } = useTheme();
  // Merge dynamic theme values with fallback defaults.
  const currentTheme = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: theme.text || newColors.text,
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    buttonBackground: theme.buttonBackground || newColors.buttonBackground,
    buttonText: theme.buttonText || newColors.buttonText,
  };

  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = async () => {
    try {
      const db = await getDbConnection();
      const result = await db.getAllAsync('SELECT * FROM books WHERE favorite = 1');
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

  const handleRating = async (bookId, rating) => {
    await updateBookRating(bookId, rating, refreshFavorites);
  };

  const renderStars = (book) => (
    <View style={[styles.starContainer, { 
      backgroundColor: currentTheme.cardBackground, 
      borderColor: currentTheme.secondary 
    }]}>
      {[1, 2, 3, 4, 5].map((star) => (
        <AnimatedStar
          key={star}
          filled={star <= book.rating}
          onPress={() => handleRating(book.id, book.rating === star ? 0 : star)}
        />
      ))}
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={[styles.bookCard, { backgroundColor: currentTheme.cardBackground }]}>
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: currentTheme.background }]}>
          <Ionicons name="image" size={40} color={currentTheme.text} />
        </View>
      )}
      <View style={styles.detailsContainer}>
        <Text style={[styles.bookTitle, { color: currentTheme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: currentTheme.text }]} numberOfLines={1}>
          by {item.author}
        </Text>
        <Text style={[styles.bookRating, { color: currentTheme.text }]}>
          Rating: {item.rating} star{item.rating === 1 ? '' : 's'}
        </Text>
      </View>
      {renderStars(item)}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size="large" color={currentTheme.buttonBackground} />
      </View>
    );
  }

  if (favoriteBooks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.emptyText, { color: currentTheme.text }]}>No favorite books found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
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
    paddingHorizontal: 10,
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
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 20,
  },
  bookCard: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
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
    borderBottomColor: '#DDD',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 16,
    marginTop: 4,
  },
  bookRating: {
    fontSize: 14,
    marginTop: 5,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default FavoritesScreen;
