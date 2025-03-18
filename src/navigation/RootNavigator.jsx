import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import EditBookScreen from '../screens/EditBookScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import AddBookScreen from '../screens/AddBookScreen'; // Import your AddBookScreen

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
          headerStyle: { backgroundColor: "#C8B6FF" },
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen 
        name="EditBook" 
        component={EditBookScreen}
        options={{
          headerStyle: { backgroundColor: "#C8B6FF" },
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen 
        name="AddBookScreen" 
        component={AddBookScreen}
        options={{
          headerTitle: 'Add Book',
          headerStyle: { backgroundColor: "#C8B6FF" },
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUsScreen}
        options={{
          headerTitle: 'About Us',
          headerStyle: { backgroundColor: "#C8B6FF" },
          cardStyle: { backgroundColor: "#C8B6FF" },
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
