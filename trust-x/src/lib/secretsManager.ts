/**
 * Secrets Manager Library
 * 
 * Unified interface for retrieving secrets from cloud providers:
 * - AWS Secrets Manager
 * - Azure Key Vault
 * - Local .env fallback for development
 * 
 * This module provides runtime secret injection, caching,
 * and graceful fallback mechanisms.
 * 
 * Usage:
 *   import { getSecrets, getSecret } from '@/lib/secretsManager';
 *   
 *   // Get all secrets
 *   const secrets = await getSecrets();
 *   console.log(secrets.DATABASE_URL);
 *   
 *   // Get individual secret
 *   const dbUrl = await getSecret('DATABASE_URL');
 */

import { logger } from './logger';

// AWS SDK imports
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Azure SDK imports
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';

// ============================================================================
// Types
// ============================================================================

export type SecretsProvider = 'aws' | 'azure' | 'local';

export interface SecretConfig {
  provider: SecretsProvider;
  useSecretsManager: boolean;
  
  // AWS configuration
  aws?: {
    region: string;
    secretName: string;
    secretArn?: string;
  };
  
  // Azure configuration
  azure?: {
    vaultUrl: string;
    tenantId: string;
    clientId?: string;
    clientSecret?: string;
  };
}

export interface SecretsCache {
  secrets: Record<string, string>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// ============================================================================
// Configuration
// ============================================================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
let secretsCache: SecretsCache | null = null;

function getSecretsConfig(): SecretConfig {
  const useSecretsManager = process.env.USE_SECRETS_MANAGER === 'true' || 
                           process.env.USE_KEY_VAULT === 'true';
  
  if (!useSecretsManager) {
    return {
      provider: 'local',
      useSecretsManager: false,
    };
  }
  
  // Determine provider
  if (process.env.USE_SECRETS_MANAGER === 'true' || process.env.SECRET_ARN) {
    return {
      provider: 'aws',
      useSecretsManager: true,
      aws: {
        region: process.env.AWS_REGION || 'us-east-1',
        secretName: process.env.SECRET_NAME || 'nextjs/trustx-app-secrets',
        secretArn: process.env.SECRET_ARN,
      },
    };
  }
  
  if (process.env.USE_KEY_VAULT === 'true' || process.env.KEYVAULT_NAME) {
    const vaultName = process.env.KEYVAULT_NAME;
    if (!vaultName) {
      throw new Error('KEYVAULT_NAME is required when USE_KEY_VAULT is true');
    }
    
    return {
      provider: 'azure',
      useSecretsManager: true,
      azure: {
        vaultUrl: `https://${vaultName}.vault.azure.net`,
        tenantId: process.env.AZURE_TENANT_ID || '',
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
    };
  }
  
  return {
    provider: 'local',
    useSecretsManager: false,
  };
}

// ============================================================================
// AWS Secrets Manager
// ============================================================================

let awsSecretsClient: SecretsManagerClient | null = null;

function getAWSSecretsClient(): SecretsManagerClient {
  if (awsSecretsClient) return awsSecretsClient;
  
  const config = getSecretsConfig();
  if (!config.aws) {
    throw new Error('AWS Secrets Manager configuration not found');
  }
  
  awsSecretsClient = new SecretsManagerClient({
    region: config.aws.region,
  });
  
  logger.info('AWS Secrets Manager client initialized', {
    region: config.aws.region,
    secretName: config.aws.secretName,
  });
  
  return awsSecretsClient;
}

async function getAWSSecrets(): Promise<Record<string, string>> {
  const config = getSecretsConfig();
  if (!config.aws) {
    throw new Error('AWS configuration not found');
  }
  
  const client = getAWSSecretsClient();
  const secretId = config.aws.secretArn || config.aws.secretName;
  
  try {
    logger.info('Retrieving secrets from AWS Secrets Manager', { secretId });
    
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });
    
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }
    
    const secrets = JSON.parse(response.SecretString);
    
    logger.info('Successfully retrieved secrets from AWS', {
      secretCount: Object.keys(secrets).length,
    });
    
    return secrets;
  } catch (error: any) {
    logger.error('Failed to retrieve secrets from AWS Secrets Manager', {
      error: error.message,
      secretId,
    });
    throw error;
  }
}

// ============================================================================
// Azure Key Vault
// ============================================================================

let azureSecretClient: SecretClient | null = null;

function getAzureSecretClient(): SecretClient {
  if (azureSecretClient) return azureSecretClient;
  
  const config = getSecretsConfig();
  if (!config.azure) {
    throw new Error('Azure Key Vault configuration not found');
  }
  
  let credential;
  
  // Use service principal if credentials provided
  if (config.azure.clientId && config.azure.clientSecret && config.azure.tenantId) {
    credential = new ClientSecretCredential(
      config.azure.tenantId,
      config.azure.clientId,
      config.azure.clientSecret
    );
    logger.info('Using Azure service principal authentication');
  } else {
    // Use Managed Identity (recommended for production)
    credential = new DefaultAzureCredential();
    logger.info('Using Azure Managed Identity authentication');
  }
  
  azureSecretClient = new SecretClient(config.azure.vaultUrl, credential);
  
  logger.info('Azure Key Vault client initialized', {
    vaultUrl: config.azure.vaultUrl,
  });
  
  return azureSecretClient;
}

async function getAzureSecrets(): Promise<Record<string, string>> {
  const client = getAzureSecretClient();
  const secrets: Record<string, string> = {};
  
  try {
    logger.info('Retrieving secrets from Azure Key Vault');
    
    // List all secrets and retrieve their values
    const secretsIterator = client.listPropertiesOfSecrets();
    
    const retrievalPromises = [];
    for await (const secretProperties of secretsIterator) {
      if (secretProperties.enabled && secretProperties.name) {
        retrievalPromises.push(
          client.getSecret(secretProperties.name).then(secret => {
            if (secret.value) {
              // Convert Azure Key Vault naming (hyphen) back to env format (underscore)
              const envKey = secretProperties.name.replace(/-/g, '_').toUpperCase();
              secrets[envKey] = secret.value;
            }
          })
        );
      }
    }
    
    await Promise.all(retrievalPromises);
    
    logger.info('Successfully retrieved secrets from Azure', {
      secretCount: Object.keys(secrets).length,
    });
    
    return secrets;
  } catch (error: any) {
    logger.error('Failed to retrieve secrets from Azure Key Vault', {
      error: error.message,
    });
    throw error;
  }
}

// ============================================================================
// Local Environment (Development)
// ============================================================================

function getLocalSecrets(): Record<string, string> {
  logger.info('Using local environment variables (development mode)');
  
  // Return all environment variables
  return process.env as Record<string, string>;
}

// ============================================================================
// Unified Interface
// ============================================================================

/**
 * Retrieve all secrets from configured provider with caching
 */
export async function getSecrets(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const config = getSecretsConfig();
  
  // Check cache
  if (!forceRefresh && secretsCache && Date.now() - secretsCache.timestamp < secretsCache.ttl) {
    logger.debug('Returning cached secrets');
    return secretsCache.secrets;
  }
  
  let secrets: Record<string, string>;
  
  try {
    switch (config.provider) {
      case 'aws':
        secrets = await getAWSSecrets();
        break;
      
      case 'azure':
        secrets = await getAzureSecrets();
        break;
      
      case 'local':
      default:
        secrets = getLocalSecrets();
        break;
    }
    
    // Update cache
    secretsCache = {
      secrets,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };
    
    logger.info('Secrets loaded successfully', {
      provider: config.provider,
      secretCount: Object.keys(secrets).length,
      cached: true,
    });
    
    return secrets;
  } catch (error: any) {
    logger.error('Failed to retrieve secrets, falling back to local env', {
      provider: config.provider,
      error: error.message,
    });
    
    // Fallback to local environment variables
    return getLocalSecrets();
  }
}

/**
 * Retrieve a single secret by key
 */
export async function getSecret(key: string): Promise<string | undefined> {
  const secrets = await getSecrets();
  return secrets[key];
}

/**
 * Check if secrets manager is configured
 */
export function isSecretsManagerConfigured(): boolean {
  const config = getSecretsConfig();
  return config.useSecretsManager;
}

/**
 * Get secrets provider information
 */
export function getSecretsProviderInfo() {
  const config = getSecretsConfig();
  
  return {
    provider: config.provider,
    useSecretsManager: config.useSecretsManager,
    configured: config.useSecretsManager,
    cacheEnabled: secretsCache !== null,
    cacheTTL: CACHE_TTL / 1000, // seconds
  };
}

/**
 * Clear secrets cache (useful for testing or forced refresh)
 */
export function clearSecretsCache(): void {
  secretsCache = null;
  logger.info('Secrets cache cleared');
}

/**
 * Initialize secrets at application startup
 * This preloads secrets into cache for faster subsequent access
 */
export async function initializeSecrets(): Promise<void> {
  try {
    logger.info('Initializing secrets manager...');
    await getSecrets(true); // Force refresh
    logger.info('Secrets manager initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize secrets manager', {
      error: error.message,
    });
    throw error;
  }
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkSecretsHealth(): Promise<{
  healthy: boolean;
  provider: SecretsProvider;
  configured: boolean;
  message: string;
  details?: any;
}> {
  const config = getSecretsConfig();
  
  if (!config.useSecretsManager) {
    return {
      healthy: true,
      provider: config.provider,
      configured: false,
      message: 'Using local environment variables (development mode)',
    };
  }
  
  try {
    const startTime = Date.now();
    await getSecrets(true); // Force refresh to test connection
    const duration = Date.now() - startTime;
    
    return {
      healthy: true,
      provider: config.provider,
      configured: true,
      message: `Secrets retrieved successfully from ${config.provider}`,
      details: {
        retrievalTime: `${duration}ms`,
        cached: secretsCache !== null,
      },
    };
  } catch (error: any) {
    return {
      healthy: false,
      provider: config.provider,
      configured: true,
      message: `Failed to retrieve secrets: ${error.message}`,
      details: {
        error: error.message,
      },
    };
  }
}

// Export config function for debugging
export { getSecretsConfig };
