## MODIFIED Requirements
### Requirement: Sidebar Configuration
The main sidebar navigation SHALL be generated from a configuration object rather than being hardcoded. This allows for flexible and safe iteration on the information architecture.

#### Scenario: V1 Configuration (Default)
- **GIVEN** the V2 feature flag is not enabled
- **WHEN** the application renders the sidebar
- **THEN** the sidebar structure SHALL be generated from the `navConfigV1` object, perfectly matching the original hardcoded layout.

#### Scenario: V2 Configuration (Feature-Flagged)
- **GIVEN** the V2 feature flag is enabled
- **WHEN** the application renders the sidebar
- **THEN** the sidebar structure SHALL be generated from the `navConfigV2` object, displaying the SRE workflow layout with the following first-level groups:
  1. AI Copilot (Operation Plans, YAML Copilot, Ask the Cluster)
  2. SRE Mission Control (Health, App Runtime, Platform, Infra flows with the specified child links per flow)
  3. Dashboards (Overview, Node, Workload, Network, Storage dashboards)
  4. Resources (Workloads, Networking, Config & Storage, Cluster explorers)
  5. Audit (Operation History, API Logs, Audit Events)
- **AND** each nav item MUST point to a concrete, routable Next.js page; net-new destinations SHALL be scaffolded as placeholders returning `🚧 Coming Soon` until their real UX ships.
- **AND** the Resources group SHALL include the full Kubernetes resource tree (e.g., Workloads → Pods/Deployments/StatefulSets/DaemonSets/Jobs/CronJobs; Networking → Services/Ingresses; Config & Storage → ConfigMaps/Secrets/PVCs/PVs; Cluster → Nodes/Namespaces).
- **AND** duplicate entries such as `Overview` appearing in both Mission Control and Dashboards are permitted and expected to satisfy the double-entry navigation intent.
- **AND** future resources (e.g., Network Policies, Storage Classes, CRDs) SHALL stay out of the UI until their backing pages ship; they are documented only in SSOT.

### Requirement: Collapsible Navigation Groups
The sidebar's navigation groups SHALL behave like the animate-ui / Radix Sidebar pattern: smooth accordion animations, single expanded child per parent, and automatic focus on the active branch.

#### Scenario: Expanding a Group
- **GIVEN** a navigation group with children is collapsed
- **WHEN** the user clicks on it
- **THEN** the group SHALL expand with a smooth transition (matching the animate-ui sidebar easing) and reveal its child navigation links.

#### Scenario: Single Open Child Per Parent
- **GIVEN** a parent group (e.g., "SRE Mission Control" or "Resources") that contains multiple second-level groups
- **WHEN** the user expands one child group
- **THEN** any previously expanded child under that same parent SHALL collapse, so only one second-level group is open at a time.

#### Scenario: Active Link Highlighting
- **GIVEN** the user has navigated to a page
- **WHEN** the sidebar is rendered
- **THEN** the corresponding navigation link and every ancestor group SHALL be highlighted and automatically expanded, even if they were previously collapsed.
