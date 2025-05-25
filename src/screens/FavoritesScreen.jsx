// ./screens/FavoritesScreen.js
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
import { getDbConnection, deleteBook } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import CustomAlert from '../context/CustomAlert';

const newColors = {
  primary: "#C8B6FF", // Periwinkle
  secondary: "#B8C0FF", // Mauve-ish
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const AnimatedStar = ({ filled, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotationAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.7}>
      <Animated.View style={{ 
        transform: [
          { scale: scaleAnim },
          { rotate: rotationAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) }
        ]
      }}>
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
  const [alert, setAlert] = useState({ visible:false, id:null });
  const [layout, setLayout] = useState('small');

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

  const confirmDelete = async () => {
    await deleteBook(alert.id, refreshFavorites);
    setAlert({ visible:false, id:null });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.bookCard, layout === 'medium' && styles.cardMedium, { backgroundColor: currentTheme.cardBackground, flexDirection: layout === 'small' ? 'row' : 'column' }]}>
      {item.coverImage ? (
        <Image style={[styles.coverImage, layout === 'medium' && styles.coverMedium, layout === 'small' && styles.coverSmall]} source={{ uri: item.coverImage }} resizeMode="cover" />
      ) : (
        <View style={[styles.coverPlaceholder, layout === 'medium' && styles.coverPlaceholderMedium, layout === 'small' && styles.coverPlaceholderSmall, { backgroundColor: currentTheme.background }]}>
          <Ionicons name="image" size={layout === 'small' ? 60 : 80} color={currentTheme.text} />
        </View>
      )}
      <View style={[styles.detailsContainer, layout === 'medium' && styles.detailsContainerMedium, layout === 'small' && styles.detailsContainerSmall]}>
        <Text style={[styles.bookTitle, { color: currentTheme.text, fontSize: layout === 'small' ? 18 : 24 }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: currentTheme.text, fontSize: layout === 'small' ? 14 : 18 }]} numberOfLines={1}>
          by {item.author}
        </Text>
      </View>
      <View style={[styles.buttonRowCentered, layout === 'medium' && styles.buttonRowMedium]}>
        <TouchableOpacity
          onPress={()=>setAlert({ visible:true, id:item.id })}
          style={[styles.deleteIconButton, layout === 'medium' && styles.deleteIconButtonMedium]}
          activeOpacity={0.7}
          onLongPress={() => alert('Delete this book from favorites')}
        >
          <Ionicons name="trash" size={layout === 'small' ? 24 : 28} color="#fff" />
        </TouchableOpacity>
      </View>
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
      <View style={styles.layoutButtons}>
        <Text style={[styles.layoutLabel, { color: currentTheme.text }]}>Layout:</Text>
        <TouchableOpacity
          style={[styles.layoutButton, layout === 'small' && styles.layoutButtonActive, { borderColor: currentTheme.secondary, backgroundColor: layout === 'small' ? currentTheme.secondary : 'transparent' }]} 
          onPress={() => setLayout('small')}
        >
          <Text style={[styles.layoutButtonText, { color: layout === 'small' ? currentTheme.buttonText : currentTheme.text }]}>Small</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layoutButton, layout === 'medium' && styles.layoutButtonActive, { borderColor: currentTheme.secondary, marginLeft: 10, backgroundColor: layout === 'medium' ? currentTheme.secondary : 'transparent' }]} 
          onPress={() => setLayout('medium')}
        >
          <Text style={[styles.layoutButtonText, { color: layout === 'medium' ? currentTheme.buttonText : currentTheme.text }]}>Medium</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={favoriteBooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
      />
      <CustomAlert
        visible={alert.visible}
        title="Delete Book"
        message="Are you sure?"
        onConfirm={confirmDelete}
        onCancel={()=>setAlert({ visible:false, id:null })}
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
    borderRadius: 18,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  coverImage: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
    borderBottomWidth: 0,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#888',
    marginBottom: 6,
  },
  buttonRowCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteIconButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  layoutButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  layoutLabel: {
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  layoutButton: {
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  layoutButtonActive: {
    // Styles for active button (handled inline for dynamic color)
  },
  layoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardMedium: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
    marginHorizontal: 0,
  },
  coverMedium: {
    width: '100%',
    height: 250,
    marginBottom: 10,
    borderRadius: 12,
  },
  coverPlaceholderMedium: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderRadius: 12,
  },
  detailsContainerMedium: {
    padding: 0,
    marginBottom: 10,
  },
  bookTitleMedium: {
    fontSize: 24,
  },
  bookAuthorMedium: {
    fontSize: 18,
  },
  buttonRowMedium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  deleteIconButtonMedium: {
    padding: 16,
    borderRadius: 32,
  },
  coverSmall: {
    width: 60,
    height: 90,
    marginRight: 10,
    borderRadius: 4,
  },
  coverPlaceholderSmall: {
    width: 60,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 4,
  },
  detailsContainerSmall: {
    flex: 1,
    padding: 0,
    justifyContent: 'center',
  },
});

export default FavoritesScreen;
