# Bubbles - Verified Community Chat Platform 💬

A React Native social platform built with Expo that enables verified member communities called "Bubbles". Users can create, join, and participate in verified community spaces with blockchain-powered data storage via DocuStore.

## Features

- 🫧 **Create Bubbles**: Start verified member communities for organizations or projects
- ✅ **Verification System**: Join bubbles and get verified to participate
- 💬 **Post & Comment**: Share updates and engage in discussions within bubbles
- 🔗 **Blockchain Storage**: All data stored on-chain using XION DocuStore smart contracts
- 🔗 **ZK verification**: User verification done with zkTLS (not implemented)
- 🎨 **Theme Support**: Light and dark mode with consistent design system

## Prerequisites

- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- XION wallet for blockchain interactions
- DocuStore contract address (set in environment variables)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   # Create .env as in https://docs.burnt.com/xion/developers/mobile-app-development/build-a-todo-mobile-app-using-the-docustore-contract
   EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS="xion1svpts9q2ml4ahgc4tuu95w8cqzv988s6mf5mupt5kt56gvdnklks9hzar4"
   EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS="xion1aza0jdzfc7g0u64k8qcvcxfppll0cjeer56k38vpshe3p26q5kzswpywp9"
   EXPO_PUBLIC_RPC_ENDPOINT="https://rpc.xion-testnet-2.burnt.com:443"
   EXPO_PUBLIC_REST_ENDPOINT="https://api.xion-testnet-2.burnt.com"
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator, `i` for iOS simulator
   - Or press `w` to run in web browser

## Running on Android

For Android development builds:
```bash
npx expo run:android
```

*Note: Requires Java 17 for Android builds*

## How to Use

1. **Connect Wallet**: Link your XION wallet to interact with bubbles
2. **Browse Bubbles**: View available community bubbles 
3. **Get Verified**: Request verification for bubbles you want to join
4. **Create Content**: Post updates and comment on discussions
5. **Create Bubbles**: Start your own verified community space

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Blockchain**: XION network with Abstraxion SDK
- **Storage**: DocuStore smart contracts
- **Verification**: zkTLS
- **Styling**: Custom theme system with TypeScript

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [XION Blockchain](https://xion.burnt.com/)
- [Abstraxion SDK](https://docs.burnt.com/abstraxion/)
- [DocuStore Contracts](https://github.com/burnt-labs/contracts)
