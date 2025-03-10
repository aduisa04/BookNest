import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, FlatList, Text, StyleSheet } from 'react-native';
import { addCategory, getCategories } from '../database/db';

const CategoriesScreen = () => {
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
    <View style={styles.container}>
      <Text style={styles.header}>Categories</Text>
      <TextInput
        placeholder="Enter Category Name"
        value={categoryName}
        onChangeText={setCategoryName}
        style={styles.input}
      />
      <Button title="➕ Add Category" onPress={handleAddCategory} color="#A67C52" />
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.categoryItem}>{item.name}</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6D2', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#4B3E3E', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#FFF' },
  categoryItem: { padding: 10, fontSize: 18, backgroundColor: '#FFF', marginBottom: 5, borderRadius: 5, color: '#4B3E3E' },
});

export default CategoriesScreen;
