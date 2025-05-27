import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

// Set Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const navigation = useNavigation();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load notification setting from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const notifValue = await AsyncStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(notifValue === 'true');
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Toggle notifications and schedule a test notification
  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');

    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Notifications have been turned off.");
    } else {
      await scheduleNotification();
    }
  };

  // Schedule a test notification with the default sound
  const scheduleNotification = async () => {
    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    let channelId = 'default';
    if (Platform.OS === 'android') {
      // For Android, create (or update) a notification channel using the default sound.
      await Notifications.setNotificationChannelAsync(channelId, {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Schedule the test notification (triggers after 5 seconds)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Study Reminder",
        body: "Time to focus on your tasks!",
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: { seconds: 5 },
    });

    console.log("Notification scheduled with default sound.");
  };

  const openUrl = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader title="Settings" navigation={navigation} />

      {/* Dark Mode Toggle */}
      <View style={[styles.row, { borderColor: theme.border }]}>
        <Ionicons name="moon-outline" size={24} color={theme.text} />
        <Text style={[styles.rowText, { color: theme.text }]}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      {/* Notifications Toggle */}
      <View style={[styles.row, { borderColor: theme.border }]}>
        <Ionicons name="notifications-outline" size={24} color={theme.text} />
        <Text style={[styles.rowText, { color: theme.text }]}>Notifications</Text>
        <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} />
      </View>

      {/* About Us Row */}
      <TouchableOpacity onPress={() => navigation.navigate('AboutUs')} style={[styles.row, { borderColor: theme.border }]}>
        <Ionicons name="information-circle-outline" size={24} color={theme.text} />
        <Text style={[styles.rowText, { color: theme.text }]}>About Us</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  rowText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
  },
});

export default SettingsScreen;
