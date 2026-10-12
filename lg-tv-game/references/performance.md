# Performance on TV hardware

LG TVs run web apps on modest ARM chips, often with less memory than a
budget phone. A game that is smooth on a laptop can stutter on the TV. Test
on the real set early with `ares-inspect` and the Performance panel.

## Budgets
- 60 fps target, 30 fps floor for ambient scenes.
- Package under 20 MB; initial load under 3 seconds.
- Under about 300 live DOM nodes during play.
- Canvas at 1920x1080 is fine; do not use devicePixelRatio scaling on TV.

## Do
- Draw dynamic games on a single canvas; keep menus and HUD in DOM.
- Pre-render static art (backgrounds, glows, sprites) to offscreen canvases
  or images once, then `drawImage`.
- Animate only `transform` and `opacity` in CSS.
- Update DOM text only when its value changes (for example the timer once per
  second, not every frame).
- Pool particles and objects; cap counts.
- Pause the update loop when the page is hidden (kit.js does this).
- Compress images: JPEG for textures, PNG only where transparency is needed,
  SVG for illustration.

## Avoid
- `shadowBlur` and `filter` on canvas.
- CSS `filter: blur`, `backdrop-filter`, and SVG filters on large or moving
  elements.
- Animating `box-shadow`, `width`, `top`, `left` or gradients.
- Large semi-transparent layers stacked over each other during play.
- Loading anything from the internet at run time.
- `setInterval` game loops; use the kit loop.

## Old models
webOS versions differ in browser engine. Stick to ES5-friendly patterns in
core code where possible (the kit avoids newer syntax), test on the oldest
TV you care about, and check LG's spec list for the target years.
