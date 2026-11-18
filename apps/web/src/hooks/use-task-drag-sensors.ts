import {
  MouseSensor,
  type SensorDescriptor,
  type SensorOptions,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo } from "react";

const NEVER = 999999;
export const NO_SENSORS: SensorDescriptor<SensorOptions>[] = [];

/**
 * Drag sensors that keep their identity across renders. New sensor objects
 * change dnd-kit's context, which re-renders every card or row in the view.
 */
export function useTaskDragSensors(
  disabled: boolean,
  touch: { delay: number; tolerance: number },
) {
  const { delay, tolerance } = touch;
  const mouseOptions = useMemo(
    () => ({ activationConstraint: { distance: disabled ? NEVER : 8 } }),
    [disabled],
  );
  const touchOptions = useMemo(
    () => ({
      activationConstraint: { delay: disabled ? NEVER : delay, tolerance },
    }),
    [disabled, delay, tolerance],
  );
  return useSensors(
    useSensor(MouseSensor, mouseOptions),
    useSensor(TouchSensor, touchOptions),
  );
}
