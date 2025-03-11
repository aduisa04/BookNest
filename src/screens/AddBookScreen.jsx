// BookNest/src/screens/AddBookScreen.jsx
import React, { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  ScrollView, 
  TextInput, 
  Alert, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  View 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategories } from '../database/db';
import { Picker } from '@react-native-picker/picker';
import { getDbConnection } from '../database/db';

const AddBookScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
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
      style={[styles.outerContainer, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.header, { color: theme.text }]}>Add New Book</Text>
        <TextInput 
          placeholder="Title" 
          value={title} 
          onChangeText={setTitle} 
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]} 
          placeholderTextColor="#999"
        />
        <TextInput 
          placeholder="Author" 
          value={author} 
          onChangeText={setAuthor} 
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]} 
          placeholderTextColor="#999"
        />

        <Text style={[styles.label, { color: theme.text }]}>Select Status</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
          <Picker 
            selectedValue={status} 
            onValueChange={setStatus} 
            style={[styles.picker, { color: theme.text }]}
            itemStyle={{ color: theme.text }}
          >
            <Picker.Item label="Pending" value="Pending" />
            <Picker.Item label="Finished" value="Finished" />
          </Picker>
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Select Category</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
          <Picker 
            selectedValue={selectedCategory} 
            onValueChange={setSelectedCategory} 
            style={[styles.picker, { color: theme.text }]}
            itemStyle={{ color: theme.text }}
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
        </View>

        <TextInput 
          placeholder="Notes" 
          value={notes} 
          onChangeText={setNotes} 
          style={[styles.input, styles.notesInput, { backgroundColor: theme.inputBackground, color: theme.text }]} 
          multiline 
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={handleAddBook}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Add Book</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={() => navigation.navigate('AddCategory')}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Add Category</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF', // This will be overridden by theme
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#A67C52', // This may be overridden by dynamic theme if needed
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#A67C52',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBookScreen;
