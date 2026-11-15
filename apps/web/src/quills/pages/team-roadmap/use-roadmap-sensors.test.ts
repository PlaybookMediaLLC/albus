import { KeyboardSensor, MouseSensor, TouchSensor } from "@dnd-kit/core";
import { renderQuillsHook } from "../../test/render";
import { describe, expect, it } from "vite-plus/test";
import { keyboardCodes, useRoadmapSensors } from "./use-roadmap-sensors";

describe("useRoadmapSensors", () => {
  it("drags by mouse distance, by a long touch and by Space only", () => {
    const { result } = renderQuillsHook(() => useRoadmapSensors(), {});
    expect(result.current.map((sensor) => sensor.sensor)).toEqual([
      MouseSensor,
      TouchSensor,
      KeyboardSensor,
    ]);
    expect(result.current[1]!.options).toMatchObject({
      activationConstraint: { delay: 250, tolerance: 10 },
    });
    // Enter opens the request link, so it must not start a drag.
    expect(keyboardCodes.start).toEqual(["Space"]);
  });
});
