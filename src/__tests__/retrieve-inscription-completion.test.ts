import axios, { type AxiosInstance } from 'axios';
import { InscriptionSDK } from '../inscription-sdk';

jest.mock('axios');

describe('InscriptionSDK completion normalization', () => {
  it('treats status=completed as completed=true in retrieveInscription', async () => {
    const mockClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          id: 'job-1',
          status: 'completed',
          completed: false,
          tx_id: 'tx-1',
          topic_id: '0.0.100',
          jsonTopicId: '0.0.101',
          registryTopicId: '0.0.102',
          mode: 'hashinal-collection',
        },
      }),
    } as AxiosInstance;

    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.create.mockReturnValue(mockClient);

    const sdk = new InscriptionSDK({
      apiKey: 'test-api-key',
      network: 'testnet',
      connectionMode: 'http',
    });

    const result = await sdk.retrieveInscription('0.0.123@456.789');
    expect(result.status).toBe('completed');
    expect(result.completed).toBe(true);
  });

  it('returns successfully from waitForInscription when status=completed (even if completed=false)', async () => {
    const mockClient = {
      get: jest.fn().mockResolvedValue({
        data: {
          id: 'job-2',
          status: 'completed',
          completed: false,
          tx_id: 'tx-2',
          topic_id: '0.0.200',
          jsonTopicId: '0.0.201',
          registryTopicId: '0.0.202',
          mode: 'hashinal-collection',
        },
      }),
    } as AxiosInstance;

    const mockedAxios = axios as jest.Mocked<typeof axios>;
    mockedAxios.create.mockReturnValue(mockClient);

    const sdk = new InscriptionSDK({
      apiKey: 'test-api-key',
      network: 'testnet',
      connectionMode: 'http',
    });

    const result = await sdk.waitForInscription('0.0.123@456.789', 1, 1, true);
    expect(result.status).toBe('completed');
    expect(result.completed).toBe(true);
    expect(mockClient.get).toHaveBeenCalledTimes(1);
  });
});

