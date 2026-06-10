// OHM v1.0 manifest model — the harness definition the console's agent builder authors.
// Bound to the AS-BUILT runtime validator (harness-runtime-service domain/ohm/manifest.py),
// cross-checked against the OHM v1.0 standalone spec and live-verified against the gateway
// (a wrong runtime.entrypoint is rejected 422 with the exact binding rule below).
//
// The manifest is a cross-repo contract (§8): field names here are the wire names (snake_case,
// JSON) because the manifest travels verbatim inside requests — it is a document, not a response
// to be re-mapped.

/** capabilities[].ref: "core/<name>@<version>" or "org:<org-id>/<name>@<version>". Resolved
 * at load time all-or-nothing by slug-matching <name> against registry tool names. */
export interface OhmCapability {
  readonly ref: string;
  /** snake_case, unique within the manifest; tools surface to the loop as "<binding>.<operation>". */
  readonly binding: string;
  /** Reserved keys the runtime consumes: credential_mappings (credential_type -> broker
   * credential UUID) and capability_id (explicit registry row pin). */
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface OhmModel {
  /** "primary" is the role the loop uses by default. */
  readonly role: string;
  /** "<provider>/<model-id>", e.g. "openrouter/meta-llama/llama-3.1-8b-instruct". */
  readonly binding: string;
  /** Only "openai-compatible" is wired in the live client build. */
  readonly protocol_shape: 'native' | 'openai-compatible' | 'gemini-compatible';
  /** In live LLM mode, credential_id (a credential-broker UUID) is required. */
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface OhmPrompt {
  readonly role: string;
  readonly source?: 'inline' | 'asset-ref';
  readonly body?: string;
}

export interface OhmActor {
  readonly role: string;
  readonly kind: 'agent' | 'human';
  /** The workspace role a human task is assigned to. */
  readonly human_role?: string | null;
}

export interface OhmGovernance {
  /** "policy-set:<name>@<version>"; null means the deployment default. */
  readonly policy_set_ref?: string | null;
  readonly rebac_bindings?: readonly unknown[];
  /** Regexes redacted from tool results and the final answer. */
  readonly redact_patterns?: readonly string[];
}

export interface OhmRuntime {
  /** Must equal a capabilities[].binding or an actors[].role — enforced 422 otherwise. */
  readonly entrypoint: string;
  /** Override-down only vs the policy set; breach escalates the run. */
  readonly budget?: {
    readonly max_tokens?: number;
    readonly max_wall_time_seconds?: number;
    readonly max_tool_calls?: number;
  };
  readonly observability_tags?: Readonly<Record<string, string>>;
}

export interface OhmMetadata {
  readonly id: string;
  readonly name: string;
  readonly owner_organization_id: string;
  readonly created_at?: string | null;
  readonly description?: string | null;
  readonly labels?: Readonly<Record<string, string>>;
}

export interface OhmManifest {
  readonly ohm_version: string;
  readonly metadata: OhmMetadata;
  readonly capabilities?: readonly OhmCapability[];
  readonly models?: readonly OhmModel[];
  readonly prompts?: readonly OhmPrompt[];
  readonly actors?: readonly OhmActor[];
  readonly governance?: OhmGovernance;
  readonly runtime: OhmRuntime;
  readonly signatures?: readonly unknown[];
}
