import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import React, { useEffect, useState, } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';




// --- CONFIGURAÇÃO Google maps ---

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';
//Crie um arquivo .env e coloque essa chave, EXPO_PUBLIC_GOOGLE_API_KEY = 'SUA_CHAVE_AQUI'; 

interface Place {
  id: string;
  name: string;
  address: string;
  distance: number;
  latitude: number;
  longitude: number;
  rating: number;
  openNow: boolean;
}

export default function ExploreScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('Assaí Atacadista');
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    getUserLocation();
  }, [radius]);

  const getUserLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("GPS Negado", "Ative o GPS para localizar os mercados.");
      setLoading(false);
      return;
    }

    let currentLocation = await Location.getCurrentPositionAsync({});
    setLocation(currentLocation);
    fetchPlaces(currentLocation.coords.latitude, currentLocation.coords.longitude);
  };

  const fetchPlaces = async (lat: number, lon: number) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&keyword=${searchText}&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    
    if (response.data.results) {
      const mappedPlaces = response.data.results.map((p: any) => {
        // PEGA A REFERÊNCIA DA FOTO
        const photoRef = p.photos ? p.photos[0].photo_reference : null;
        
        return {
          id: p.place_id,
          name: p.name,
          address: p.vicinity,
          rating: p.rating || 0,
          latitude: p.geometry.location.lat,
          longitude: p.geometry.location.lng,
          openNow: p.opening_hours?.open_now || false,
          distance: calculateDistance(lat, lon, p.geometry.location.lat, p.geometry.location.lng),
          // ADICIONA A URL DA IMAGEM NO OBJETO
          imageUrl: photoRef 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`
            : 'https://via.placeholder.com/150'
        };
      });

      setPlaces(mappedPlaces.sort((a: any, b: any) => a.distance - b.distance));
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  // --- FUNÇÃO DE ROTA DIRETA E NATIVA ---
  const openRoute = (place: Place) => {

  const latLng = `${place.latitude},${place.longitude}`;
  const encodedName = encodeURIComponent(place.name);
  const namemap = `${place.name}`;

  
  // URL para iniciar NAVEGAÇÃO direta
  const url = Platform.select({
         //     ios: `maps:0,0?q=${encodedName}&ll=${latLng}`,
        ios: `http://maps.apple.com/?daddr=${latLng}&dirflg=d`, // daddr = destination address
    //android: `google.navigation:q=${latLng}` // Esse comando é uma ordem direta para o Android: "Abra o Maps e comece a navegar agora"
    //android: `geo:0,0?q=${namemap}`
    android: `geo:${latLng}?q=${encodedName}`
     //android: `https://www.google.com/maps/dir/?api=1&destination=${latLng}`  //Permite ver caminhos alternativos e o tempo de chegada antes de começar.
  });

  if (url) {
    Linking.openURL(url).catch(() => {
      // Caso falte o Google Maps no Android, tentamos abrir via browser que redireciona
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
    });
  }
};




  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorar 📍</Text>

      {/* BARRA DE BUSCA */}
      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar (ex: Padaria, Açougue...)"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={getUserLocation}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={getUserLocation}>
          <MaterialIcons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* RAIO DE BUSCA */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Raio:</Text>
        {[5000, 10000, 20000].map((r) => (
          <TouchableOpacity 
            key={r} 
            style={[styles.radiusChip, radius === r && styles.activeChip]}
            onPress={() => setRadius(r)}
          >
            <Text style={[styles.chipText, radius === r && styles.activeChipText]}>{r/1000}km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
    <View style={styles.cardMain}>
      
      {/* 1. ADICIONE A IMAGEM AQUI */}
      <Image 
        source={{ uri: item.imageUrl}} 
        style={styles.placeImage} 
      />

      <View style={{flex: 1, marginLeft: 12}}>
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeAddress} numberOfLines={1}>{item.address}</Text>
                  
                  <View style={styles.tagRow}>
                    <View style={[styles.statusTag, {backgroundColor: item.openNow ? '#E8F5E9' : '#FFEBEE'}]}>
                      <Text style={{color: item.openNow ? '#2E7D32' : '#C62828', fontSize: 10, fontWeight: 'bold'}}>
                        {item.openNow ? 'ABERTO' : 'FECHADO'}
                      </Text>
                    </View>
                    <View style={styles.ratingTag}>
                      <MaterialIcons name="star" size={12} color="#FBC02D" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {item.distance < 1 ? `${(item.distance*1000).toFixed(0)}m` : `${item.distance.toFixed(1)}km`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.routeBtn} onPress={() => openRoute(item)}>
                <MaterialIcons name="navigation" size={20} color="white" />
                  <Text style={styles.routeBtnText}>VER ROTA NO MAPA</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum local encontrado.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 60, paddingHorizontal: 15 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, elevation: 3, marginBottom: 15, alignItems: 'center' },
  searchInput: { flex: 1, padding: 15, fontSize: 15 },
  searchBtn: { backgroundColor: '#6200EE', padding: 15, borderRadius: 12 },
  radiusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  radiusLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', marginRight: 10 },
  radiusChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  activeChip: { backgroundColor: '#6200EE' },
  chipText: { fontSize: 12, color: '#666' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  //cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  placeName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  placeAddress: { fontSize: 12, color: '#888', marginTop: 3 },
  distanceBadge: { backgroundColor: '#f3f0ff', padding: 8, borderRadius: 10 },
  distanceText: { color: '#6200EE', fontWeight: 'bold', fontSize: 12 },
  tagRow: { flexDirection: 'row', marginTop: 10 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginRight: 8 },
  ratingTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 8, borderRadius: 5 },
  ratingText: { fontSize: 10, fontWeight: 'bold', marginLeft: 3, color: '#F57F17' },
  routeBtn: { backgroundColor: '#4CAF50', flexDirection: 'row', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  routeBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  placeImage: {
    width: 70,        // LARGURA OBRIGATÓRIA
    height: 70,       // ALTURA OBRIGATÓRIA
    borderRadius: 10, // Deixa as pontas arredondadas (estilo moderno)
    backgroundColor: '#EEE' // Cor de fundo enquanto carrega
  },
  cardMain: { 
    flexDirection: 'row', // Alinha a imagem ao lado do texto
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
});