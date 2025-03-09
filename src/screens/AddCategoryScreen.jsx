import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, FlatList, Text } from 'react-native';
import { addCategory, getCategories } from '../database/db';

const AddCategoryScreen = () => {
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState([]);

  // ✅ Fetch Categories on Screen Load
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    await getCategories(setCategories);
  };

  const handleAddCategory = async () => {
    if (categoryName.trim() === '') {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    await addCategory(categoryName, fetchCategories); // ✅ Refresh categories after adding
    Alert.alert('Success', 'Category added successfully!');
    setCategoryName(''); // Clear input field
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter Category Name"
        value={categoryName}
        onChangeText={setCategoryName}
        style={{
          borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5
        }}
      />
      <Button title="➕ Add Category" onPress={handleAddCategory} />

      {/* ✅ Show updated category list in real-time */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={{ padding: 10, fontSize: 16 }}>{item.name}</Text>
        )}
      />
    </View>
  );
};

export default AddCategoryScreen;
