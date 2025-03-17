import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getDbConnection } from '../database/db';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

// Import banner images – adjust paths as needed
import banner1 from '../../assets/b1.png';
import banner2 from '../../assets/b2.png';
import banner3 from '../../assets/b3.png';

const HomeScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const banners = [banner1, banner2, banner3];

  // State for Recently Read books, limited to 3
  const [recentBooks, setRecentBooks] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // State for Favorite books, limited to 3
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Fetch the 3 most recent finished books (assuming that finished books have status != 'pending')
  const fetchRecentBooks = async () => {
    try {
      const db = await getDbConnection();
      const results = await db.getAllAsync("SELECT * FROM books WHERE status != 'pending' ORDER BY id DESC LIMIT 3");
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
      const results = await db.getAllAsync("SELECT * FROM books WHERE favorite = 1 ORDER BY id DESC LIMIT 3");
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

  // Render a card for a single book item (used in both sections) with fadeInUp animation
  const renderBookCard = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={600} style={[styles.bookCard, { backgroundColor: theme.cardBackground }]}>
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
    </Animatable.View>
  );

  return (
    <>
      {/* StatusBar uses the primary color and dynamic statusBar style */}
      <StatusBar barStyle={theme.statusBarStyle || "dark-content"} backgroundColor={theme.primary || "#C8B6FF"} />
      <ScrollView
        style={[styles.outerContainer, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        stickyHeaderIndices={[0]}
      >
        {/* Updated Header with Mauve Background and Curved Bottom */}
        <Animatable.View 
          animation="slideInDown" 
          duration={800} 
          style={[styles.headerContainer, { backgroundColor: theme.primary || "#C8B6FF" }]}
        >
          <View style={styles.headerContent}>
            <Image 
              source={require('../../assets/booknest.png')} 
              style={styles.logo} 
              resizeMode="cover" 
            />
            <Text style={[styles.headerLabelText, { color: theme.text }]}>
              BOOKNEST
            </Text>
          </View>
        </Animatable.View>
  
        {/* Added extra space before the banners */}
        <View style={styles.bannerSpacer} />
  
        {/* Animated Banner Scroller */}
        <Animatable.View animation="fadeIn" duration={1000} style={styles.bannerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerScroll}>
            {banners.map((banner, index) => (
              <Animatable.View key={index} animation="zoomIn" duration={800} style={styles.bannerWrapper}>
                <Image source={banner} style={styles.bannerImage} resizeMode="cover" />
              </Animatable.View>
            ))}
          </ScrollView>
        </Animatable.View>
  
        {/* Recently Read Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.sectionContainer}>
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
        </Animatable.View>
  
        {/* Favorites Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.sectionContainer}>
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
        </Animatable.View>
  
        {/* Reading Calendar Section */}
        <Animatable.View animation="fadeInUp" duration={800} delay={600} style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Book Reading Reminder</Text>
          <TouchableOpacity
  style={[styles.calendarButton, { backgroundColor: "#C8B6FF" }]}
  onPress={() => navigation.navigate('BookCalendar')}
>
  <Ionicons name="calendar-outline" size={24} color={theme.text} />
  <Text style={[styles.calendarButtonText, { color: theme.text }]}>
    Set A Reminder
  </Text>
</TouchableOpacity>

        </Animatable.View>
  
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
  /* Updated Header Styles */
  headerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 50,
    borderRadius: 25,
    marginRight: -20,
  },
  headerLabelText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  bannerSpacer: {
    height: 20,  // Extra space below header and above banners
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
    shadowRadius: 4,
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
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  calendarButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HomeScreen;
