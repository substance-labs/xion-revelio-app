#!/usr/bin/env node

/**
 * DocuStore Cleanup Analysis Tool using XION
 * 
 * This script provides detailed analysis of documents in the DocuStore
 * and guidance on how to clean them up through the XION app interface.
 * 
 * You're absolutely right - we should use XION's proper tooling instead of raw CosmJS.
 * This script uses the same approach as our existing query tool but focuses on cleanup analysis.
 */

require('dotenv').config({ path: '.env.local' });

console.log('🧹 DocuStore Cleanup Analysis Tool');
console.log('===================================');
console.log('');
console.log('💡 For document deletion, use the web/mobile app with wallet connection,');
console.log('   as XION requires interactive signing through Abstraxion.');
console.log('');
console.log('📋 This script provides analysis of documents that can be cleaned up.');
console.log('');

const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;
const RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443';

if (!CONTRACT_ADDRESS) {
  console.error('❌ EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS not found in environment');
  process.exit(1);
}

async function analyzeCollection() {
  try {
    // Use the same CosmWasmClient approach as our existing docustore-query.js script
    const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
    const client = await CosmWasmClient.connect(RPC_ENDPOINT);
    
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
    console.log(`🌐 RPC: ${RPC_ENDPOINT}`);
    console.log('');
    
    console.log('🔗 Connecting to XION network...');
    
    // Query the bubbles collection
    const result = await client.queryContractSmart(CONTRACT_ADDRESS, {
      Collection: { collection: 'bubbles' }
    });
    
    if (!result?.documents) {
      console.log('❌ No documents found in bubbles collection');
      return;
    }
    
    console.log(`✅ Connected! Analyzing ${result.documents.length} documents...`);
    console.log('');
    
    const analysis = {
      total: result.documents.length,
      valid: [],
      invalid: [],
      byOwner: {}
    };
    
    // Analyze each document
    result.documents.forEach(([key, doc], index) => {
      try {
        const data = JSON.parse(doc.data);
        const hasRequiredFields = data.name && data.createdBy && data.id;
        const owner = doc.owner || 'unknown';
        
        // Track by owner
        if (!analysis.byOwner[owner]) {
          analysis.byOwner[owner] = { valid: 0, invalid: 0, documents: [] };
        }
        
        if (hasRequiredFields) {
          analysis.valid.push({ key, doc, data });
          analysis.byOwner[owner].valid++;
        } else {
          analysis.invalid.push({ 
            key, 
            doc, 
            data, 
            reason: 'Missing required fields (name, createdBy, id)' 
          });
          analysis.byOwner[owner].invalid++;
        }
        
        analysis.byOwner[owner].documents.push({ key, valid: hasRequiredFields });
        
      } catch (parseError) {
        const owner = doc.owner || 'unknown';
        if (!analysis.byOwner[owner]) {
          analysis.byOwner[owner] = { valid: 0, invalid: 0, documents: [] };
        }
        
        analysis.invalid.push({ 
          key, 
          doc, 
          reason: 'Invalid JSON data',
          parseError: parseError.message 
        });
        analysis.byOwner[owner].invalid++;
        analysis.byOwner[owner].documents.push({ key, valid: false });
      }
    });
    
    // Display results
    console.log('📊 ANALYSIS RESULTS');
    console.log('==================');
    console.log(`📄 Total documents: ${analysis.total}`);
    console.log(`✅ Valid documents: ${analysis.valid.length}`);
    console.log(`❌ Invalid documents: ${analysis.invalid.length}`);
    console.log('');
    
    // Show valid documents
    if (analysis.valid.length > 0) {
      console.log('✅ VALID DOCUMENTS:');
      analysis.valid.forEach((item, index) => {
        console.log(`${index + 1}. ${item.key}`);
        console.log(`   Name: ${item.data.name}`);
        console.log(`   Created By: ${item.data.createdBy}`);
        console.log(`   Owner: ${item.doc.owner}`);
        console.log('');
      });
    }
    
    // Show invalid documents by owner
    console.log('❌ INVALID DOCUMENTS BY OWNER:');
    Object.entries(analysis.byOwner).forEach(([owner, stats]) => {
      if (stats.invalid > 0) {
        console.log(`\n👤 Owner: ${owner}`);
        console.log(`   Invalid documents: ${stats.invalid}`);
        console.log(`   Valid documents: ${stats.valid}`);
        
        const invalidDocs = stats.documents.filter(d => !d.valid);
        invalidDocs.forEach(doc => {
          console.log(`   • ${doc.key}`);
        });
      }
    });
    
    console.log('');
    console.log('🛠️  HOW TO CLEAN UP:');
    console.log('===================');
    console.log('1. 🌐 Open the web app: npm run web');
    console.log('2. 🔑 Connect your XION wallet through Abstraxion');
    console.log('3. 🧹 Use the deleteBubble function from useBubbles hook');
    console.log('4. 📱 Or use the mobile app with the same wallet');
    console.log('');
    console.log('💡 Only document owners can delete their documents.');
    console.log('   The BubbleService automatically handles ownership validation.');
    console.log('');
    console.log('🔧 For programmatic deletion in the app, use:');
    console.log('   const { deleteBubble } = useBubbles();');
    console.log('   await deleteBubble("document_id");');
    console.log('');
    console.log('📚 The refactored BubbleService handles all XION integration properly.');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
}

// Simple command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run cleanup [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('This script analyzes the DocuStore bubbles collection');
    console.log('and provides guidance on cleaning up invalid documents.');
    console.log('');
    console.log('For actual cleanup, use the web/mobile app with XION wallet connection.');
    console.log('The app uses proper XION Abstraxion integration for signing.');
    return;
  }
  
  await analyzeCollection();
}

main().catch(console.error);
