import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import Login from './screens/Login';
import { RootStackParamList } from './navigation/RootStackedList';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n';
import '../../global.css';
import { NetworkProvider } from '../context/NetworkProvider';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import Home from './navigation/BottomTabs';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import {
  getAuthTokens,
  refreshAuthTokens,
} from '../services/auth/tokenStorage';

enableScreens();

// Inner component that uses theme
function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Login' | 'MainApp'>(
    'Login'
  );

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });

    const checkAuthState = async () => {
      try {
        const storedTokens = await getAuthTokens();
        const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();

        if (storedTokens?.idToken) {
          setInitialRoute('MainApp');
          if (hasPreviousSignIn) {
            try {
              await refreshAuthTokens();
            } catch (tokenError) {
              console.error('Failed to refresh tokens silently:', tokenError);
            }
          }
          return;
        }

        if (hasPreviousSignIn) {
          try {
            const refreshed = await refreshAuthTokens();
            if (refreshed.idToken) {
              setInitialRoute('MainApp');
              return;
            }
          } catch (refreshError) {
            console.error(
              'Unable to refresh tokens during startup:',
              refreshError
            );
          }
        }

        setInitialRoute('Login');
      } catch (error) {
        console.error('Error checking auth state:', error);
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  if (isLoading) {
    return (
      <GestureHandlerRootView className="flex-1">
        <SafeAreaView
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: theme.background }}
        >
          <StatusBar
            barStyle={theme.statusBarStyle}
            backgroundColor={theme.background}
          />
          <ActivityIndicator size="large" color={theme.text} />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
      >
        <StatusBar
          barStyle={theme.statusBarStyle}
          backgroundColor={theme.background}
        />
        <NetworkProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName={initialRoute}
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="MainApp" component={Home} />
            </Stack.Navigator>
          </NavigationContainer>
        </NetworkProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
