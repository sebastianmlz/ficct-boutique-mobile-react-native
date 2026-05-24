import { gql } from '@apollo/client';

export const REGISTER_PUSH_TOKEN = gql`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input) {
      id
      token
      platform
      isActive
      lastSeenAt
    }
  }
`;

export const UNREGISTER_PUSH_TOKEN = gql`
  mutation UnregisterPushToken($token: String!) {
    unregisterPushToken(token: $token)
  }
`;

export const MY_PUSH_TOKENS = gql`
  query MyPushTokens {
    myPushTokens {
      id
      token
      platform
      deviceId
      isActive
      lastSeenAt
      createdAt
    }
  }
`;
