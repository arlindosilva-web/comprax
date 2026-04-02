import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db_online } from '../../services/firebaseConfig';

export default function SharedListsScreen() {
  const [lists, setLists] = useState<any[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const userDoc = await getDoc(doc(db_online, "users", user.uid));
      if (userDoc.exists()) {
        const fId = userDoc.data().familyId;

        // 1. MONITORAR QUANTIDADE DE MEMBROS
        const qMembers = query(collection(db_online, "users"), where("familyId", "==", fId));
        onSnapshot(qMembers, (snap) => setMemberCount(snap.size));

        // 2. MONITORAR LISTAS COMPARTILHADAS
        const qLists = query(
          collection(db_online, "shopping_lists"),
          where("familyId", "==", fId),
          where("isShared", "==", true),
          orderBy("name", "asc")
        );
        
        const unsubscribe = onSnapshot(qLists, (snap) => {
          setLists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
        return unsubscribe;
      }
    };
    loadData();
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#6200EE" />;

  // --- CASO 1: USUÁRIO ESTÁ SOZINHO NO GRUPO ---
  if (memberCount <= 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Família CompraX 🏠</Text>
        <View style={styles.cardInfo}>
           <MaterialIcons name="group-add" size={60} color="#6200EE" />
           <Text style={styles.cardTitle}>Grupo Solitário</Text>
           <Text style={styles.cardText}>Convide sua esposa ou amigos na aba Configurações para compartilhar listas!</Text>
           <TouchableOpacity style={styles.btn} onPress={() => router.push('/config')}>
             <Text style={styles.btnText}>CONFIGURAR AGORA</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- CASO 2: TEM GRUPO, MAS NINGUÉM COMPARTILHOU NADA AINDA ---
  if (lists.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Família CompraX 🏠</Text>
        <View style={styles.cardInfo}>
           <MaterialIcons name="cloud-upload" size={60} color="#4CAF50" />
           <Text style={styles.cardTitle}>Tudo pronto!</Text>
           <Text style={styles.cardText}>Seu grupo está ativo, mas nenhuma lista foi compartilhada ainda.</Text>
           <TouchableOpacity style={[styles.btn, {backgroundColor: '#4CAF50'}]} onPress={() => router.push('/')}>
             <Text style={styles.btnText}>COMPARTILHAR MINHAS LISTAS</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- CASO 3: TEM GRUPO E TEM LISTAS COMPARTILHADAS ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Listas da Família 👨‍👩‍👧‍👦</Text>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <TouchableOpacity style={styles.listInfo} onPress={() => router.push({ pathname: "/list/[id]", params: { id: item.id, name: item.name } })}>
              <MaterialIcons name="groups" size={24} color="#6200EE" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.listText}>{item.name}</Text>
                <Text style={styles.ownerSub}>{item.owner === user?.uid ? "Você compartilhou" : "Familiar compartilhou"}</Text>
              </View>
            </TouchableOpacity>
            {item.owner === user?.uid && (
              <TouchableOpacity onPress={() => deleteDoc(doc(db_online, "shopping_lists", item.id))}>
                <MaterialIcons name="delete-outline" size={24} color="#FF5252" />
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  cardInfo: { backgroundColor: '#fff', padding: 35, borderRadius: 20, alignItems: 'center', marginTop: 20, elevation: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15, color: '#444' },
  cardText: { textAlign: 'center', color: '#666', marginVertical: 15, lineHeight: 20 },
  btn: { backgroundColor: '#6200EE', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  listCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 2 },
  listInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listText: { fontSize: 17, fontWeight: '600', color: '#444' },
  ownerSub: { fontSize: 11, color: '#999', marginTop: 2 }
});