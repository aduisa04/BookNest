// BookNest/src/navigation/MainNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen'; // Home banner scroller
import BookListScreen from '../screens/BookListScreen';
import AddBookScreen from '../screens/AddBookScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CategoriesScreen from '../screens/AddCategoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Book List') {
            iconName = 'list';
          } else if (route.name === 'Add Book') {
            iconName = 'add-circle';
          } else if (route.name === 'Favorites') {
            iconName = 'star';
          } else if (route.name === 'Categories') {
            iconName = 'albums';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#F5E6D2',
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: '#A67C52',
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Book List" component={BookListScreen} options={{ headerTitle: 'Book List' }} />
      <Tab.Screen name="Add Book" component={AddBookScreen} options={{ headerTitle: 'Add Book' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ headerTitle: 'Favorites' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ headerTitle: 'Categories' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerTitle: 'Settings' }} />
    </Tab.Navigator>
  );
}
