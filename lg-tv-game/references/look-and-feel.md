# Look and feel for TV games

Read this before designing the screens and art for a game. It covers the
constraints of the living room first, then how to give a game a strong,
distinctive identity within them.

## Contents
1. The 10-foot screen
2. Art direction: pick a world, not a palette
3. Techniques that look rich and stay fast
4. Typography
5. Colour and contrast
6. Focus and feedback
7. Motion
8. Sound
9. Checklist

## 1. The 10-foot screen

People sit about three metres away, often several of them, often with the
lights on and a phone in one hand. Design for a glance, not a read.

- Work on a fixed 1920x1080 stage and let kit.js scale it. Never lay out
  against the window size.
- Keep text and controls 64px inside every edge (the `--safe` token). Some
  TVs still overscan, and edges are where eyes reach last.
- Body text no smaller than 30px, labels no smaller than 26px, headings 60px
  and up. A single short line beats a paragraph every time.
- One focal point per screen. The thing to look at should be the biggest,
  brightest, highest-contrast element, and everything else should recede.
- Big targets. Buttons at least 90px tall; game objects the player must track
  at least 60px across.

## 2. Art direction: pick a world, not a palette

The fastest way to look generic is to start from a colour scheme. Start from
a place and a material instead, then derive everything from it: what the
background is made of, what the pieces are made of, what the buttons are
made of, what makes a sound.

Write a one-paragraph brief before drawing anything, naming:
- the setting (a rock pool at low tide, a night market, a nana's kitchen
  table, a train yard in the rain);
- the hero material for game pieces (pebbles, paper cut-outs, enamel pins,
  felt, glass jars, carved wood);
- one character or creature that reacts to the player;
- three signature details someone would notice on second look.

Make it specific to a culture or place where you can. Local flora and fauna,
regional crafts and everyday objects give a game an identity that a generic
"fantasy" or "neon" look never will. If the person has a place, a family in-joke
or a favourite object, build from that.

Every state the game needs (selected, correct, wrong, disabled, locked)
should be a variation of the same material, not a flat recolour. A correct
answer in a rock-pool game is pāua shell, not "green".

Family friendly means warm and readable, not bland: rounded forms, expressive
faces, gentle failure states, no gore, no fear-based mechanics for young
players.

Push it further than feels safe. A TV is the largest, most cinematic screen in
most homes, and most TV apps waste it on flat tiles. Full-bleed illustrated
scenes, layered parallax, a character with moods, light that moves: these
are what make someone call the rest of the household over.

## 3. Techniques that look rich and stay fast

TV chips are slow, so richness has to be cheap at run time.

- **Procedural raster backgrounds.** Generate textures once with Python
  (numpy, Pillow): sand with ripples, water caustics from a Voronoi field,
  paper grain, star fields, painted gradients. Save as a JPEG (quality 75 to
  80, about 150 to 250 KB at 1600px) and use it as a static background.
- **Inline SVG illustration** for scenery, characters and props. Use gradients
  for form, a lighter stroke along top edges for highlight, a soft radial
  gradient ellipse for contact shadows. Avoid SVG filters.
- **Pre-rendered canvas sprites.** Draw glows, particles and complex shapes
  once into an offscreen canvas and `drawImage` them each frame. Use
  `globalCompositeOperation = "lighter"` for additive light.
- **Layered CSS backgrounds** for game pieces: a radial "gloss" highlight, a
  speckle texture (several radial-gradient dot layers at odd sizes so no grid
  shows), and a base gradient. Add depth with a hard offset `box-shadow` plus
  a soft one.
- **Irregular shapes** with eight-value `border-radius` so pieces look
  handmade rather than machined.
- **Anchor scenery to screen corners**, scaled with `--s`, so it fills
  portrait phones and ultra-wide windows as well as the TV.

## 4. Typography

Use one characterful display face with heavy weights, embedded in the
package (TV fonts vary by model and the store review may run offline). The
template ships Baloo 2 under the SIL Open Font License. Good alternatives
from Google Fonts: Fredoka, Lilita One, Bricolage Grotesque, Rubik, Nunito.
Subset fonts to Latin with `pyftsubset` to keep them under 100 KB, and keep
macrons and accents if the game uses te reo Māori or other languages.

## 5. Colour and contrast

- Contrast ratio of at least 4.5:1 for all text against what is behind it.
  Add a soft text shadow when text sits over illustration.
- Never carry meaning on hue alone. States must differ in lightness and
  texture too, so colour-blind players can play.
- TVs oversaturate and crush blacks. Avoid pure black backgrounds and pure
  saturated primaries; mid-dark tinted backgrounds read better.
- Give each player a colour that differs in hue and lightness from the others
  and from the board's state colours.

## 6. Focus and feedback

Remote players navigate by focus, so focus is the cursor.
- Focus ring at least 6px, high contrast, with a small scale-up (1.05) and
  lift. It must be obvious from across the room within half a second.
- Hide the focus ring when the player is using touch (kit.js adds a `touch`
  class).
- Every input gets an immediate response within 100ms: a sound, a squash, a
  colour change. Silence feels like a dropped input.

## 7. Motion

- Use motion to explain: pieces flip to reveal, characters react, rewards
  burst. Avoid motion that only decorates and never stops, except slow
  ambient movement (kelp, clouds) which makes the scene feel alive.
- Animate only `transform` and `opacity`. Keep ambient loops slow (6 to 10
  seconds) and subtle.
- Respect `prefers-reduced-motion` and `TV.reducedMotion`: turn off shake,
  shimmer and ambient loops.
- Give the title screen an attract mode, so a TV left on the game looks
  alive rather than frozen.

## 8. Sound

Sound sells feel more than art does. kit.js synthesises effects with Web Audio
so there is nothing to license. Rules: a soft tick for focus moves, a
two-note select, rising pitch for combos, a gentle descending phrase for
failure (never a harsh buzzer for children), and a mute option on the title
screen. Audio only starts after the first input, so never rely on sound for
the first thing the player needs to know.

## 9. Checklist

- [ ] One-paragraph art brief written and followed
- [ ] All text 26px or larger and 64px from the edges
- [ ] State colours differ in lightness and texture, not just hue
- [ ] Focus ring visible from three metres
- [ ] Title screen has idle animation
- [ ] Reduced motion respected
- [ ] Screenshots reviewed at 1920x1080 and on a phone
