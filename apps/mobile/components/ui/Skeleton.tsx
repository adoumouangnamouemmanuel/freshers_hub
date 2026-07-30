import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { MotiView } from 'moti';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonProps) => {
  return (
    <MotiView
      transition={{
        type: 'timing',
        duration: 1000,
        loop: true,
      }}
      from={{ opacity: 0.3 }}
      animate={{ opacity: 0.7 }}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
});
