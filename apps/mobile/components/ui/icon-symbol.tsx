// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// type IconMapping = Partial<Record<string, ComponentProps<typeof MaterialIcons>['name']>>;

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
  'alarm.fill': 'alarm',
  // Fresher Hub tabs
  'newspaper.fill': 'article',
  'map.fill': 'map',
  'heart.text.square.fill': 'support',
  'heart.fill': 'favorite',
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
  'calendar.badge.clock': 'event-available',
  'chevron.down': 'keyboard-arrow-down',
  'phone.fill': 'phone',
  'envelope.fill': 'email',
  'message.fill': 'chat',
  'magnifyingglass': 'search',
  'plus': 'add',
  'xmark.circle.fill': 'cancel',
  'xmark': 'close',
  'building.2.fill': 'business',
  'fork.knife': 'restaurant',
  'book.fill': 'menu-book',
  'hammer.fill': 'build',
  'bed.double.fill': 'hotel',
  'arrow.triangle.turn.up.right.circle.fill': 'directions',
  'location.fill': 'my-location',
  'bell.fill': 'notifications',
  'bell.badge.fill': 'notifications-active',
  'bell.slash.fill': 'notifications-off',
  'mappin.and.ellipse': 'location-on',
  'megaphone.fill': 'campaign',
  'person.3.fill': 'groups',
  'checkmark.circle.fill': 'check-circle',
  'checkmark': 'check',
  'chart.bar.fill': 'bar-chart',
  'checkmark.seal.fill': 'verified',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',
  'flag.fill': 'flag',
  'flag': 'outlined-flag',
  'doc.text.fill': 'description',
  'shield.fill': 'security',
  'person.fill': 'person',
  'trash': 'delete',
  'trash.fill': 'delete',
  'person.text.rectangle.fill': 'badge',
  'building.columns.fill': 'account-balance',
  'person.crop.circle.badge.xmark': 'person-off',
  'calendar.badge.exclamationmark': 'event-busy',
  'arrow.right': 'arrow-forward',
  'clock.fill': 'schedule',
  'ellipsis.circle': 'more-horiz',
  'pencil': 'edit',
  'nosign': 'block',
  'bookmark.fill': 'bookmark',
  'bookmark': 'bookmark-border',
  'figure.stand': 'accessibility',
  'figure.roll': 'accessible',
  'globe.americas.fill': 'public',
  'target': 'track-changes',
  'video.fill': 'videocam',
  'play.tv.fill': 'live-tv',
  'laptopcomputer': 'laptop-mac',
  'log-out': 'logout',
  'gearshape.fill': 'settings',
  'eye': 'visibility',
  'eye.slash': 'visibility-off',
  // Profile & Settings
  'lock.fill': 'lock',
  'lock': 'lock-outline',
  'moon.fill': 'dark-mode',
  'moon': 'dark-mode',
  'globe.fill': 'language',
  'globe': 'language',
  'square.and.arrow.up.fill': 'share',
  'square.and.arrow.up': 'share',
  'arrow.triangle.2.circlepath': 'sync',
  'folder.fill': 'folder',
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
