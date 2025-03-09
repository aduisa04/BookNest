import React, { useState, useEffect } from 'react';
import { View, TextInput, Alert, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getDbConnection, getCategories } from '../database/db';
import { StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const EditBookScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]); // ✅ Categories instead of genres
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchBookDetails();
  }, [bookId]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };

  const fetchBookDetails = async () => {
    try {
      const db = await getDbConnection();
      const result = await db.getFirstAsync('SELECT * FROM books WHERE id = ?', [bookId]);

      if (result) {
        setTitle(result.title);
        setAuthor(result.author);
        setStatus(result.status);
        setNotes(result.notes);
        setSelectedCategory(result.category);
      }
    } catch (error) {
      console.error('❌ Error fetching book details:', error);
    }
  };

  const handleUpdateBook = async () => {
    if (!title || !author || !selectedCategory || !status) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const db = await getDbConnection();
      await db.runAsync(
        'UPDATE books SET title = ?, author = ?, category = ?, status = ?, notes = ? WHERE id = ?',
        [title, author, selectedCategory, status, notes, bookId]
      );

      Alert.alert('Success', 'Book updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error updating book:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✏️ Edit Book</Text>

      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Author" value={author} onChangeText={setAuthor} style={styles.input} />

      <Text style={styles.label}>📁 Select Category</Text>
      <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={styles.picker}>
        {categories.map((category) => (
          <Picker.Item key={category.id} label={category.name} value={category.name} />
        ))}
      </Picker>

      <Text style={styles.label}>📝 Notes</Text>
      <TextInput
        placeholder="Enter book notes..."
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, { height: 100 }]}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdateBook}>
        <Text style={styles.buttonText}>💾 Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  picker: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  button: { backgroundColor: '#007bff', padding: 10, alignItems: 'center', borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});

export default EditBookScreen;
