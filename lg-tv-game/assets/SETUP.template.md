# {{TITLE}}: getting it onto your LG TV

This takes about 15 minutes the first time. After that, installing a new version is one command.

## What you need

An LG TV running webOS (most LG smart TVs from 2014 on), a computer on the same Wi-Fi network, Node.js installed on the computer (nodejs.org), and a free LG developer account from webostv.developer.lge.com.

## One-off setup

1. On the TV, open the LG Content Store, search for **Developer Mode** and install it.
2. Open Developer Mode on the TV, sign in with your LG developer account and switch **Dev Mode Status** on. The TV restarts.
3. Open Developer Mode again and switch **Key Server** on. Note the TV's IP address and the passphrase it shows.
4. On the computer, install LG's command-line tools:

       npm install -g @webos-tools/cli

5. Add the TV. Name it `tv`, enter its IP address, and accept the other defaults:

       ares-setup-device

6. Pair with the TV. Enter the passphrase when asked:

       ares-novacom --device tv --getkey

## Install and play

From the folder that contains `{{FOLDER}}`:

    ares-package {{FOLDER}}
    ares-install --device tv {{APP_ID}}_1.0.0_all.ipk
    ares-launch --device tv {{APP_ID}}

The game also appears in the TV's app list, so you can start it from the remote like any other app.

## Playing

The TV remote works out of the box: arrows to move, OK to select, Back to pause. Point the Magic Remote at the screen to steer with it. Bluetooth gamepads (Xbox, PlayStation and most others) pair in the TV's Bluetooth settings, and each extra gamepad can join as another player.

To try it without a TV, open `{{FOLDER}}/index.html` in a desktop browser. Arrow keys, Enter and Esc stand in for the remote.

## Updating the game

After changing any file, run `ares-package` and `ares-install` again. Bump `version` in `appinfo.json` when you share a new build, and use the new version number in the .ipk file name.

## Debugging

    ares-inspect --device tv --app {{APP_ID}} --open

This opens Chrome DevTools connected to the game running on the TV.

## Keeping Developer Mode alive

Developer Mode sessions expire after about 50 hours. Open the Developer Mode app and press **Extend** to reset the timer. If it lapses, your installed games disappear until you install them again. To keep a game permanently, publish it through the LG Content Store; see PUBLISHING.md.

## If something goes wrong

**ares-setup-device can't reach the TV.** Check both devices are on the same network, and that Key Server is on in the Developer Mode app.

**Install fails with a key or SSH error.** Run the `--getkey` step again; the key changes when Developer Mode is reset.

**The game opens but the remote does nothing.** Click once inside the game or press OK; the TV sometimes gives focus to the app a moment after launch.

**Nothing appears after an update.** Close the app fully (hold Back, or switch inputs) and launch it again.
