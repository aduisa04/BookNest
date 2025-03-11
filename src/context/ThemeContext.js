// BookNest/src/context/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const lightTheme = {
  background: '#FDF6EC',
  cardBackground: '#FFF',
  text: '#4B3E3E',
  border: '#A67C52',
  buttonBackground: '#A67C52',
  buttonText: '#FFF',
  inputBackground: '#FFF8F0',
};

const darkTheme = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  border: '#333333',
  buttonBackground: '#333333',
  buttonText: '#FFF',
  inputBackground: '#1E1E1E',
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((prev) => !prev);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
