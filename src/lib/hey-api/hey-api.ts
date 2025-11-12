import { BACKEND_URL } from '@env';
import { getIdToken } from '../../services/auth/tokenStorage';
import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = config => {
  if (!config) {
    throw new Error('Config is not provided.');
  }

  console.log('Creating custom client config with provided');
  const backendUrl = BACKEND_URL;
  console.log('BACKEND_URL:', backendUrl);
  if (!backendUrl) {
    throw new Error('Environment variable BACKEND_URL is not set or is empty.');
  }

  return {
    ...config,
    baseUrl: backendUrl,
    headers: {
      ...config.headers,
      Accept: 'application/json',
    },
    // Use a custom fetch that handles auth properly
    fetch: async (input, init) => {
      // Handle both string URL and Request object
      let url: string;
      let options: RequestInit = {};

      if (typeof input === 'string') {
        url = input;
        options = init || {};
      } else if (input instanceof Request) {
        url = input.url;
        options = {
          method: input.method,
          headers: input.headers,
          ...init,
        };
      } else {
        throw new Error('Invalid input to fetch');
      }

      const executeRequest = async (token?: string | null) => {
        const headers = {
          ...options.headers,
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        return fetch(url, {
          ...options,
          headers,
        });
      };

      let idToken: string | null = null;
      try {
        idToken = await getIdToken();
      } catch (tokenError) {
        console.error('Error retrieving ID token:', tokenError);
      }

      let response = await executeRequest(idToken);

      if (response.status === 401) {
        try {
          const refreshedToken = await getIdToken({ forceRefresh: true });
          if (refreshedToken && refreshedToken !== idToken) {
            response = await executeRequest(refreshedToken);
          }
        } catch (refreshError) {
          console.error(
            'Failed to refresh ID token after 401 response:',
            refreshError
          );
        }
      }

      return response;
    },
  };
};
