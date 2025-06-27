import { useEffect } from "react";

/**
 * Custom hook to detect clicks outside a specified DOM element and invoke a handler.
 *
 * @param ref - React ref object pointing to the element to detect outside clicks for.
 * @param handler - Callback function to run when a click occurs outside the referenced element.
 * @param when - Optional boolean to enable or disable the event listener (default: true).
 */

export default function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent) => void,
  when: boolean = true
) {
  useEffect(() => {
    // If `when` is false, do not attach the event listener
    if (!when) return;

    // Event listener to check if the click target is outside the referenced element
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      // Otherwise, invoke the handler function for outside clicks
      handler(event);
    };

    document.addEventListener("mousedown", listener);

    // Cleanup function to remove the listener when the component unmounts or dependencies change
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler, when]);
}
