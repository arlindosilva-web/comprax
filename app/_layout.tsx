import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../services/firebaseConfig'; // Ajuste o caminho se necessário

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments(); // Diz em qual tela o usuário está

  useEffect(() => {
    // Vigia se o usuário logou ou deslogou
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    // Lógica de Redirecionamento
    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Se não tem usuário e ele tenta entrar nas Tabs, manda pro Login
      router.replace('/login');
    } else if (user && segments[0] === 'login') {
      // Se já está logado e tenta ir pro Login, manda pra Home
      router.replace('/');
    }
  }, [user, initializing, segments]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}