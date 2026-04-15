import { Amplify } from 'aws-amplify';

const region =
  process.env.EXPO_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';
const userPoolId =
  process.env.EXPO_PUBLIC_AWS_USER_POOL_ID ||
  process.env.AWS_USER_POOL_ID ||
  'ap-south-1_mtAI2LLNj';
const userPoolWebClientId =
  process.env.EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID ||
  process.env.AWS_USER_POOL_CLIENT_ID ||
  '6fsf4rjptgcphmb7kkekhp1634';

Amplify.configure({
  Auth: {
    region,
    userPoolId,
    userPoolWebClientId,
  },
});
