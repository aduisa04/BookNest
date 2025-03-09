import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDbConnection } from '../database/db';

export default function BookDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;

  const [book, setBook] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      const db = await getDbConnection();
      const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);
      setBook(result);
    };

    fetchBook();
  }, [bookId]);

  if (!book) return <Text>Loading...</Text>;

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#FAF3E3' }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>{book.title}</Text>
      <Text style={{ fontSize: 18, color: '#555' }}>📖 Author: {book.author}</Text>
      <Text style={{ fontSize: 18, color: '#555' }}>🎭 Genre: {book.genre}</Text>
      <Text style={{ fontSize: 18, color: '#555' }}>📌 Status: {book.status}</Text>

      {/* Notes Section */}
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20 }}>📝 Notes:</Text>
      <Text style={{ fontSize: 16, color: '#444', fontStyle: 'italic' }}>
        {book.notes ? book.notes : 'No notes added yet.'}
      </Text>

      <Button title="✏️ Edit Book" onPress={() => navigation.navigate('EditBook', { bookId: book.id })} />
    </ScrollView>
  );
}
