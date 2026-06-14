// Canonical display labels for OAuth/credential providers. The raw lowercase slug (google, github,
// notion) is what the API and connect() calls use; this is DISPLAY-ONLY — render providerLabel(slug)
// in the UI, but always pass the raw slug to connect()/the gateway. Unknown providers fall back to
// Title-case so a new provider still reads sensibly before it's added here.
const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  notion: 'Notion',
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABEL[provider] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}
