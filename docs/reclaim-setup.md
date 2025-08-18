# ReclaimProtocol Setup Guide

This guide walks you through setting up ReclaimProtocol for zk proof verification in your bubble app.

## Prerequisites

1. **ReclaimProtocol Account**: Sign up at [ReclaimProtocol](https://docs.reclaimprotocol.org/)
2. **App Registration**: Create a new app in the ReclaimProtocol dashboard
3. **Provider Configuration**: Set up verification providers (Twitter, GitHub, Google)

## Step 1: Get API Credentials

1. Visit the [ReclaimProtocol Dashboard](https://docs.reclaimprotocol.org/api-key)
2. Create a new application
3. Note down your:
   - **App ID**: Used to identify your application
   - **App Secret**: Used for authentication

## Step 2: Configure Providers

In your ReclaimProtocol dashboard, configure the verification providers you want to support:

### Twitter Provider
- Provider ID: `twitter-login` (example)
- Configure Twitter OAuth settings
- Set up required scopes

### GitHub Provider  
- Provider ID: `github-login` (example)
- Configure GitHub OAuth app
- Set up required permissions

### Google Provider
- Provider ID: `google-login` (example)
- Configure Google OAuth 2.0
- Set up required scopes

## Step 3: Environment Variables

Add these variables to your `.env` file:

```bash
# ReclaimProtocol Configuration
EXPO_PUBLIC_RECLAIM_APP_ID=your_app_id_here
EXPO_PUBLIC_RECLAIM_APP_SECRET=your_app_secret_here
```

## Step 4: Update Provider IDs

Update the provider configuration in `/services/verificationService.native.ts`:

```typescript
private getProviderConfig(provider: string): { providerId: string } | null {
  const providers: Record<string, { providerId: string }> = {
    twitter: {
      providerId: 'your_actual_twitter_provider_id' // From ReclaimProtocol dashboard
    },
    github: {
      providerId: 'your_actual_github_provider_id' // From ReclaimProtocol dashboard
    },
    google: {
      providerId: 'your_actual_google_provider_id' // From ReclaimProtocol dashboard
    }
  };

  return providers[provider.toLowerCase()] || null;
}
```

## Step 5: Test Configuration

1. Create a test bubble with verification required
2. Try the verification flow
3. Check that proofs are generated and stored correctly

## Troubleshooting

### Common Issues

1. **"ReclaimVerification SDK not installed"**
   - Ensure `@reclaimprotocol/inapp-rn-sdk` is installed
   - Check that you're testing on a physical device (not simulator)

2. **"Invalid App ID or Secret"**
   - Verify your credentials in the environment file
   - Ensure no extra spaces or quotes in the values

3. **"Provider not found"**
   - Check that provider IDs match your dashboard configuration
   - Ensure providers are properly configured in ReclaimProtocol

4. **"Verification failed"**
   - Check network connectivity
   - Verify the provider is working correctly
   - Check ReclaimProtocol dashboard for error logs

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
console.log('ReclaimVerification config:', {
  appId: process.env.EXPO_PUBLIC_RECLAIM_APP_ID,
  hasSecret: !!process.env.EXPO_PUBLIC_RECLAIM_APP_SECRET,
  providerId: providerConfig.providerId
});
```

## Security Notes

1. **Keep secrets secure**: Never commit app secrets to version control
2. **Environment-specific configs**: Use different apps for development/production
3. **Provider permissions**: Only request necessary scopes from providers
4. **Proof validation**: Always validate proofs on your backend

## Support

If you encounter issues:

1. Check the [ReclaimProtocol Documentation](https://docs.reclaimprotocol.org/react-native/usage)
2. Visit their [Telegram Support](https://t.me/protocolreclaim)
3. Review the implementation in this codebase

## Testing Checklist

- [ ] ReclaimProtocol account created
- [ ] App registered and credentials obtained  
- [ ] Providers configured in dashboard
- [ ] Environment variables set
- [ ] Provider IDs updated in code
- [ ] Test verification flow works
- [ ] Proofs stored correctly in DocuStore
- [ ] Access control working as expected
