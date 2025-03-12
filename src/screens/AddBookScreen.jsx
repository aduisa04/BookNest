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
  View, 
  Image 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategories } from '../database/db';
import { Picker } from '@react-native-picker/picker';
import { getDbConnection } from '../database/db';
import * as ImagePicker from 'expo-image-picker';

const AddBookScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [coverImage, setCoverImage] = useState(null);

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
        setCoverImage(null);
      };
      initialize();
    }, [])
  );

  // Launch image picker using the older API constant
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Permission to access the gallery is required!");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use MediaTypeOptions here
        allowsEditing: true,
        quality: 0.7,
      });
      console.log("Image Picker Result:", result);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Selected Image URI:", uri);
        setCoverImage(uri);
      } else {
        console.log("Image selection canceled or no assets found.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "An error occurred while picking the image.");
    }
  };

  const handleAddBook = async () => {
    console.log("📌 Debugging Add Book:", { title, author, selectedCategory, status, notes, coverImage });
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
      // Insert the new book record including the coverImage URI
      await db.runAsync(
        'INSERT INTO books (title, author, category, status, notes, coverImage) VALUES (?, ?, ?, ?, ?, ?)',
        [title, author, selectedCategory, status, notes, coverImage]
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
      setCoverImage(null);
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
          placeholderTextColor={theme.text}
        />
        <TextInput 
          placeholder="Author" 
          value={author} 
          onChangeText={setAuthor} 
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]} 
          placeholderTextColor={theme.text}
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
                <Picker.Item key={category.id} label={category.name} value={category.name} />
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
          placeholderTextColor={theme.text}
        />
        <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.buttonBackground }]} onPress={pickImage}>
          <Text style={[styles.imageButtonText, { color: theme.buttonText }]}>
            {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
          </Text>
        </TouchableOpacity>
        {coverImage && (
          <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
        )}
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={handleAddBook}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>Add Book</Text>
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
    borderColor: '#A67C52',
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
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  coverPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
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
