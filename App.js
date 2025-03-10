// App.js
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'; // Import NavigationContainer
import { setupDatabase } from './src/database/db';
import RootNavigator from './src/navigation/RootNavigator'; // Use RootNavigator as entry point

export default function App() {
  const [loading, setLoading] = useState(true);

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
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
