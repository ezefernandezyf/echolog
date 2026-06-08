# Delta for Landing CTA Deduplication

## ADDED Requirements

### Requirement: Single CTA on landing page

The landing page MUST render exactly one call-to-action button that navigates to `/explore`. The "Continue without account" button MUST be removed.

#### Scenario: Visitor loads the landing page

- GIVEN an unauthenticated visitor
- WHEN the landing page renders
- THEN exactly ONE button navigates to `/explore`
- THEN that button is labeled "See how it works"

#### Scenario: "Continue without account" is absent

- GIVEN the landing page renders
- WHEN inspecting the DOM for a "Continue without account" button
- THEN no element with that label or role exists in the document

#### Scenario: CTA still accessible without JavaScript

- GIVEN JavaScript is disabled or fails to load
- WHEN the landing page renders
- THEN the "See how it works" link MUST still be an `<a>` element pointing to `/explore`
