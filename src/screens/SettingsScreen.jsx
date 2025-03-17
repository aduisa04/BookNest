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

// Fallback defaults
const newColors = {
  primary: "#C8B6FF",
  secondary: "#B8C0FF",
  text: "#333333",
  background: "#FFFFFF",
  cardBackground: "#F8F8F8",
  buttonBackground: "#B8C0FF",
  buttonText: "#FFFFFF",
};

const SettingsScreen = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  // When dark mode is active, use a light grey for text (#D3D3D3) so it remains visible.
  const currentTheme = {
    primary: theme.primary || newColors.primary,
    secondary: theme.secondary || newColors.secondary,
    text: isDark ? '#D3D3D3' : (theme.text || newColors.text),
    background: theme.background || newColors.background,
    cardBackground: theme.cardBackground || newColors.cardBackground,
    buttonBackground: theme.buttonBackground || newColors.buttonBackground,
    buttonText: theme.buttonText || newColors.buttonText,
    border: theme.border || '#ccc',
    // For the row background, we use a darker shade in dark mode, or a light tone otherwise.
    rowBackground: theme.rowBackground || (isDark ? '#333333' : '#FFF8F0'),
  };

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
    <ScrollView style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.container, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}>
        <Text style={[styles.header, { color: currentTheme.text }]}>Settings</Text>
        {/* Dark Mode Toggle */}
        <View style={[styles.row, { borderColor: currentTheme.border, backgroundColor: currentTheme.rowBackground }]}>
          <Ionicons name="moon-outline" size={24} color={currentTheme.text} />
          <Text style={[styles.rowText, { color: currentTheme.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? currentTheme.buttonBackground : '#CCC'}
            trackColor={{ true: currentTheme.buttonBackground, false: '#CCC' }}
          />
        </View>
        {/* Notification Toggle */}
        <View style={[styles.row, { borderColor: currentTheme.border, backgroundColor: currentTheme.rowBackground }]}>
          <Ionicons name="notifications-outline" size={24} color={currentTheme.text} />
          <Text style={[styles.rowText, { color: currentTheme.text }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            thumbColor={notificationsEnabled ? currentTheme.buttonBackground : '#CCC'}
            trackColor={{ true: currentTheme.buttonBackground, false: '#CCC' }}
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
