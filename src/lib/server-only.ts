// Marker for server-only modules in TanStack Start.
// Prevents bundler crashes during SSR while preventing client execution.
if (typeof window !== "undefined") {
  throw new Error("This module cannot be imported from a client bundle.");
}
