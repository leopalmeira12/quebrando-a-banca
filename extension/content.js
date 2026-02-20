/**
 * DOZEN TRACKER v36.0 — OMNI-CARD FINDER (AURA IS BACK)
 * 
 * Aggressive card finding strategy focusing on Anchors and nested text
 * to guarantee AURA over both large lobby cards and tiny in-game thumbnails.
 */
(function () {
    if (window.__DT_ACTIVE) return;
    window.__DT_ACTIVE = true;

    var BACKEND = "http://127.0.0.1:5000";
    var ack = {};
    var audioCD = {};
    var hasCards = false;

    var css = document.createElement("style");
    css.textContent = [
        "@keyframes dtG{0%,100%{box-shadow:0 0 6px 2px #00ffa3}50%{box-shadow:0 0 14px 5px #00ffa3}}",
        "@keyframes dtR{0%,100%{box-shadow:inset 0 0 15px 3px #f00;background:rgba(255,0,0,.08)}50%{box-shadow:inset 0 0 50px 15px #f00;background:rgba(255,0,0,.5)}}",
        ".dt-a{animation:dtG 2.5s infinite!important;border:2px solid #00ffa3!important;border-radius:8px!important;box-sizing:border-box!important}",
        ".dt-w{box-shadow:0 0 10px 3px orange!important;border:2px solid orange!important;border-radius:8px!important;box-sizing:border-box!important}",
        ".dt-h{border:3px solid #f00!important;border-radius:8px!important;box-sizing:border-box!important}",
        ".dt-gl{position:absolute!important;inset:0!important;z-index:999999!important;pointer-events:none!important;border-radius:6px!important;animation:dtR .5s infinite!important}",
        ".dt-bg{position:absolute!important;top:4px!important;left:4px!important;z-index:9999999!important;background:#000e!important;color:#00ffa3!important;font:bold 13px/1 monospace!important;padding:3px 7px!important;border-radius:4px!important;pointer-events:none!important;border:1px solid #00ffa3!important;white-space:nowrap!important}",
        ".dt-bg.r{background:#f00!important;color:#fff!important;border-color:#f00!important}",
        ".dt-bg.o{background:#e90!important;color:#fff!important;border-color:orange!important}",
        "#dt-sig{position:fixed!important;bottom:20px!important;right:20px!important;z-index:99999999!important;width:300px!important;background:linear-gradient(135deg,#0d1117 0%,#161b22 100%)!important;border:1px solid #30363d!important;border-left:4px solid #f00!important;border-radius:10px!important;padding:14px 16px!important;font-family:-apple-system,system-ui,sans-serif!important;color:#fff!important;box-shadow:0 8px 32px rgba(0,0,0,.6)!important;opacity:0;transform:translateY(20px) scale(.95);transition:all .35s cubic-bezier(.4,0,.2,1)!important;pointer-events:auto!important}",
        "#dt-sig.on{opacity:1!important;transform:translateY(0) scale(1)!important}",
        "#dt-sig .s-head{display:flex!important;align-items:center!important;gap:8px!important;margin-bottom:10px!important}",
        "#dt-sig .s-dot{width:8px!important;height:8px!important;border-radius:50%!important;background:#f00!important;flex-shrink:0!important}",
        "#dt-sig .s-title{font-size:11px!important;text-transform:uppercase!important;letter-spacing:1px!important;color:#8b949e!important;font-weight:600!important}",
        "#dt-sig .s-name{font-size:15px!important;font-weight:700!important;color:#fff!important;margin-bottom:4px!important;line-height:1.3!important}",
        "#dt-sig .s-info{font-size:12px!important;color:#8b949e!important;margin-bottom:10px!important}",
        "#dt-sig .s-info b{color:#ff6b6b!important}",
        "#dt-sig .s-btn{display:block!important;background:#00ffa3!important;color:#000!important;text-align:center!important;padding:8px!important;border-radius:6px!important;font-weight:700!important;font-size:12px!important;text-decoration:none!important;cursor:pointer!important;transition:background .2s!important}",
        "#dt-sig .s-btn:hover{background:#00e090!important}",
        "#dt-sig .s-x{position:absolute!important;top:6px!important;right:10px!important;color:#484f58!important;cursor:pointer!important;font-size:16px!important;background:none!important;border:none!important;line-height:1!important;padding:4px!important}",
        "#dt-dbg{position:fixed!important;bottom:4px!important;left:4px!important;z-index:99999999!important;background:#000c!important;color:#00ffa3!important;font:bold 10px/1 monospace!important;padding:3px 6px!important;border-radius:4px!important;pointer-events:none!important;border:1px solid #00ffa333!important}"
    ].join("\n");
    document.head.appendChild(css);

    function norm(s) { return s.replace(/\s+/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

    function beep(k) {
        if (audioCD[k] && Date.now() - audioCD[k] < 45000) return;
        audioCD[k] = Date.now();
        try { var a = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"); a.volume = 1; a.play().catch(function () { }); } catch (e) { }
    }

    function updateDebug(count) {
        var d = document.getElementById("dt-dbg");
        if (!d) { d = document.createElement("div"); d.id = "dt-dbg"; document.body.appendChild(d); }
        d.textContent = "[DT] " + count + " CARDS \uD83D\uDD25";
    }

    /* ── OMNI CARD FINDER ── */
    function findCards() {
        var cards = [];
        var seen = new Set();
        var kw = /roulette|roleta|ruleta/i;

        // ESTRATÉGIA MÁXIMA: Buscar em TODOS os "a" (links de jogos) e imagens ou spans com nome
        var els = document.querySelectorAll("a, span, div");

        for (var i = 0; i < els.length; i++) {
            var el = els[i];

            // Só pegar elements que tem texto direto da sala
            var txt = el.textContent || "";
            // Restringe para pegar só as pontas (sem pai gigante pegando a tela toda)
            if (txt.length < 5 || txt.length > 100 || !kw.test(txt)) continue;

            // Para não confundir com cabeçalhos globais, vamos achar o bounding box do elemento
            var rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || rect.top < 60) continue;

            // Busca o pai dele que mais se aproxima de um "Card" / "Thumbnail"
            // Sem restrição de tamanho mínimo além do trivial 30x30, pra pegar os do rodapé in-game
            var bestCard = null;
            var cur = el;
            for (var j = 0; j < 15 && cur && cur !== document.body; j++) {
                var r = cur.getBoundingClientRect();
                var w = r.width, h = r.height;
                if (w >= 30 && w <= 600 && h >= 30 && h <= 600) {
                    bestCard = cur;
                }
                cur = cur.parentElement;
            }

            if (!bestCard || seen.has(bestCard)) continue;

            seen.add(bestCard);

            // Acha o link real para aquele card
            var href = "";
            if (bestCard.tagName === "A" && bestCard.href) {
                href = bestCard.href;
            } else {
                var innerA = bestCard.querySelector("a[href]");
                if (innerA) href = innerA.href;
            }

            // Simplifica o texto (pega a primeira linha útil em uppercase)
            var lines = txt.split("\n");
            var cleanName = txt.trim();
            for (var l = 0; l < lines.length; l++) {
                if (kw.test(lines[l])) {
                    cleanName = lines[l].trim(); break;
                }
            }

            cards.push({ el: bestCard, name: cleanName, href: href, key: norm(cleanName) });
        }

        console.log("[DT] OmniFinder ->", cards.length, "cards");
        updateDebug(cards.length);
        return cards;
    }

    /* ── SALVAR URL PRA EXTENSÃO OUVINTE ── */
    function saveUrlMap(cards) {
        var map = {};
        cards.forEach(function (c) {
            if (c.href && c.href.includes("http")) {
                map[norm(c.name)] = { name: c.name, url: c.href };
            }
        });
        try { chrome.storage.local.set({ urlMap: map }); } catch (e) { }
    }

    /* ── POPUP NO CANTO INFERIOR (O AVISO DE DÚZIA) ── */
    function signal(name, count, href) {
        if (!hasCards) return;
        var old = document.getElementById("dt-sig");
        if (old) old.remove();

        beep(name);

        var box = document.createElement("div");
        box.id = "dt-sig";
        box.innerHTML =
            '<button class="s-x" id="dt-sx">\u00D7</button>' +
            '<div class="s-head"><span class="s-dot"></span><span class="s-title">Sinal de D\u00FAzia</span></div>' +
            '<div class="s-name">' + name + '</div>' +
            '<div class="s-info">Bateu <b>' + count + 'x</b> sem repetir d\u00FAzias</div>' +
            (href ? '<a class="s-btn" href="' + href + '">\u{1F449} Abrir Mesa</a>' : '');

        document.body.appendChild(box);
        document.getElementById("dt-sx").onclick = function (e) { e.stopPropagation(); box.classList.remove("on"); setTimeout(function () { box.remove(); }, 350); };
        requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add("on"); }); });
        setTimeout(function () { if (box.parentElement) { box.classList.remove("on"); setTimeout(function () { box.remove(); }, 350); } }, 25000);
    }

    /* ── AO CLICAR NA AURA VERMELHA: RECONHECER SINAL ── */
    document.addEventListener("click", function (e) {
        var t = e.target;
        while (t && t !== document.body) {
            if (t.dataset && t.dataset.rn && t.classList.contains("dt-h")) {
                ack[t.dataset.rn] = true;
                t.classList.remove("dt-h"); t.classList.add("dt-w");
                var g = t.querySelector(".dt-gl"); if (g) g.remove();
                var b = t.querySelector(".dt-bg"); if (b) b.className = "dt-bg o";
                var s = document.getElementById("dt-sig"); if (s) { s.classList.remove("on"); setTimeout(function () { s.remove(); }, 350); }
                break;
            }
            t = t.parentElement;
        }
    }, true);

    /* ── TICK PRINCIPAL (A CADA 3s) ── */
    async function tick() {
        var cards = findCards();
        hasCards = cards.length > 0;
        if (!hasCards) return;

        saveUrlMap(cards);

        // Comunica com o Python local
        var st = { rooms: [], threshold: 6 };
        try { var r = await fetch(BACKEND + "/roulette/status"); if (r.ok) st = await r.json(); } catch (e) { }

        var rooms = st.rooms || [];
        var th = st.threshold || 6;

        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            var el = c.el;

            if (getComputedStyle(el).position === "static") el.style.setProperty("position", "relative", "important");
            el.classList.remove("dt-a", "dt-w", "dt-h");
            var ob = el.querySelector(".dt-bg"); if (ob) ob.remove();
            var og = el.querySelector(".dt-gl"); if (og) og.remove();

            var zz = 0, bn = c.name, cn = c.key, best = -1;
            for (var j = 0; j < rooms.length; j++) {
                var rn = norm(rooms[j].room_name);
                if (rn === cn) { zz = rooms[j].zigzag || 0; bn = rooms[j].room_name; break; }
                if ((cn.includes(rn) || rn.includes(cn)) && rn.length > best) { best = rn.length; zz = rooms[j].zigzag || 0; bn = rooms[j].room_name; }
            }

            el.dataset.rn = bn;
            var ratio = zz / th;
            if (ratio < 1 && ack[bn]) ack[bn] = false;

            var badge = document.createElement("div");
            badge.className = "dt-bg";

            // Se for SINAL / AURA VERMELHA
            if (ratio >= 1) {
                if (ack[bn]) {
                    el.classList.add("dt-w"); badge.className = "dt-bg o"; badge.textContent = "\uD83C\uDFAF " + zz + "x";
                } else {
                    el.classList.add("dt-h"); badge.className = "dt-bg r"; badge.textContent = "\uD83C\uDFAF " + zz + "x";
                    var gl = document.createElement("div"); gl.className = "dt-gl"; el.appendChild(gl);
                    signal(c.name, zz, c.href);
                }
            }
            // Se tiver PRÓXIMO do SINAL / AURA LARANJA
            else if (ratio >= 0.6) {
                el.classList.add("dt-w"); badge.className = "dt-bg o"; badge.textContent = "\u26A0 " + zz + "x";
            }
            // Se tiver monitorando normal / AURA VERDE BRILHANTE
            else {
                el.classList.add("dt-a"); badge.textContent = zz + "x";
            }
            el.appendChild(badge);
        }
    }

    try {
        chrome.runtime.onMessage.addListener(function (msg) {
            if (msg.type === "AI_SIGNAL" && msg.alerts && hasCards) {
                msg.alerts.forEach(function (a) {
                    if (!ack[a.room]) {
                        var cards = findCards();
                        var f = null, nn = norm(a.room);
                        for (var k = 0; k < cards.length; k++) {
                            if (cards[k].key === nn || cards[k].key.includes(nn) || nn.includes(cards[k].key)) { f = cards[k]; break; }
                        }
                        signal(f ? f.name : a.room, a.absence, f ? f.href : "");
                    }
                });
            }
        });
        if (window === window.top) chrome.runtime.sendMessage({ type: "START_VISION" });
    } catch (e) { }

    document.addEventListener("click", function () { }, { once: true });
    setTimeout(tick, 2500);
    setInterval(tick, 3000);
    console.log("%c[DT] v36.0 LOADED", "color:#00ffa3;font-weight:bold;font-size:14px;background:#000;padding:4px 8px");
})();
