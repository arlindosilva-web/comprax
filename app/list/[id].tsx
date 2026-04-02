import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Share // IMPORTANTE: Faltava o Share aqui
  ,







  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// FIREBASE IMPORTS
import {
  addDoc,
  collection,
  deleteDoc // IMPORTANTE: Faltava o deleteDoc aqui
  ,







  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db_online } from '../../services/firebaseConfig';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  bought: boolean;
  position: number;
}

export default function ItemsScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();

  const [task, setTask] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db_online, "items"), where("list_id", "==", id), orderBy("position", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShoppingItem[];
      
      // Organização: Não comprados em cima, Comprados embaixo
      const sortedData = data.sort((a, b) => Number(a.bought) - Number(b.bought));
      setItems(sortedData);
    });
    return () => unsubscribe();
  }, [id]);

  const totalItems = items.length;
  const boughtItems = items.filter(i => i.bought).length;
  const progress = totalItems > 0 ? (boughtItems / totalItems) * 100 : 0;

  const handleSave = async () => {
    if (task.trim().length === 0) return;
    try {
      if (editingId) {
        await updateDoc(doc(db_online, "items", editingId), { name: task, quantity: quantity });
        setEditingId(null);
      } else {
        const nextPos = items.length > 0 ? Math.max(...items.map(i => i.position)) + 1 : 0;
        await addDoc(collection(db_online, "items"), {
          name: task, quantity: quantity, bought: false, list_id: id, position: nextPos, createdAt: serverTimestamp()
        });
      }
      setTask(''); setQuantity('1'); Keyboard.dismiss();
    } catch (e) { console.error(e); }
  };

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    await updateDoc(doc(db_online, "items", itemId), { bought: !currentStatus });
  };

  const shareList = () => {
    const listText = items
      .filter(i => !i.bought)
      .map(i => `• ${i.name} (${i.quantity})`)
      .join('\n');
    const message = `🛒 *Faltam na lista ${name}:*\n\n${listText}\n\nEnviado pelo CompraX`;
    Share.share({ message });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* HEADER FIXO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <TouchableOpacity onPress={shareList}>
          <MaterialIcons name="share" size={26} color="#6200EE" />
        </TouchableOpacity>
      </View>

      {/* PROGRESSO FIXO */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Progresso</Text>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* ÁREA QUE REAGE AO TECLADO */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "padding"} // Padding funciona melhor em ambos com offset
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 5} // Offset para não cobrir o input
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={[styles.itemRow, item.bought && styles.itemRowBought]}>
              <TouchableOpacity onPress={() => toggleItem(item.id, item.bought)} style={styles.checkArea}>
                <MaterialIcons name={item.bought ? "check-circle" : "radio-button-unchecked"} size={26} color={item.bought ? "#4CAF50" : "#CCC"} />
                <View style={{marginLeft: 12, flex: 1}}>
                  <Text style={[styles.itemText, item.bought && styles.itemTextBought]}>{item.name}</Text>
                  <Text style={styles.quantityText}>Qtd: {item.quantity}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {!item.bought && (
                  <TouchableOpacity onPress={() => {setTask(item.name); setQuantity(item.quantity); setEditingId(item.id);}} style={{marginRight: 15}}>
                    <MaterialIcons name="edit" size={22} color="#4A90E2" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteDoc(doc(db_online, "items", item.id))}>
                  <MaterialIcons name="delete-outline" size={22} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* ÁREA DE INPUT */}
        <View style={styles.inputArea}>
          <TextInput 
            style={[styles.input, { flex: 3 }]} 
            placeholder="O que comprar?" 
            value={task} 
            onChangeText={setTask} 
          />
          <TextInput 
            style={[styles.input, { flex: 1, marginLeft: 10, textAlign: 'center' }]} 
            placeholder="Qtd" 
            value={quantity} 
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          <TouchableOpacity style={[styles.addButton, editingId && {backgroundColor: '#4CAF50'}]} onPress={handleSave}>
            <MaterialIcons name={editingId ? "check" : "add"} size={30} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginLeft: 15 },
  progressWrapper: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 15, elevation: 1 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  progressPercent: { fontSize: 12, fontWeight: 'bold', color: '#6200EE' },
  progressBarBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6200EE' },
  itemRow: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1 },
  itemRowBought: { backgroundColor: '#F2F2F2', opacity: 0.6, elevation: 0 },
  checkArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },
  itemTextBought: { textDecorationLine: 'line-through', color: '#AAA' },
  quantityText: { fontSize: 12, color: '#888' },
  inputArea: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, backgroundColor: '#F8F9FA' },
  input: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#DDD' },
  addButton: { backgroundColor: '#6200EE', width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});