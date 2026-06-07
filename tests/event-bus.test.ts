import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { publish, subscribe, replaySince, _resetForTest } from "../lib/eventBus.js";

describe("eventBus", () => {
  beforeEach(() => _resetForTest());

  it("delivers events to subscribers", () => {
    const received: any[] = [];
    subscribe((ev) => received.push(ev));
    publish("job1", "phase", { phase: "streaming", requestId: "job1" });
    assert.equal(received.length, 1);
    assert.equal(received[0].jobId, "job1");
    assert.equal(received[0].event, "phase");
    assert.equal(received[0].id, 1);
  });

  it("assigns monotonically increasing ids", () => {
    const ids: number[] = [];
    subscribe((ev) => ids.push(ev.id));
    publish("a", "phase", {});
    publish("b", "done", {});
    publish("c", "error", {});
    assert.deepEqual(ids, [1, 2, 3]);
  });

  it("unsubscribe stops delivery", () => {
    const received: any[] = [];
    const unsub = subscribe((ev) => received.push(ev));
    publish("j1", "phase", {});
    unsub();
    publish("j2", "done", {});
    assert.equal(received.length, 1);
  });

  it("replaySince returns events after given id", () => {
    publish("a", "phase", { requestId: "a" });
    publish("b", "done", { requestId: "b" });
    publish("c", "error", { requestId: "c" });
    const replayed = replaySince(1);
    assert.equal(replayed.length, 2);
    assert.equal(replayed[0].jobId, "b");
    assert.equal(replayed[1].jobId, "c");
  });

  it("replaySince returns empty for unknown id", () => {
    publish("a", "phase", {});
    const replayed = replaySince(999);
    assert.deepEqual(replayed, []);
  });

  it("ring buffer caps at 500", () => {
    for (let i = 0; i < 600; i++) {
      publish(`job${i}`, "phase", {});
    }
    const all = replaySince(0);
    assert.equal(all.length, 500);
    assert.equal(all[0].id, 101);
  });

  it("excludes large base64 images from ring buffer", () => {
    const largeImage = "data:image/png;base64," + "A".repeat(2000);
    publish("img1", "partial", { image: largeImage, requestId: "img1" });
    publish("other", "done", { requestId: "other" });
    const replayed = replaySince(0);
    assert.equal(replayed.length, 1);
    assert.equal(replayed[0].jobId, "other");
  });

  it("still delivers large image events to live subscribers", () => {
    const received: any[] = [];
    subscribe((ev) => received.push(ev));
    const largeImage = "data:image/png;base64," + "A".repeat(2000);
    publish("img1", "partial", { image: largeImage, requestId: "img1" });
    assert.equal(received.length, 1);
    assert.equal(received[0].event, "partial");
  });
});
