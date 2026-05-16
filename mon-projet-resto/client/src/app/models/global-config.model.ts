export interface FeatureFlagVariant {
  name: string;
  weight: number;
  payload?: Record<string, unknown>;
}

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  forceDefault: boolean;
  defaultVariant: string;
  variants: FeatureFlagVariant[];
}

export interface GlobalConfig {
  scope: 'global';
  flags: FeatureFlag[];
  globalBannerText: string;
  globalBannerEnabled: boolean;
}
