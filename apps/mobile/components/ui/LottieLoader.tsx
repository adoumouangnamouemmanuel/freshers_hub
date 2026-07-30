import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieLoaderProps {
  source: any;
  width?: DimensionValue;
  height?: DimensionValue;
  autoPlay?: boolean;
  loop?: boolean;
}

export const LottieLoader = ({
  source,
  width = 150,
  height = 150,
  autoPlay = true,
  loop = true,
}: LottieLoaderProps) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
