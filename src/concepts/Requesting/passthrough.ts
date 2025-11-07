/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  "/api/Dictionary/translateTermFromL1": "public dictionary lookup",
  "/api/Dictionary/translateTermFromL2": "public dictionary lookup",
  "/api/llm/executeLLM": "add llm",
  // "/api/Dictionary/addTerm": "don't need to be logged in to add to dictionary",
  // "/api/Dictionary/deleteTerm": "don't need to be logged in to delete from dictionary",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  "/api/FileTracker/startTracking",
  "/api/FileTracker/deleteTracking",
  "/api/FileTracker/jumpTo",
  "/api/FileTracker/next",
  "/api/FileTracker/back",
  "/api/FileTracker/setVisibility",
  "/api/FileTracker/startTrackingUsingLLM",
  "/api/FileTracker/createTrackingPrompt",
  "/api/FileTracker/parseAndStartTracking",
  "/api/FileTracker/_getCurrentItem",
  "/api/FileTracker/_getVisibility",
  "/api/Library/create",
  "/api/Library/delete",
  "/api/Library/createFile",
  "/api/Library/addItemToFile",
  "/api/Library/modifyItemInFile",
  "/api/Library/removeItemFromFile",
  "/api/Library/setImageToFile",
  "/api/Library/clearImageFromFile",
  "/api/Library/deleteFile",
  "/api/Library/_getAllFiles",
  "/api/Library/_getFileString",
  "/api/PasswordAuthentication/register",
  "/api/PasswordAuthentication/authenticate",
  "/api/PasswordAuthentication/_getUserByUsername",
  "/api/PasswordAuthentication/_getUsername",
  "/api/Sessioning/create",
  "/api/Sessioning/delete",
  "/api/Sessioning/_getUser",
  "/api/Dictionary/addTerm",
  "/api/Dictionary/deleteTerm",
];
