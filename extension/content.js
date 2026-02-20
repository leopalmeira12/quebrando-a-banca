/**
 * DOZEN TRACKER v34.1 — URL SCRAPER + CLEAN SIGNAL
 * 
 * Scrapes real hrefs from Betano cards and saves to chrome.storage.
 * Signal toast uses real URLs. No junk data.
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
        ".dt-bg{position:absolute!important;top:4px!important;left:4px!important;z-index:9999999!important;background:#000e!important;color:#00ffa3!important;font:bold 13px/1 monospace!important;padding:3px 7px!important;border-radius:4px!important;pointer-events:none!important;border:1px solid #00ffa3!important}",
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
        "#dt-sig .s-x{position:absolute!important;top:6px!important;right:10px!important;color:#484f58!important;cursor:pointer!important;font-size:16px!important;background:none!important;border:none!important;line-height:1!important;padding:4px!important}"
    ].join("\n");
    document.head.appendChild(css);

    function norm(s) { return s.replace(/\s+/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

    function beep(k) {
        if (audioCD[k] && Date.now() - audioCD[k] < 45000) return;
        audioCD[k] = Date.now();
        try { var a = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"); a.volume = 1; a.play().catch(function () { }); } catch (e) { }
    }

    /* ── FIND CARDS ── */
    function findCards() {
        var cards = [];
        var seen = new Set();
        var kw = /roulette|roleta|ruleta/i;

        var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                var tag = n.parentElement ? n.parentElement.tagName : "";
                if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        var node;
        while ((node = walker.nextNode())) {
            var txt = node.textContent.trim();
            if (txt.length < 5 || txt.length > 60 || !kw.test(txt)) continue;

            var el = node.parentElement;
            var best = null;
            for (var i = 0; i < 15 && el; i++) {
                var r = el.getBoundingClientRect();
                var w = r.width, h = r.height;
                // Min width 60px, min height 45px explicitly to capture small bottom-bar thumbnails
                if (w > 60 && w < 400 && h > 45 && h < 350 && h / w > 0.3 && h / w < 3.0) {
                    best = el;
                }
                el = el.parentElement;
            }

            if (!best || best === document.body || seen.has(best)) continue;

            // Skip header/breadcrumb (top of page, small height)
            var br = best.getBoundingClientRect();
            if (br.top < 100 && br.height < 60) continue;

            seen.add(best);

            // Extract href: walk up to find <a> with /games/ in href
            var href = "";
            var cur = best;
            for (var j = 0; j < 20 && cur; j++) {
                if (cur.tagName === "A" && cur.href) {
                    href = cur.href;
                    break;
                }
                cur = cur.parentElement;
            }
            if (!href) {
                var ia = best.querySelector("a[href]");
                if (ia && ia.href) href = ia.href;
            }

            cards.push({ el: best, name: txt, href: href, key: norm(txt) });
        }
        return cards;
    }

    /* ── SAVE URL MAP TO CHROME STORAGE ── */
    function saveUrlMap(cards) {
        var map = {};
        cards.forEach(function (c) {
            if (c.href && c.href.includes("http")) {
                map[norm(c.name)] = { name: c.name, url: c.href };
            }
        });
        try {
            chrome.storage.local.set({ urlMap: map });
        } catch (e) { }
    }

    /* ── SIGNAL ── */
    function signal(name, count, href) {
        if (!hasCards) return;
        var old = document.getElementById("dt-sig");
        if (old) old.remove();

        beep(name);

        var short = (href || "").replace(/https?:\/\/[^/]+/, "").substring(0, 50);

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
    /* ── ACK ── */
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

    /* ── TICK ── */
    async function tick() {
        // --- LOBBY LOGIC ---
        var cards = findCards();
        hasCards = cards.length > 0;
        if (!hasCards) return;

        // Save the real URL map to chrome.storage for the popup
        saveUrlMap(cards);

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

            if (ratio >= 1) {
                if (ack[bn]) {
                    el.classList.add("dt-w"); badge.className = "dt-bg o"; badge.textContent = "\uD83C\uDFAF " + zz + "x";
                } else {
                    el.classList.add("dt-h"); badge.className = "dt-bg r"; badge.textContent = "\uD83C\uDFAF " + zz + "x";
                    var gl = document.createElement("div"); gl.className = "dt-gl"; el.appendChild(gl);
                    signal(c.name, zz, c.href);
                }
            } else if (ratio >= 0.6) {
                el.classList.add("dt-w"); badge.className = "dt-bg o"; badge.textContent = "\u26A0 " + zz + "x";
            } else {
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
    console.log("%c[DT] v34.1", "color:#00ffa3;font-weight:bold;font-size:12px;background:#000;padding:2px 6px");
})();
