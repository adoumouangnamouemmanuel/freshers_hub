import React from 'react';
import { View, StyleSheet, ViewProps, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  onPress?: () => void;
  color?: string; // Optional overlay color tint
}

export function GlassCard({ children, delay = 0, style, onPress, color = '#FFFFFF', ...props }: GlassCardProps) {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  
  const content = (
    <View style={[
      styles.card, 
      { backgroundColor: color },
      style
    ]} {...props}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable 
        entering={FadeInDown.delay(delay).duration(400)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
        ]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(400)} 
      style={styles.container}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    borderRadius: 24,
    shadowColor: "#0A1229",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
  }
});
