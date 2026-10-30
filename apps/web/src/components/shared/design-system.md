# Stash UI conventions

Use `Button` and `buttonVariants` from `components/ui/button` for ordinary actions and button-shaped links. Use semantic sizes/variants instead of repeating button geometry. `Input` is the base for bordered form inputs, while `SearchField` supplies the shared labelled search pattern. `Card` provides the standard bordered surface; `StashEmpty` provides a shared empty state. `IconPicker` shares notebook icon selection.

The component geometry tokens live in `app/globals.css`: `--radius-control`, `--radius-card`, `--radius-dialog`, and `--control-height`. Theme colours and focus tokens are also defined there. A token change affects only components using that token; intentionally different controls (tree rows, icon palettes, editor tools, navigation) have their own styles and should not be treated as standard buttons.

Prefer shared components and meaningful variants to copied utility strings. Keep per-screen classes for layout and genuinely unique visual treatments. Preserve accessible names, focus indicators, form button types, and existing mutation handlers during migration.
