---
name: lg-tv-game
description: Guide someone through designing, building, testing and installing a game for an LG smart TV (webOS), and output the playable game files, an installable .ipk, and plain-English setup docs. Includes a TV runtime (remote, Magic Remote pointer, gamepads, focus navigation, sound, saving), a polished couch co-op template, and best-practice guidance on look, feel and gameplay for the living room. Use this whenever someone wants to make, port or improve a game or interactive toy for an LG TV, webOS, a smart TV, or "something the kids can play on the telly", even if they never say webOS, and when they ask how to sideload, package, or publish a TV game.
---

# LG TV game builder

Help a person go from an idea to a game running on their LG TV, with a look
and feel good enough that the household wants to play it. LG TVs run webOS,
whose apps are web pages (HTML, CSS, JavaScript) packaged as an .ipk, so the
whole game is web code.

The person may be a developer or a parent who has never opened a terminal.
Match your language to them, and do the technical work yourself rather than
handing them steps you could run.

## What to deliver

Every time, unless the person asks for less:

1. **The game folder**, built from the template and passing `scripts/check_game.py`.
2. **An .ipk** packaged with the webOS CLI (`scripts/package.sh`), if npm is
   reachable. If not, say so and leave the folder ready to package.
3. **A playable preview**: a single self-contained HTML file from
   `scripts/inline.py`, published as a hosted artifact if the environment
   supports it, so they can try it on a phone or laptop straight away.
4. **SETUP.md** (generated, then adjusted to the game's controls) explaining
   Developer Mode, pairing, installing, playing and updating, and
   **PUBLISHING.md** for getting it out of Dev Mode.
5. A short reply covering what you made, how to install it, and one or two
   ideas for what to do next. Keep the reply brief; the docs hold the detail.

## Workflow

### 1. Shape the idea (one short exchange)

If the request is vague, ask one question with tappable options if that tool
exists, covering what matters most: the kind of game, and who plays
(young children, family, one player, several). Do not interrogate. If they
named a game ("like Wordle", "a racing game"), go with it and decide the
rest yourself, stating your assumptions.

If they reference a well-known game, make an original game with the same kind
of fun under a new name and a distinct look. Game mechanics are fine to use;
names, characters, logos and distinctive art are not.

### 2. Write the brief

Before code, write a five-line brief for yourself (not necessarily shown):
core loop, controls on a basic remote, how extra players join, the art
direction (setting, hero material, a reacting character, three signature
details), and one boundary-pushing element. Read `references/look-and-feel.md`
and `references/gameplay.md` the first time you use this skill in a
conversation; they are what separate a great TV game from a web page on a TV.

### 3. Scaffold

```bash
python scripts/new_game.py --title "Game Name" --out /home/claude/game-name \
    --id com.<owner>.<gamename> --vendor "<Owner>" --bg "#hex" --accent "#hex"
```

This copies `assets/template/` (kit.js runtime, sample game, styles, embedded
font), fills in appinfo.json, generates icons and a splash screen, and writes
SETUP.md and PUBLISHING.md. Use the person's name or brand for the id and
vendor if known.

### 4. Build the game

- Keep `kit.js` unchanged unless you need a new capability; add to it rather
  than rewriting. Read `references/input.md` for its API and key codes.
- Replace `game.js` with the new game, keeping the template's structure:
  title screen with join and sound toggle, play, pause on Back, results with
  play again, saved best score or stats.
- Put dynamic play on the canvas and menus, HUD and dialogs in DOM with the
  `focusable` class. A turn-based or word game can be DOM-only (see
  `assets/examples/kupu.html`, a fully themed word game built this way).
- Re-theme `style.css` from the tokens at the top, then go well beyond tokens:
  illustrated backgrounds, textured pieces, a character. Generate raster
  textures with Python and illustrate with inline SVG as described in the
  look-and-feel reference.
- Support a portrait phone layout when it makes sense for the game (pass a
  `portrait` size to `TV.mount`) so the preview plays well on a phone.
- Follow `references/performance.md`. The TV is much slower than your test
  browser.

### 5. Test and self-review

```bash
python scripts/check_game.py /home/claude/game-name
python scripts/inline.py /home/claude/game-name /home/claude/game-name-preview.html
python scripts/screenshot.py /home/claude/game-name-preview.html /home/claude/shots --keys "Enter,ArrowRight,ArrowRight"
```

Look at the screenshots yourself (TV, 1280x720 store size, phone). Ask: would
this make someone in the room say "ooh"? Is there one clear focal point? Is
every bit of text readable from the couch? Does it look like a specific place
or thing, or like a template? Fix what you find and re-shoot. Also play
through the key paths in the headless browser with keyboard events: start,
score, pause with Escape, finish, play again. Zero page errors is the bar.

If Playwright is missing, try `pip install playwright` and
`python -m playwright install chromium`; if that fails, skip screenshots and
say so.

### 6. Package and deliver

```bash
bash scripts/package.sh /home/claude/game-name /home/claude/out
```

Copy the .ipk, a zip of the game folder (including SETUP.md and
PUBLISHING.md) and the preview HTML to the outputs folder. Publish the
preview as an artifact if available, and present the files. Bump `version`
in appinfo.json for every rebuild you hand over.

### 7. Iterate

When they ask for changes, edit the game folder, re-run check, screenshots
and package, and update the same published preview rather than creating a
new one. If they say it looks basic, take the art direction a level further
(illustrated scene, textures, character expressions, ambient life), not just
new colours.

## Non-negotiables for a TV game

- Fixed 1920x1080 stage scaled to fit; text 26px or larger; 64px safe margin.
- Fully playable with arrows, OK and Back alone. Back pauses or goes back,
  never silently quits.
- Visible focus at all times when using the remote.
- Works offline: no runtime network requests, fonts and assets embedded.
- No `alert`, `confirm` or `prompt`.
- Storage wrapped in try/catch.
- Family friendly unless the person clearly wants otherwise.

## Files in this skill

- `assets/template/`: the starter game (appinfo.json, index.html, kit.js,
  game.js, style.css, fonts with licence).
- `assets/examples/kupu.html`: a finished, heavily themed word game for
  reference on art direction and DOM-based play.
- `assets/SETUP.template.md`, `assets/PUBLISHING.md`: player-facing docs.
- `scripts/new_game.py`, `check_game.py`, `inline.py`, `screenshot.py`,
  `package.sh`.
- `references/look-and-feel.md`, `gameplay.md`, `input.md`,
  `performance.md`, `publishing.md`.
