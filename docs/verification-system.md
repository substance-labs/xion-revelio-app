# ZK Proof Verification with ReclaimProtocol

This implementation adds zero-knowledge proof verification to bubble access control using ReclaimProtocol.

## Overview

The verification system allows bubbles to require users to prove their identity through various providers (Twitter, GitHub, Google) without exposing personal data. This is achieved through zero-knowledge proofs.

## Architecture

### Core Components

1. **Types** (`types/bubble.ts`)
   - `ReclaimProof`: ZK proof structure from ReclaimProtocol
   - `BubbleVerification`: User verification record for a bubble
   - `BubbleMetadata`: Extended with verification settings
   - `CreateBubbleFormData`: Includes verification configuration

2. **Services**
   - `VerificationService`: Base verification service
   - `NativeVerificationService`: React Native implementation
   - `WebVerificationService`: Web implementation (placeholder)

3. **Components**
   - `VerificationComponent`: UI for user verification
   - `CreateBubbleWizard`: Extended with verification settings

4. **Hooks**
   - `useVerification`: Hook for verification operations

## Usage

### Creating a Bubble with Verification

```typescript
const bubbleData: CreateBubbleFormData = {
  name: "Verified Community",
  description: "A community for verified users",
  domain: "company.com",
  permissions: {
    read: 'verified',  // Only verified users can read
    write: 'verified' // Only verified users can write
  },
  verification: {
    required: true,
    providers: ['twitter', 'github'] // Available providers
  }
};
```

### Access Control Levels

#### Read Permissions
- `'public'`: Anyone can read posts
- `'verified'`: Only verified users can read posts

#### Write Permissions
- `'public'`: Anyone can write posts (if authenticated)
- `'admins'`: Only bubble creators can write posts
- `'verified'`: Only verified users can write posts

### Verification Flow

1. User attempts to access a bubble requiring verification
2. System checks if user is already verified for that bubble
3. If not verified, `VerificationComponent` is shown
4. User selects a verification provider (Twitter, GitHub, etc.)
5. ReclaimProtocol handles the verification process
6. On success, proof is stored in the bubble document
7. User gains access based on bubble permissions

### Platform Support

#### Native (React Native)
- Full ReclaimProtocol integration
- Supports all verification providers
- Real ZK proof generation and verification

#### Web
- Currently not supported (placeholder implementation)
- Shows message directing users to mobile app
- Can be extended when ReclaimProtocol web SDK is available

## Implementation Details

### Proof Storage

Verification proofs are stored in the DocuStore contract within each bubble document:

```typescript
{
  verifications: [
    {
      walletAddress: "xion1...",
      proof: {
        claimInfo: {
          provider: "twitter",
          parameters: "...",
          context: "..."
        },
        signedClaim: {
          claim: {
            identifier: "...",
            owner: "...",
            epoch: 123456,
            timestampS: 1234567890
          },
          signatures: ["..."]
        }
      },
      verifiedAt: "2025-01-01T00:00:00Z",
      provider: "twitter"
    }
  ]
}
```

### Access Control Check

```typescript
const { checkAccess } = useVerification();

const canRead = await checkAccess(bubbleId, 'read');
const canWrite = await checkAccess(bubbleId, 'write');
```

### ReclaimProtocol Integration Details

The implementation follows the official ReclaimProtocol React Native SDK documentation:

```typescript
import { ReclaimVerification } from '@reclaimprotocol/inapp-rn-sdk';

// Initialize verification
const reclaimVerification = new ReclaimVerification();

// Start verification
const verificationResult = await reclaimVerification.startVerification({
  appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID ?? '',
  secret: process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET ?? '',
  providerId: 'twitter-login', // or github-login, google-login, etc.
});

// Extract proof data for DocuStore storage
const claimInfo = {
  provider: verificationResult.proofs[0].claimData.provider,
  parameters: verificationResult.proofs[0].claimData.parameters,
  context: verificationResult.proofs[0].claimData.context,
};

const signedClaim = {
  claim: {
    identifier: verificationResult.proofs[0].claimData.identifier,
    owner: verificationResult.proofs[0].claimData.owner,
    epoch: verificationResult.proofs[0].claimData.epoch,
    timestampS: verificationResult.proofs[0].claimData.timestampS,
  },
  signatures: verificationResult.proofs[0].signatures,
};

// Store in DocuStore
const executeMsg = {
  update: {
    value: {
      proof: {
        claimInfo: claimInfo,
        signedClaim: signedClaim,
      },
    },
  },
};
```

### Exception Handling

The implementation includes proper exception handling as per the official documentation:

```typescript
try {
  const verificationResult = await reclaimVerification.startVerification({...});
} catch (error) {
  if (error.constructor.name === 'ReclaimVerificationException') {
    switch (error.type) {
      case 'Cancelled':
        // User cancelled verification
        break;
      case 'Dismissed':
        // User dismissed verification
        break;
      case 'SessionExpired':
        // Verification session expired
        break;
      case 'Failed':
      default:
        // Verification failed
        break;
    }
  }
}
```

### Verification Status

```typescript
const { checkUserVerification } = useVerification();

const isVerified = await checkUserVerification(bubbleId);
```

## Environment Configuration

The verification system requires the following environment variables:

```bash
# DocuStore Configuration
EXPO_PUBLIC_CONTRACT_ADDRESS=xion1...
EXPO_PUBLIC_BUBBLES_COLLECTION=bubbles

# ReclaimProtocol Configuration
EXPO_PUBLIC_RECLAIM_APP_ID=your_reclaim_app_id
EXPO_PUBLIC_RECLAIM_APP_SECRET=your_reclaim_app_secret
```

To get your ReclaimProtocol app credentials:
1. Visit [ReclaimProtocol Dashboard](https://docs.reclaimprotocol.org/api-key)
2. Create a new app
3. Copy the App ID and App Secret
4. Configure providers (Twitter, GitHub, Google) in the dashboard

## Security Considerations

1. **Zero-Knowledge**: No personal data is exposed, only cryptographic proofs
2. **Provider Agnostic**: Supports multiple verification providers
3. **On-Chain Storage**: Proofs are stored securely in DocuStore
4. **Tamper Proof**: Cryptographic signatures prevent proof manipulation

## Future Enhancements

1. **Web Support**: Implement when ReclaimProtocol web SDK is available
2. **Custom Providers**: Add support for custom verification providers
3. **Batch Verification**: Allow users to verify for multiple bubbles at once
4. **Verification Expiry**: Add time-based verification expiration
5. **Reputation System**: Build reputation scores based on verifications

## Error Handling

The system gracefully handles various error scenarios:

- Network connectivity issues
- Invalid proofs
- Unsupported platforms
- Missing credentials
- Contract interaction failures

## Testing

To test the verification system:

1. Create a bubble with verification required
2. Try accessing without verification (should show VerificationComponent)
3. Complete verification process
4. Verify access is granted after successful verification
5. Test on different platforms (native vs web)

## Provider Configuration

Each verification provider needs specific configuration in `NativeVerificationService`:

```typescript
const providers = {
  twitter: {
    providerId: 'twitter-login',
    secretParams: {
      // Twitter-specific parameters
    }
  },
  github: {
    providerId: 'github-login', 
    secretParams: {
      // GitHub-specific parameters
    }
  }
};
```

Note: You'll need to configure actual provider IDs and parameters based on your ReclaimProtocol setup.
