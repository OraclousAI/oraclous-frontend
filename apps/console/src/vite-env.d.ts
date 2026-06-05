/// <reference types="vite/client" />

// Typed app env so `import.meta.env.VITE_API_BASE_URL` is a known property
// (not an index-signature access — noPropertyAccessFromIndexSignature).
interface ImportMetaEnv {
  // Base URL of the Application Gateway (single ingress). See .env.example.
  readonly VITE_API_BASE_URL: string;
}
