import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Define the theme interface
export interface Theme {
  // Core colors
  background: string;
  text: string;
  subtext: string;
  border: string;

  // Component specific colors
  cardBackground: string;
  dropdownBg: string;
  selectedBg: string;
  selectedText: string;
  dropdownSelectedBg: string;
  iconColor: string;

  // Button colors
  buttonBackground: string;
  buttonText: string;

  // Modal colors
  modalBackground: string;
  modalOverlay: string;

  // Tab bar colors
  activeTint: string;
  inactiveTint: string;
  tabBarBackground: string;

  // Status colors
  pendingText: string;
  pendingBorder: string;

  // Shadow
  shadow: string;

  // Status bar
  statusBarStyle: 'light-content' | 'dark-content';
}

// Define light and dark themes
const lightTheme: Theme = {
  background: '#ffffff',
  text: '#000000',
  subtext: '#64748B', // slate-500
  border: '#808080',
  cardBackground: '#FFFCF0', // light yellow
  dropdownBg: '#ffffff',
  selectedBg: '#000000',
  selectedText: '#ffffff',
  dropdownSelectedBg: '#1A1A1A', // darkerGrey for light mode
  iconColor: '#000000',
  buttonBackground: '#000000',
  buttonText: '#ffffff',
  modalBackground: '#ffffff',
  modalOverlay: '#00000033',
  activeTint: '#000000',
  inactiveTint: '#64748B',
  tabBarBackground: '#E4E5E5', // light grey
  pendingText: '#DC7609',
  pendingBorder: '#DC7609',
  shadow: '#000000',
  statusBarStyle: 'dark-content',
};

const darkTheme: Theme = {
  background: '#000000',
  text: '#ffffff',
  subtext: '#9ca3af', // gray-400 - better contrast for placeholders
  border: '#808080',
  cardBackground: '#1a1a1a',
  dropdownBg: '#000000',
  selectedBg: '#ffffff',
  selectedText: '#000000',
  dropdownSelectedBg: '#E6E6E6', // lightGrey for dark mode
  iconColor: '#ffffff',
  buttonBackground: '#ffffff',
  buttonText: '#000000',
  modalBackground: '#1a1a1a',
  modalOverlay: '#00000066',
  activeTint: '#ffffff',
  inactiveTint: '#808080',
  tabBarBackground: '#1a1a1a', // darker grey
  pendingText: '#FFA500',
  pendingBorder: '#FFA500',
  shadow: '#000000',
  statusBarStyle: 'light-content',
};

// Create the context
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
