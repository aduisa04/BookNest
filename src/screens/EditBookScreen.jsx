// BookNest/src/screens/EditBookScreen.jsx
import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getDbConnection, getCategories } from '../database/db';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Define new color scheme
const newColors = {
  primary: "#C8B6FF",       // Mauve
  secondary: "#B8C0FF",     // Periwinkle
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const EditBookScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  // Override theme values using newColors for this screen.
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [coverImage, setCoverImage] = useState(null);

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
        setCoverImage(result.coverImage);
      }
    } catch (error) {
      console.error('❌ Error fetching book details:', error);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access gallery is required!");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCoverImage(result.assets[0].uri);
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
        'UPDATE books SET title = ?, author = ?, category = ?, status = ?, notes = ?, coverImage = ? WHERE id = ?',
        [title, author, selectedCategory, status, notes, coverImage, bookId]
      );
      Alert.alert('Success', 'Book updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error updating book:', error);
      Alert.alert('Error', 'Failed to update book.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: newColors.background }]}>
      <View style={styles.header}>
        <Ionicons name="create-outline" size={28} color={newColors.buttonBackground} />
        <Text style={[styles.headerText, { color: newColors.text }]}>Edit Book</Text>
      </View>
      <TextInput 
        placeholder="Title" 
        value={title} 
        onChangeText={setTitle} 
        style={[styles.input, { backgroundColor: newColors.background, color: newColors.text, borderColor: newColors.secondary }]} 
        placeholderTextColor={newColors.text}
      />
      <TextInput 
        placeholder="Author" 
        value={author} 
        onChangeText={setAuthor} 
        style={[styles.input, { backgroundColor: newColors.background, color: newColors.text, borderColor: newColors.secondary }]} 
        placeholderTextColor={newColors.text}
      />
      <Text style={[styles.label, { color: newColors.text }]}>Select Status</Text>
      <View style={[styles.pickerContainer, { backgroundColor: newColors.background, borderColor: newColors.secondary }]}>
        <Picker 
          selectedValue={status} 
          onValueChange={setStatus} 
          style={[styles.picker, { color: newColors.text }]}
          itemStyle={{ color: newColors.text }}
        >
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="Finished" value="Finished" />
        </Picker>
      </View>
      <Text style={[styles.label, { color: newColors.text }]}>Select Category</Text>
      <View style={[styles.pickerContainer, { backgroundColor: newColors.background, borderColor: newColors.secondary }]}>
        <Picker 
          selectedValue={selectedCategory} 
          onValueChange={setSelectedCategory} 
          style={[styles.picker, { color: newColors.text }]}
          itemStyle={{ color: newColors.text }}
        >
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.name} />
          ))}
        </Picker>
      </View>
      <Text style={[styles.label, { color: newColors.text }]}>Notes</Text>
      <TextInput
        placeholder="Enter book notes..."
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notesInput, { backgroundColor: newColors.background, color: newColors.text, borderColor: newColors.secondary }]}
        multiline
        placeholderTextColor={newColors.text}
      />
      <TouchableOpacity style={[styles.imageButton, { backgroundColor: newColors.buttonBackground }]} onPress={pickImage}>
        <Text style={[styles.imageButtonText, { color: newColors.buttonText }]}>
          {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
        </Text>
      </TouchableOpacity>
      {coverImage && (
        <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
      )}
      <TouchableOpacity style={[styles.button, { backgroundColor: newColors.buttonBackground }]} onPress={handleUpdateBook}>
        <Ionicons name="save-outline" size={24} color={newColors.buttonText} />
        <Text style={[styles.buttonText, { color: newColors.buttonText }]}> Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  input: { 
    borderWidth: 1, 
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 8,
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
});

export default EditBookScreen;
