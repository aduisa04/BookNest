import React, { useState, useCallback } from 'react';
import { ScrollView, TextInput, Alert, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategories } from '../database/db';
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

  // Fetch categories and reset form fields when the screen gains focus.
  useFocusEffect(
    useCallback(() => {
      const initialize = async () => {
        try {
          const data = await getCategories();
          setCategories(data);
          if (data.length > 0) {
            setSelectedCategory(data[0].name);
          } else {
            setSelectedCategory('');
          }
        } catch (error) {
          console.error('❌ Error fetching categories:', error);
        }
        // Reset form fields
        setTitle('');
        setAuthor('');
        setNotes('');
        setStatus('Pending');
      };
      initialize();
    }, [])
  );

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

      // Insert the new book
      await db.runAsync(
        'INSERT INTO books (title, author, category, status, notes) VALUES (?, ?, ?, ?, ?)',
        [title, author, selectedCategory, status, notes]
      );

      console.log("✅ Book added successfully");
      Alert.alert('Success', 'Book added successfully!');

      // Clear the form fields after adding the book
      setTitle('');
      setAuthor('');
      setNotes('');
      setStatus('Pending');
      if (categories.length > 0) {
        setSelectedCategory(categories[0].name);
      } else {
        setSelectedCategory('');
      }

      navigation.goBack();

    } catch (error) {
      console.error("❌ Unexpected error adding book:", error);
      Alert.alert('Error', 'Failed to add book.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput 
        placeholder="Title" 
        value={title} 
        onChangeText={setTitle} 
        style={styles.input} 
        placeholderTextColor="#999"
      />
      <TextInput 
        placeholder="Author" 
        value={author} 
        onChangeText={setAuthor} 
        style={styles.input} 
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>📌 Select Status</Text>
      <Picker 
        selectedValue={status} 
        onValueChange={setStatus} 
        style={styles.picker}
        itemStyle={{ color: '#4B3E3E' }}
      >
        <Picker.Item label="Pending" value="Pending" />
        <Picker.Item label="Finished" value="Finished" />
      </Picker>

      <Text style={styles.label}>📁 Select Category</Text>
      <Picker 
        selectedValue={selectedCategory} 
        onValueChange={setSelectedCategory} 
        style={styles.picker}
        itemStyle={{ color: '#4B3E3E' }}
      >
        {categories.length > 0 ? (
          categories.map((category) => (
            <Picker.Item 
              key={category.id} 
              label={category.name} 
              value={category.name} 
            />
          ))
        ) : (
          <Picker.Item label="No Categories Available" value="" />
        )}
      </Picker>

      <TextInput 
        placeholder="Notes" 
        value={notes} 
        onChangeText={setNotes} 
        style={[styles.input, styles.notesInput]} 
        multiline 
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleAddBook}>
        <Text style={styles.buttonText}>📚 Add Book</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddCategory')}>
        <Text style={styles.buttonText}>➕ Add Category</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FDF6EC', // Off-white, cozy background
  },
  contentContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#A67C52', // Warm brown border
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#FFF8F0', // Subtle off-white background
    fontSize: 16,
    color: '#4B3E3E', // Dark brown text
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    color: '#4B3E3E',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#A67C52',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#FFF8F0',
    color: '#4B3E3E',
  },
  button: {
    backgroundColor: '#A67C52',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default AddBookScreen;
