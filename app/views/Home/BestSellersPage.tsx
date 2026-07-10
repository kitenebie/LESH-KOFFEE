import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { Colors } from '../../../components/UI/Colors';
import { useAppData } from '../../../lib/useAppData';

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviews: number;
  isPopular: boolean;
  image: string;
  customizable?: boolean;
}

interface BestSellersPageProps {
  products: Product[];
  onBack: () => void;
  onAddProduct: (product: Product, event: any) => void;
}

export default function BestSellersPage({ products, onBack, onAddProduct }: BestSellersPageProps) {
  const { data: dummyData } = useAppData();

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Best Sellers</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listBody}
        renderItem={({ item, index }) => {
          const config = dummyData?.customizationOptions?.[item.id];
          const hasCustomization = item.customizable && !!config;

          return (
            <Animated.View
              entering={
                index % 2 === 0
                  ? SlideInLeft.delay(300 + index * 80).duration(400)
                  : SlideInRight.delay(300 + index * 80).duration(400)
              }
            >
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <View style={styles.cardContent}>
                  <View style={styles.nameRow}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#F4A261" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>

                  {/* Customization indicator */}
                  {hasCustomization && (
                    <View style={styles.customizableBadge}>
                      <Ionicons name="options-outline" size={10} color={Colors.secondary.default} />
                      <Text style={styles.customizableBadgeText}>Customizable</Text>
                    </View>
                  )}

                  <View style={styles.footerRow}>
                    <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={(e) => onAddProduct(item, e)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
      />
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
  listBody: {
    padding: 24,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.neutral.gray900,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 162, 97, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: '#D48C46',
    marginLeft: 3,
  },
  productDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: Colors.neutral.gray500,
    lineHeight: 15,
    marginVertical: 4,
  },
  customizableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(179, 101, 52, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
    gap: 4,
  },
  customizableBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: Colors.secondary.default,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: Colors.secondary.default,
  },
  addBtn: {
    backgroundColor: Colors.secondary.default,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary.default,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
});
