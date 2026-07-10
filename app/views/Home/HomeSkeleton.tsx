import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '../../../components/UI/Colors';

// Shimmer pulse animation component
function SkeletonBlock({ width, height, borderRadius = 12, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.neutral.gray200,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBlock width={100} height={14} borderRadius={6} />
          <SkeletonBlock width={140} height={22} borderRadius={8} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.headerRight}>
          <SkeletonBlock width={36} height={36} borderRadius={18} />
          <SkeletonBlock width={36} height={36} borderRadius={18} style={{ marginLeft: 10 }} />
          <SkeletonBlock width={48} height={48} borderRadius={24} style={{ marginLeft: 10 }} />
        </View>
      </View>

      {/* Search Skeleton */}
      <View style={styles.searchSection}>
        <SkeletonBlock width="100%" height={48} borderRadius={14} />
      </View>

      {/* Loyalty Card Skeleton */}
      <View style={styles.section}>
        <SkeletonBlock width="100%" height={90} borderRadius={20} />
      </View>

      {/* Promos Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBlock width={160} height={18} borderRadius={8} />
          <SkeletonBlock width={60} height={14} borderRadius={6} />
        </View>
        <View style={styles.horizontalScroll}>
          <SkeletonBlock width={220} height={110} borderRadius={20} />
          <SkeletonBlock width={220} height={110} borderRadius={20} style={{ marginLeft: 12 }} />
        </View>
      </View>

      {/* Best Sellers Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBlock width={170} height={18} borderRadius={8} />
          <SkeletonBlock width={60} height={14} borderRadius={6} />
        </View>
        <View style={styles.horizontalScroll}>
          <SkeletonBlock width={150} height={200} borderRadius={18} />
          <SkeletonBlock width={150} height={200} borderRadius={18} style={{ marginLeft: 12 }} />
          <SkeletonBlock width={150} height={200} borderRadius={18} style={{ marginLeft: 12 }} />
        </View>
      </View>

      {/* Categories Skeleton */}
      <View style={styles.section}>
        <SkeletonBlock width={100} height={16} borderRadius={6} />
        <View style={[styles.horizontalScroll, { marginTop: 12 }]}>
          <SkeletonBlock width={90} height={36} borderRadius={16} />
          <SkeletonBlock width={80} height={36} borderRadius={16} style={{ marginLeft: 8 }} />
          <SkeletonBlock width={85} height={36} borderRadius={16} style={{ marginLeft: 8 }} />
          <SkeletonBlock width={95} height={36} borderRadius={16} style={{ marginLeft: 8 }} />
        </View>
      </View>

      {/* Menu Grid Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <SkeletonBlock width={100} height={18} borderRadius={8} />
          <SkeletonBlock width={60} height={14} borderRadius={6} />
        </View>
        <View style={styles.gridRow}>
          <SkeletonBlock width="48%" height={200} borderRadius={18} />
          <SkeletonBlock width="48%" height={200} borderRadius={18} />
        </View>
        <View style={[styles.gridRow, { marginTop: 12 }]}>
          <SkeletonBlock width="48%" height={200} borderRadius={18} />
          <SkeletonBlock width="48%" height={200} borderRadius={18} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
