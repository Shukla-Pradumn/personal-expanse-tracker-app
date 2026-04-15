import { Amplify } from 'aws-amplify';

const region = process.env.EXPO_PUBLIC_AWS_REGION || process.env.AWS_REGION;
const userPoolId =
  process.env.EXPO_PUBLIC_AWS_USER_POOL_ID || process.env.AWS_USER_POOL_ID;
const userPoolWebClientId =
  process.env.EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID ||
  process.env.AWS_USER_POOL_CLIENT_ID;

Amplify.configure({
  Auth: {
    region,
    userPoolId,
    userPoolWebClientId,
  },
});
