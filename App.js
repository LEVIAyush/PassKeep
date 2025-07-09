import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from './src/screens/HomeScreen';
import BrowserPasswordScreen from './src/screens/BrowserPasswordScreen';
import AppPasswordScreen from './src/screens/AppPasswordScreen';
import AddPasswordScreen from './src/screens/AddPasswordScreen';
import { initDatabase } from './src/utils/Database';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PasswordManagerApp = () => {
  useEffect(() => {
    initDatabase(); // Initialize the database when the app starts
  }, []);

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: 'rgb(0, 0, 0)', borderTopColor: 'rgb(0, 255, 0)', borderTopWidth: 1 },
        tabBarActiveTintColor: 'rgb(66, 255, 66)',
        tabBarInactiveTintColor: 'rgb(102, 102, 102)',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="BrowserTab"
        options={{
          tabBarLabel: 'Browser',
          tabBarIcon: ({ color, size }) => (
            <Icon name="web" color={color} size={size} />
          ),
        }}
      >
        {(props) => <BrowserPasswordScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen
        name="AppTab"
        options={{
          tabBarLabel: 'Apps',
          tabBarIcon: ({ color, size }) => (
            <Icon name="apps" color={color} size={size} />
          ),
        }}
      >
        {(props) => <AppPasswordScreen {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: 'rgb(0, 0, 0)' },
          headerTintColor: 'rgb(0, 255, 0)',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddPassword"
          options={{ title: 'ADD NEW PASSWORD' }}
        >
          {(props) => <AddPasswordScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default PasswordManagerApp;