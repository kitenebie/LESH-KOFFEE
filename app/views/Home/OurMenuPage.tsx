import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { Input } from '../../../components/UI/Input';
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

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface OurMenuPageProps {
  products: Product[];
  categories: Category[];
  onBack: () => void;
  onAddProduct: (product: Product, event: any) => void;
}

export default function OurMenuPage({ products, categories, onBack, onAddProduct }: OurMenuPageProps) {
  const { data: dummyData } = useAppData();

  const [selectedCat, setSelectedCat] = useState('all');
  const [searchWord, setSearchWord] = useState('');

  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesSearch = p.name.toLowerCase().includes(searchWord.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchWord.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Animated.View entering={SlideInDown.duration(400)} style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary.default} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Menu</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Floating search within this view */}
      <Animated.View entering={SlideInRight.delay(300).duration(400)} style={styles.searchWrap}>
        <Input
          placeholder="Search items in full menu..."
          value={searchWord}
          onChangeText={setSearchWord}
          leftIcon={<Ionicons name="search-outline" size={18} color={Colors.primary.default} />}
          rightIcon={
            searchWord ? (
              <TouchableOpacity onPress={() => setSearchWord('')}>
                <Ionicons name="close-circle" size={16} color={Colors.neutral.gray500} />
              </TouchableOpacity>
            ) : null
          }
        />
      </Animated.View>

      {/* Category filters */}
      <Animated.View entering={SlideInLeft.delay(400).duration(400)} style={styles.categoriesSection}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCat === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryBtn, isActive && styles.categoryBtnActive]}
                onPress={() => setSelectedCat(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : Colors.primary.default}
                />
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </Animated.View>

      {/* Products Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridBody}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={48} color={Colors.neutral.gray400} />
            <Text style={styles.emptyText}>No menu matches found.</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const config = dummyData?.customizationOptions?.[item.id];
          const hasCustomization = item.customizable && !!config;

          return (
          <Animated.View
            entering={
              index % 2 === 0
                ? SlideInLeft.delay(450 + index * 60).duration(400)
                : SlideInRight.delay(450 + index * 60).duration(400)
            }
            style={styles.gridCardWrapper}
          >
            <View style={styles.gridCard}>
              <Image source={{ uri: item.image }} style={styles.gridImage} />
              <View style={styles.ratingBadgeMini}>
                <Ionicons name="star" size={10} color="#F4A261" />
                <Text style={styles.ratingTextMini}>{item.rating}</Text>
              </View>
              {hasCustomization && (
                <View style={styles.customizableMini}>
                  <Ionicons name="options-outline" size={9} color={Colors.secondary.default} />
                  <Text style={styles.customizableMiniText}>Custom</Text>
                </View>
              )}
              <View style={styles.gridContent}>
                <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gridDesc} numberOfLines={1}>{item.description}</Text>
                <View style={styles.gridFooter}>
                  <Text style={styles.gridPrice}>₱{item.price.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={styles.addButtonMini}
                    onPress={(e) => onAddProduct(item, e)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={16} color="#FFF" />
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
  searchWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoriesSection: {
    marginBottom: 10,
  },
  categoriesList: {
    paddingHorizontal: 24,
    paddingVertical: 6,
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: Colors.neutral.gray300,
    gap: 6,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary.default,
    borderColor: Colors.primary.default,
  },
  categoryText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: Colors.primary.default,
  },
  categoryTextActive: {
    color: '#FAF9F5',
  },
  gridBody: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridCardWrapper: {
    width: '48%',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral.gray200,
    shadowColor: Colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
  },
  ratingBadgeMini: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 2,
  },
  customizableMini: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    gap: 3,
  },
  customizableMiniText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 8,
    color: Colors.secondary.default,
  },
  ratingTextMini: {
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
    color: '#D48C46',
  },
  gridContent: {
    marginTop: 10,
  },
  gridName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.neutral.gray900,
  },
  gridDesc: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: Colors.neutral.gray500,
    marginTop: 2,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  gridPrice: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: Colors.secondary.default,
  },
  addButtonMini: {
    backgroundColor: Colors.secondary.default,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: Colors.neutral.gray600,
    marginTop: 10,
  },
});
