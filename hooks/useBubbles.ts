// This file is now a fallback - platform-specific implementations are in:
// - useBubbles.web.ts (for web platform)  
// - useBubbles.native.ts (for React Native platforms)

export { useBubbles } from './useBubbles.native'; // Default to native implementation
