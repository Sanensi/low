# TODO

- Refactor city border to be persisted instead of calculated.
  - This should resolve any border dispute between two neighboring cities, giving the older city its acquired rights
- Consider replacing javascript getter for functionnal getter defined in the base interface
  - `this is this` typeguards are not playing nicely with wrapped getters
- Refactor: Remove duplicate Unit selection state ✅
- Refactor: Extract World altering logic out of LoW ✅
- Refactor: distinguish selection/highlight from base hex rendering
  - To do so, use distinct hex graphics for each rendered element
- Refactor: Render changes to hex display only after the user interact with the game instead of every frames
  - Two potential solutions:
    - Make the ui states completly distinct from the game state and synchronize them on user actions
    - OR
    - Bind each piece of ui to its game state representation, syncing it every time its associated object state is updated
- Setup github actions for unit tests

## Bugs

- When canceling movement, the reachableHexes doesn't get updated ✅
- When moving a unit to the cell previously occupied by another unit, then chaos ensue

## Notes

- When using PixiApplication.destroy, the application is broken apart by HMR

### Hexagonal coordinates

We use (q, r, s) with the constraint `q + r + s = 0` for the hexagonal coordinates system.

Rule of thumbs to remember the meaning of each value (flat-top hexes):

- Imagine the hands of a clock
- `q` becomes positive at 3 o'clock, negative at 9 o'clock
- `r` becomes positive at 7 o'clock, negative at 1 o'clock
- `s` becomes positive at 11 o'clock, negative at 5 o'clock
