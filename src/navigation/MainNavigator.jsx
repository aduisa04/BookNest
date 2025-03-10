import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AddBookScreen from '../screens/AddBookScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CategoriesScreen from '../screens/AddCategoryScreen';
import EditBookScreen from '../screens/EditBookScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'book';
          } else if (route.name === 'Add Book') {
            iconName = 'add-circle';
          } else if (route.name === 'Favorites') {
            iconName = 'star';
          } else if (route.name === 'Categories') {
            iconName = 'list';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#F5E6D2', // cozy library vibe background
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: '#A67C52', // warm header color
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerTitle: 'BookNest' }} />
      <Tab.Screen name="Add Book" component={AddBookScreen} options={{ headerTitle: 'Add Book' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ headerTitle: 'Favorites' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ headerTitle: 'Categories' }} />
    </Tab.Navigator>
  );
}
