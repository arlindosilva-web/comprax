import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../services/firebaseConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Erro", "Digite seu e-mail para receber o link.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
  "E-mail enviado! 📧",
  "Enviamos o link de recuperação. \n\n⚠️ IMPORTANTE: Se não encontrar na Caixa de Entrada, verifique sua pasta de SPAM ou Lixo Eletrônico.",
  [{ text: "Entendi", onPress: () => router.back() }]
);
    } catch (error: any) {
      Alert.alert("Erro", "Não encontramos esse e-mail ou houve um erro técnico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Recuperar Senha", headerShown: true }} />
      
      <MaterialIcons name="lock-reset" size={80} color="#6200EE" style={{ alignSelf: 'center', marginBottom: 20 }} />
      
      <Text style={styles.title}>Esqueceu a senha?</Text>
      <Text style={styles.subtitle}>Digite seu e-mail abaixo e enviaremos um link para você criar uma nova senha.</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Seu e-mail cadastrado" 
        value={email} 
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>ENVIAR LINK</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { textAlign: 'center', color: '#666', marginVertical: 20, lineHeight: 20 },
  input: { backgroundColor: '#F3F3F3', padding: 18, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#6200EE', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});