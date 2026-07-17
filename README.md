# Flow Commander

A complete, dependency-free browser puzzle game. Draw one continuous orthogonal route from the lone commander to the royal banner, recruiting the exact company needed for every encounter along the way.

## Play

From this folder, start any static file server:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

Controls:

- Mouse, touch, or pen: press the commander and drag through adjacent tiles.
- Tap/click an adjacent tile to extend the route one step at a time.
- Drag back one tile or use **Undo** to retract.
- Keyboard: arrow keys move, Backspace undoes, `R` resets, and `H` gives a nudge.

## Campaign mechanics

- Soldiers are consumed by goblin encounters; enemy badges show the exact cost.
- One builder is assigned to each river crossing.
- One mage is assigned to each dragon.
- Sun and Moon switches permanently open their matching gates for the current route.
- The route may not cross itself and the banner must be the final tile.

The campaign contains 10 progressively harder levels. The last two require planning several forks backward from the final obstacle sequence.

## Validate levels

```sh
npm test
```

The exhaustive DFS validator uses the same transition engine as gameplay and fails unless every level has exactly one legal route.

## Art and sound

All art is downloaded into `assets/vendor` and works offline. It is licensed under CC0 1.0:

- [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon), [Tiny Town](https://kenney.nl/assets/tiny-town), [Tiny Farm](https://kenney.nl/assets/tiny-farm), and [Tiny Battle](https://kenney.nl/assets/tiny-battle) by Kenney.
- [Tiny Creatures](https://opengameart.org/content/tiny-creatures) by Clint Bellanger.

Attribution is not required by the licenses, but is included in the game and here as a courtesy. Sound effects are generated locally with the Web Audio API; there are no remote runtime dependencies.
