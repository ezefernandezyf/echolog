# Delta for TopNavbar Items

## ADDED Requirements

### Requirement: TopNavbar hosts notification bell, theme toggle, and avatar dropdown

The TopNavbar MUST render a notification bell (`PendingInvitationsBell`), a theme toggle, and an avatar dropdown (containing Settings and Sign out). The Sidebar MUST NOT duplicate any of these items.

#### Scenario: Logged-in user sees all TopNavbar items

- GIVEN a user is authenticated and on any authenticated route
- WHEN the TopNavbar renders
- THEN a notification bell icon with unread badge is visible
- THEN a theme toggle (light/dark) is visible
- THEN an avatar button is visible showing the user's initials
- THEN clicking the avatar opens a dropdown with "Settings" and "Sign out"

#### Scenario: Sidebar bottom section is clean

- GIVEN a user is authenticated and the sidebar renders
- WHEN inspecting the sidebar DOM
- THEN no `ThemeToggle` is present
- THEN no `PendingInvitationsBell` is present
- THEN no user profile card (initials, name, email) is present
- THEN the Explore link and workspace/board navigation remain intact

#### Scenario: Notification bell shows unread count

- GIVEN the user has 3 pending invitations
- WHEN the TopNavbar renders
- THEN the notification bell displays a badge showing "3"
- THEN clicking the bell opens the invitation dropdown

#### Scenario: Avatar dropdown Sign out action

- GIVEN the avatar dropdown is open
- WHEN the user clicks "Sign out"
- THEN the user is logged out and redirected to the landing page
