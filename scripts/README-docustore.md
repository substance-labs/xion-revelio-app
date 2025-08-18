# DocuStore Contract Interrogation Script

This script allows you to query and explore the DocuStore contract on the XION network. It's useful for debugging, data exploration, and understanding what data is stored in your contract.

## Usage

### Quick Commands

```bash
# Get contract information
npm run docustore info

# Query all collections (if supported)
npm run docustore collections

# Query a specific collection
npm run docustore collection bubbles

# Query all documents for a user
npm run docustore user xion1...

# Query user documents in a specific collection
npm run docustore user xion1... bubbles

# Get a specific document
npm run docustore document bubbles bubble_123

# Query contract state
npm run docustore state

# Quick shortcut for user bubbles
npm run docustore bubbles xion1...
```

### Interactive Mode

Run without arguments to enter interactive mode:

```bash
npm run docustore
```

This will start an interactive session where you can run multiple queries:

```
docustore> info
docustore> collections
docustore> user xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r
docustore> bubbles xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r
docustore> exit
```

### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `info` | Get contract information | `npm run docustore info` |
| `collections` | Query all collections | `npm run docustore collections` |
| `collection <name>` | Query specific collection | `npm run docustore collection bubbles` |
| `user <address> [collection]` | Query user documents | `npm run docustore user xion1... bubbles` |
| `document <collection> <document>` | Get specific document | `npm run docustore document bubbles bubble_123` |
| `state` | Query contract state/config | `npm run docustore state` |
| `bubbles <address>` | Quick query for user bubbles | `npm run docustore bubbles xion1...` |

## Examples

### Example 1: Get Contract Info
```bash
$ npm run docustore info

📋 Contract Info:
{
  "address": "xion1svpts9q2ml4ahgc4tuu95w8cqzv988s6mf5mupt5kt56gvdnklks9hzar4",
  "codeId": 1228,
  "creator": "xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r",
  "label": "docustore"
}
```

### Example 2: Query User Bubbles
```bash
$ npm run docustore bubbles xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r

👤 Querying documents for user: xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r
📂 In collection: bubbles
✅ User documents: {...}
📊 Found 2 documents

📄 Document 1: bubble_1703123456789
   Data: {
     "id": "bubble_1703123456789",
     "name": "My First Bubble",
     "description": "A test bubble",
     "verified": false,
     "createdAt": "2023-12-21T10:30:56.789Z",
     "createdBy": "xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r",
     "memberCount": 1
   }
```

### Example 3: Interactive Session
```bash
$ npm run docustore

🔍 Interactive Query Mode
Available commands:
1. info - Get contract information
2. collections - Query all collections
3. collection <name> - Query specific collection
4. user <address> [collection] - Query user documents
5. document <collection> <document> - Query specific document
6. state - Query contract state
7. bubbles <address> - Quick query for user bubbles
8. exit - Exit interactive mode

docustore> user xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r
👤 Querying documents for user: xion1ka5gdcv4m7kfzxkllapqdflenwe0fv8ftm357r
✅ User documents: {...}

docustore> exit
👋 Goodbye!
```

## Configuration

The script reads configuration from your `.env.local` file:

- `EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS` - The DocuStore contract address
- `EXPO_PUBLIC_RPC_ENDPOINT` - The XION RPC endpoint (defaults to testnet)

## Troubleshooting

### Common Issues

1. **Contract address not found**
   - Make sure `EXPO_PUBLIC_DOCUSTORE_CONTRACT_ADDRESS` is set in `.env.local`

2. **Connection failed** 
   - Check your internet connection
   - Verify the RPC endpoint is accessible
   - Try using a different RPC endpoint

3. **Query failed**
   - The contract might not support the specific query method
   - Try different query variations (the script automatically tries multiple formats)

### Debug Mode

For more detailed error information, you can modify the script to enable debug logging or use the interactive mode to test different queries.

## Development

The script is located at `scripts/docustore-query.js` and uses:

- `@cosmjs/cosmwasm-stargate` for blockchain interaction
- `dotenv` for environment variable loading
- `readline` for interactive mode

Feel free to extend the script with additional query methods or customize it for your specific needs!
