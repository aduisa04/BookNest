// BookNest/src/navigation/RootNavigator.jsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import EditBookScreen from '../screens/EditBookScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator>
      {/* The MainNavigator contains the bottom tabs */}
      <Stack.Screen 
        name="Main" 
        component={MainNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="BookDetails" component={BookDetailsScreen} />
      <Stack.Screen name="EditBook" component={EditBookScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
