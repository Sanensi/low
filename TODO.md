# TODO

- Consider replacing javascript getter for functionnal getter defined in the base interface
- Refactor: distinguish selection/highlight from base hex rendering
  - To do so, use distinct hex graphics for each render

## Notes

- When using PixiApplication.destroy, the application is broken apart by HMR

### Hexagonal coordinates

We use (q, r, s) with the constraint `q + r + s = 0` for the hexagonal coordinates system.

Rule of thumbs to remember the meaning of each value (flat-top hexes):

- Imagine the hands of a clock
- `q` becomes positive at 3 o'clock, negative at 9 o'clock
- `r` becomes positive at 7 o'clock, negative at 1 o'clock
- `s` becomes positive at 11 o'clock, negative at 5 o'clock
