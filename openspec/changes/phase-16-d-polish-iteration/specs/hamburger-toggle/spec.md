# Delta for Hamburger Toggle

## ADDED Requirements

### Requirement: Hamburger button toggles sidebar on desktop

The `UiStore` MUST expose a `toggleSidebar` action. The TopNavbar hamburger button MUST call `toggleSidebar`. On desktop viewports (>= 1024px), clicking the hamburger MUST toggle the sidebar between open and closed states.

#### Scenario: Sidebar is open, user clicks hamburger on desktop

- GIVEN the sidebar is open (`sidebarOpen = true`) on a viewport >= 1024px
- WHEN the user clicks the hamburger button in TopNavbar
- THEN `toggleSidebar` sets `sidebarOpen` to `false`
- THEN the sidebar collapses visually

#### Scenario: Sidebar is closed, user clicks hamburger on desktop

- GIVEN the sidebar is closed (`sidebarOpen = false`) on a viewport >= 1024px
- WHEN the user clicks the hamburger button in TopNavbar
- THEN `toggleSidebar` sets `sidebarOpen` to `true`
- THEN the sidebar expands visually

#### Scenario: Mobile viewport — existing drawer behavior preserved

- GIVEN a viewport < 1024px with sidebar closed
- WHEN the user clicks the hamburger button
- THEN toggleSidebar opens the mobile drawer (existing mobile behavior unchanged)

#### Scenario: Rapid double-click

- GIVEN the sidebar is open
- WHEN the user clicks the hamburger twice in rapid succession
- THEN the sidebar state toggles twice (opens after the second click)
- THEN no intermediate state corruption occurs
