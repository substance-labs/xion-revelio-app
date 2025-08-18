#!/usr/bin/env node

/**
 * DocuStore Contract Deployment Script for XION
 * 
 * This script helps you deploy your own private DocuStore contract instance
 * on the XION network using the existing code ID.
 * 
 * Benefits of your own DocuStore:
 * - Clean data (no other users' test documents)
 * - Full control over permissions
 * - No interference from other developers
 */

require('dotenv').config({ path: '.env.local' });

const CONTRACT_CODE_ID = 1228; // The DocuStore code ID from the existing contract
const RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443';

console.log('🚀 DocuStore Contract Deployment Tool');
console.log('=====================================');
console.log('');
console.log('💡 This will deploy your own private DocuStore contract instance');
console.log('   giving you a clean database with no other users\' test data.');
console.log('');
console.log(`📍 Code ID: ${CONTRACT_CODE_ID}`);
console.log(`🌐 RPC: ${RPC_ENDPOINT}`);
console.log('');

async function deployDocuStore() {
  try {
    // Import required dependencies
    const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
    const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
    const { GasPrice } = require('@cosmjs/stargate');

    // Check for mnemonic
    const MNEMONIC = process.env.WALLET_MNEMONIC;
    if (!MNEMONIC) {
      console.log('⚠️  No wallet mnemonic provided.');
      console.log('');
      console.log('To deploy a contract, you need to:');
      console.log('1. Add WALLET_MNEMONIC to your .env.local file');
      console.log('2. Make sure your wallet has XION testnet tokens');
      console.log('3. Run this script again');
      console.log('');
      console.log('💡 You can get testnet tokens from the XION faucet:');
      console.log('   https://faucet.burnt.com/');
      console.log('');
      console.log('🔧 Your .env.local should include:');
      console.log('   WALLET_MNEMONIC="your twelve word mnemonic phrase here"');
      return;
    }

    console.log('🔗 Connecting to XION network...');
    
    // Create wallet from mnemonic
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, {
      prefix: 'xion'
    });
    
    const [account] = await wallet.getAccounts();
    console.log(`👤 Deployer address: ${account.address}`);

    // Create signing client
    const signingClient = await SigningCosmWasmClient.connectWithSigner(
      RPC_ENDPOINT,
      wallet,
      {
        gasPrice: GasPrice.fromString('0.001uxion')
      }
    );
    
    console.log('✅ Connected successfully!');
    
    // Check balance
    const balance = await signingClient.getBalance(account.address, 'uxion');
    console.log(`💰 Balance: ${balance.amount} uxion`);
    
    if (parseInt(balance.amount) < 1000000) { // Less than 1 XION
      console.log('⚠️  Low balance! You may need more XION tokens for deployment.');
      console.log('   Get tokens from: https://faucet.burnt.com/');
    }
    
    console.log('');
    console.log('🚀 Deploying DocuStore contract...');
    
    // DocuStore instantiation message
    const instantiateMsg = {
      // Most DocuStore contracts have empty init messages
      // or simple configuration
    };
    
    // Deploy the contract
    const result = await signingClient.instantiate(
      account.address,           // sender
      CONTRACT_CODE_ID,          // code ID
      instantiateMsg,           // init message
      "my-docustore",           // label
      "auto"                    // fees
    );
    
    console.log('🎉 Contract deployed successfully!');
    console.log('');
    console.log('📋 Deployment Details:');
    console.log(`   Contract Address: ${result.contractAddress}`);
    console.log(`   Transaction Hash: ${result.transactionHash}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    console.log('');
    
    // Update environment file instructions
    console.log('🔧 To use your new contract:');
    console.log('');
    console.log('1. Update your .env.local file:');
    console.log(`   EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS="${result.contractAddress}"`);
    console.log('');
    console.log('2. Restart your app:');
    console.log('   npm run web');
    console.log('');
    console.log('✨ You now have a clean, private DocuStore contract!');
    
    // Generate the update command
    console.log('');
    console.log('🚀 Quick update command:');
    console.log(`   sed -i 's/EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS=.*/EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS="${result.contractAddress}"/' .env.local`);
    
    return result.contractAddress;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('');
      console.log('💡 This error usually means you need more XION tokens.');
      console.log('   Get them from: https://faucet.burnt.com/');
    } else if (error.message.includes('code not found')) {
      console.log('');
      console.log('💡 The code ID might be incorrect or not available on this network.');
      console.log(`   Current code ID: ${CONTRACT_CODE_ID}`);
    }
    
    return null;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run deploy-docustore [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Prerequisites:');
    console.log('  - WALLET_MNEMONIC in .env.local');
    console.log('  - XION testnet tokens in your wallet');
    console.log('');
    console.log('This will deploy a new DocuStore contract instance that you own.');
    return;
  }
  
  if (args.includes('--check-deps')) {
    console.log('Checking dependencies...');
    try {
      require('@cosmjs/cosmwasm-stargate');
      require('@cosmjs/proto-signing');
      require('@cosmjs/stargate');
      console.log('✅ All dependencies available');
    } catch (error) {
      console.log('❌ Missing dependencies. Install with:');
      console.log('   npm install @cosmjs/proto-signing @cosmjs/stargate --legacy-peer-deps');
    }
    return;
  }
  
  await deployDocuStore();
}

main().catch(console.error);
