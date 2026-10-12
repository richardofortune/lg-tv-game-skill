/*
 * kit.js: a small runtime for LG webOS TV games.
 * Handles the 1920x1080 stage, every input device a living room has
 * (remote, Magic Remote pointer, gamepads, keyboard, touch), spatial focus
 * for menus, a fixed-step game loop, synthesised sound, storage and quitting.
 * No dependencies. Works in any modern browser too, for testing.
 */
(function (global) {
  "use strict";

  var isTV = /Web0S|webOS/i.test(navigator.userAgent);
  var reducedMotion = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // ---------- Events ----------
  var handlers = {};
  function on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return fn; }
  function off(evt, fn) { var h = handlers[evt]; if (h) handlers[evt] = h.filter(function (f) { return f !== fn; }); }
  function emit(evt, data) { (handlers[evt] || []).slice().forEach(function (fn) { fn(data); }); }

  // ---------- Stage ----------
  var stage = null, opts = {}, scale = 1, portrait = false;
  function mount(el, o) {
    stage = el;
    opts = o || {};
    opts.width = opts.width || 1920; opts.height = opts.height || 1080;
    stage.style.position = "absolute"; stage.style.left = "0"; stage.style.top = "0";
    stage.style.transformOrigin = "0 0";
    window.addEventListener("resize", fit);
    fit();
  }
  function fit() {
    if (!stage) return;
    var w = window.innerWidth, h = window.innerHeight;
    portrait = !!opts.portrait && h > w;
    var sw = portrait ? opts.portrait.width : opts.width;
    var sh = portrait ? opts.portrait.height : opts.height;
    stage.style.width = sw + "px"; stage.style.height = sh + "px";
    scale = Math.min(w / sw, h / sh);
    stage.style.transform = "translate(" + (w - sw * scale) / 2 + "px," + (h - sh * scale) / 2 + "px) scale(" + scale + ")";
    document.documentElement.style.setProperty("--s", scale);
    document.body.classList.toggle("portrait-mode", portrait);
    emit("resize", { width: sw, height: sh, scale: scale, portrait: portrait });
  }
  function toStage(clientX, clientY) {
    var r = stage.getBoundingClientRect();
    return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
  }

  // ---------- Input: actions ----------
  // Every device is normalised into named actions:
  // up down left right ok back red green yellow blue pause x y lb rb erase
  // Each action event carries { name, player, source, repeat }.
  var KEY = {
    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, SPACE: 32, BACKSPACE: 8, ESC: 27,
    BACK: 461, RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
    PLAY: 415, PAUSE: 19, PLAYPAUSE: 10252, STOP: 413
  };
  var keyMap = {};
  keyMap[KEY.LEFT] = "left"; keyMap[KEY.RIGHT] = "right"; keyMap[KEY.UP] = "up"; keyMap[KEY.DOWN] = "down";
  keyMap[KEY.OK] = "ok"; keyMap[KEY.SPACE] = "ok";
  keyMap[KEY.BACK] = "back"; keyMap[KEY.ESC] = "back"; keyMap[KEY.BACKSPACE] = "erase";
  keyMap[KEY.RED] = "red"; keyMap[KEY.GREEN] = "green"; keyMap[KEY.YELLOW] = "yellow"; keyMap[KEY.BLUE] = "blue";
  keyMap[KEY.PLAY] = "pause"; keyMap[KEY.PAUSE] = "pause"; keyMap[KEY.PLAYPAUSE] = "pause"; keyMap[KEY.STOP] = "back";

  var held = {};          // "player:action" -> true
  var lastSource = "remote";
  function isDown(name, player) { return !!held[(player || 0) + ":" + name]; }
  function fire(name, player, source, repeat) {
    lastSource = source;
    document.body.classList.toggle("touch", source === "touch");
    emit("action", { name: name, player: player || 0, source: source, repeat: !!repeat });
  }

  document.addEventListener("keydown", function (e) {
    unlockAudio();
    var name = keyMap[e.keyCode];
    if (name) {
      held["0:" + name] = true;
      fire(name, 0, "remote", e.repeat);
      e.preventDefault();
      return;
    }
    if (e.key && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
      emit("char", { char: e.key.toLowerCase() });
    }
  });
  document.addEventListener("keyup", function (e) {
    var name = keyMap[e.keyCode];
    if (name) held["0:" + name] = false;
  });

  // ---------- Pointer (Magic Remote, mouse, touch) ----------
  var pointer = { x: 0, y: 0, active: false, lastMove: 0, down: false };
  document.addEventListener("pointermove", function (e) {
    if (!stage) return;
    var p = toStage(e.clientX, e.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.active = true; pointer.lastMove = performance.now();
    emit("pointer", pointer);
  });
  document.addEventListener("pointerdown", function (e) {
    unlockAudio();
    pointer.down = true;
    if (e.pointerType === "touch") { document.body.classList.add("touch"); lastSource = "touch"; }
    if (stage) { var p = toStage(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; }
    emit("pointerdown", pointer);
  });
  document.addEventListener("pointerup", function () { pointer.down = false; emit("pointerup", pointer); });
  // webOS fires this when the Magic Remote cursor shows or hides.
  document.addEventListener("cursorStateChange", function (e) {
    pointer.active = !!(e.detail && e.detail.visibility);
    document.body.classList.toggle("pointer-on", pointer.active);
  });

  // ---------- Gamepads ----------
  var padPrev = {}, padRepeat = {}, axes = {};
  var REPEAT_START = 380, REPEAT_EVERY = 110, DEAD = 0.35;
  var padButtons = { 0: "ok", 1: "back", 2: "x", 3: "y", 4: "lb", 5: "rb", 8: "back", 9: "pause" };
  function pollPads(now) {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var i = 0; i < pads.length; i++) {
      var p = pads[i]; if (!p) continue;
      var btn = function (n) { return !!(p.buttons[n] && p.buttons[n].pressed); };
      var ax = p.axes || [];
      var x = Math.abs(ax[0] || 0) > DEAD ? ax[0] : 0, y = Math.abs(ax[1] || 0) > DEAD ? ax[1] : 0;
      if (btn(14)) x = -1; if (btn(15)) x = 1; if (btn(12)) y = -1; if (btn(13)) y = 1;
      axes[i] = { x: x, y: y };
      var dirs = { left: x < -0.5, right: x > 0.5, up: y < -0.5, down: y > 0.5 };
      Object.keys(dirs).forEach(function (d) {
        var id = i + ":" + d;
        held[id] = dirs[d];
        if (dirs[d]) {
          if (!padRepeat[id]) { padRepeat[id] = now + REPEAT_START; fire(d, i, "gamepad"); }
          else if (now >= padRepeat[id]) { padRepeat[id] = now + REPEAT_EVERY; fire(d, i, "gamepad", true); }
        } else padRepeat[id] = 0;
      });
      var nowHeld = {};
      Object.keys(padButtons).forEach(function (n) {
        var id = i + ":b" + n, down = btn(+n), name = padButtons[n];
        nowHeld[name] = nowHeld[name] || down;
        if (down && !padPrev[id]) { unlockAudio(); fire(name, i, "gamepad"); }
        padPrev[id] = down;
      });
      Object.keys(nowHeld).forEach(function (name) { held[i + ":" + name] = nowHeld[name]; });
    }
  }
  window.addEventListener("gamepadconnected", function (e) { emit("padconnect", { player: e.gamepad.index }); });
  window.addEventListener("gamepaddisconnected", function (e) { emit("paddisconnect", { player: e.gamepad.index }); });
  function axis(player) { return axes[player || 0] || { x: 0, y: 0 }; }
  function padCount() {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [], n = 0;
    for (var i = 0; i < pads.length; i++) if (pads[i]) n++;
    return n;
  }

  // ---------- Focus navigation for menus ----------
  // Mark buttons with class "focusable". Call focus.scope(el) to make a
  // container the active menu; arrows move, OK activates (fires click).
  var focusScope = null;
  var focus = {
    scope: function (el, first) {
      focusScope = el;
      if (!el) return;
      var target = first || el.querySelector(".focusable");
      if (target) target.focus({ preventScroll: true });
    },
    current: function () { return focusScope; },
    move: function (dir) {
      if (!focusScope) return;
      var items = Array.prototype.slice.call(focusScope.querySelectorAll(".focusable")).filter(function (el) { return el.offsetParent !== null; });
      var cur = document.activeElement;
      if (items.indexOf(cur) < 0) { if (items[0]) items[0].focus({ preventScroll: true }); return; }
      var a = centre(cur), best = null, bestScore = Infinity;
      items.forEach(function (el) {
        if (el === cur) return;
        var b = centre(el), dx = b.x - a.x, dy = b.y - a.y, main, side;
        if (dir === "left")  { if (dx > -5) return; main = -dx; side = Math.abs(dy); }
        if (dir === "right") { if (dx < 5)  return; main = dx;  side = Math.abs(dy); }
        if (dir === "up")    { if (dy > -5) return; main = -dy; side = Math.abs(dx); }
        if (dir === "down")  { if (dy < 5)  return; main = dy;  side = Math.abs(dx); }
        var score = main + side * 3;
        if (score < bestScore) { bestScore = score; best = el; }
      });
      if (best) { best.focus({ preventScroll: true }); sfx("tick"); }
    },
    activate: function () {
      var el = document.activeElement;
      if (focusScope && el && focusScope.contains(el)) { sfx("select"); el.click(); }
    }
  };
  function centre(el) { var b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }
  on("action", function (a) {
    if (!focusScope) return;
    if (a.name === "up" || a.name === "down" || a.name === "left" || a.name === "right") focus.move(a.name);
    else if (a.name === "ok") focus.activate();
  });
  document.addEventListener("mouseover", function (e) {
    var el = e.target.closest && e.target.closest(".focusable");
    if (el && focusScope && focusScope.contains(el) && document.activeElement !== el) el.focus({ preventScroll: true });
  });

  // ---------- Loop ----------
  // Fixed 60 Hz update for consistent physics, render once per frame.
  var running = false, acc = 0, last = 0, STEP = 1 / 60, updateFn = null, renderFn = null;
  function loop(update, render) { updateFn = update; renderFn = render; if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function frame(now) {
    pollPads(now);
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!document.hidden && updateFn) {
      acc += dt;
      while (acc >= STEP) { updateFn(STEP); acc -= STEP; }
    }
    if (renderFn) renderFn(acc / STEP);
    requestAnimationFrame(frame);
  }
  // Make sure gamepads still work on menu screens before a game loop starts.
  requestAnimationFrame(function idle(now) { if (!running) { pollPads(now); requestAnimationFrame(idle); } });

  // ---------- Storage ----------
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- Sound ----------
  // Synthesised, so there are no audio files to license or load.
  var ctx = null, master = null, muted = store.get("tvkit-muted", false);
  function unlockAudio() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
  }
  function tone(freq, dur, type, vol, slide, delay) {
    if (!ctx) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  var SFX = {
    tick:   function () { tone(880, 0.05, "triangle", 0.12); },
    select: function () { tone(660, 0.08, "triangle", 0.2); tone(990, 0.1, "triangle", 0.18, null, 0.06); },
    good:   function (p) { var f = 520 * Math.pow(2, (p || 0) / 12); tone(f, 0.12, "sine", 0.3); tone(f * 1.5, 0.14, "sine", 0.15, null, 0.04); },
    bad:    function () { tone(220, 0.25, "sawtooth", 0.12, 110); },
    win:    function () { [0, 4, 7, 12].forEach(function (s, i) { tone(523 * Math.pow(2, s / 12), 0.25, "triangle", 0.25, null, i * 0.11); }); },
    lose:   function () { [7, 4, 0].forEach(function (s, i) { tone(392 * Math.pow(2, s / 12), 0.3, "triangle", 0.2, null, i * 0.16); }); }
  };
  function sfx(name, arg) { if (!muted && SFX[name]) SFX[name](arg); }
  function setMuted(m) { muted = m; store.set("tvkit-muted", m); if (master) master.gain.value = m ? 0 : 0.5; }

  // ---------- Toast ----------
  var toastEl = null, toastTimer = null;
  function toast(msg, ms) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "tv-toast"; toastEl.setAttribute("role", "status"); (stage || document.body).appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 1600);
  }

  // ---------- Quit ----------
  function quit() {
    try { if (window.webOS && webOS.platformBack) { webOS.platformBack(); return; } } catch (e) {}
    window.close();
  }

  if (!isTV) document.documentElement.classList.add("web");

  global.TV = {
    isTV: isTV, reducedMotion: reducedMotion, KEY: KEY,
    mount: mount, fit: fit, toStage: toStage,
    on: on, off: off, emit: emit,
    isDown: isDown, axis: axis, padCount: padCount, pointer: pointer,
    lastSource: function () { return lastSource; },
    focus: focus, loop: loop, store: store,
    sfx: sfx, tone: tone, setMuted: setMuted, isMuted: function () { return muted; }, unlockAudio: unlockAudio,
    toast: toast, quit: quit,
    get scale() { return scale; }, get portrait() { return portrait; }
  };
})(window);
