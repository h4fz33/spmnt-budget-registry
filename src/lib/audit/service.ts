import "server-only"

// Application code imports this guarded boundary. The same implementation is
// exercised directly by the Node integration test and structural verifier.
export * from "./core.ts"
