import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import AddBookScreen from '../screens/AddBookScreen';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import EditBookScreen from '../screens/EditBookScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen'; // ✅ Import it

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddBook" component={AddBookScreen} />
        <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
        <Stack.Screen name="EditBook" component={EditBookScreen} />
        <Stack.Screen name="AddCategory" component={AddCategoryScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}
