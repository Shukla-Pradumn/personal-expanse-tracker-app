import { Amplify } from 'aws-amplify';

const normalizeDomain = (value?: string) =>
  String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^https?:\/?/i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

const normalizeRedirect = (value?: string) => String(value || '').trim();

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
const oauthDomain = normalizeDomain(
  process.env.EXPO_PUBLIC_COGNITO_DOMAIN || process.env.COGNITO_DOMAIN || '',
);
const redirectSignIn = normalizeRedirect(
  process.env.EXPO_PUBLIC_COGNITO_REDIRECT_SIGN_IN ||
    process.env.COGNITO_REDIRECT_SIGN_IN ||
    '',
);
const redirectSignOut = normalizeRedirect(
  process.env.EXPO_PUBLIC_COGNITO_REDIRECT_SIGN_OUT ||
    process.env.COGNITO_REDIRECT_SIGN_OUT ||
    '',
);

const oauthConfig =
  oauthDomain && redirectSignIn && redirectSignOut
    ? {
        domain: oauthDomain,
        scope: ['openid', 'email', 'profile'],
        redirectSignIn,
        redirectSignOut,
        responseType: 'code',
      }
    : undefined;

Amplify.configure({
  Auth: {
    region,
    userPoolId,
    userPoolWebClientId,
    oauth: oauthConfig,
  },
});
