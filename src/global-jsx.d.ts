// Temporary global JSX declarations to avoid "JSX.IntrinsicElements" errors
// These are intentionally permissive to make the Figma UI integration compile quickly.
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
