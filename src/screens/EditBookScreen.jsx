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

// Fallback default colors with new scheme:
// - Periwinkle for general backgrounds and headers
// - Mauve for buttons
const newColors = {
  primary: "#B8C0FF",       // Periwinkle for backgrounds and headers
  secondary: "#C8B6FF",     // Mauve for accents
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#C8B6FF", // Mauve for buttons
  buttonText: "#FFFFFF",
};

const EditBookScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  const { theme } = useTheme();
  
  // Merge dynamic theme values with fallback defaults.
  const currentTheme = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: theme.text || newColors.text,
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    // For the buttons, we want mauve so we'll explicitly use "#C8B6FF"
    buttonBackground: "#C8B6FF",
    buttonText: theme.buttonText || newColors.buttonText,
  };

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
    // Set the container background to Periwinkle (currentTheme.primary)
    <ScrollView 
      style={[styles.container, { backgroundColor: currentTheme.primary }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Ionicons name="create-outline" size={28} color={currentTheme.buttonBackground} />
        <Text style={[styles.headerText, { color: currentTheme.text }]}>Edit Book</Text>
      </View>
      <TextInput 
        placeholder="Title" 
        value={title} 
        onChangeText={setTitle} 
        style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text, borderColor: currentTheme.secondary }]} 
        placeholderTextColor={currentTheme.text}
      />
      <TextInput 
        placeholder="Author" 
        value={author} 
        onChangeText={setAuthor} 
        style={[styles.input, { backgroundColor: currentTheme.background, color: currentTheme.text, borderColor: currentTheme.secondary }]} 
        placeholderTextColor={currentTheme.text}
      />
      <Text style={[styles.label, { color: currentTheme.text }]}>Select Status</Text>
      <View style={[styles.pickerContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.secondary }]}>
        <Picker 
          selectedValue={status} 
          onValueChange={setStatus} 
          style={[styles.picker, { color: currentTheme.text }]}
          itemStyle={{ color: currentTheme.text }}
        >
          <Picker.Item label="Pending" value="Pending" />
          <Picker.Item label="Finished" value="Finished" />
        </Picker>
      </View>
      <Text style={[styles.label, { color: currentTheme.text }]}>Select Category</Text>
      <View style={[styles.pickerContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.secondary }]}>
        <Picker 
          selectedValue={selectedCategory} 
          onValueChange={setSelectedCategory} 
          style={[styles.picker, { color: currentTheme.text }]}
          itemStyle={{ color: currentTheme.text }}
        >
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.name} />
          ))}
        </Picker>
      </View>
      <Text style={[styles.label, { color: currentTheme.text }]}>Notes</Text>
      <TextInput
        placeholder="Enter book notes..."
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notesInput, { backgroundColor: currentTheme.background, color: currentTheme.text, borderColor: currentTheme.secondary }]}
        multiline
        placeholderTextColor={currentTheme.text}
      />
      {/* Change Cover Image button with Mauve background */}
      <TouchableOpacity style={[styles.imageButton, { backgroundColor: "#C8B6FF" }]} onPress={pickImage}>
        <Text style={[styles.imageButtonText, { color: currentTheme.buttonText }]}>
          {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
        </Text>
      </TouchableOpacity>
      {coverImage && (
        <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
      )}
      {/* Save Changes button with Mauve background */}
      <TouchableOpacity style={[styles.button, { backgroundColor: "#C8B6FF" }]} onPress={handleUpdateBook}>
        <Ionicons name="save-outline" size={24} color={currentTheme.buttonText} />
        <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}> Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
  },
  // Added extra padding and spacing for scrollable content
  scrollContent: {
    paddingBottom: 40,
    paddingVertical: 20,
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
