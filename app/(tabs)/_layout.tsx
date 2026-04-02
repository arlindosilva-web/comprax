import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6200EE', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pessoais',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="shared" // Esta será a nova tela
        options={{
          title: 'Família',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="map" color={color} />, 
        }}
      />
      <Tabs.Screen
        name="config"
        options={{
          title: 'Config',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="settings" color={color} />, 
        }}
      />
    </Tabs>
  );
}