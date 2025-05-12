// ==UserScript==
// @name         TikTok Video & Image URL Exporter
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Scrolls through TikTok pages and exports video/photo URLs (with optional view counts & captions) as TXT or JSON
// @author       generative AI
// @match        https://www.tiktok.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // Default options
    const defaults = {
        scrollCount: 5,                // number of scroll iterations
        scrollDelay: 1500,             // ms between scrolls
        adapt_text_output: true,       // sanitize filename
        allow_images: true,            // include photo URLs
        export_format: 'txt',          // 'txt' or 'json'
        output_name: '',               // custom filename
    };

    let opts = GM_getValue('tiktok_exporter_opts', defaults);
    function saveOpts() { GM_setValue('tiktok_exporter_opts', opts); }

    // Register menu command
    GM_registerMenuCommand('Export TikTok Links', startExport);

    async function startExport() {
        container = new Map(); skip = new Set();
        for (let i = 0; i < opts.scrollCount; i++) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            await new Promise(r => setTimeout(r, opts.scrollDelay));
        }
        collectLinks();
        generateFile();
    }

    let container; let skip;

    function collectLinks() {
        // fallback: grab all anchors with /video/ or /photo/
        const anchors = document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]');
        anchors.forEach(a => {
            const url = a.href.split('?')[0];
            if (!opts.allow_images && url.includes('/photo/')) return;
            if (!skip.has(url)) {
                skip.add(url);
                container.set(url, {});
            }
        });
    }

    function sanitizeName(name) {
        return name.replace(/[<>:"\\\/|?*]/g, '_');
    }

    function generateFile() {
        const arr = Array.from(container.keys());
        let content;
        if (opts.export_format === 'json') content = JSON.stringify(arr, null, 2);
        else content = arr.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        let filename = opts.output_name || document.title || 'TikTokLinks';
        filename = sanitizeName(filename);
        filename += opts.export_format === 'json' ? '.json' : '.txt';
        const url = URL.createObjectURL(blob);
        GM_download({ url, name: filename, saveAs: true });
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

})();
