import React, { useState, useCallback } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategories, addBook } from '../database/db';
import { Picker } from '@react-native-picker/picker';
import { getDbConnection } from '../database/db';


const AddBookScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');

  // ✅ Fetch categories when screen is focused
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
  
      if (data.length > 0) {
        setSelectedCategory(data[0].name); // ✅ Default to first category
      } else {
        setSelectedCategory(''); // ✅ Ensure selectedCategory is not undefined
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };
  
  // ✅ Reload categories when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // ✅ Handle Add Book
  const handleAddBook = async () => {
    console.log("📌 Debugging Add Book:", { title, author, selectedCategory, status, notes });
  
    if (!title || !author || !selectedCategory || !status) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
  
    try {
      const db = await getDbConnection();
      if (!db) {
        Alert.alert('Error', 'Database connection failed.');
        return;
      }
  
      // ✅ Use runAsync instead of transaction
      await db.runAsync(
        'INSERT INTO books (title, author, category, status, notes) VALUES (?, ?, ?, ?, ?)',
        [title, author, selectedCategory, status, notes]
      );
  
      console.log("✅ Book added successfully");
      Alert.alert('Success', 'Book added successfully!');
      navigation.goBack();
  
    } catch (error) {
      console.error("❌ Unexpected error adding book:", error);
      Alert.alert('Error', 'Failed to add book.');
    }
  };
  
  
  

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Author" value={author} onChangeText={setAuthor} style={styles.input} />

      <Text style={styles.label}>📌 Select Status</Text>
      <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
        <Picker.Item label="Pending" value="Pending" />
        <Picker.Item label="Finished" value="Finished" />
      </Picker>

      <Text style={styles.label}>📁 Select Category</Text>
      <Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory} style={styles.picker}>
        {categories.length > 0 ? (
          categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.name} />
          ))
        ) : (
          <Picker.Item label="No Categories Available" value="" />
        )}
      </Picker>

      <TextInput placeholder="Notes" value={notes} onChangeText={setNotes} style={styles.input} multiline />

      <Button title="📚 Add Book" onPress={handleAddBook} />
      <Button title="➕ Add Category" onPress={() => navigation.navigate('AddCategory')} />
    </View>
  );
};

// Styles
const styles = {
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  label: { fontWeight: 'bold', marginTop: 10 },
  picker: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
};

export default AddBookScreen;
