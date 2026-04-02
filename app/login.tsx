import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';

// FIREBASE IMPORTS
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db_online } from '../services/firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. FUNÇÃO PARA ENTRAR (LOGIN)
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Se deu certo, o Firebase avisa o app e o router nos leva para a Home
      router.replace('/'); 
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro ao entrar", "E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNÇÃO PARA CRIAR CONTA (SIGN UP)
  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Senha Curta", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // CRIAÇÃO DO "CRACHÁ DE FAMÍLIA"
      // Criamos um documento na coleção 'users' com o ID do usuário
      await setDoc(doc(db_online, "users", user.uid), {
        email: user.email,
        familyId: user.uid, // O crachá inicial é o próprio ID dele
        createdAt: serverTimestamp()
      });

      Alert.alert("Sucesso!", "Conta criada com sucesso!");
      router.replace('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert("Erro", "Este e-mail já está em uso.");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
       <Image source={require('../assets/images/logo.png')} style={styles.logoImage}  resizeMode="contain"  />

          <Text style={styles.tagline}>Sua compra inteligente em família</Text>


        <View style={styles.form}>
          <TextInput 
            style={styles.input} 
            placeholder="E-mail" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Senha" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />

          {loading ? (
            <ActivityIndicator size="large" color="#6200EE" style={{ marginTop: 20 }} />
          ) : (
            <View style={{ marginTop: 10 }}>
              {/* Dentro do login.tsx, abaixo do campo de senha e acima do botão ENTRAR */}
<TouchableOpacity 
  onPress={() => router.push('/forgot-password')}
  style={{ alignSelf: 'flex-end', marginBottom: 20 }}
>
  <Text style={{ color: '#6200EE', fontWeight: '600' }}>Esqueci minha senha</Text>
</TouchableOpacity>
              <TouchableOpacity style={styles.buttonLogin} onPress={handleLogin}>
                <Text style={styles.buttonText}>ENTRAR</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buttonSignUp} onPress={handleSignUp}>
                <Text style={styles.buttonSignUpText}>Criar Nova Conta</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: { fontSize: 42, fontWeight: 'bold', textAlign: 'center', color: '#6200EE' },
  tagline: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 40 },
  form: { width: '100%' },
  input: { 
    backgroundColor: '#F3F3F3', 
    padding: 18, 
    borderRadius: 12, 
    marginBottom: 15, 
    fontSize: 16 
  },
  buttonLogin: { 
    backgroundColor: '#6200EE', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 15,
    elevation: 2
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonSignUp: { 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#6200EE' 
  },

  buttonSignUpText: { color: '#6200ee', fontWeight: 'bold' },

  logoImage: {
  width: 250  ,
  height: 150,
  alignSelf: 'center',
  //marginBottom: 5,
},
});