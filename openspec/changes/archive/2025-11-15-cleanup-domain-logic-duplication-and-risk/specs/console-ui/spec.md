## MODIFIED Requirements
### Requirement: Inspector Composition Parity
Resource inspectors SHALL share a consistent set of sections so the experience is predictable irrespective of the resource kind.

#### Scenario: Sensitive & Missing Data
- **GIVEN** a resource lacks certain sections (e.g., Secrets have no “Referenced Manifests” content or events are unavailable)
- **WHEN** the inspector renders
- **THEN** it SHALL show a muted placeholder explaining the absence instead of removing the section.
- **AND** sensitive data (e.g., values in a `Secret`, token fields in a `ServiceAccount`) **MUST** be redacted or omitted entirely from the UI. The inspector SHOULD display keys or metadata about the sensitive data (like key names in a Secret), but never the plaintext values themselves.
- **AND** backend transformers MUST keep sensitive payloads encoded (e.g., base64 values from Kubernetes Secrets) so any consumer that truly needs plaintext must explicitly opt into decoding and accept the associated audit responsibilities.
