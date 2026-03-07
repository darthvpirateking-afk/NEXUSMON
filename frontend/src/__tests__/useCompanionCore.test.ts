import { afterEach, describe, expect, test } from "vitest";
import {
  armCompanionComposer,
  buildCompanionComposerDraft,
  clearCompanionComposer,
  getCompanionComposerState,
} from "../hooks/useCompanionCore";

afterEach(() => {
  clearCompanionComposer();
});

describe("useCompanionCore composer state", () => {
  test("builds stable default drafts for seal and transmit intents", () => {
    expect(buildCompanionComposerDraft("seal")).toBe("Prepare sealed command: ");
    expect(buildCompanionComposerDraft("transmit")).toBe("Transmit directive: ");
  });

  test("arms and clears the companion composer intent", () => {
    armCompanionComposer("seal");
    expect(getCompanionComposerState()).toMatchObject({
      intent: "seal",
      draft: "Prepare sealed command: ",
    });

    clearCompanionComposer();
    expect(getCompanionComposerState()).toMatchObject({
      intent: null,
      draft: "",
    });
  });
});