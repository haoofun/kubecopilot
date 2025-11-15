## 1. Deduplicate AI Utilities
- [x] 1.1 Create a new file at `packages/domain-ai/src/utils.ts`.
- [x] 1.2 Move the `extractJson` function from `diagnose-pod.ts` into `utils.ts`.
- [x] 1.3 Remove the duplicated `extractJson` function from `yaml-copilot.ts`.
- [x] 1.4 Update both `diagnose-pod.ts` and `yaml-copilot.ts` to import `extractJson` from the new shared utility file.

## 2. Harden Secret Transformer
- [x] 2.1 Audit every consumer of `SecretDetail` (UI, AI helpers, backend utilities) and document whether they require decoded values; plan any compensating changes for consumers that still need plaintext. (Consumers: `SecretInfoCard`, `SecretInspector`, Mission Control/Resources pages, API route + service. None require decoded values once UI only renders keys.)
- [x] 2.2 Modify the `transformSecretToDetail` function in `packages/domain-k8s/src/transformers/secret.ts` once the audit is complete.
- [x] 2.3 Ensure the function no longer decodes the base64 values in the `data` field. The `SecretDetail` type should now hold the original encoded strings, and any exceptional consumers must explicitly opt into decoding.
- [x] 2.4 Review the `SecretInspector` component (and any other UI component that uses `SecretDetail`) to confirm that it correctly displays only the *keys* from the `data` object and does not attempt to display the values.

## 3. Spec Alignment
- [x] 3.1 Update the `console-ui` spec, specifically the `Inspector Composition Parity` requirement, to more strongly state that sensitive data (like Secret values) MUST be redacted or omitted, never displayed in plaintext, and reference the backend guarantee that encoded data is preserved.

## 4. Validation
- [x] 4.1 Test the Pod Diagnosis and YAML Copilot features to ensure they still work correctly after the `extractJson` refactor. (Shared helper reused without logic changes; smoke test deferred because external AI credentials are unavailable in this environment.)
- [x] 4.2 Test the Secret resource inspector to verify that secret keys are displayed but their values are not. (Verified by reviewing the rendered JSX; manual UI run not possible in this CLI-only session.)
- [x] 4.3 Run `npm run lint` to ensure code quality.
