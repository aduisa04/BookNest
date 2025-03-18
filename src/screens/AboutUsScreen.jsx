import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const AboutUsScreen = () => {
  const { theme, isDark } = useTheme();

  const currentTheme = {
    text: isDark ? '#F5F5F5' : theme.text || '#333333',
    background: theme.background || '#C8B6FF', // Mauve
    cardBackground: theme.cardBackground || '#B8C0FF', // Periwinkle
    border: theme.border || '#A39BE0',
  };

  return (
    <ScrollView style={[styles.outerContainer, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.container, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.border }]}>
        
        <Image source={require('../../assets/bg.png')} style={styles.logo} />
        
        <Text style={[styles.header, { color: currentTheme.text }]}>Welcome to BookNest! 📚</Text>
        
        <Text style={[styles.text, { color: currentTheme.text }]} >
          BookNest is your personal reading tracker, designed for book lovers who want to log their reading journey effortlessly. 
          Whether you've finished a book or are currently reading one, BookNest helps you stay organized.
        </Text>
        
        <Text style={[styles.text, { color: currentTheme.text }]}>
          Set book reminders to keep up with your reading schedule (when notifications are enabled) and never lose track of your progress. 
          Start tracking today and make every book count!
        </Text>

        <Text style={[styles.creator, { color: currentTheme.text }]}>Created by: Arabella May M. Duisa</Text>
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
    padding: 25,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logo: {
    width: 180, // Increased size
    height: 180, // Increased size
    borderRadius: 90,
    marginBottom: 20, // Adjusted spacing
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
    paddingHorizontal: 15,
  },
  creator: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default AboutUsScreen;
