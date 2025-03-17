import React, { useState, useCallback } from 'react';
import { 
  ScrollView, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  View, 
  Image,
  Modal
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCategories, getDbConnection } from '../database/db';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

// Define the default color scheme (fallback for light mode)
const newColors = {
  primary: "#C8B6FF",    // Mauve – used for borders, selected states, etc.
  secondary: "#B8C0FF",  // Periwinkle – used for buttons and accents
  text: "#333333",       // Dark text for contrast
  background: "#FFFFFF", // White background
};

// Custom Alert Component with dark mode support
const CustomAlert = ({ visible, title, message, onClose }) => {
  const { theme } = useTheme();
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={alertStyles.modalBackground}>
        <View style={[alertStyles.alertContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[alertStyles.alertTitle, { color: currentTheme.text }]}>{title}</Text>
          <Text style={[alertStyles.alertMessage, { color: currentTheme.text }]}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={[alertStyles.alertButton, { backgroundColor: currentTheme.secondary }]}>
            <Text style={alertStyles.alertButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const alertStyles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertContainer: {
    width: '80%',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  alertButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

const AddBookScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  // Create a currentTheme object with fallback values
  const currentTheme = {
    background: theme.background || newColors.background,
    text: theme.text || newColors.text,
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    inputBackground: theme.inputBackground || newColors.background,
  };

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [status, setStatus] = useState('Pending');
  const [notes, setNotes] = useState('');
  const [coverImage, setCoverImage] = useState(null);

  // State for custom alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState(null);

  // Helper to show custom alert
  const showAlert = (title, message, callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setAlertVisible(true);
  };

  // Dismiss alert and run callback if provided.
  const handleCloseAlert = () => {
    setAlertVisible(false);
    if (alertCallback) {
      alertCallback();
      setAlertCallback(null);
    }
  };

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
          console.error('Error fetching categories:', error);
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

  // Launch image picker using updated API
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert("Permission required", "Permission to access the gallery is required!");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setCoverImage(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert("Error", "An error occurred while picking the image.");
    }
  };

  const handleAddBook = async () => {
    if (!title || !author || !selectedCategory || !status) {
      showAlert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      const db = await getDbConnection();
      if (!db) {
        showAlert('Error', 'Database connection failed.');
        return;
      }
      // Insert the new book record including the coverImage URI
      await db.runAsync(
        'INSERT INTO books (title, author, category, status, notes, coverImage) VALUES (?, ?, ?, ?, ?, ?)',
        [title, author, selectedCategory, status, notes, coverImage]
      );
      showAlert('Success', 'Book added successfully!', () => {
        // Clear form fields and navigate back after dismissal
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
      });
    } catch (error) {
      console.error("Error adding book:", error);
      showAlert('Error', 'Failed to add book.');
    }
  };

  return (
    <ScrollView
      style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Add New Book</Text>
        <TextInput 
          placeholder="Title" 
          value={title} 
          onChangeText={setTitle} 
          style={[styles.input, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text, borderColor: currentTheme.primary }]} 
          placeholderTextColor={currentTheme.text}
        />
        <TextInput 
          placeholder="Author" 
          value={author} 
          onChangeText={setAuthor} 
          style={[styles.input, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text, borderColor: currentTheme.primary }]} 
          placeholderTextColor={currentTheme.text}
        />
        <Text style={[styles.label, { color: currentTheme.text }]}>Select Status</Text>
        <View style={[styles.pickerContainer, { backgroundColor: currentTheme.inputBackground, borderColor: currentTheme.primary }]}>
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
        <View style={[styles.pickerContainer, { backgroundColor: currentTheme.inputBackground, borderColor: currentTheme.primary }]}>
          <Picker 
            selectedValue={selectedCategory} 
            onValueChange={setSelectedCategory} 
            style={[styles.picker, { color: currentTheme.text }]}
            itemStyle={{ color: currentTheme.text }}
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
          style={[styles.input, styles.notesInput, { backgroundColor: currentTheme.inputBackground, color: currentTheme.text, borderColor: currentTheme.primary }]} 
          multiline 
          placeholderTextColor={currentTheme.text}
        />
        <TouchableOpacity style={[styles.imageButton, { backgroundColor: currentTheme.secondary }]} onPress={pickImage}>
          <Text style={[styles.imageButtonText, { color: currentTheme.text }]}>
            {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
          </Text>
        </TouchableOpacity>
        {coverImage && (
          <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
        )}
        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.secondary }]} onPress={handleAddBook}>
          <Text style={[styles.buttonText, { color: currentTheme.text }]}>Add Book</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert 
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
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
