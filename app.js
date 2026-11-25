// Shared helpers for the reading pages and the writing studio.
(function () {
  const S = window.SITE;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function inline(s) {
    // s is already escaped
    return s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/(^|\W)_(?!\s)(.+?)_(?=\W|$)/g, "$1<em>$2</em>");
  }

  // Simple writing format:
  //   blank line = new paragraph      ## Heading      ### Small heading
  //   > quote      ***  or  ---  = scene break      - list item
  //   **bold**     *italic*
  function render(text) {
    const blocks = String(text || "").replace(/\r\n?/g, "\n").split(/\n\s*\n/);
    const out = [];
    for (let raw of blocks) {
      const b = raw.trim();
      if (!b) continue;
      if (/^(\*\s*\*\s*\*|-{3,}|⁂)$/.test(b)) { out.push("<hr>"); continue; }
      if (b.startsWith("### ")) { out.push("<h3>" + inline(esc(b.slice(4))) + "</h3>"); continue; }
      if (b.startsWith("## ")) { out.push("<h2>" + inline(esc(b.slice(3))) + "</h2>"); continue; }
      if (b.startsWith("# ")) { out.push("<h2>" + inline(esc(b.slice(2))) + "</h2>"); continue; }
      const lines = b.split("\n");
      if (lines.every(l => /^\s*>/.test(l))) {
        const q = lines.map(l => inline(esc(l.replace(/^\s*>\s?/, "")))).join("<br>");
        out.push("<blockquote><p>" + q + "</p></blockquote>"); continue;
      }
      if (lines.every(l => /^\s*[-•]\s+/.test(l))) {
        out.push("<ul>" + lines.map(l => "<li>" + inline(esc(l.replace(/^\s*[-•]\s+/, ""))) + "</li>").join("") + "</ul>");
        continue;
      }
      out.push("<p>" + lines.map(l => inline(esc(l))).join("<br>") + "</p>");
    }
    return out.join("\n");
  }

  function plain(text) {
    return String(text || "")
      .replace(/^#+\s+/gm, "").replace(/^>\s?/gm, "").replace(/\*\*|\*|_/g, "")
      .replace(/^(-{3,}|⁂)$/gm, "").replace(/\s+/g, " ").trim();
  }
  function words(text) { const p = plain(text); return p ? p.split(" ").length : 0; }
  function excerpt(text, n) {
    const p = plain(text); n = n || 200;
    if (p.length <= n) return p;
    return p.slice(0, n).replace(/\s+\S*$/, "") + "…";
  }
  function minutes(w) { return Math.max(1, Math.round(w / 200)); }
  function niceDate(iso) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return ""; }
  }
  const KIND = { story: "Story", longread: "Long read", essay: "Essay", note: "Note" };

  // Reading side: load the list and single posts from the site itself.
  async function loadIndex() {
    if (window.DEMO_POSTS) return window.DEMO_POSTS.map(p => ({ ...p, excerpt: excerpt(p.body), words: words(p.body) }));
    const r = await fetch("posts/index.json?v=" + Date.now(), { cache: "no-store" });
    if (r.status === 404) return [];
    if (!r.ok) throw new Error("Could not load stories (" + r.status + ")");
    return r.json();
  }
  async function loadPost(slug) {
    if (window.DEMO_POSTS) return window.DEMO_POSTS.find(p => p.slug === slug) || null;
    if (!/^[a-z0-9-]+$/.test(slug)) return null;
    const r = await fetch("posts/" + slug + ".json?v=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return null;
    return r.json();
  }

  function link(slug) { return "post.html" + (window.DEMO_POSTS ? "#" : "?p=") + encodeURIComponent(slug); }
  function currentSlug() { return new URLSearchParams(location.search).get("p") || decodeURIComponent(location.hash.slice(1)); }

  window.App = { link, currentSlug, S, esc, render, plain, words, excerpt, minutes, niceDate, KIND, loadIndex, loadPost };
})();
