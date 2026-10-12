/*
 * game.js: sample game "Firefly Night", built on kit.js.
 * Shows the patterns a TV game needs: title screen with player joining,
 * a canvas game with 1 to 4 players, Magic Remote steering, pause on Back,
 * results, saved best score, sound, and pre-rendered art for speed.
 * Replace the game logic, keep the structure.
 */
(function () {
  "use strict";
  var W = 1920, H = 1080, ROUND = 60;
  var $ = function (s) { return document.querySelector(s); };
  var canvas = $("#game"), g = canvas.getContext("2d");
  var css = getComputedStyle(document.documentElement);
  var COLOURS = ["--p1", "--p2", "--p3", "--p4"].map(function (v) { return css.getPropertyValue(v).trim(); });

  TV.mount($("#stage"), { width: W, height: H });

  // ---------- Pre-rendered art (draw once, blit every frame) ----------
  function makeCanvas(w, h, draw) { var c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; }

  var sky = makeCanvas(W, H, function (c) {
    var grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#070D24"); grd.addColorStop(.55, "#1E2350"); grd.addColorStop(.85, "#4A3360"); grd.addColorStop(1, "#6B4566");
    c.fillStyle = grd; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 260; i++) {
      var x = Math.random() * W, y = Math.random() * H * .6, r = Math.random() * 1.8 + .3;
      c.globalAlpha = Math.random() * .7 + .2; c.fillStyle = "#fff";
      c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
    var moon = c.createRadialGradient(1540, 200, 10, 1540, 200, 260);
    moon.addColorStop(0, "rgba(255,240,200,.5)"); moon.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = moon; c.fillRect(1200, 0, 700, 500);
    var crescent = makeCanvas(160, 160, function (m) {
      m.fillStyle = "#FFF1CC"; m.beginPath(); m.arc(80, 80, 70, 0, 6.283); m.fill();
      m.globalCompositeOperation = "destination-out";
      m.beginPath(); m.arc(112, 64, 64, 0, 6.283); m.fill();
    });
    c.drawImage(crescent, 1460, 120);
    hills(c, 760, 90, "#1A1C40", 3); hills(c, 840, 70, "#14152F", 5); hills(c, 930, 40, "#0C0D20", 9);
    c.fillStyle = "#0C0D20"; c.fillRect(0, 960, W, 120);
    for (var t = 0; t < 140; t++) {
      var gx = Math.random() * W, gh = 20 + Math.random() * 40;
      c.strokeStyle = "#0C0D20"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(gx, 965); c.quadraticCurveTo(gx + 6, 965 - gh / 2, gx + (Math.random() - .5) * 30, 965 - gh); c.stroke();
    }
  });
  function hills(c, base, amp, col, waves) {
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (var x = 0; x <= W; x += 20) c.lineTo(x, base - Math.sin(x / W * Math.PI * waves + base) * amp - Math.sin(x / 140) * 8);
    c.lineTo(W, H); c.closePath(); c.fill();
  }
  function glowSprite(r, rgb) {
    return makeCanvas(r * 2, r * 2, function (c) {
      var grd = c.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, "rgba(" + rgb + ",1)"); grd.addColorStop(.18, "rgba(" + rgb + ",.8)");
      grd.addColorStop(.45, "rgba(" + rgb + ",.22)"); grd.addColorStop(1, "rgba(" + rgb + ",0)");
      c.fillStyle = grd; c.fillRect(0, 0, r * 2, r * 2);
    });
  }
  var GLOW = glowSprite(48, "214,255,120"), GOLD = glowSprite(64, "255,206,90"), SPARK = glowSprite(16, "255,255,220");

  // ---------- State ----------
  var state = "title", players = [], bugs = [], parts = [], floats = [], t = 0, timeLeft = ROUND, spawnT = 0, shake = 0;
  var joined = [true, false, false, false];
  var best = TV.store.get("firefly-best", 0);

  function makePlayer(i, n) {
    var slot = W / (n + 1);
    return { id: i, x: slot * (i + 1), vx: 0, score: 0, combo: 0, comboT: 0, fog: 0, inJar: [] };
  }

  // ---------- Screens ----------
  function show(id) {
    ["title", "pause", "over"].forEach(function (s) { $("#" + s).hidden = s !== id; });
    $("#hud").hidden = !(state === "play" || state === "pause");
    TV.focus.scope(id ? $("#" + id) : null);
  }
  function renderJoins() {
    $("#joins").innerHTML = joined.map(function (on, i) {
      return "<div class='chip p" + (i + 1) + (on ? " on" : "") + "'><i></i>" + (on ? "Player " + (i + 1) : "Press A") + "</div>";
    }).join("");
  }
  function renderSound() { $("#soundBtn").textContent = TV.isMuted() ? "Sound off" : "Sound on"; }

  function start() {
    var ids = []; joined.forEach(function (on, i) { if (on) ids.push(i); });
    players = ids.map(function (id, k) { return makePlayer(id, ids.length); });
    bugs = []; parts = []; floats = []; timeLeft = ROUND; spawnT = 0; t = 0;
    renderScores();
    state = "play"; show(null);
  }
  function pause() { if (state !== "play") return; state = "pause"; show("pause"); }
  function resume() { state = "play"; show(null); }
  function finish() {
    state = "over";
    var top = players.slice().sort(function (a, b) { return b.score - a.score; });
    var newBest = top[0].score > best;
    if (newBest) { best = top[0].score; TV.store.set("firefly-best", best); }
    $("#overTitle").textContent = players.length > 1 ? "Player " + (top[0].id + 1) + " wins" : (newBest ? "New best!" : "Night's over");
    $("#overSub").textContent = "Best ever: " + best;
    $("#results").innerHTML = players.map(function (p) {
      return "<div class='result" + (p === top[0] && players.length > 1 ? " win" : "") + "'><b style='color:" + COLOURS[p.id] + "'>" + p.score + "</b><span>Player " + (p.id + 1) + "</span></div>";
    }).join("");
    TV.sfx(newBest || players.length > 1 ? "win" : "lose");
    show("over");
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act;
    if (act === "play" || act === "restart") start();
    else if (act === "resume") resume();
    else if (act === "menu") { state = "title"; renderJoins(); show("title"); }
    else if (act === "sound") { TV.setMuted(!TV.isMuted()); renderSound(); }
    else if (act === "quit") TV.quit();
  });

  TV.on("action", function (a) {
    if (a.name === "back" || a.name === "pause") {
      if (state === "play") pause();
      else if (state === "pause") resume();
      else if (state === "over") { state = "title"; renderJoins(); show("title"); }
      return;
    }
    if (state === "title" && a.source === "gamepad" && a.name === "ok" && a.player > 0 && !joined[a.player]) {
      joined[a.player] = true; renderJoins(); TV.sfx("good", a.player * 3);
    }
  });

  // ---------- Game update ----------
  function spawn() {
    var gold = Math.random() < 0.06, moth = t > 8 && Math.random() < 0.16 + Math.min(0.12, t / 400);
    bugs.push({
      kind: moth ? "moth" : gold ? "gold" : "fly",
      x: 120 + Math.random() * (W - 240), y: -40, vy: 120 + Math.random() * 80 + t * 1.6,
      phase: Math.random() * 6.28, wob: 40 + Math.random() * 60
    });
  }

  function update(dt) {
    if (state !== "play") { t += dt; return; }
    t += dt; timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; finish(); return; }

    spawnT -= dt;
    var rate = 0.55 - Math.min(0.3, t / 200);
    if (spawnT <= 0) { spawn(); if (players.length > 2) spawn(); spawnT = rate / (0.7 + players.length * 0.3); }

    players.forEach(function (p) {
      var ax = TV.axis(p.id).x;
      if (TV.isDown("left", p.id)) ax = -1;
      if (TV.isDown("right", p.id)) ax = 1;
      var target = null;
      if (p.id === 0 && TV.pointer.active && performance.now() - TV.pointer.lastMove < 2500) target = TV.pointer.x;
      var max = p.fog > 0 ? 600 : 1150;
      if (target !== null) p.vx = Math.max(-max, Math.min(max, (target - p.x) * 9));
      else p.vx += (ax * max - p.vx) * Math.min(1, dt * 14);
      p.x = Math.max(110, Math.min(W - 110, p.x + p.vx * dt));
      p.fog = Math.max(0, p.fog - dt);
      p.comboT -= dt; if (p.comboT <= 0) p.combo = 0;
      p.inJar.forEach(function (f) { f.a += dt * f.s; });
    });

    for (var i = bugs.length - 1; i >= 0; i--) {
      var b = bugs[i];
      b.phase += dt * (b.kind === "moth" ? 7 : 2.4);
      b.y += b.vy * dt;
      b.drawX = b.x + Math.sin(b.phase) * b.wob * (b.kind === "moth" ? 0.6 : 1);
      var caught = null;
      if (b.y > 880 && b.y < 960) players.forEach(function (p) { if (!caught && Math.abs(b.drawX - p.x) < 78) caught = p; });
      if (caught) { catchBug(caught, b); bugs.splice(i, 1); continue; }
      if (b.y > H + 60) bugs.splice(i, 1);
    }
    for (i = parts.length - 1; i >= 0; i--) {
      var q = parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt;
      if (q.life <= 0) parts.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) { floats[i].life -= dt; floats[i].y -= 90 * dt; if (floats[i].life <= 0) floats.splice(i, 1); }
    shake = Math.max(0, shake - dt * 30);
  }

  function catchBug(p, b) {
    if (b.kind === "moth") {
      p.combo = 0; p.fog = 1.2; p.score = Math.max(0, p.score - 2);
      burst(b.drawX, 900, "rgba(180,170,160,", 14);
      floats.push({ x: p.x, y: 860, text: "-2", col: "#FF8A7A", life: 1 });
      if (!TV.reducedMotion) shake = 14;
      TV.sfx("bad");
    } else {
      p.combo++; p.comboT = 1.4;
      var mult = 1 + Math.floor(p.combo / 5), pts = (b.kind === "gold" ? 5 : 1) * mult;
      p.score += pts;
      if (p.inJar.length < 28) p.inJar.push({ a: Math.random() * 6.28, s: 1 + Math.random() * 2, r: 10 + Math.random() * 34, gold: b.kind === "gold" });
      burst(b.drawX, 900, b.kind === "gold" ? "rgba(255,210,100," : "rgba(214,255,120,", 10);
      floats.push({ x: p.x, y: 850, text: "+" + pts + (mult > 1 ? " x" + mult : ""), col: COLOURS[p.id], life: 0.9 });
      TV.sfx("good", Math.min(12, p.combo));
    }
    renderScores();
  }
  function burst(x, y, rgba, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, s = 120 + Math.random() * 260;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200, life: 0.5 + Math.random() * 0.4, c: rgba });
    }
  }

  function renderScores() {
    $("#scores").innerHTML = players.map(function (p) {
      var mult = 1 + Math.floor(p.combo / 5);
      return "<div class='score'><i style='background:" + COLOURS[p.id] + "'></i>" + p.score + (mult > 1 ? "<small>x" + mult + "</small>" : "") + "</div>";
    }).join("");
  }

  // ---------- Render ----------
  var lastSec = -1;
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (shake > 0) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    g.drawImage(sky, 0, 0);

    // Idle fireflies on the title screen keep the TV alive while nobody plays.
    if (state === "title") {
      g.globalCompositeOperation = "lighter";
      for (var k = 0; k < 26; k++) {
        var ix = (k * 337 + Math.sin(t * 0.3 + k) * 120) % W, iy = 400 + Math.sin(t * 0.5 + k * 1.7) * 220 + (k % 5) * 60;
        g.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + k));
        g.drawImage(GLOW, ix - 48, iy - 48);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      return;
    }

    g.globalCompositeOperation = "lighter";
    bugs.forEach(function (b) {
      if (b.kind === "moth") return;
      var blink = 0.55 + 0.45 * Math.sin(b.phase * 2.2);
      g.globalAlpha = blink;
      var s = b.kind === "gold" ? GOLD : GLOW;
      g.drawImage(s, b.drawX - s.width / 2, b.y - s.height / 2);
    });
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    bugs.forEach(function (b) {
      if (b.kind !== "moth") { g.fillStyle = "#FFFCE0"; g.beginPath(); g.arc(b.drawX, b.y, 5, 0, 6.283); g.fill(); return; }
      var flap = Math.abs(Math.sin(b.phase)) * 0.8 + 0.2;
      g.fillStyle = "#8C8076";
      g.beginPath(); g.ellipse(b.drawX - 18 * flap, b.y, 22 * flap, 16, -0.3, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(b.drawX + 18 * flap, b.y, 22 * flap, 16, 0.3, 0, 6.283); g.fill();
      g.fillStyle = "#4D443E"; g.beginPath(); g.ellipse(b.drawX, b.y, 6, 16, 0, 0, 6.283); g.fill();
    });

    players.forEach(drawJar);

    parts.forEach(function (q) { g.globalAlpha = Math.max(0, q.life * 1.6); g.fillStyle = q.c + "1)"; g.beginPath(); g.arc(q.x, q.y, 4, 0, 6.283); g.fill(); });
    g.globalAlpha = 1;
    g.textAlign = "center"; g.font = "800 48px Baloo, Arial, sans-serif";
    floats.forEach(function (f) { g.globalAlpha = Math.min(1, f.life * 2); g.fillStyle = f.col; g.fillText(f.text, f.x, f.y); });
    g.globalAlpha = 1;

    var sec = Math.ceil(timeLeft);
    if (sec !== lastSec) { lastSec = sec; var tm = $("#timer"); tm.textContent = sec; tm.classList.toggle("low", sec <= 10); }
  }

  function drawJar(p) {
    var x = p.x, top = 870, w = 150, h = 150, col = COLOURS[p.id];
    // glow from the catch inside the jar
    if (p.inJar.length) {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = Math.min(0.9, 0.2 + p.inJar.length * 0.04);
      g.drawImage(GOLD, x - 64, top + h / 2 - 64 + 10);
      g.globalAlpha = 1;
      p.inJar.forEach(function (f) {
        g.globalAlpha = 0.5 + 0.5 * Math.sin(f.a * 2);
        g.drawImage(SPARK, x + Math.cos(f.a) * f.r * 1.2 - 16, top + 80 + Math.sin(f.a * 1.3) * f.r * 0.9 - 16);
      });
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    }
    // glass
    g.fillStyle = p.fog > 0 ? "rgba(200,190,180,.35)" : "rgba(190,230,255,.13)";
    g.strokeStyle = "rgba(230,245,255,.65)"; g.lineWidth = 5;
    roundRect(x - w / 2, top + 14, w, h, 34); g.fill(); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.moveTo(x - w / 2 + 22, top + 50); g.lineTo(x - w / 2 + 22, top + 110); g.stroke();
    // lid in the player's colour
    g.fillStyle = col; roundRect(x - w / 2 - 8, top - 6, w + 16, 30, 12); g.fill();
    g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(x - w / 2 - 8, top + 16, w + 16, 6);
  }
  function roundRect(x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // ---------- Go ----------
  renderJoins(); renderSound(); show("title");
  TV.loop(update, render);
})();
