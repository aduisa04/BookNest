import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import BookListScreen from '../screens/BookListScreen';
import AddBookScreen from '../screens/AddBookScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CategoriesScreen from '../screens/AddCategoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BookCalendarScreen from '../screens/BookCalendarScreen';

import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const Tab = createBottomTabNavigator();

// An animated icon component for the tab bar.
const AnimatedIcon = ({ name, color, size, focused }) => {
  return (
    <Animatable.View
      animation={focused ? 'bounceIn' : 'fadeIn'}
      duration={500}
    >
      <Ionicons name={name} size={size} color={color} />
    </Animatable.View>
  );
};

// Custom Tab Bar Component with lively styling.
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        // Determine icon based on route name.
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
        } else if (route.name === 'BookCalendar') {
          iconName = 'calendar-outline';
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityStates={isFocused ? ['selected'] : []}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            testID={descriptors[route.key].options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <AnimatedIcon
              name={iconName}
              size={32} // Increased icon size from 28 to 32
              color={isFocused ? '#6A0572' : '#FFFFFF'}
              focused={isFocused}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#C8B6FF', // Mauve header background
        },
        headerTintColor: '#6A0572', // Darker mauve for header text
        tabBarShowLabel: false, // Hide labels for a cleaner look
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="BookCalendar" component={BookCalendarScreen} options={{ headerTitle: 'My Calendar' }} />
      <Tab.Screen name="Book List" component={BookListScreen} options={{ headerTitle: 'Book List' }} />
      <Tab.Screen name="Add Book" component={AddBookScreen} options={{ headerTitle: 'Add Book' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ headerTitle: 'Favorites' }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ headerTitle: 'Categories' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerTitle: '' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute', // Make the tab bar stick to the bottom
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#C8B6FF', // Mauve background for tab bar
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 10, // Increased vertical padding for a larger tab bar
    height: 60,         // Explicit height added
    paddingHorizontal: 0, // Remove horizontal padding for a flush edge
    // Shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 10,
    // Elevation for Android
    elevation: 10,
    overflow: 'hidden', // Ensure the curved edges are not cut off
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
