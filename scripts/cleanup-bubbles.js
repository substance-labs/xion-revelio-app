#!/usr/bin/env node

/**
 * Bubble Cleanup Script
 * 
 * This script deletes specific test bubbles to make room for new ones.
 * It requires signing capabilities to delete bubbles.
 */

const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { GasPrice } = require('@cosmjs/stargate');
require('dotenv').config({ path: '.env.local' });

// Configuration
const RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443';
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
const COLLECTION = process.env.EXPO_PUBLIC_BUBBLES_COLLECTION || 'bubbles';

if (!CONTRACT_ADDRESS) {
  console.error('❌ EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS not found in environment');
  process.exit(1);
}

// Bubbles to delete (owned by xion1unxq6g8c3qz765z5d3ae8hadjwzg7sgaxcycjjw9jq065akn0ces8kmggw)
const BUBBLES_TO_DELETE = [
  'bubble_1755527302555', // test3
  'bubble_1755531409768', // test4
  'bubble_1755564193769', // Twitter users
];

console.log('🧹 Bubble Cleanup Script');
console.log('========================');
console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
console.log(`🌐 RPC: ${RPC_ENDPOINT}`);
console.log(`📂 Collection: ${COLLECTION}`);
console.log(`🗑️  Bubbles to delete: ${BUBBLES_TO_DELETE.length}`);
console.log('');

async function deleteBubbles() {
  try {
    console.log('⚠️  WARNING: This script requires a wallet with signing capabilities.');
    console.log('⚠️  You need to modify this script to include your wallet mnemonic or private key.');
    console.log('⚠️  For security, never commit wallet credentials to version control.');
    console.log('');
    
    // TODO: Replace this with actual wallet setup
    // Example with mnemonic (NEVER commit real mnemonics):
    // const mnemonic = "your twelve word mnemonic phrase here...";
    // const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    
    console.log('❌ Wallet setup not implemented. Please configure signing wallet first.');
    console.log('');
    console.log('To use this script:');
    console.log('1. Add your wallet mnemonic or private key');
    console.log('2. Uncomment the wallet setup code');
    console.log('3. Run the script again');
    console.log('');
    console.log('Bubbles that would be deleted:');
    BUBBLES_TO_DELETE.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    return;
    
    // Uncomment and modify this section when ready to use:
    /*
    const accounts = await wallet.getAccounts();
    const signerAddress = accounts[0].address;
    
    console.log(`🔑 Signer address: ${signerAddress}`);
    
    const gasPrice = GasPrice.fromString("0.025uxion");
    const client = await SigningCosmWasmClient.connectWithSigner(
      RPC_ENDPOINT,
      wallet,
      { gasPrice }
    );
    
    console.log('✅ Connected to blockchain with signing client');
    
    for (const bubbleId of BUBBLES_TO_DELETE) {
      try {
        console.log(`\n🗑️  Deleting bubble: ${bubbleId}`);
        
        // First check if bubble exists
        const existing = await client.queryContractSmart(CONTRACT_ADDRESS, {
          Get: {
            collection: COLLECTION,
            document: bubbleId
          }
        });
        
        if (!existing.exists) {
          console.log(`⚠️  Bubble ${bubbleId} does not exist, skipping`);
          continue;
        }
        
        console.log(`👤 Owner: ${existing.document.owner}`);
        if (existing.document.owner !== signerAddress) {
          console.log(`❌ Cannot delete ${bubbleId}: You are not the owner`);
          continue;
        }
        
        // Delete the bubble
        const result = await client.execute(
          signerAddress,
          CONTRACT_ADDRESS,
          {
            Delete: {
              collection: COLLECTION,
              document: bubbleId
            }
          },
          "auto"
        );
        
        console.log(`✅ Successfully deleted ${bubbleId}`);
        console.log(`📄 Transaction hash: ${result.transactionHash}`);
        
      } catch (error) {
        console.error(`❌ Error deleting ${bubbleId}:`, error.message);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    */
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

deleteBubbles().catch(console.error);
