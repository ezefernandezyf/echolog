# Delta for Public Board Navigation

## ADDED Requirements

### Requirement: BoardCard links to board detail

The system MUST render each `BoardCard` in the public workspace view as a link to `/explore/:workspaceSlug/:boardSlug`.

#### Scenario: User clicks a BoardCard in public workspace

- GIVEN a public workspace with slug `acme` and a board with slug `roadmap`
- WHEN a visitor clicks the BoardCard for "Roadmap"
- THEN the browser navigates to `/explore/acme/roadmap`
- AND the public board detail page renders

#### Scenario: Board slug is missing

- GIVEN a board object that lacks a `slug` property
- WHEN the BoardCard renders
- THEN the link href MUST NOT include `undefined` as a segment
- AND navigation to an invalid route is prevented (graceful fallback)

#### Scenario: Multiple boards in public workspace

- GIVEN a public workspace with boards "Roadmap" (slug `roadmap`) and "Feedback" (slug `feedback`)
- WHEN a visitor clicks the "Feedback" BoardCard
- THEN the browser navigates to `/explore/acme/feedback`
- AND the "Roadmap" link continues pointing to `/explore/acme/roadmap`
