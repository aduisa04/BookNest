// BookNest/src/screens/BookDetailsScreen.jsx
import React, { useState, useCallback } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDbConnection, toggleFavorite } from '../database/db';
import { useTheme } from '../context/ThemeContext';

export default function BookDetailsScreen() {
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

  if (!book) return <Text style={[styles.loading, { color: theme.text }]}>Loading...</Text>;

  const handleToggleFavorite = async () => {
    await toggleFavorite(book.id, book.favorite, async () => {
      await fetchBook();
    });
  };

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.title, { color: theme.text }]}>{book.title}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Author: {book.author}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Category: {book.category}</Text>
        <Text style={[styles.detail, { color: theme.text }]}>Status: {book.status}</Text>
        
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Notes</Text>
        <Text style={[styles.notes, { color: theme.text }]}>{book.notes ? book.notes : 'No notes added yet.'}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]} 
            onPress={() => navigation.navigate('EditBook', { bookId: book.id })}
          >
            <Ionicons name="create-outline" size={24} color={theme.buttonText} />
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Edit Book</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.buttonBackground }]} 
            onPress={handleToggleFavorite}
          >
            {book.favorite ? (
              <Ionicons name="star" size={24} color="#FFD700" />
            ) : (
              <Ionicons name="star-outline" size={24} color={theme.buttonText} />
            )}
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              {book.favorite ? 'Unfavorite' : 'Favorite'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    padding: 20,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  loading: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginTop: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    textAlign: 'center'
  },
  detail: { 
    fontSize: 18, 
    marginBottom: 8, 
    textAlign: 'center'
  },
  sectionHeader: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginTop: 30, 
    marginBottom: 10, 
    textAlign: 'left'
  },
  notes: { 
    fontSize: 16, 
    fontStyle: 'italic', 
    lineHeight: 24, 
    marginBottom: 30, 
    textAlign: 'justify'
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    marginBottom: 10 
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 10,
  },
});


