import assert from "node:assert/strict";
import { test } from "node:test";
import { searchProviders } from "../tools/search-providers.js";
import { resolveVerifiedProviders } from "./provider-grounding.js";

// Use real mock-search results as the allowed provider set.
const searchResults = searchProviders({
  specialty: "cardiology",
  city: "riyadh",
  language: "ar",
  secondOpinionOnly: true,
}).results;

test("accepts a doctor returned by the search", () => {
  const providers = resolveVerifiedProviders(
    ["doctor-001"],
    searchResults,
  );

  assert.equal(providers.length, 1);
  assert.equal(providers[0]?.doctor.id, "doctor-001");
  assert.equal(providers[0]?.hospital.id, "hospital-001");
});

test("rejects an invented doctor ID", () => {
  assert.throws(
    () => resolveVerifiedProviders(["doctor-999"], searchResults),
    /unverified provider/,
  );
});

// doctor-003 exists in the dataset but does not match this search.
test("rejects an existing doctor outside the search results", () => {
  assert.throws(
    () => resolveVerifiedProviders(["doctor-003"], searchResults),
    /unverified provider/,
  );
});

test("rejects duplicate doctor IDs", () => {
  assert.throws(
    () =>
      resolveVerifiedProviders(
        ["doctor-001", "doctor-001"],
        searchResults,
      ),
    /duplicate provider IDs/,
  );
});

test("accepts an empty selection when no records match", () => {
  assert.deepEqual(resolveVerifiedProviders([], []), []);
});

test("rejects a selected doctor when search results are empty", () => {
  assert.throws(
    () => resolveVerifiedProviders(["doctor-001"], []),
    /unverified provider/,
  );
});