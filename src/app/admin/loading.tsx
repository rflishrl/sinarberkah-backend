export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">Memuat...</span>
      <div className="h-9 w-56 animate-pulse rounded-md bg-line" />
      <div className="h-64 animate-pulse rounded-lg bg-line" />
    </div>
  );
}
