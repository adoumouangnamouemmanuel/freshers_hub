import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  withSequence,
  withDelay
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(100, withTiming(0.8, { duration: 800 })),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardContainer}>
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <SkeletonLoader width={56} height={56} borderRadius={28} />
          <View style={styles.headerTextCol}>
            <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={120} height={20} borderRadius={6} />
          </View>
        </View>
        <SkeletonLoader width={44} height={44} borderRadius={22} />
      </View>

      {/* Widget Skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <SkeletonLoader width="100%" height={160} borderRadius={24} />
      </View>

      {/* Feed Skeleton */}
      <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
        <SkeletonLoader width={140} height={24} borderRadius={6} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={44} borderRadius={8} style={{ marginBottom: 16 }} />
        
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          <SkeletonLoader width={60} height={32} borderRadius={16} />
          <SkeletonLoader width={100} height={32} borderRadius={16} />
          <SkeletonLoader width={80} height={32} borderRadius={16} />
        </View>

        <SkeletonLoader width="100%" height={200} borderRadius={24} style={{ marginBottom: 16 }} />
        <SkeletonLoader width="100%" height={200} borderRadius={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTextCol: {
    justifyContent: 'center',
  }
});
