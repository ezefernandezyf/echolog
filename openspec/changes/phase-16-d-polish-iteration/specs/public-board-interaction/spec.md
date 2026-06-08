# Delta for Public Board Interaction

## ADDED Requirements

### Requirement: Interactive controls gated by access level and auth

The system MUST render vote, comment, and create-post controls in `PublicBoardView` gated by the workspace `publicAccessLevel` and authentication state. The server MUST enforce the same gating independently.

#### Scenario: Anonymous visitor on READ_ONLY workspace

- GIVEN a public workspace with `publicAccessLevel = READ_ONLY`
- WHEN an anonymous visitor loads the public board view
- THEN vote buttons MUST NOT render
- THEN comment form MUST NOT render
- THEN create-post button MUST NOT render
- THEN the server MUST return 401 for any write endpoint

#### Scenario: Logged-in user on INTERACT workspace

- GIVEN a public workspace with `publicAccessLevel = INTERACT`
- WHEN a logged-in user loads the public board view
- THEN vote buttons MUST render and be functional
- THEN comment form MUST render and be functional
- THEN create-post button MUST NOT render
- THEN the server MUST accept votes and comments, reject post creation

#### Scenario: Logged-in user on FULL workspace

- GIVEN a public workspace with `publicAccessLevel = FULL`
- WHEN a logged-in user loads the public board view
- THEN vote buttons MUST render and be functional
- THEN comment form MUST render and be functional
- THEN create-post button MUST render and be functional
- THEN the server MUST accept votes, comments, and post creation

#### Scenario: Anonymous visitor on INTERACT workspace

- GIVEN a public workspace with `publicAccessLevel = INTERACT`
- WHEN an anonymous visitor loads the public board view
- THEN vote buttons and comment form MUST NOT render
- THEN the server MUST return 401 for any write endpoint

#### Scenario: Action completes successfully in public board

- GIVEN a logged-in user on a FULL workspace viewing a public board
- WHEN the user submits a vote, comment, or new post
- THEN the UI MUST reflect the change without a page reload
- THEN the server MUST persist the action with the user's identity
