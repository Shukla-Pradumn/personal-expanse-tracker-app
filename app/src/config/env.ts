import Constants from 'expo-constants';

const normalizeUrl = (value?: string | null) =>
  String(value || '')
    .trim()
    .replace(/\/+$/, '');

const getExtraApiBaseUrl = () => {
  const expoConfigExtra = (Constants.expoConfig?.extra || {}) as Record<
    string,
    unknown
  >;
  const manifestExtra =
    ((Constants as any).manifest2?.extra as Record<string, unknown>) || {};

  return (
    expoConfigExtra.EXPO_PUBLIC_API_BASE_URL ||
    expoConfigExtra.apiBaseUrl ||
    manifestExtra.EXPO_PUBLIC_API_BASE_URL ||
    manifestExtra.apiBaseUrl
  );
};

export const getApiBaseUrl = () =>
  normalizeUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      (getExtraApiBaseUrl() as string | undefined),
  );
