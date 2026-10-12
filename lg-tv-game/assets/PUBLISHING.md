# Publishing to the LG Content Store

Developer Mode installs expire after about 50 hours unless extended. To keep
a game permanently, or to share it, publish through LG's store.

## Steps
1. Create an LG Seller Lounge account at seller.lgappstv.com.
2. Package the game as an .ipk with `ares-package`.
3. In Seller Lounge, App Management, submit the app with: the .ipk, store
   screenshots (1280x720), a
   description, a content rating, icons, and the launcher background and
   splash images LG asks for.
4. Attach the two documents LG requires: a UX scenario (a slide deck
   describing how the app behaves, used by LG testers) and the App Self
   Checklist marked PASS, FAIL or N/A per item. Both templates are
   downloadable inside Seller Lounge.
5. LG runs a pretest, function test and content test. Reviews commonly take
   one to two weeks. Fix any reported failures and resubmit.

Seller Lounge also offers alpha testing on specific TVs before public
release, which can be a way to install on your own TVs without Dev Mode.
Check the current terms after signing in.

## What usually fails review
- Back key closing the app without a confirmation or doing nothing.
- Focus lost or invisible after an action.
- Text cut off at screen edges.
- Crashes or freezes on older webOS versions.
- Missing `requiredACG` in appinfo.json on newer webOS.
- Content that does not match the age rating.

## Licensing before you publish
Everything in the package must be yours or licensed for redistribution:
fonts (SIL OFL is fine; include the licence text), word lists, sounds and
images. Avoid names and visual styles that imitate a known game or brand.
Word lists taken from other games, or under share-alike licences, need
checking or replacing with openly licensed dictionaries.

LG's process and requirements change; check webostv.developer.lge.com and
the Seller Lounge guide for the current version before submitting.
