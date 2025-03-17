import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rescheduleNotifications } from '../rescheduleNotifications';
import { useTheme } from '../context/ThemeContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const SettingsScreen = () => {
  // Get values from your theme context
  const { theme, toggleTheme, isDark } = useTheme();
  // Change text to black when dark mode is active, otherwise use theme.text
  const textColor = isDark ? '#000000' : theme.text;
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const loadNotificationSetting = async () => {
      try {
        const value = await AsyncStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(value === 'true');
      } catch (error) {
        console.error("Error loading notifications setting:", error);
      }
    };
    loadNotificationSetting();
  }, []);

  const handleToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value ? 'true' : 'false');
    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Notifications have been turned off. All scheduled notifications cancelled.");
    } else {
      await rescheduleNotifications();
    }
  };

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.header, { color: textColor }]}>Settings</Text>
        {/* Dark Mode Toggle */}
        <View style={[styles.row, { borderColor: theme.border }]}>
          <Ionicons name="moon-outline" size={24} color={textColor} />
          <Text style={[styles.rowText, { color: textColor }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? theme.buttonBackground : '#CCC'}
            trackColor={{ true: theme.buttonBackground, false: '#CCC' }}
          />
        </View>
        {/* Notification Toggle */}
        <View style={[styles.row, { borderColor: theme.border }]}>
          <Ionicons name="notifications-outline" size={24} color={textColor} />
          <Text style={[styles.rowText, { color: textColor }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            thumbColor={notificationsEnabled ? theme.buttonBackground : '#CCC'}
            trackColor={{ true: theme.buttonBackground, false: '#CCC' }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
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
