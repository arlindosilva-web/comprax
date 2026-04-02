import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// BIBLIOTECAS EXPO E FIREBASE
import * as Clipboard from 'expo-clipboard';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db_online } from '../../services/firebaseConfig';

interface FamilyMember {
  id: string;
  email: string;
  familyId: string;
}

export default function ConfigScreen() {
  const [myFamilyId, setMyFamilyId] = useState('');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Você é o dono se o código da família atual for igual ao seu ID de usuário
  const isAdminOfThisGroup = auth.currentUser?.uid === myFamilyId;

  useEffect(() => {
    loadInitialData();
  }, []);

  // 1. CARREGA INFORMAÇÕES DO USUÁRIO E DO GRUPO
  const loadInitialData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db_online, "users", user.uid));
        if (userDoc.exists()) {
          const fId = userDoc.data().familyId;
          setMyFamilyId(fId);
          startListeningMembers(fId);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      }
    }
    setLoading(false);
  };

  // 2. OUVE QUEM SÃO OS MEMBROS DO GRUPO EM TEMPO REAL
  const startListeningMembers = (familyId: string) => {
    const q = query(collection(db_online, "users"), where("familyId", "==", familyId));
    
    return onSnapshot(q, (snapshot) => {
      const memberList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FamilyMember[];
      setMembers(memberList);
    });
  };

  // 3. COPIAR CÓDIGO PARA ÁREA DE TRANSFERÊNCIA
  const copyToClipboard = async () => {
    if (!myFamilyId) return;
    await Clipboard.setStringAsync(myFamilyId);
    Alert.alert("Copiado!", "Código da família copiado para o seu celular.");
  };

  // 4. LOGICA PARA ENTRAR EM OUTRA FAMÍLIA E DESLOGAR
  const handleJoinFamily = async () => {
    const cleanCode = inviteCode.trim();
    
    if (cleanCode.length < 10) {
      Alert.alert("Código Inválido", "O código de convite parece estar incompleto.");
      return;
    }

    Alert.alert(
      "Unir Família 🏠",
      "Ao entrar nesta nova família, você será deslogado para que suas listas sejam atualizadas. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Unir e Sair", 
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                // Atualiza o familyId no Firebase
                await updateDoc(doc(db_online, "users", user.uid), {
                  familyId: cleanCode
                });

                // Desloga para forçar a atualização na volta
                await signOut(auth);
                Alert.alert("Sucesso", "Família alterada! Entre novamente para ver as novas listas.");
                router.replace('/login');
              }
            } catch (error) {
              Alert.alert("Erro", "Não foi possível mudar de família no momento.");
            }
          }
        }
      ]
    );
  };

  // 5. EXPULSAR MEMBRO (APENAS PARA O DONO)
  const removeMember = (member: FamilyMember) => {
    Alert.alert(
      "Remover Membro ❌",
      `Deseja realmente remover ${member.email} da sua família?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Remover", 
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db_online, "users", member.id), {
                familyId: member.id // O membro expulso volta a ter seu próprio ID como grupo
              });
            } catch (error) {
              Alert.alert("Erro", "Não foi possível remover este membro.");
            }
          }
        }
      ]
    );
  };

  // 6. SAIR DA CONTA
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  const handleLeaveFamily = async () => {
  Alert.alert(
    "Sair da Família 🚪",
    "Você deixará de ver as listas compartilhadas deste grupo e voltará para o seu grupo privado. Deseja continuar?",
    [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Sim, Sair e Reiniciar", 
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (user) {
              // RESET MÁGICO: O familyId volta a ser o seu UID pessoal
              await updateDoc(doc(db_online, "users", user.uid), {
                familyId: user.uid
              });

              // Desloga para limpar o app
              await auth.signOut();
              Alert.alert("Sucesso", "Você saiu da família. Entre novamente para ver seu painel pessoal.");
              router.replace('/login');
            }
          } catch (error) {
            Alert.alert("Erro", "Não foi possível sair da família.");
          }
        } 
      }
    ]
  );
};
  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Família CompraX 🏠</Text>
      
      {/* CARD DO MEU CÓDIGO */}
     <View style={styles.card}>
        <Text style={styles.label}>Seu Código de Família {isAdminOfThisGroup && "(Dono)"}:</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText} numberOfLines={1}>{myFamilyId}</Text>
          <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
            <MaterialIcons name="content-copy" size={24} color="#6200EE" />
          </TouchableOpacity>
        </View>
        <Text style={styles.info}>Compartilhe este código para que outros vejam suas listas.</Text>
      </View>

      {/* LISTA DE MEMBROS CONECTADOS */}
      
       <View style={[styles.membersList, { marginTop: 25 }]}>
        <Text style={styles.sectionTitle}>Membros no seu grupo ({members.length})</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialIcons 
                name="person" 
                size={20} 
                color={member.id === myFamilyId ? "#6200EE" : "#666"} 
              />
              <Text style={styles.memberEmail} numberOfLines={1}>
                {member.email} {member.id === myFamilyId && "(Dono)"}
              </Text>
            </View>
            
            
            {isAdminOfThisGroup && member.id !== auth.currentUser?.uid && (
              <TouchableOpacity onPress={() => removeMember(member)} style={{ padding: 5 }}>
                <MaterialIcons name="person-remove" size={22} color="#FF5252" />
              </TouchableOpacity>
            )}
          </View>
          
        ))}
      </View>

      {!isAdminOfThisGroup && (
  <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFamily}>
    <MaterialIcons name="directions-run" size={22} color="#FF9800" />
    <Text style={styles.leaveButtonText}>SAIR DESTA FAMÍLIA</Text>
  </TouchableOpacity>
)}

      {/* ENTRAR EM OUTRO GRUPO */}
      <View style={[styles.card, { marginTop: 25 }]}>
        <Text style={styles.label}>Entrar em outra Família:</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Cole o código recebido aqui" 
          value={inviteCode} 
          onChangeText={setInviteCode}
        />
        <TouchableOpacity style={styles.button} onPress={handleJoinFamily}>
          <Text style={styles.buttonText}>Unir Família e Sair</Text>
        </TouchableOpacity>
      </View>

      {/* BOTÃO DE LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#FF5252" />
        <Text style={styles.logoutText}>SAIR DA CONTA</Text>
      </TouchableOpacity>

   
      <View style={{ height: 60 }} />

    

     

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 25, color: '#333' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontSize: 12, color: '#666', fontWeight: 'bold', marginBottom: 10 },
  codeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f3f0ff', 
    padding: 15, 
    borderRadius: 12 
  },
  codeText: { fontSize: 14, fontWeight: 'bold', color: '#6200EE', flex: 1, marginRight: 10 },
  copyButton: { padding: 5 },
  info: { fontSize: 11, color: '#999', marginTop: 10, fontStyle: 'italic' },
  membersList: { backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, elevation: 3, marginBottom: 10 },
  memberItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  memberEmail: { fontSize: 14, marginLeft: 10, color: '#444', flex: 1 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 15, padding: 8, fontSize: 16 },
  button: { backgroundColor: '#6200EE', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 30,
    backgroundColor: '#FFF1F1',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFDADA'
  },
  logoutText: { color: '#FF5252', fontWeight: 'bold', marginLeft: 10 },
  leaveButton: {
  flexDirection: 'row',
  backgroundColor: '#FFF8E1', // Cor de aviso suave (amarelado)
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 15,
  borderWidth: 1,
  borderColor: '#FFE082',
},
leaveButtonText: {
  color: '#FF9800',
  fontWeight: 'bold',
  marginLeft: 10,
  fontSize: 14,
},
});