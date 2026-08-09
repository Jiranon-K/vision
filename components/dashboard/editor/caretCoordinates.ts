// A textarea has no API for the caret's pixel position, so this mirrors the
// well-known technique: build a hidden div with the same box model and font
// metrics, fill it with the text up to the caret, and measure where a marker
// span lands. Kept out of markdownOps.ts because it touches the DOM and
// can't be exercised as a pure function.
const MIRRORED_PROPERTIES = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "wordSpacing",
  "tabSize",
] as const;

export interface CaretCoordinates {
  /** Offset from the textarea's own top edge, in the textarea's local (unscrolled) space. */
  top: number;
  left: number;
  height: number;
}

// Coordinates are relative to the textarea's border box, with scrollTop /
// scrollLeft already subtracted — callers add the textarea's own
// getBoundingClientRect() to get a viewport position.
export function getCaretCoordinates(textarea: HTMLTextAreaElement, position: number): CaretCoordinates {
  const computed = window.getComputedStyle(textarea);

  const mirror = document.createElement("div");
  const style = mirror.style;
  style.position = "absolute";
  style.visibility = "hidden";
  style.top = "0";
  style.left = "-9999px";
  style.whiteSpace = "pre-wrap";
  style.wordWrap = "break-word";

  for (const prop of MIRRORED_PROPERTIES) {
    style.setProperty(cssPropertyName(prop), computed.getPropertyValue(cssPropertyName(prop)));
  }

  mirror.textContent = textarea.value.slice(0, position);
  const marker = document.createElement("span");
  // A trailing empty span collapses to zero width in some engines; a single
  // character guarantees the marker has a measurable box.
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const coordinates: CaretCoordinates = {
    top: marker.offsetTop - textarea.scrollTop,
    left: marker.offsetLeft - textarea.scrollLeft,
    height: marker.offsetHeight,
  };

  document.body.removeChild(mirror);
  return coordinates;
}

function cssPropertyName(camelCase: string): string {
  return camelCase.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
