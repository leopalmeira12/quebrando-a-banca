/**
 * DOM DIAGNOSTIC — Cole isso no Console do DevTools na página da Betano
 * e me envie o resultado completo.
 */
(function () {
    console.clear();
    console.log("=== BETANO DOM DIAGNOSTIC ===");

    // 1. Find ALL elements with text that is a number 0-36
    let numEls = [];
    document.querySelectorAll('*').forEach(el => {
        // Get only direct text (not from children)
        let directText = '';
        el.childNodes.forEach(n => {
            if (n.nodeType === 3) directText += n.textContent.trim();
        });

        // Also check full textContent for very simple elements
        const fullText = el.textContent.trim();
        const checkText = directText || fullText;

        if (/^\d{1,2}$/.test(checkText)) {
            const num = parseInt(checkText, 10);
            if (num >= 0 && num <= 36) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    numEls.push({
                        tag: el.tagName,
                        cls: (el.className || '').toString().substring(0, 100),
                        num: num,
                        w: Math.round(r.width),
                        h: Math.round(r.height),
                        x: Math.round(r.left),
                        y: Math.round(r.top),
                        children: el.children.length,
                        parentTag: el.parentElement?.tagName,
                        parentCls: (el.parentElement?.className || '').toString().substring(0, 100),
                        gpTag: el.parentElement?.parentElement?.tagName,
                        gpCls: (el.parentElement?.parentElement?.className || '').toString().substring(0, 100),
                        directText: directText,
                        fullText: fullText.substring(0, 30)
                    });
                }
            }
        }
    });

    console.log(`\nTOTAL NUMBER ELEMENTS (0-36): ${numEls.length}`);
    console.log("First 20 samples:");
    numEls.slice(0, 20).forEach((e, i) => {
        console.log(`  [${i}] <${e.tag}> cls="${e.cls}" num=${e.num} size=${e.w}x${e.h} pos=(${e.x},${e.y}) children=${e.children} directText="${e.directText}" fullText="${e.fullText}"`);
        console.log(`       parent: <${e.parentTag}> cls="${e.parentCls}"`);
        console.log(`       gp: <${e.gpTag}> cls="${e.gpCls}"`);
    });

    // 2. Try a completely different approach - innerHTML regex
    console.log("\n=== APPROACH 2: Container innerHTML regex ===");
    const containers = document.querySelectorAll('a[href], div, section, article');
    let foundRooms = 0;
    containers.forEach(c => {
        const r = c.getBoundingClientRect();
        if (r.width < 100 || r.width > 500 || r.height < 50 || r.height > 500) return;

        const text = c.textContent;
        const nums = text.match(/\b([0-9]|[12][0-9]|3[0-6])\b/g);
        if (nums && nums.length >= 3) {
            const uniqueNums = [...new Set(nums.map(Number))].filter(n => n >= 0 && n <= 36);
            if (uniqueNums.length >= 3 && foundRooms < 10) {
                foundRooms++;
                console.log(`  Container: <${c.tagName}> cls="${(c.className || '').toString().substring(0, 80)}" size=${Math.round(r.width)}x${Math.round(r.height)}`);
                console.log(`  Numbers: [${uniqueNums.join(', ')}]`);
                console.log(`  href: ${c.getAttribute?.('href') || 'none'}`);
                console.log(`  Text preview: "${text.substring(0, 100).replace(/\n/g, ' ')}"`);
                console.log('  ---');
            }
        }
    });
    console.log(`Found ${foundRooms} potential room containers`);

    // 3. Check for Shadow DOM
    console.log("\n=== SHADOW DOM CHECK ===");
    let shadowCount = 0;
    document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
            shadowCount++;
            if (shadowCount <= 5) {
                console.log(`  Shadow host: <${el.tagName}> cls="${(el.className || '').toString().substring(0, 60)}"`);
            }
        }
    });
    console.log(`Total shadow roots: ${shadowCount}`);

    // 4. Check iframes
    console.log("\n=== IFRAMES ===");
    document.querySelectorAll('iframe').forEach((f, i) => {
        console.log(`  [${i}] src="${(f.src || '').substring(0, 100)}" size=${f.width}x${f.height}`);
    });

    console.log("\n=== DIAGNOSTIC COMPLETE ===");
})();
