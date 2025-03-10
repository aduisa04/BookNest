// src/navigation/RootNavigator.jsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator'; // Relative path (same folder)
import EditBookScreen from '../screens/EditBookScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={MainNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{ headerTitle: 'Edit Book' }}
      />
      <Stack.Screen
        name="BookDetails"
        component={BookDetailsScreen}
        options={{ headerTitle: 'Book Details' }}
      />
    </Stack.Navigator>
  );
}
