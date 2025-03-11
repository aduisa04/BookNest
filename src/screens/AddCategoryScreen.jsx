// BookNest/src/screens/AddCategoryScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, FlatList, Text, StyleSheet } from 'react-native';
import { addCategory, getCategories } from '../database/db';
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
        renderItem={({ item }) => (
          <Text style={[styles.categoryItem, { backgroundColor: theme.cardBackground, color: theme.text }]}>
            {item.name}
          </Text>
        )}
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
  categoryItem: { 
    padding: 10, 
    fontSize: 18, 
    marginBottom: 5, 
    borderRadius: 5 
  },
});

export default AddCategoryScreen;
