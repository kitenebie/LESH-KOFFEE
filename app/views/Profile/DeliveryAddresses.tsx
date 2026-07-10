import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';

interface DeliveryAddressesProps {
  onBack: () => void;
  showAlert: (title: string, message: string) => void;
}

export default function DeliveryAddressesView({ onBack, showAlert }: DeliveryAddressesProps) {
  const { data: dummyData } = useAppData();

  const [addresses, setAddresses] = useState(dummyData?.user?.addresses || []);

  // Sync addresses when data updates from API/SQLite
  React.useEffect(() => {
    if (dummyData?.user?.addresses?.length > 0) setAddresses(dummyData.user.addresses);
  }, [dummyData?.user?.addresses]);

  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Map and Location States
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.5547,
    longitude: 121.0244,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  });
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleMapPress = async (coords: { latitude: number; longitude: number }) => {
    setSelectedCoords(coords);
    setMapRegion(prev => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude
    }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const result = await Location.reverseGeocodeAsync(coords);
        if (result && result.length > 0) {
          const addr = result[0];
          const addressString = [
            addr.streetNumber,
            addr.street,
            addr.district,
            addr.city,
            addr.region,
            addr.country
          ].filter(Boolean).join(', ');
          setNewAddress(addressString || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        } else {
          setNewAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }
      } else {
        setNewAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      }
    } catch {
      setNewAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
    }
  };

  const handleAutoLocate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Please enable location permissions to auto-locate.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setSelectedCoords(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      });
      
      const result = await Location.reverseGeocodeAsync(coords);
      if (result && result.length > 0) {
        const addr = result[0];
        const addressString = [
          addr.streetNumber,
          addr.street,
          addr.district,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');
        setNewAddress(addressString || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      } else {
        setNewAddress(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      }
    } catch {
      showAlert('Error', 'Unable to fetch your current location.');
    }
  };

  const handleAddAddress = () => {
    if (!newLabel || !newAddress) {
      showAlert('Error', 'Please fill in both label and address fields.');
      return;
    }
    const newId = (addresses.length + 1).toString();
    setAddresses([...addresses, { id: newId, label: newLabel, address: newAddress, isDefault: false }]);
    setNewLabel('');
    setNewAddress('');
    setSelectedCoords(null);
    setShowAddForm(false);
    showAlert('Success', 'Address added successfully.');
  };

  const handleSetDefault = (id: string) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id
      }))
    );
    showAlert('Success', 'Default delivery address updated.');
  };

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Addresses List */}
        {addresses.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={index % 2 === 0 ? SlideInLeft.delay(300 + index * 100).duration(400) : SlideInRight.delay(300 + index * 100).duration(400)}
            style={[styles.addressCard, item.isDefault && styles.activeAddressCard]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <Ionicons name={item.label === 'Home' ? 'home-outline' : 'business-outline'} size={18} color={Colors.primary.default} />
                <Text style={styles.addressLabel}>{item.label}</Text>
              </View>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressText}>{item.address}</Text>

            {!item.isDefault && (
              <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(item.id)}>
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ))}

        {/* Add Address trigger */}
        {!showAddForm ? (
          <TouchableOpacity style={styles.addTriggerBtn} onPress={() => setShowAddForm(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary.default} />
            <Text style={styles.addTriggerText}>Add New Address</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>New Delivery Address</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label (e.g., Home, Work)</Text>
              <TextInput
                style={styles.input}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="Enter address label"
                placeholderTextColor={Colors.neutral.gray400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Address Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Enter street, city, postal code"
                placeholderTextColor={Colors.neutral.gray400}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Map Selector */}
            <View style={styles.mapInputGroup}>
              <Text style={styles.inputLabel}>Pin Location on Map (Tap to Mark)</Text>
              <View style={styles.mapWrapper}>
                <MapView
                  style={styles.formMap}
                  region={mapRegion}
                  onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
                  mapType="standard"
                >
                  {selectedCoords && (
                    <Marker coordinate={selectedCoords} title="New Location" />
                  )}
                </MapView>
                
                <TouchableOpacity style={styles.locateBtn} onPress={handleAutoLocate} activeOpacity={0.85}>
                  <Ionicons name="locate" size={16} color="#FAF9F5" />
                  <Text style={styles.locateBtnText}>Auto-Locate Me</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setShowAddForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleAddAddress}>
                <Text style={styles.saveBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.primary.default,
  },
  scrollBody: {
    padding: 24,
    paddingBottom: 48,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  activeAddressCard: {
    borderColor: Colors.secondary.default,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.neutral.gray800,
  },
  defaultBadge: {
    backgroundColor: 'rgba(179,101,52,0.1)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: Colors.secondary.default,
  },
  addressText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: Colors.neutral.gray600,
    lineHeight: 18,
    marginBottom: 12,
  },
  setDefaultBtn: {
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.secondary.default,
  },
  addTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary.default,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addTriggerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.primary.default,
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
  },
  formTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: Colors.primary.default,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: Colors.neutral.gray500,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: Colors.neutral.gray900,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.neutral.gray100,
  },
  cancelBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.neutral.gray600,
  },
  saveBtn: {
    backgroundColor: Colors.secondary.default,
  },
  saveBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FAF9F5',
  },
  mapInputGroup: {
    marginBottom: 20,
  },
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
  },
  formMap: {
    flex: 1,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: Colors.primary.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  locateBtnText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#FAF9F5',
  },
});
