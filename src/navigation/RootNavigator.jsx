// BookNest/src/navigation/RootNavigator.jsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import EditBookScreen from '../screens/EditBookScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen'; // New import

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} options={{ headerTitle: 'Book Details' }} />
      <Stack.Screen name="EditBook" component={EditBookScreen} options={{ headerTitle: 'Edit Book' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerTitle: 'Settings' }} />
      <Stack.Screen name="AddCategory" component={AddCategoryScreen} options={{ headerTitle: 'Add Category' }} />
    </Stack.Navigator>
  );
}
