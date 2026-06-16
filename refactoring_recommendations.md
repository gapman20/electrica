# Refactoring Recommendations for Admin.jsx

The current `Admin.jsx` is a monolithic component (~1600 lines) that manages multiple disparate domains. To improve maintainability, testability, and performance, I recommend extracting the following logical sections into standalone components:

## 1. Core Management Modules
These modules handle complex state and external API interactions.

- **`DashboardView`**: Handles stats, charts (using `SimpleBarChart`), and quick actions.
- **`OrderManager`**: Manages order listing, filtering, pagination, and status updates (e.g., `handleMarkShipped`).
- **`MessageInbox`**: Handles contact form submissions, read status, and deletions.
- **`CampaignManager`**: Manages the complex draft/launch lifecycle, product selection, and timing logic.

## 2. Inventory Management
These modules involve heavy CRUD and external TCG API integration.

- **`SealedProductManager`**: CRUD for booster boxes, ETBs, etc.
- **`CardInventoryManager`**: Handles manual card entry and the **Scryfall/PokéWallet import logic**. This is a prime candidate for a dedicated component due to its search state and multi-provider mapping.

## 3. CMS & Theming
These sections mostly interact with `SiteContext` for global configuration.

- **`ThemeEditor`**: Manages color pickers and preset theme selection.
- **`SEOConfig`**: Handles meta titles, descriptions, and the Google search preview.
- **`ContentEditor`**: A generic component (or set of components) for editing simple page fields (Home, About, Contact, etc.).
- **`BlogManager`**: CRUD for blog posts, including the Markdown-capable editor.

## 4. Shared UI Components
Many helper components within `Admin.jsx` can be moved to `src/components/admin/`:
- `StatCard`
- `SimpleBarChart`
- `Field` (input wrapper)
- `ColorPicker`
- `Toolbar` (formatting)

## 5. Benefits of Refactoring
- **Isolated Re-renders**: Changes in a specific editor (like the Blog) won't cause the entire Admin sidebar and other inactive modules to re-evaluate.
- **Improved Readability**: Reducing `Admin.jsx` to a simple router/layout that switches between these components.
- **Easier Testing**: Individual modules can be unit tested without the overhead of the full Admin state.
