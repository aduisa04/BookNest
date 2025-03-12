// BookNest/src/screens/BookDetailsScreen.jsx
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

const BookDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  const { theme } = useTheme();
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
    return <Text style={[styles.loading, { color: theme.text }]}>Loading...</Text>;
  }

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        {/* Display Cover Image if available */}
        {book.coverImage ? (
          <Image source={{ uri: book.coverImage }} style={styles.coverImage} resizeMode="cover" />
        ) : null}
        <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Author: {book.author}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Category: {book.category}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Status: {book.status}</Text>
        
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Notes</Text>
        <Text style={[styles.notes, { color: theme.text }]}>
          {book.notes ? book.notes : 'No notes added yet.'}
        </Text>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]}
            onPress={() => navigation.navigate('EditBook', { bookId: book.id })}
          >
            <Ionicons name="create-outline" size={24} color={theme.buttonText} />
            <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>Edit Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
