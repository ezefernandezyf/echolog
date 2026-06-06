# Delta for Sidebar Explore Conditional

## ADDED Requirements

### Requirement: Explore link only on dashboard

The Sidebar Explore link MUST render only when the current route is `/w` (workspace dashboard). It MUST NOT render inside a specific workspace context where `workspaceId` is set.

#### Scenario: User on workspace dashboard

- GIVEN the current route is `/w` and `workspaceId` is undefined
- WHEN the sidebar renders
- THEN the "Explore" link pointing to `/explore` is visible

#### Scenario: User inside a specific workspace

- GIVEN the current route is `/w/acme` and `workspaceId` is `"acme-id"`
- WHEN the sidebar renders
- THEN the "Explore" link is NOT rendered in the DOM

#### Scenario: User navigates from workspace to dashboard

- GIVEN the user is inside workspace "acme" where Explore is hidden
- WHEN the user navigates to `/w` (dashboard)
- THEN the "Explore" link appears
