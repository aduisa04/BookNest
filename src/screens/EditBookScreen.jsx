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

const EditBookScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;
  const { theme } = useTheme();

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
        setCoverImage(result.coverImage); // Set existing cover image, if available
      }
    } catch (error) {
      console.error('❌ Error fetching book details:', error);
    }
  };

  // Function to pick an image from the gallery (updated for Expo ImagePicker v13+)
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
    // For newer versions of expo-image-picker:
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="create-outline" size={28} color={theme.buttonBackground} />
        <Text style={[styles.headerText, { color: theme.text }]}>Edit Book</Text>
      </View>
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
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.name} value={category.name} />
          ))}
        </Picker>
      </View>
      <Text style={[styles.label, { color: theme.text }]}>Notes</Text>
      <TextInput
        placeholder="Enter book notes..."
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notesInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
        multiline
        placeholderTextColor={theme.text}
      />

      {/* Cover Image Section */}
      <TouchableOpacity style={[styles.imageButton, { backgroundColor: theme.buttonBackground }]} onPress={pickImage}>
        <Text style={[styles.imageButtonText, { color: theme.buttonText }]}>
          {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
        </Text>
      </TouchableOpacity>
      {coverImage && (
        <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={handleUpdateBook}>
        <Ionicons name="save-outline" size={24} color={theme.buttonText} />
        <Text style={[styles.buttonText, { color: theme.buttonText }]}> Save Changes</Text>
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
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
