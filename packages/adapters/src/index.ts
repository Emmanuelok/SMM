/**
 * The public surface of `@smm/adapters`.
 *
 * Ordered from the vocabulary outward: what a post is, what a network can do,
 * what an authorised route to a network looks like, how a publish progresses,
 * what comes back from one — and only then the contract that ties them
 * together. Nothing here re-exports selectively; a type that is worth defining
 * in this package is worth being able to name outside it, and a curated subset
 * would drift out of date the first time a module gained a type.
 */
export * from './networks.js';
export * from './content.js';
export * from './variants.js';
export * from './capabilities.js';
export * from './connection.js';
export * from './destinations.js';
export * from './lifecycle.js';
export * from './metrics.js';
export * from './validation.js';
export * from './registry.js';
export * from './adapter.js';

// Network implementations. Exported from the package root so a service wires an
// adapter by importing it, not by reaching into a file path.
export * from './networks/bluesky.js';
export * from './networks/mastodon.js';
