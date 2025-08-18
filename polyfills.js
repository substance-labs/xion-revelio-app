// polyfills.js - Platform-aware polyfills
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Polyfill process.browser for libraries that expect it.
if (typeof process === 'undefined') {
  global.process = { browser: true };
} else if (typeof process.browser === 'undefined') {
  process.browser = true;
}

// Set up global Buffer for all platforms
global.Buffer = Buffer;

// Platform-specific setup
if (typeof window !== 'undefined') {
  // Web platform detected - @burnt-labs/abstraxion will handle its own dependencies
  console.log('Web platform detected, using @burnt-labs/abstraxion');
  
  // Prevent any react-native-libsodium imports on web
  if (typeof global === 'undefined') {
    global = {};
  }
} else {
  // React Native platform - @burnt-labs/abstraxion-react-native handles libsodium
  console.log('React Native platform detected, using @burnt-labs/abstraxion-react-native');
}
