import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported as a component
export function App() {
  const ctx = require.context('./app'); 
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
