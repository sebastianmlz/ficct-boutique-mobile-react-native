import Constants from 'expo-constants';

type Extra = {
  graphqlUrl?: string;
  aiApiUrl?: string;
};

const extra: Extra = (Constants.expoConfig?.extra as Extra) ?? {};

export const env = {
  graphqlUrl:
    process.env.EXPO_PUBLIC_GRAPHQL_URL ?? extra.graphqlUrl ?? 'http://10.0.2.2:8080/graphql',
  aiApiUrl: process.env.EXPO_PUBLIC_AI_API_URL ?? extra.aiApiUrl ?? 'http://10.0.2.2:8000/api/v1',
};
