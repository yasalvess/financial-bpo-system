# Project Plan: Financial BPO System UI/UX & Security Audit

## 1. Overview
The goal of this project is to perform a comprehensive UI/UX revision, security audit, calendar styling, and general QA for a React (CDN) + Supabase BPO financial system. The focus is to make launch registrations more intuitive, improve datepicker/calendar styling, implement rigid database RLS security policies, enforce frontend form validation, and ensure all buttons/actions are live and functional.

## 2. Milestones and Objectives
- **Milestone 1: Codebase Exploration and Architecture Discovery**
  - Explore the repository to locate all components, forms, calendar elements, and database client definitions.
  - Formulate a clear strategy for database schema design/RLS policies and form validations.
- **Milestone 2: Max Security (Database RLS & Frontend Form Validation)**
  - Implement/ensure RLS database rules are fully defined. If `schema.sql` is missing, document/create the policies.
  - Implement or integrate the `Validacao` object on the frontend to validate all creation/edition forms before executing Supabase mutations.
- **Milestone 3: UI/UX "Lançamentos" Page Enhancement**
  - Redesign the "Lançamentos" page so that the registration form or "Novo Lançamento" action is the most prominent element, directly on the page, without top bar shortcuts or FAB buttons.
- **Milestone 4: Dropdown Calendar and UI Styling**
  - Update dropdown calendars with polished CSS including hover, focus, and selected-date styles.
- **Milestone 5: QA & Liveness Verification**
  - Perform audit of all buttons, forms, and handlers to ensure no dead onClick handlers exist and proper user feedback is provided.

## 3. Orchestration Details
- Pattern: Project Pattern
- Sequence of Milestones: Milestone 1 -> Milestone 2 -> Milestone 3 -> Milestone 4 -> Milestone 5
- Verification: Explorer (find files/strategy) -> Worker (implement) -> Reviewer (review and check) -> Challenger (verify) -> Auditor (integrity audit)
