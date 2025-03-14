// BookNest/src/screens/HomeScreen.jsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { getDbConnection } from '../database/db';

// Import images – adjust paths as needed
import banner1 from '../../assets/b1.png';
import banner2 from '../../assets/b2.png';
import banner3 from '../../assets/b3.png';

const HomeScreen = () => {
  const { theme } = useTheme();
  const banners = [banner1, banner2, banner3];

  // State for Recently Read (most recent added) books, limited to 3
  const [recentBooks, setRecentBooks] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // State for Favorite books, limited to 3
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Fetch the 3 most recent books (assuming higher id means more recent)
  const fetchRecentBooks = async () => {
    try {
      const db = await getDbConnection();
      const results = await db.getAllAsync('SELECT * FROM books ORDER BY id DESC LIMIT 3');
      setRecentBooks(results || []);
      setLoadingRecent(false);
    } catch (error) {
      console.error("Error fetching recent books:", error);
      setLoadingRecent(false);
    }
  };

  // Fetch the 3 most recent favorite books
  const fetchFavoriteBooks = async () => {
    try {
      const db = await getDbConnection();
      const results = await db.getAllAsync('SELECT * FROM books WHERE favorite = 1 ORDER BY id DESC LIMIT 3');
      setFavoriteBooks(results || []);
      setLoadingFavorites(false);
    } catch (error) {
      console.error("Error fetching favorite books:", error);
      setLoadingFavorites(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentBooks();
      fetchFavoriteBooks();
    }, [])
  );

  // Render a card for a single book item (used in both sections)
  const renderBookCard = ({ item }) => (
    <View style={[styles.bookCard, { backgroundColor: theme.cardBackground }]}>
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.bookCover} resizeMode="cover" />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: theme.inputBackground }]}>
          <Text style={{ color: theme.border }}>No Image</Text>
        </View>
      )}
      <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.bookAuthor, { color: theme.text }]} numberOfLines={1}>
        by {item.author}
      </Text>
    </View>
  );

  return (
    <>
      {/* Set the status bar style so that the brown shows behind the notifications */}
      <StatusBar barStyle="light-content" backgroundColor="#5d4037" />
      <ScrollView
        style={[styles.outerContainer, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        stickyHeaderIndices={[0]}
      >
        {/* Header Background extends to the top; content is pushed down with extra padding */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Image 
              source={require('../../assets/booknest.png')} 
              style={styles.logo} 
              resizeMode="cover" 
            />
            <Text style={styles.headerLabelText}>BOOKNEST</Text>
          </View>
        </View>
  
        {/* Banner Scroller */}
        <View style={styles.bannerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerScroll}>
            {banners.map((banner, index) => (
              <View key={index} style={styles.bannerWrapper}>
                <Image source={banner} style={styles.bannerImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        </View>
  
        {/* Recently Read Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recently Read</Text>
          {loadingRecent ? (
            <ActivityIndicator size="small" color={theme.buttonBackground} />
          ) : recentBooks.length > 0 ? (
            <FlatList
              data={recentBooks}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBookCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: theme.text }]}>No recent books found.</Text>
          )}
        </View>
  
        {/* Your Favorites Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Favorites</Text>
          {loadingFavorites ? (
            <ActivityIndicator size="small" color={theme.buttonBackground} />
          ) : favoriteBooks.length > 0 ? (
            <FlatList
              data={favoriteBooks}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBookCard}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <Text style={[styles.emptyText, { color: theme.text }]}>No favorite books found.</Text>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 70,
  },
  headerContainer: {
    backgroundColor: '#5d4037',
    paddingTop: 5,  // Extra padding pushes logo/text further down
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 125,      // Unchanged
    height: 90,      // Unchanged
    borderRadius: 45, // Unchanged
    marginRight: -40, // Unchanged marginRight functionality
  },
  headerLabelText: {
    fontFamily: 'PlayfairDisplay_400Regular', // Ensure this custom font is installed
    fontSize: 30,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    marginRight: 20, // Unchanged
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bannerScroll: {
    paddingVertical: 10,
  },
  bannerWrapper: {
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bannerImage: {
    width: 320,
    height: 200,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  horizontalList: {
    paddingVertical: 10,
  },
  bookCard: {
    width: 140,
    marginRight: 15,
    borderRadius: 10,
    overflow: 'hidden',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bookCover: {
    width: '100%',
    height: 180,
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  bookAuthor: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen;
