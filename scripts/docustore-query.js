#!/usr/bin/env node

/**
 * DocuStore Contract Interrogation Script
 * 
 * This script allows you to query the DocuStore contract for various information
 * such as collections, documents, user data, and contract state.
 */

const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

// Configuration
const RPC_ENDPOINT = process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443';
const CONTRACT_ADDRESS = process.env.EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  console.error('❌ EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS not found in environment');
  process.exit(1);
}

console.log('🔗 DocuStore Contract Interrogation Tool');
console.log('==========================================');
console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
console.log(`🌐 RPC: ${RPC_ENDPOINT}`);
console.log('');

class DocuStoreQuery {
  constructor(client, contractAddress) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  /**
   * Get contract information
   */
  async getContractInfo() {
    try {
      const info = await this.client.getContract(this.contractAddress);
      console.log('📋 Contract Info:');
      console.log(JSON.stringify(info, null, 2));
      return info;
    } catch (error) {
      console.error('❌ Error getting contract info:', error.message);
      return null;
    }
  }

  /**
   * Query all collections in the contract
   */
  async queryCollections() {
    try {
      console.log('📚 Querying collections...');
      
      // Try to get all collections (this might not be directly supported)
      // We'll try a few different query methods
      
      const queries = [
        { Collections: {} },
        { AllCollections: {} },
        { ListCollections: {} }
      ];

      for (const query of queries) {
        try {
          const result = await this.client.queryContractSmart(this.contractAddress, query);
          console.log(`✅ Query ${Object.keys(query)[0]} successful:`, result);
          return result;
        } catch (error) {
          console.log(`⚠️  Query ${Object.keys(query)[0]} failed:`, error.message);
        }
      }
      
      console.log('ℹ️  Direct collection queries not supported. Try querying specific collections like "bubbles".');
      return null;
    } catch (error) {
      console.error('❌ Error querying collections:', error.message);
      return null;
    }
  }

  /**
   * Query documents in a specific collection
   */
  async queryCollection(collection) {
    try {
      console.log(`📄 Querying collection: ${collection}`);
      
      const queries = [
        { Collection: { collection } },
        { GetCollection: { collection } },
        { ListDocuments: { collection } }
      ];

      for (const query of queries) {
        try {
          const result = await this.client.queryContractSmart(this.contractAddress, query);
          console.log(`✅ Collection "${collection}" found with ${result.documents?.length || 0} documents:`);
          
          if (result.documents && Array.isArray(result.documents)) {
            console.log('\n📄 Documents in collection:');
            result.documents.forEach(([key, doc], index) => {
              console.log(`\n${index + 1}. Document ID: ${key}`);
              try {
                const data = JSON.parse(doc.data);
                console.log(`   Name: ${data.name || 'N/A'}`);
                console.log(`   Created By: ${data.createdBy || 'N/A'}`);
                console.log(`   Created At: ${data.createdAt || 'N/A'}`);
                console.log(`   Description: ${data.description || 'N/A'}`);
                console.log(`   Member Count: ${data.memberCount || 'N/A'}`);
              } catch (parseError) {
                console.log(`   Raw data: ${doc.data}`);
                console.log(`   Parse error: ${parseError.message}`);
              }
            });
          }
          
          return result;
        } catch (error) {
          console.log(`⚠️  Query ${Object.keys(query)[0]} failed:`, error.message);
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error querying collection ${collection}:`, error.message);
      return null;
    }
  }

  /**
   * Query documents for a specific user
   */
  async queryUserDocuments(owner, collection = null) {
    try {
      console.log(`👤 Querying documents for user: ${owner}`);
      if (collection) {
        console.log(`📂 In collection: ${collection}`);
      }

      const query = collection 
        ? { UserDocuments: { owner, collection } }
        : { UserDocuments: { owner } };

      const result = await this.client.queryContractSmart(this.contractAddress, query);
      console.log(`✅ User documents:`, result);
      
      if (result.documents && Array.isArray(result.documents)) {
        console.log(`📊 Found ${result.documents.length} documents`);
        result.documents.forEach(([key, doc], index) => {
          console.log(`\n📄 Document ${index + 1}: ${key}`);
          try {
            const data = JSON.parse(doc.data);
            console.log('   Data:', JSON.stringify(data, null, 2));
          } catch (e) {
            console.log('   Raw data:', doc.data);
          }
          console.log('   Metadata:', doc);
        });
      }

      return result;
    } catch (error) {
      console.error(`❌ Error querying user documents:`, error.message);
      return null;
    }
  }

  /**
   * Query a specific document
   */
  async queryDocument(collection, document) {
    try {
      console.log(`📄 Querying document: ${document} in collection: ${collection}`);
      
      const query = { Get: { collection, document } };
      const result = await this.client.queryContractSmart(this.contractAddress, query);
      
      console.log(`✅ Document data:`, result);
      
      if (result.data) {
        try {
          const parsedData = JSON.parse(result.data);
          console.log('📋 Parsed data:', JSON.stringify(parsedData, null, 2));
        } catch (e) {
          console.log('📋 Raw data:', result.data);
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Error querying document:`, error.message);
      return null;
    }
  }

  /**
   * Query contract state/config
   */
  async queryState() {
    try {
      console.log('⚙️  Querying contract state...');
      
      const queries = [
        { State: {} },
        { Config: {} },
        { Info: {} },
        { GetConfig: {} }
      ];

      for (const query of queries) {
        try {
          const result = await this.client.queryContractSmart(this.contractAddress, query);
          console.log(`✅ ${Object.keys(query)[0]}:`, result);
        } catch (error) {
          console.log(`⚠️  Query ${Object.keys(query)[0]} failed:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error querying state:', error.message);
    }
  }

  /**
   * Delete a specific document (requires signing client)
   */
  async deleteDocument(collection, document, signerAddress, signingClient) {
    try {
      console.log(`🗑️  Attempting to delete document: ${document} from collection: ${collection}`);
      
      if (!signingClient) {
        console.error('❌ Signing client required for deletion');
        return false;
      }

      if (!signerAddress) {
        console.error('❌ Signer address required for deletion');
        return false;
      }

      // First check if document exists and get owner info
      const existing = await this.queryDocument(collection, document);
      if (!existing || !existing.exists) {
        console.log('⚠️  Document does not exist');
        return false;
      }

      const owner = existing.document.owner;
      console.log(`👤 Document owner: ${owner}`);
      console.log(`🔑 Attempting deletion as: ${signerAddress}`);

      if (owner !== signerAddress) {
        console.log('❌ Cannot delete: You are not the owner of this document');
        return false;
      }

      // Attempt deletion
      const result = await signingClient.execute(
        signerAddress,
        this.contractAddress,
        {
          Delete: {
            collection,
            document
          }
        },
        "auto"
      );

      console.log('✅ Document deleted successfully!');
      console.log('📄 Transaction result:', result);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting document:`, error.message);
      return false;
    }
  }

  /**
   * Bulk cleanup of invalid documents (interactive)
   */
  async cleanupCollection(collection, signerAddress, signingClient) {
    try {
      console.log(`🧹 Starting cleanup of collection: ${collection}`);
      
      // First, get all documents in the collection
      const collectionData = await this.queryCollection(collection);
      if (!collectionData?.documents) {
        console.log('❌ No documents found in collection');
        return;
      }

      console.log(`📊 Found ${collectionData.documents.length} documents to analyze`);
      
      const invalidDocuments = [];
      const validDocuments = [];
      const ownedDocuments = [];

      // Analyze each document
      for (const [key, doc] of collectionData.documents) {
        try {
          const data = JSON.parse(doc.data);
          const hasRequiredFields = data.name && data.createdBy && data.id;
          const isOwned = doc.owner === signerAddress;
          
          if (!hasRequiredFields) {
            invalidDocuments.push({ key, doc, reason: 'Missing required fields' });
          } else {
            validDocuments.push({ key, doc });
          }

          if (isOwned) {
            ownedDocuments.push({ key, doc });
          }

        } catch (parseError) {
          invalidDocuments.push({ key, doc, reason: 'Invalid JSON data' });
        }
      }

      console.log('\n📋 Cleanup Analysis:');
      console.log(`✅ Valid documents: ${validDocuments.length}`);
      console.log(`❌ Invalid documents: ${invalidDocuments.length}`);
      console.log(`🔑 Documents you own: ${ownedDocuments.length}`);

      // Show invalid documents that can be deleted
      const deletableInvalid = invalidDocuments.filter(item => 
        ownedDocuments.some(owned => owned.key === item.key)
      );

      if (deletableInvalid.length > 0) {
        console.log(`\n🗑️  Invalid documents you can delete: ${deletableInvalid.length}`);
        deletableInvalid.forEach((item, index) => {
          console.log(`${index + 1}. ${item.key} - ${item.reason}`);
        });
        
        return {
          total: collectionData.documents.length,
          valid: validDocuments.length,
          invalid: invalidDocuments.length,
          owned: ownedDocuments.length,
          deletable: deletableInvalid.length,
          deletableList: deletableInvalid
        };
      } else {
        console.log('\n✅ No invalid documents found that you can delete');
        return {
          total: collectionData.documents.length,
          valid: validDocuments.length,
          invalid: invalidDocuments.length,
          owned: ownedDocuments.length,
          deletable: 0,
          deletableList: []
        };
      }

    } catch (error) {
      console.error('❌ Error during cleanup analysis:', error.message);
      return null;
    }
  }
  async runInteractive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    console.log('\n🔍 Interactive Query Mode');
    console.log('Available commands:');
    console.log('1. info - Get contract information');
    console.log('2. collections - Query all collections');
    console.log('3. collection <name> - Query specific collection');
    console.log('4. user <address> [collection] - Query user documents');
    console.log('5. document <collection> <document> - Query specific document');
    console.log('6. state - Query contract state');
    console.log('7. bubbles <address> - Quick query for user bubbles');
    console.log('8. cleanup <collection> - Analyze collection for cleanup (read-only)');
    console.log('9. exit - Exit interactive mode');
    console.log('');

    while (true) {
      try {
        const input = await question('docustore> ');
        const [command, ...args] = input.trim().split(' ');

        switch (command.toLowerCase()) {
          case 'info':
            await this.getContractInfo();
            break;
          
          case 'collections':
            await this.queryCollections();
            break;
          
          case 'collection':
            if (args[0]) {
              await this.queryCollection(args[0]);
            } else {
              console.log('❌ Please provide collection name: collection <name>');
            }
            break;
          
          case 'user':
            if (args[0]) {
              await this.queryUserDocuments(args[0], args[1]);
            } else {
              console.log('❌ Please provide user address: user <address> [collection]');
            }
            break;
          
          case 'document':
            if (args[0] && args[1]) {
              await this.queryDocument(args[0], args[1]);
            } else {
              console.log('❌ Please provide collection and document: document <collection> <document>');
            }
            break;
          
          case 'state':
            await this.queryState();
            break;
          
          case 'bubbles':
            if (args[0]) {
              await this.queryUserDocuments(args[0], 'bubbles');
            } else {
              console.log('❌ Please provide user address: bubbles <address>');
            }
            break;
          
          case 'cleanup':
            if (args[0]) {
              await this.cleanupCollection(args[0]);
            } else {
              console.log('❌ Please provide collection name: cleanup <collection>');
            }
            break;
          
          case 'exit':
            console.log('👋 Goodbye!');
            rl.close();
            return;
          
          default:
            console.log('❌ Unknown command. Type a valid command or "exit" to quit.');
        }
        
        console.log(''); // Empty line for readability
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    }
  }
}

async function main() {
  try {
    console.log('🔗 Connecting to XION network...');
    const client = await CosmWasmClient.connect(RPC_ENDPOINT);
    console.log('✅ Connected successfully!');
    
    const docuStore = new DocuStoreQuery(client, CONTRACT_ADDRESS);
    
    // Check if command line arguments were provided
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // No arguments, run interactive mode
      await docuStore.runInteractive();
    } else {
      // Parse command line arguments
      const [command, ...params] = args;
      
      switch (command.toLowerCase()) {
        case 'info':
          await docuStore.getContractInfo();
          break;
        
        case 'collections':
          await docuStore.queryCollections();
          break;
        
        case 'collection':
          if (params[0]) {
            await docuStore.queryCollection(params[0]);
          } else {
            console.log('❌ Please provide collection name');
          }
          break;
        
        case 'user':
          if (params[0]) {
            await docuStore.queryUserDocuments(params[0], params[1]);
          } else {
            console.log('❌ Please provide user address');
          }
          break;
        
        case 'document':
          if (params[0] && params[1]) {
            await docuStore.queryDocument(params[0], params[1]);
          } else {
            console.log('❌ Please provide collection and document names');
          }
          break;
        
        case 'state':
          await docuStore.queryState();
          break;
        
        case 'bubbles':
          if (params[0]) {
            await docuStore.queryUserDocuments(params[0], 'bubbles');
          } else {
            console.log('❌ Please provide user address');
          }
          break;
        
        case 'cleanup':
          if (params[0]) {
            await docuStore.cleanupCollection(params[0]);
          } else {
            console.log('❌ Please provide collection name');
          }
          break;
        
        default:
          console.log('❌ Unknown command:', command);
          console.log('Available commands: info, collections, collection, user, document, state, bubbles');
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

main().catch(console.error);
