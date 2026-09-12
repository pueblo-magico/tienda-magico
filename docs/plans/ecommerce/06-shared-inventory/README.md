# Task 06 milestones: mixed commerce and shared inventory

This directory splits [Task 06 shared inventory](../06-shared-inventory.md) into
implementation milestones. The order is intentional: customer self-service
comes before camera discovery, staff operations, shared inventory controls,
and event workflows.

## Milestones

1. [Webshop local purchase](01-webshop-local-purchase.md)
2. [Camera product discovery](02-camera-product-discovery.md)
3. [Staff-assisted local sales](03-staff-assisted-local-sales.md)
4. [Shared inventory operations](04-shared-inventory-operations.md)
5. [Events and retreats](05-events-retreats.md)

Task 07 owns online checkout reservations, expiry, payment webhooks,
reconciliation, and final-unit races. Task 05 owns supplier and purchasing-cost
data; no milestone here may expose or duplicate that private data.

Each milestone is independently reviewable but depends on the contracts and
Definition of Done of the preceding milestone. The consolidated plan remains
the source for cross-milestone boundaries until these files are accepted as the
primary implementation plan.
