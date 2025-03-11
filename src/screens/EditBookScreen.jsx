// BookNest/src/screens/EditBookScreen.jsx
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  TextInput, 
  Alert, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  View 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
        placeholderTextColor="#999"
      />
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
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default EditBookScreen;
