// AddBookScreen.jsx

import React, { useState } from 'react';
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
import { MediaTypeOptions, PermissionStatus } from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';

// Define the default color scheme (fallback for light mode)
const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
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
  const [status, setStatus] = useState('To Read');
  const [description, setDescription] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [progressMode, setProgressMode] = useState('pages');
  const [coverImage, setCoverImage] = useState(null);

  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState(null);

  const showAlert = (title, message, callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setAlertVisible(true);
  };

  const handleCloseAlert = () => {
    setAlertVisible(false);
    if (alertCallback) {
      alertCallback();
      setAlertCallback(null);
    }
  };

  // Fetch categories & reset form on focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      async function initialize() {
        try {
          const data = await getCategories();
          if (!active) return;
          setCategories(data);
          setSelectedCategory(data[0]?.name || '');
          setTitle('');
          setAuthor('');
          setDescription('');
          setTotalPages('');
          setProgressMode('pages');
          setStatus('To Read');
          setCoverImage(null);
        } catch (e) {
          console.error(e);
        }
      }
      initialize();
      return () => { active = false; };
    }, [])
  );

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== PermissionStatus.GRANTED) {
      return showAlert("Permission required", "Permission to access the gallery is required!");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleAddBook = async () => {
    if (!title || !author || !selectedCategory || !status || !totalPages) {
      return showAlert('Error', 'Please fill in all fields.');
    }
    try {
      const db = await getDbConnection();
      await db.runAsync(
        `INSERT INTO books 
           (title, author, category, status, description, coverImage, totalPages, progressMode) 
         VALUES (?,?,?,?,?,?,?,?);`,
        [
          title,
          author,
          selectedCategory,
          status,
          description,
          coverImage,
          parseInt(totalPages, 10),
          progressMode
        ]
      );
      showAlert('Success', 'Book added successfully!', () => {
        navigation.goBack();
      });
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to add book.');
    }
  };

  return (
    <ScrollView
      style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Add New Book" navigation={navigation} />
      <View style={[styles.card, { backgroundColor: currentTheme.background, marginTop: 30 }]}>
        <TextInput 
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={[styles.input, {
            backgroundColor: currentTheme.inputBackground,
            color: currentTheme.text,
            borderColor: currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <TextInput 
          placeholder="Author"
          value={author}
          onChangeText={setAuthor}
          style={[styles.input, {
            backgroundColor: currentTheme.inputBackground,
            color: currentTheme.text,
            borderColor: currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        {/* Category Picker */}
        <Text style={[styles.label, { color: currentTheme.text }]}>Category</Text>
        <View style={[styles.pickerContainer, {
          backgroundColor: currentTheme.inputBackground,
          borderColor: currentTheme.primary
        }]}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={[styles.picker, { color: currentTheme.text }]}
          >
            {categories.map(cat => (
              <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
            ))}
          </Picker>
        </View>

        <Text style={[styles.label, { color: currentTheme.text }]}>Total Pages</Text>
        <TextInput
          placeholder="e.g. 320"
          value={totalPages}
          onChangeText={setTotalPages}
          keyboardType="numeric"
          style={[styles.input, {
            backgroundColor: currentTheme.inputBackground,
            color: currentTheme.text,
            borderColor: currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <Text style={[styles.label, { color: currentTheme.text }]}>Record Progress By</Text>
        <View style={[styles.pickerContainer, {
          backgroundColor: currentTheme.inputBackground,
          borderColor: currentTheme.primary
        }]}>
          <Picker
            selectedValue={progressMode}
            onValueChange={setProgressMode}
            style={[styles.picker, { color: currentTheme.text }]}
          >
            <Picker.Item label="By Pages" value="pages" />
            <Picker.Item label="By Percentage" value="percentage" />
          </Picker>
        </View>

        <Text style={[styles.label, { color: currentTheme.text }]}>Status</Text>
        <View style={[styles.pickerContainer, {
          backgroundColor: currentTheme.inputBackground,
          borderColor: currentTheme.primary
        }]}>
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            style={[styles.picker, { color: currentTheme.text }]}
          >
            <Picker.Item label="To Read" value="To Read" />
            <Picker.Item label="Reading" value="Reading" />
            <Picker.Item label="I've Read It All" value="I've Read It All" />
            <Picker.Item label="Gave Up" value="Gave Up" />
          </Picker>
        </View>

        <Text style={[styles.label, { color: currentTheme.text }]}>Description</Text>
        <TextInput
          placeholder="Description…"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, styles.notesInput, {
            backgroundColor: currentTheme.inputBackground,
            color: currentTheme.text,
            borderColor: currentTheme.primary
          }]}
          placeholderTextColor={currentTheme.text}
        />

        <TouchableOpacity
          style={[styles.imageButton, { backgroundColor: currentTheme.secondary }]}
          onPress={pickImage}
        >
          <Text style={[styles.imageButtonText, { color: currentTheme.text }]}>
            {coverImage ? 'Change Cover Image' : 'Select Cover Image'}
          </Text>
        </TouchableOpacity>
        {coverImage && (
          <Image source={{ uri: coverImage }} style={styles.coverPreview} resizeMode="cover" />
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentTheme.secondary }]}
          onPress={handleAddBook}
        >
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
  outerContainer: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginTop: 30,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  notesInput: { height: 100, textAlignVertical: 'top' },
  label: { fontWeight: 'bold', marginBottom: 5, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  picker: { height: 50 },
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  imageButtonText: { fontSize: 16, fontWeight: 'bold' },
  coverPreview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});

export default AddBookScreen;
