# Error Handling Standardization

## Goal
Add consistent error handling for React Query queries and standardize mutation error patterns so users see meaningful feedback when things fail, instead of silent blank states.

## Current State

### What exists
- **ErrorBoundary** — wraps the entire Router in App.tsx, catches render errors only. Shows "A wild bug appeared!" with reload button and feedback form.
- **Toast system** — `useAppStore().showToast(message)` renders a MUI Snackbar. Used in 4 files for mutation errors (ManageTags, SettingsSidebar, FeedbackForm, CanvasItemPanel).
- **Auth pages** — Login, Signup, PasswordReset have inline MUI `<Alert severity="error">` for auth-specific errors.
- **useAutoSave** — has a `"error"` status that re-marks dirty for retry. Works well.

### What's missing
- **No query error handling** — 13 query hooks (`useCanvases`, `useItems`, `useItem`, `useSearchItems`, `useTimeline`, `useTimelineCounts`, `useGallery`, `useSessions`, `useTags`, `useQuickNotes`, `useTaggedItems`, `useNoteHistory`, `useQuickNoteHistory`) never expose `.error` to components. If a query fails, users see a loading state or blank screen forever.
- **No global mutation error handler** — queryClient has no `defaultOptions.mutations.onError`. Each mutation error must be caught manually.
- **Inconsistent mutation error patterns** — some use `try/catch` around `mutateAsync`, some use `onError` callback on `mutate`, most have no error handling at all.
- **No retry UI** — users can't trigger retries on failed queries.

### Query client config
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

## Approach

### 1. Global mutation error toast
Add `defaultOptions.mutations.onError` to the QueryClient that shows a toast with a generic error message. This provides a safety net — individual mutations can still override with specific messages via their own `onError`.

### 2. Query error handling in page components
For the main page queries (`useCanvases`, `useItems`, `useSessions`, `useTimeline`, `useGallery`), destructure `.error` and `.isError` and show an inline error state with a retry button. Use a lightweight shared component for this.

### 3. QueryErrorDisplay shared component
A simple component that renders when a query fails:
```tsx
<QueryErrorDisplay
  error={error}
  onRetry={() => refetch()}
/>
```
Renders a centered message ("Something went wrong") with a retry button. No complex error parsing — just a consistent UI.

### 4. Clean up inconsistent mutation error handling
Standardize the 4 files that currently handle mutation errors to use a consistent pattern. Since the global onError provides the safety net, most try/catch blocks can be removed — only keep explicit error handling where the component needs to react to the error (e.g., re-enable a button, clear a form).

## Out of Scope
- Per-route error boundaries — the top-level ErrorBoundary is sufficient for render errors
- Detailed error message parsing from the API — generic messages are fine for now
- Offline detection / network status indicators
- Error logging/reporting service integration
