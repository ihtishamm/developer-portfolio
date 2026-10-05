// Fixed full-screen film grain. Pure CSS (see .grain in globals.css), so it stays a server component.
export function Grain() {
  return <div aria-hidden="true" className="grain" />;
}
