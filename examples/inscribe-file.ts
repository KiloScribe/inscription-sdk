import { InscriptionSDK } from '../src/inscription-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define interface for progress data to avoid using 'any' type
interface ProgressData {
  stage: 'preparing' | 'submitting' | 'confirming' | 'completed' | 'verifying';
  message: string;
  progressPercent?: number;
  details?: {
    status?: string;
    messagesProcessed?: number;
    maxMessages?: number;
    messageCount?: number;
    completed?: boolean;
    confirmedMessages?: boolean;
    currentAttempt?: number;
    maxAttempts?: number;
    [key: string]: any;
  };
}

function createProgressBar(percent: number, length: number = 20): string {
  const filled = Math.floor((percent / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function inscribeFile() {
  // Initialize SDK with config from .env
  const sdk = new InscriptionSDK(sdkConfig);

  // Read image file and convert to base64
  const moonscapeImage = join(__dirname, 'assets', 'moonscape.png');
  const base64MoonscapeImage = readFileSync(moonscapeImage).toString('base64');

  const progressCallback = (progressData: ProgressData) => {
    const timestamp = new Date().toISOString();
    const stage = progressData.stage;
    const message = progressData.message;
    const percent = progressData.progressPercent || 0;
    const details = progressData.details || {};

    const progressBar = createProgressBar(percent);

    console.log(`[${timestamp}] ${stage.toUpperCase()}: ${message}`);

    const relevantDetails = {
      status: details.status,
      messages: details.messageCount || details.messagesProcessed,
      maxMessages: details.maxMessages,
      completed: details.completed,
      confirmedMessages: details.confirmedMessages,
      attempt: details.currentAttempt,
      maxAttempts: details.maxAttempts,
    };

    let progressInfo = `${Math.round(percent)}%`;
    if (details.messageCount && details.maxMessages) {
      progressInfo += ` (${details.messageCount}/${details.maxMessages} messages)`;
    } else if (details.messageCount) {
      progressInfo += ` (${details.messageCount} messages)`;
    }

    console.log(`Progress: ${progressBar} ${progressInfo}`);
    console.log('Details:', JSON.stringify(relevantDetails, null, 2));
    console.log('-'.repeat(50));
  };

  try {
    const config = {
      file: {
        type: 'base64' as const,
        base64: base64MoonscapeImage,
        fileName: 'moonscape.ico',
      },
      holderId: inscriptionConfig.holderId,
      mode: 'file' as const,
      network: sdkConfig.network,
      description: 'Example inscription with progress tracking',
    };

    console.log('About to inscribe:', config.file.fileName);

    // Start inscription and execute transaction
    const result = await sdk.inscribeAndExecute(config, hederaConfig);
    console.log('Inscription started:', result);

    console.log('Waiting for inscription to complete...');

    const status = await sdk.waitForInscription(
      result.jobId,
      100,
      10000,
      true,
      progressCallback
    );

    console.log('\nFinal inscription status:', status);

    if (status.topic_id) {
      console.log(`\nSuccessfully inscribed with topic ID: ${status.topic_id}`);
      console.log(
        `View your inscription at: https://hashscan.io/${sdkConfig.network}/topic/${status.topic_id}`
      );
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the example
inscribeFile().catch(console.error);
