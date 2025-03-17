// BookNest/App.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { setupDatabase } from './src/database/db';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import * as Notifications from 'expo-notifications';

// Set up notification handler so alerts show even in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [loading, setLoading] = useState(true);

  // Global notification listener (for debugging)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Global Notification Received:", notification);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const initializeDB = async () => {
      setLoading(true);
      try {
        const timeout = setTimeout(() => {
          console.error('Database initialization timed out');
          setLoading(false);
        }, 10000);
        await setupDatabase();
        clearTimeout(timeout);
      } catch (error) {
        console.error('Error during database initialization:', error);
      } finally {
        setLoading(false);
      }
    };
    initializeDB();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Initializing Database...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
