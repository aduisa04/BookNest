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

// A component for each animated star
const AnimatedStar = ({ filled, onPress, theme }) => {
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
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={filled ? "star" : "star-outline"}
          size={36}
          color={filled ? "#FFD700" : "#CCCCCC"}
          style={{ marginHorizontal: 8 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const FavoritesScreen = () => {
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

  // Update rating and refresh the list
  const handleRating = async (bookId, rating) => {
    await updateBookRating(bookId, rating, refreshFavorites);
  };

  // Render the 5-star rating UI using the AnimatedStar component with toggle logic
  const renderStars = (book) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <AnimatedStar
            key={star}
            filled={star <= book.rating}
            onPress={() => {
              // Toggle: if tapped star is already selected, set rating to 0; otherwise, set to the star value.
              const newRating = (book.rating === star) ? 0 : star;
              handleRating(book.id, newRating);
            }}
            theme={theme}
          />
        ))}
      </View>
    );
  };

  // Render each book card as a static view (without navigation)
  const renderItem = ({ item }) => (
    <View style={[styles.bookCard, { backgroundColor: theme.cardBackground }]}>
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
        <Text style={{ color: theme.text, marginTop: 5 }}>
          Rating: {item.rating} star{item.rating === 1 ? '' : 's'}
        </Text>
      </View>
      {renderStars(item)}
    </View>
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
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderColor: '#eee',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});

export default FavoritesScreen;
