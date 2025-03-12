// BookNest/src/screens/AddCategoryScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { addCategory, getCategories, deleteCategory } from '../database/db';
import { useTheme } from '../context/ThemeContext';

const AddCategoryScreen = () => {
  const { theme } = useTheme();
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const handleAddCategory = async () => {
    if (categoryName.trim() === '') {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    await addCategory(categoryName, fetchCategories);
    Alert.alert('Success', 'Category added successfully!');
    setCategoryName('');
  };

  const handleDeleteCategory = async (categoryId) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => await deleteCategory(categoryId, fetchCategories),
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.categoryItemContainer, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.categoryItem, { color: theme.text }]}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.deleteButton}>
        <Text style={[styles.deleteButtonText, { color: theme.buttonBackground }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Add Category</Text>
      <TextInput
        placeholder="Enter Category Name"
        value={categoryName}
        onChangeText={setCategoryName}
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }
        ]}
        placeholderTextColor={theme.text}
      />
      <Button title="Add Category" onPress={handleAddCategory} color={theme.buttonBackground} />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  input: { 
    borderWidth: 1, 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    fontSize: 16 
  },
  listContainer: {
    marginTop: 20,
  },
  categoryItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  categoryItem: { 
    fontSize: 18,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
    // Optional: you can use a background color from theme if desired.
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddCategoryScreen;
