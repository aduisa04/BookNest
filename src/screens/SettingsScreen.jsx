// BookNest/src/screens/SettingsScreen.jsx
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Text style={[styles.header, { color: theme.text }]}>Settings</Text>

        {/* Theme Toggle */}
        <View style={[styles.row, { borderColor: theme.border }]}>
          <Ionicons name="moon-outline" size={24} color={theme.text} />
          <Text style={[styles.rowText, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? theme.buttonBackground : '#CCC'}
            trackColor={{ true: theme.buttonBackground, false: '#CCC' }}
          />
        </View>

        {/* Notification Toggle */}
        <View style={[styles.row, { borderColor: theme.border }]}>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          <Text style={[styles.rowText, { color: theme.text }]}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor={notificationsEnabled ? theme.buttonBackground : '#CCC'}
            trackColor={{ true: theme.buttonBackground, false: '#CCC' }}
          />
        </View>

        {/* Additional settings options can be added here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
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
    backgroundColor: '#FFF8F0', // Fallback; will be overridden if needed
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
