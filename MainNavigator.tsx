import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from './App'; // Home Screen
import WeeklySummaryScreen from './WeeklySummaryScreen'; // Weekly Summary Screen
import { RootStackParamList } from './types'; // Navigation types

const Stack = createStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={App} />
        <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
