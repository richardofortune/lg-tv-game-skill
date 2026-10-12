# Input reference

kit.js turns every device into named actions:
`up down left right ok back red green yellow blue pause x y lb rb erase`.
Listen with `TV.on("action", fn)`; each event has `{ name, player, source, repeat }`.
For continuous movement, read `TV.isDown(name, player)` and `TV.axis(player)`
inside the update loop.

## Remote key codes (webOS)

| Key | keyCode | kit action |
|---|---|---|
| Left, Up, Right, Down | 37, 38, 39, 40 | left, up, right, down |
| OK | 13 | ok |
| Back | 461 | back |
| Red, Green, Yellow, Blue | 403, 404, 405, 406 | red, green, yellow, blue |
| Play, Pause | 415, 19 | pause |
| Stop | 413 | back |
| Channel up and down | 33, 34 | (not mapped) |

`disableBackHistoryAPI: true` in appinfo.json makes Back arrive as keyCode
461 instead of navigating browser history. Escape maps to back for desktop
testing, Backspace to `erase`.

## Magic Remote pointer

The pointer behaves like a mouse: `pointermove`, hover and click all work.
webOS fires `cursorStateChange` on the document when the cursor shows or
hides (`event.detail.visibility`); kit.js tracks this in `TV.pointer.active`
and adds `pointer-on` to the body. When the player presses an arrow key the
cursor hides and focus navigation takes over, so every screen must work both
ways. `TV.pointer.x/y` are in stage coordinates. Treat the pointer as
steering only while it has moved recently (the template uses 2.5 seconds).

## Gamepads

Standard mapping via the Gamepad API, polled every frame. Each pad index is a
player number. kit.js maps: A (0) ok, B (1) back, X (2) x, Y (3) y,
LB/RB (4, 5), Select (8) back, Start (9) pause, d-pad and left stick to
directions with key-repeat (380ms delay, then every 110ms). Pads must be
paired in the TV's Bluetooth settings, and a button press is needed before
the browser exposes a pad.

## Keyboard and touch

Letters arrive as `TV.on("char", fn)`. Touch sets `source: "touch"` and adds
the `touch` class to the body (hide focus rings). DOM buttons with class
`focusable` respond to touch, pointer, remote and gamepad alike.

## Menus

Give buttons the class `focusable`, then `TV.focus.scope(containerEl)` when a
menu opens and `TV.focus.scope(null)` when play resumes. Arrows move focus by
screen position, OK clicks. Remember which control had focus before a dialog
opened and restore it after.
