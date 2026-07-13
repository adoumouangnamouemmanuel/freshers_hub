// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<string, ComponentProps<typeof MaterialIcons>['name']>>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // existing
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  // Fresher Hub tabs
  'newspaper.fill': 'article',
  'map.fill': 'map',
  'heart.text.square.fill': 'support',
  'person.2.fill': 'groups',
  'questionmark.circle.fill': 'help',
  'star.fill': 'star',
  // Help Center Offices
  'earth.americas.fill': 'public',
  'briefcase.fill': 'work',
  'cross.case.fill': 'local-hospital',
  'graduationcap.fill': 'school',
  'figure.2.arms.open': 'emoji-people',
  'chevron.left': 'chevron-left',
  'calendar': 'event',
  'chevron.down': 'keyboard-arrow-down',
  'phone.fill': 'phone',
  'envelope.fill': 'email',
  'message.fill': 'chat',
  'magnifyingglass': 'search',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mName = MAPPING[name] as ComponentProps<typeof MaterialIcons>['name'];
  return <MaterialIcons color={color} size={size} name={mName} style={style} />;
}
