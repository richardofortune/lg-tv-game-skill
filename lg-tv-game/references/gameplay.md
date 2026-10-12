# Gameplay for the living room

Read this when designing or refining the game itself.

## Who is playing

Assume a mixed group: a parent who has not played a game in years, a child
who plays constantly, someone half watching from the couch. Good TV games let
all of them have fun in the same session.

- **Learnable in one look.** The first screen should show what to do with
  almost no words. Teach by doing: make the first ten seconds impossible to
  fail, then add one idea at a time.
- **Short sessions.** Rounds of one to three minutes. Every round ends with a
  clear result and a one-press "Play again".
- **Drop in, drop out.** Extra players join by pressing a button on their
  controller, at the title screen or between rounds. Nobody should need to
  open a settings screen to play together.
- **Forgiving by default.** Losses cost a little, never everything. Use
  combos and streaks that reset rather than lives that end the game early.
- **Rubber-banding for families.** Quietly help whoever is behind: slightly
  more targets near them, a wider catch zone, a head start next round. Never
  punish the leader visibly.

## Controls

Design for the worst controller in the room, the standard remote: four arrows,
OK and Back. Everything must be playable with those alone. Then layer on:

- **Magic Remote pointer** as a motion controller: steering, aiming, drawing,
  waving. This is the TV's most underused input and the cheapest way to make
  a game feel unlike anything else on the platform.
- **Gamepads** for extra players and faster games. Map A to OK and B to Back.
- **Colour buttons** (red, green, yellow, blue) as shortcuts, labelled on
  screen with coloured dots.
- **Keyboard** for word games and for testing.

Back is sacred: in play it pauses, in a menu it goes back, at the top level it
offers quit. Never let Back silently close the game.

Keep turn-based games fully playable with up and down navigation only, and
keep action games' controls to one axis plus one button where possible.

## Feel

- Respond to every input instantly with sound and motion.
- Add juice in proportion to the achievement: a small pop for a point, a
  burst and rising pitch for a combo, a character celebration for a win.
- Use a fixed-step update (kit.js runs at 60 Hz) so the game feels the same
  on fast and slow TVs.
- Avoid precise timing windows below about 150ms. TV input latency varies
  and many sets add 50 to 100ms of display lag.

## Structure

A complete game needs: title screen (with join and sound toggle), play,
pause (Back), results (scores, best, play again), and saved progress or
stats. The template has all of these. Save after every round, wrapped in
try/catch.

## Push the boundaries

Pick at least one of these to make the game memorable:

- **Phones as controllers.** Show a QR code; each phone becomes a private
  controller or hand of cards. Needs a small relay server (WebSocket) that
  the TV and phones both reach; host it yourself and note that LG review
  requires it to be reliable.
- **Pointer-first play.** Draw paths, sling objects, sweep a torch across a
  dark scene, conduct music.
- **Asymmetric co-op.** One player with the pointer, another with a gamepad,
  doing different jobs toward one goal.
- **The TV as a place.** An ambient mode that keeps playing gently when
  nobody touches the remote: a living aquarium, a garden that grows between
  sessions, a scene that follows the real time of day.
- **Daily shared puzzle.** Seed the day's level from the date, so the whole
  family plays the same one and compares at dinner.
- **A character with memory.** The mascot remembers streaks, greets players
  by colour, changes outfit with the seasons.
- **Local flavour.** Words, creatures, places and sounds from where the
  player lives.

## Content

Family friendly by default: no violence beyond cartoon bonks, no fear
mechanics for young players, no real-money anything, no ads, no data
collection. Word games need a curated answer list free of slurs, crude words
and names; keep a separate larger list of accepted guesses. Check the licence
of any word list or asset before publishing.
