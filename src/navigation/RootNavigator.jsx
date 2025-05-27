import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import EditBookScreen from '../screens/EditBookScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import AddBookScreen from '../screens/AddBookScreen'; // Import your AddBookScreen
import FinishedBooksScreen from '../screens/FinishedBooksScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={MainNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookDetails"
        component={BookDetailsScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen
        name="AddBookScreen"
        component={AddBookScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen
        name="AboutUs"
        component={AboutUsScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen
        name="FinishedBooks"
        component={FinishedBooksScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
