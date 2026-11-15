import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Enter on a card opens the request, so only Space starts a keyboard drag.
export const keyboardCodes = {
  start: ["Space"],
  cancel: ["Escape"],
  end: ["Space", "Enter"],
};

/**
 * The drag sensors of the roadmap, as on the Kaneo board: a mouse drags after 8 px and a touch
 * after a 250 ms press, so a swipe still scrolls the board and the columns. Space drags with
 * the keyboard.
 */
export function useRoadmapSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes,
    }),
  );
}
