import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection } from '../database/db';
import { useTheme } from '../context/ThemeContext';
import * as Animatable from 'react-native-animatable';

// Fallback default colors
const newColors = {
  primary: "#C8B6FF",       // Mauve
  secondary: "#B8C0FF",     // Periwinkle
  text: "#333333",          // Dark text for readability
  background: "#FFFFFF",    // White background
  cardBackground: "#F8F8F8",// Light card background
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const BookDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  const { theme } = useTheme();
  // Merge dynamic theme values with fallbacks
  const currentTheme = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: theme.text || newColors.text,
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    buttonBackground: theme.buttonBackground || newColors.buttonBackground,
    buttonText: theme.buttonText || newColors.buttonText,
    statusBarStyle: theme.statusBarStyle || "dark-content",
  };

  const [book, setBook] = useState(null);

  const fetchBook = async () => {
    const db = await getDbConnection();
    const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
    setBook(result);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBook();
    }, [bookId])
  );

  if (!book) {
    return <Text style={[styles.loading, { color: currentTheme.text }]}>Loading...</Text>;
  }

  return (
    <ScrollView 
      style={[styles.outerContainer, { backgroundColor: currentTheme.background }]} 
      contentContainerStyle={styles.contentContainer}
    >
      <Animatable.View 
        animation="fadeInUp" 
        duration={800} 
        style={[styles.card, { backgroundColor: currentTheme.cardBackground }]}
      >
        {book.coverImage ? (
          <Animatable.Image 
            animation="fadeIn" 
            duration={800} 
            source={{ uri: book.coverImage }} 
            style={styles.coverImage} 
            resizeMode="cover" 
          />
        ) : null}
        <Animatable.Text 
          animation="fadeIn" 
          duration={800} 
          style={[styles.title, { color: currentTheme.text }]}
        >
          {book.title}
        </Animatable.Text>
        <Text style={[styles.detail, { color: currentTheme.text }]}>
          Author: {book.author}
        </Text>
        <Text style={[styles.detail, { color: currentTheme.text }]}>
          Category: {book.category}
        </Text>
        <Text style={[styles.detail, { color: currentTheme.text }]}>
          Status: {book.status}
        </Text>
        
        <Text style={[styles.sectionHeader, { color: currentTheme.text }]}>
          Notes
        </Text>
        <Text style={[styles.notes, { color: currentTheme.text }]}>
          {book.notes ? book.notes : 'No notes added yet.'}
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: currentTheme.secondary }]}
            onPress={() => navigation.navigate('EditBook', { bookId: book.id })}
          >
            <Ionicons name="create-outline" size={24} color={currentTheme.buttonText} />
            <Text style={[styles.actionButtonText, { color: currentTheme.buttonText }]}>
              Edit Book
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  coverImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  detail: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  notes: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'justify',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loading: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default BookDetailsScreen;
