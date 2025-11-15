# Change: Clean Up Domain Logic Duplication and Risk

## Why
A review of the `@packages` directory identified two specific issues that impact code clarity and security:

1.  **Duplicated Code:** The `extractJson` utility function is defined identically in both `@domain-ai/src/diagnose-pod.ts` and `@domain-ai/src/yaml-copilot.ts`. This violates the DRY (Don't Repeat Yourself) principle and adds unnecessary maintenance overhead.
2.  **Security Risk:** The `transformSecretToDetail` function in `@domain-k8s/src/transformers/secret.ts` currently decodes base64-encoded secret values into plaintext. While convenient for debugging, passing decoded secrets to upper layers of the application is a security risk and contradicts the intended design of redacting sensitive data in the UI—and any backend consumers that expect decoded values today must either be updated or explicitly opted out before we change the transformer.

## What Changes
1.  **Deduplicate `extractJson`:**
    - Create a new shared utility file at `@domain-ai/src/utils.ts`.
    - Move the `extractJson` function into this new file.
    - Update `diagnose-pod.ts` and `yaml-copilot.ts` to import and use the shared function.
2.  **Harden Secret Transformer:**
    - Inventory every consumer of `SecretDetail` (UI and backend/AI helpers) and confirm whether they require decoded values. Document any exceptions and how they are handled.
    - Modify `transformSecretToDetail` in `@domain-k8s/src/transformers/secret.ts` to **stop decoding** the `data` field once all consumers are confirmed to handle encoded data (or receive an alternative pathway).
    - The `data` field in the returned `SecretDetail` object will now contain the original, untampered base64-encoded strings from the Kubernetes API, and **no upstream caller** should see plaintext values. The UI remains responsible for showing only the keys of the secret, never the decoded values.

## Impact
- **Specs**: The `console-ui` spec will be updated to be more explicit about redacting sensitive data in resource inspectors, and a short note will be added to the domain layer docs/tasks so we never reintroduce plaintext secret handling upstream.
- **Code**: Affects two files in `@domain-ai` and one transformer in `@domain-k8s`. May require minor adjustments to the Secret inspector UI component to ensure it handles the un-decoded data correctly.
- **Risk**: Low. This is a straightforward cleanup and security hardening task. The primary validation will be ensuring the AI features and the Secret inspector UI continue to function as expected.
