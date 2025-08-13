// polyfills.js - Simple polyfills for web platform
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Set up global Buffer for all platforms
global.Buffer = Buffer;
