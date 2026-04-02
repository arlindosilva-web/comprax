import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db_online } from '../../services/firebaseConfig';

interface List { id: string; name: string; isShared: boolean; owner: string; familyId: string; }

export default function PersonalListsScreen() {
  const [listName, setListName] = useState('');
  const [lists, setLists] = useState<List[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // 1. Monitora o perfil e a quantidade de membros no grupo
    const syncData = async () => {
      const userDoc = await getDoc(doc(db_online, "users", user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);

        // CONTA MEMBROS: Se houver > 1, o compartilhamento é liberado
        const qMembers = query(collection(db_online, "users"), where("familyId", "==", profile.familyId));
        onSnapshot(qMembers, (snap) => setMemberCount(snap.size));

        // BUSCA LISTAS QUE EU CRIEI
        const qLists = query(collection(db_online, "shopping_lists"), where("owner", "==", user.uid), orderBy("name", "asc"));
        onSnapshot(qLists, (snap) => {
          setLists(snap.docs.map(d => ({ id: d.id, ...d.data() })) as List[]);
          setLoading(false);
        });
      }
    };
    syncData();
  }, []);

  const toggleShare = async (list: List) => {
    // NOVA LÓGICA: Se houver mais de 1 membro, permite compartilhar
    if (memberCount <= 1) {
      Alert.alert("Aba Família Vazia", "Para compartilhar, convide alguém na aba Configurações primeiro.");
      return;
    }

    try {
      const nextStatus = !list.isShared;
      await updateDoc(doc(db_online, "shopping_lists", list.id), {
        isShared: nextStatus,
        familyId: nextStatus ? userProfile.familyId : user?.uid // Se compartilha, vai pro grupo, se não, fica no meu ID
      });
    } catch (e) { Alert.alert("Erro", "Falha ao mudar status."); }
  };

  const handleSave = async () => {
    if (!listName.trim() || !user) return;
    if (editingId) {
      await updateDoc(doc(db_online, "shopping_lists", editingId), { name: listName });
      setEditingId(null);
    } else {
      await addDoc(collection(db_online, "shopping_lists"), {
        name: listName, owner: user.uid, familyId: user.uid, isShared: false, createdAt: new Date()
      });
    }
    setListName(''); Keyboard.dismiss();
  };

  if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#6200EE" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Minhas Listas 👤</Text>
      <View style={styles.inputArea}>
        <TextInput style={styles.input} placeholder="Nova lista pessoal..." value={listName} onChangeText={setListName} />
        <TouchableOpacity style={[styles.addButton, editingId && {backgroundColor: '#4CAF50'}]} onPress={handleSave}>
          <MaterialIcons name={editingId ? "check" : "add"} size={30} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <TouchableOpacity style={styles.listInfo} onPress={() => router.push({ pathname: "/list/[id]", params: { id: item.id, name: item.name } })}>
              <MaterialIcons name={item.isShared ? "cloud-done" : "lock-outline"} size={22} color={item.isShared ? "#4CAF50" : "#6200EE"} />
              <Text style={styles.listText}>{item.name}</Text>
            </TouchableOpacity>
            <View style={styles.listActions}>
              <TouchableOpacity onPress={() => toggleShare(item)} style={{marginRight: 15}}>
                <MaterialIcons name="cloud-upload" size={26} color={item.isShared ? "#4CAF50" : "#CCC"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {setListName(item.name); setEditingId(item.id);}} style={{marginRight: 15}}><MaterialIcons name="edit" size={22} color="#4A90E2" /></TouchableOpacity>
              <TouchableOpacity onPress={() => {
                Alert.alert("Apagar", "Deseja apagar?", [{text: "Não"}, {text: "Sim", onPress: () => deleteDoc(doc(db_online, "shopping_lists", item.id))}])
              }}><MaterialIcons name="delete-outline" size={24} color="#FF5252" /></TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  inputArea: { flexDirection: 'row', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  addButton: { backgroundColor: '#6200EE', width: 55, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  listCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 3 },
  listInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listText: { fontSize: 17, fontWeight: '600', marginLeft: 10, color: '#444' },
  listActions: { flexDirection: 'row', alignItems: 'center' },
});