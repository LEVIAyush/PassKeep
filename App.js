import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VaultProvider, useVault } from './src/state/VaultContext';
import { ToastProvider } from './src/components/Toast';
import { Icon, Wordmark } from './src/components/ui';

import SetupScreen from './src/screens/SetupScreen';
import UnlockScreen from './src/screens/UnlockScreen';
import HomeScreen from './src/screens/HomeScreen';
import VaultScreen from './src/screens/VaultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EntryFormScreen from './src/screens/EntryFormScreen';
import { colors } from './src/theme';
import { BackupReminderProvider } from './src/components/BackupReminder';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.panel, text: colors.text, border: colors.line, primary: colors.accent },
};

const tabIcon = (name) => ({ color, size }) => <Icon name={name} color={color} size={size} />;

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel, borderTopColor: colors.line, borderTopWidth: 1,
          height: 66 + insets.bottom, paddingTop: 6, paddingBottom: 8 + insets.bottom,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', lineHeight: 15, flexShrink: 0 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tab.Screen name="BrowserTab" component={VaultScreen} initialParams={{ category: 'browser' }} options={{ tabBarLabel: 'Browser', tabBarIcon: tabIcon('language') }} />
      <Tab.Screen name="AppTab" component={VaultScreen} initialParams={{ category: 'app' }} options={{ tabBarLabel: 'Apps', tabBarIcon: tabIcon('apps') }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: 'Settings', tabBarIcon: tabIcon('settings') }} />
    </Tab.Navigator>
  );
}

function Unlocked() {
  return (
    <BackupReminderProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.panel },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="EntryForm"
            component={EntryFormScreen}
            options={({ route }) => ({ title: route.params?.entryId ? 'Edit password' : 'Add password' })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BackupReminderProvider>
  );
}

function Root({ ready }) {
  const { status, touch } = useVault();
  let body;
  if (!ready || status === 'booting') {
    body = (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {ready ? <Wordmark size={28} /> : <ActivityIndicator color={colors.accent} />}
      </View>
    );
  } else if (status === 'needsSetup') body = <SetupScreen />;
  else if (status === 'locked') body = <UnlockScreen />;
  else body = <Unlocked />;

  // Any touch/click counts as activity and restarts the auto-lock timer.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onStartShouldSetResponderCapture={() => { touch(); return false; }}>
      {body}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ SpaceMono: require('./assets/fonts/SpaceMono-Regular.ttf') });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ToastProvider>
        <VaultProvider>
          <Root ready={fontsLoaded || !!fontError} />
        </VaultProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
