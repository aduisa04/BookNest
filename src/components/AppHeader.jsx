import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Assuming Ionicons might be used for a back button
import { useTheme } from '../context/ThemeContext'; // Assuming theme context is needed for colors

const AppHeader = ({ title, navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.headerContainer]}>
      <View style={styles.headerContent}>
        {/* Optional: Add a back button if needed, requires navigation prop */}
        { navigation && navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
        <Image
          source={require('../../assets/booknest.png')}
          style={styles.logo}
          resizeMode="cover"
        />
        <Text style={[styles.headerLabelText, { color: theme.text }]}>
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 5,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: '#C8B6FF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
  },
  logo: {
    width: 80,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  headerLabelText: {
    fontSize: 26,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  // Styles for optional back button
  backButton: {
    // Remove absolute positioning
    // position: 'absolute',
    // left: 20,
    // paddingVertical: 20,
  },
  backButtonContainer: {
    paddingRight: 10,
  }
});

export default AppHeader; 