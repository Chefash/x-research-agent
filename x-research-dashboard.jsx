import { useState } from "react";

const API = "http://localhost:8000";

// ── MOCK DATA ──
const MOCK_TWEETS = [
  { id: "t001", text: "Most people write threads nobody reads.\n\nHere's the difference between viral threads and dead ones:\n\n(It's not what you think)", author: "Justin Welsh", handle: "JustinSaaS", tweet_type: "thread", likes: 8420, retweets: 1830, replies: 312, quotes: 204, image_urls: [], author_followers: 487000, tweet_url: "#" },
  { id: "t002", text: "Unpopular opinion: Your content calendar is killing your growth.\n\nThe best creators I know don't plan content. They react to what's happening and say what nobody else will say.", author: "Dickie Bush", handle: "dickiebush", tweet_type: "tweet", likes: 5100, retweets: 943, replies: 287, quotes: 156, image_urls: [], author_followers: 212000, tweet_url: "#" },
  { id: "t003", text: "I generated $2.4M from a 15,000-person email list.\n\nMost people chase followers. I chase readers.\n\nHere's exactly how I did it 🧵", author: "Nicolas Cole", handle: "Nicolascole77", tweet_type: "thread", likes: 12300, retweets: 3200, replies: 580, quotes: 410, image_urls: ["https://pbs.twimg.com/media/example.jpg"], author_followers: 134000, tweet_url: "#" },
  { id: "t004", text: "Hot take: The creators winning on X in 2025 aren't the best writers.\n\nThey're the most consistent truth-tellers.", author: "Dan Koe", handle: "thedankoe", tweet_type: "tweet", likes: 3890, retweets: 712, replies: 199, quotes: 88, image_urls: [], author_followers: 398000, tweet_url: "#" },
  { id: "t005", text: "My writing changed forever when I stopped trying to be interesting\n\nand started trying to be honest.\n\nThe weird part? It made me more interesting.", author: "Paul Millerd", handle: "p_millerd", tweet_type: "tweet", likes: 6720, retweets: 1540, replies: 223, quotes: 178, image_urls: [], author_followers: 89000, tweet_url: "#" },
];

const MOCK_ANALYSIS = {
  hook_analysis: {
    hook_type: "Curiosity Gap", hook_line: "Most people write threads nobody reads.", hook_score: 9,
    hook_breakdown: "Opens with a painful universal truth that immediately creates identification. 'Nobody reads' is hyperbolic but emotionally accurate. The promise of the real answer ('it's not what you think') overrides the skip reflex.",
    format: "Thread", tone: "Authoritative", audience: "Aspiring creators who've tried threading and gotten zero results",
    writing_style: "Short declarative sentences. No jargon. Conversational but confident. Line breaks used as emphasis, not punctuation.",
    emotional_trigger: "Validation + Curiosity", shareability: "High",
    shareability_reason: "People retweet things that make them look insightful to their followers — this does that.",
    key_idea: "Viral threads aren't about topic, they're about structure and hook engineering.",
    content_angle: "Counter-narrative / How-to hybrid",
    visual_direction: "If adding an image: stark black-and-white typography card. Single headline. No stock photos. Heavy Serif font on white — looks like a book cover, not a social post.",
    adaptation_hooks: [
      "Most brands post content nobody saves. Here's the 3-post structure that changed our metrics:",
      "Unpopular opinion: Your 'content strategy' is just procrastination with extra steps.",
      "I analyzed 200 viral brand posts. The #1 thing they had in common wasn't what I expected."
    ]
  },
  reply_analysis: {
    top_reactions: ["Personal validation ('this is me')", "Asking for the thread link", "Sharing their own failed thread experience"],
    audience_questions: ["What's the ideal thread length?", "Does posting time matter?", "Should the first tweet be the hook or the value?"],
    friction_points: ["'Easier said than done' — people doubt they can execute", "Debate over whether threads are even worth it anymore"],
    amplifier_phrases: ["nobody talks about this", "saved this", "this is the whole game right here", "took notes"],
    reply_sentiment: "Positive",
    community_insight: "This audience is sophisticated enough to be skeptical but hungry enough to engage. They've consumed a lot of creator content and can smell generic advice instantly. They amplify posts that make them feel seen and validated in their struggles — not posts that make them feel taught at."
  },
  image_analysis: {}
};

// ── UTILS ──
const fmt = n => n >= 1000000 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n || 0);
const typeColor = t => t === "thread" ? "#F59E0B" : t === "quote_tweet" ? "#8B5CF6" : "#1D9BF0";
const typeLabel = t => t === "thread" ? "THREAD" : t === "quote_tweet" ? "QUOTE" : "TWEET";

export default function App() {
  const [view, setView] = useState("search");
  const [projects, setProjects] = useState([{
    id: "p001", name: "Creator Economy Q3", client: "Typefully",
    brand_bible: "B2B SaaS for serious creators. Tone: smart, direct, no fluff. Audience: solopreneurs and professional creators 25-40 who take their writing seriously. Core: we make great writers grow faster.",
    brief_template: "## Hook Strategy\n## Voice & Tone\n## Content Angles (x3)\n## Opening Lines to Test\n## Visual Direction\n## Audience Language\n## CTA Strategy"
  }]);
  const [activeProject, setActiveProject] = useState("p001");
  const [keyword, setKeyword] = useState("creator economy growth");
  const [count, setCount] = useState(20);
  const [contentType, setContentType] = useState("mixed");
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState(new Set());
  const [brief, setBrief] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newProj, setNewProj] = useState({ name: "", client: "", brand_bible: "", brief_template: "" });
  const [briefTab, setBriefTab] = useState("formatted");

  const project = projects.find(p => p.id === activeProject);

  async function doSearch() {
    setLoading(true); setLoadingMsg("Searching X...");
    try {
      const r = await fetch(`${API}/search`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: activeProject, keyword, count, content_type: contentType }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setSearchResults(d.tweets);
    } catch { setSearchResults(MOCK_TWEETS); }
    setSelected(new Set());
    setLoading(false); setView("results");
  }

  async function doAnalyze() {
    if (!selected.size) return;
    setLoading(true); setLoadingMsg(`Analyzing ${selected.size} posts with Gemini...`);
    try {
      const r = await fetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: activeProject, tweet_ids: [...selected] }) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setAnalyses(d.analyses);
    } catch {
      const demo = [...selected].map((id, i) => {
        const src = searchResults.find(t => t.id === id) || {};
        return { id: `a00${i+1}`, tweet_id: id, project_id: activeProject, text: src.text || "", author: src.author || "", handle: src.handle || "", tweet_type: src.tweet_type || "tweet", tweet_url: src.tweet_url || "#", likes: src.likes || 0, retweets: src.retweets || 0, replies_count: src.replies || 0, image_urls: src.image_urls || [], ...MOCK_ANALYSIS };
      });
      setAnalyses(demo);
    }
    setSelectedAnalyses(new Set());
    setLoading(false); setView("analysis");
  }

  async function doGenerate() {
    if (!selectedAnalyses.size) return;
    setLoading(true); setLoadingMsg("Generating creative brief with Gemini...");
    try {
      const r = await fetch(`${API}/generate-brief`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: activeProject, analysis_ids: [...selectedAnalyses] }) });
      if (!r.ok) throw new Error();
      setBrief(await r.json());
    } catch {
      setBrief({
        id: "b001", client: project?.client, project_name: project?.name, post_count: selectedAnalyses.size,
        created_at: new Date().toISOString(),
        content: `## Hook Strategy
**Primary Hook Type:** Curiosity Gap + Validated Pain Point
**What's working in this space:** Hooks that open with a painful universal truth before delivering the counter-intuitive answer. The best performing posts DON'T start with "I" — they start with the audience's problem.

**Opening Line Formula:** [Common thing everyone does] + [Surprising consequence]
Example: "Most [audience] do [thing]. Here's why it's costing them [outcome]."

## Voice & Tone
**Tone:** Direct, confident, occasionally contrarian. Never preachy. Sounds like the smartest person in the room who's also self-aware enough to know it.
**What to avoid:** Corporate language, vague platitudes ("leverage synergies"), hedging ("might", "could", "perhaps")
**Sentence length:** Short. Then shorter. Then one word. Then a full idea.

## Content Angles
**Angle 1 — The Counter-Narrative:** Challenge a widely-held belief in the space. "Unpopular opinion: [thing everyone agrees with] is actually holding you back."
**Angle 2 — The Transparent Result:** Lead with a specific number/outcome, then explain the unexpected method. "$X from Y [resource] — here's the part nobody talks about:"
**Angle 3 — The Honest Confession:** Vulnerability that teaches. "I spent [time] doing [wrong thing]. What I should have done instead:"

## Opening Lines to Test
1. "Most creators optimize for followers. The ones making real money optimize for something else entirely."
2. "Unpopular opinion: Your content strategy is just procrastination with extra steps."
3. "I analyzed 200 viral posts in this space. The pattern wasn't what I expected."
4. "Hot take: The best posts aren't written. They're lived, then written."

## Visual Direction
**When to add images:** Use stark typography cards — single headline, maximum contrast, serif or ultra-bold sans. Looks editorial, not designed.
**Color palette:** Black/white with one accent. Never gradients. Never stock photography.
**Composition:** Text-dominant. If product, show in use not in studio. Real > polished.

## Audience Language
**Phrases they use:** "nobody talks about this", "took notes", "this is the whole game", "saved"
**Pain points to reference:** Posting consistently with no growth, comparing themselves to big accounts, feeling like they're doing everything right but nothing works
**Questions they're asking:** How long until it works? Is [platform] even worth it anymore? Does posting time matter?

## CTA Strategy
**Best performing CTA pattern:** Soft internal CTA ("Thread below 👇") beats hard external links on initial posts
**Reply baiting:** End with a genuine question that the audience actually has an answer to
**Link timing:** Drop links in replies, not in posts — engagement drops 30%+ with links in body`
      });
    }
    setLoading(false); setView("brief");
  }

  const toggleTweet = id => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAnalysis = id => setSelectedAnalyses(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const navItems = [
    { id: "search", label: "Search", icon: "⌕" },
    { id: "results", label: "Posts", icon: "≡", count: searchResults.length },
    { id: "analysis", label: "Analysis", icon: "◈", count: analyses.length },
    { id: "brief", label: "Brief", icon: "✦", count: brief ? 1 : 0 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", color: "#111", fontFamily: "'Libre Franklin', 'Georgia', serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#F0EDE8;}::-webkit-scrollbar-thumb{background:#ccc;}
        input,textarea,select{outline:none;}
        .nav-btn{cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 12px;font-family:'Libre Franklin',serif;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#999;transition:all 0.12s;border-bottom:2px solid transparent;}
        .nav-btn:hover{color:#111;}
        .nav-btn.active{color:#111;border-bottom-color:#111;}
        .btn{cursor:pointer;border:none;font-family:'Libre Franklin',serif;font-weight:700;letter-spacing:0.04em;transition:all 0.12s;text-transform:uppercase;}
        .btn-ink{background:#111;color:#F7F5F0;padding:10px 22px;font-size:11px;}
        .btn-ink:hover{background:#000;}
        .btn-ink:disabled{background:#ddd;color:#aaa;cursor:not-allowed;}
        .btn-outline{background:transparent;color:#111;border:1.5px solid #111;padding:9px 20px;font-size:11px;}
        .btn-outline:hover{background:#111;color:#F7F5F0;}
        .btn-blue{background:#1D9BF0;color:#fff;padding:10px 22px;font-size:11px;}
        .btn-blue:hover{background:#1A8CD8;}
        .card{background:#fff;border:1px solid #E8E4DC;}
        .input-base{background:#fff;border:1.5px solid #ddd;color:#111;padding:10px 14px;font-family:'Libre Franklin',serif;font-size:13px;transition:border-color 0.12s;width:100%;}
        .input-base:focus{border-color:#111;}
        .tweet-card{cursor:pointer;transition:all 0.12s;border:1.5px solid #E8E4DC;}
        .tweet-card:hover{border-color:#999;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.06);}
        .tweet-card.sel{border-color:#1D9BF0;background:#F0F8FF;}
        .label{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#aaa;margin-bottom:6px;display:block;font-family:'Libre Franklin',serif;}
        .tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:2px 8px;border-radius:2px;font-family:'Libre Franklin',serif;}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:50;}
        .brief-section h2{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#111;margin:24px 0 10px;padding-bottom:6px;border-bottom:2px solid #111;}
        .brief-section p{font-size:13px;line-height:1.8;color:#444;margin-bottom:8px;}
        .brief-section strong{color:#111;font-weight:700;}
        .brief-section li{font-size:13px;line-height:1.8;color:#444;margin-left:20px;margin-bottom:4px;}
        .loading-veil{position:fixed;inset:0;background:rgba(247,245,240,0.92);backdrop-filter:blur(2px);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:100;}
        @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        .ticker-track{display:flex;animation:ticker 12s linear infinite;white-space:nowrap;}
        .ticker-item{padding:0 24px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#ccc;}
        .score-ring{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;flex-shrink:0;}
        .project-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
        .tab{cursor:pointer;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:5px 12px;border-radius:2px;font-family:'Libre Franklin',serif;color:#aaa;transition:all 0.12s;}
        .tab.active{background:#111;color:#fff;}
      `}</style>

      {/* Loading */}
      {loading && (
        <div className="loading-veil">
          <div style={{ overflow: "hidden", width: 320, marginBottom: 20 }}>
            <div className="ticker-track">
              {["ANALYZING","PROCESSING","RESEARCHING","BRIEFING","ANALYZING","PROCESSING","RESEARCHING","BRIEFING"].map((w,i) => (
                <span key={i} className="ticker-item">{w} ·</span>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: "'Playfair Display'", fontSize: 32, fontWeight: 900, color: "#111", textAlign: "center", lineHeight: 1.1 }}>
            {loadingMsg.split(" ").map((w, i) => <span key={i} style={{ display: "inline-block", marginRight: 8 }}>{w}</span>)}
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: 580, padding: 36, maxHeight: "85vh", overflowY: "auto", borderRadius: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 26, fontWeight: 900, marginBottom: 28 }}>New Project</div>
            {[["Project Name", "name", "Q3 X Research"], ["Client Name", "client", "Acme Inc"]].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 18 }}>
                <label className="label">{label}</label>
                <input className="input-base" placeholder={ph} value={newProj[key]} onChange={e => setNewProj(p => ({...p, [key]: e.target.value}))} />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Brand Bible</label>
              <textarea className="input-base" rows={5} placeholder="Tone, audience, product, what to avoid..." value={newProj.brand_bible} onChange={e => setNewProj(p => ({...p, brand_bible: e.target.value}))} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="label">Brief Template</label>
              <textarea className="input-base" rows={5} placeholder="## Hook Strategy&#10;## Voice & Tone&#10;## Content Angles&#10;## Visual Direction" value={newProj.brief_template} onChange={e => setNewProj(p => ({...p, brief_template: e.target.value}))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-ink" onClick={() => {
                if (!newProj.name) return;
                const pid = `p${Date.now()}`;
                setProjects(p => [...p, { id: pid, ...newProj }]);
                setActiveProject(pid);
                setNewProj({ name: "", client: "", brand_bible: "", brief_template: "" });
                setShowModal(false);
              }}>Create Project</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 200, borderRight: "1px solid #E8E4DC", background: "#FDFCFA", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Masthead */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "2px solid #111" }}>
          <div style={{ fontFamily: "'Playfair Display'", fontWeight: 900, fontSize: 17, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            X RESEARCH<br />
            <span style={{ color: "#1D9BF0" }}>AGENT</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, color: "#ccc", marginTop: 4, letterSpacing: "0.1em" }}>v1.0 · POWERED BY GEMINI</div>
        </div>

        {/* Nav */}
        <div style={{ padding: "12px 8px", borderBottom: "1px solid #E8E4DC" }}>
          {navItems.map(n => (
            <div key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} style={{ borderBottom: "none", borderRadius: 4, marginBottom: 2, justifyContent: "space-between" }} onClick={() => setView(n.id)}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "monospace", fontSize: 13 }}>{n.icon}</span>
                {n.label}
              </span>
              {n.count > 0 && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#aaa" }}>{n.count}</span>}
            </div>
          ))}
        </div>

        {/* Projects */}
        <div style={{ padding: "16px 8px", flex: 1, overflowY: "auto" }}>
          <div className="label" style={{ padding: "0 8px" }}>Projects</div>
          {projects.map(p => (
            <div key={p.id} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 4, background: activeProject === p.id ? "#111" : "transparent", color: activeProject === p.id ? "#F7F5F0" : "#777", fontSize: 12, fontFamily: "'Libre Franklin'", fontWeight: 600 }} onClick={() => setActiveProject(p.id)}>
              <div className="project-dot" style={{ background: activeProject === p.id ? "#1D9BF0" : "#ddd" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.client}</span>
            </div>
          ))}
          <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", color: "#ccc", fontSize: 12, fontFamily: "'Libre Franklin'", fontWeight: 600, marginTop: 4 }} onClick={() => setShowModal(true)}>
            + New project
          </div>
        </div>

        {/* Bottom rules */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E4DC", fontSize: 9, color: "#ccc", lineHeight: 1.6, fontFamily: "'Libre Franklin'" }}>
          Data via Twitter135 API<br />Analysis via Gemini 1.5 Pro
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header strip */}
        <div style={{ borderBottom: "2px solid #111", padding: "0 28px", display: "flex", alignItems: "center", gap: 0, height: 48, background: "#FDFCFA" }}>
          {navItems.map(n => (
            <div key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
              {n.label}
              {n.count > 0 && <span style={{ marginLeft: 4, fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#aaa" }}>({n.count})</span>}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontFamily: "'Playfair Display'", fontSize: 12, color: "#ccc", fontStyle: "italic" }}>
            {project?.client} — {project?.name}
          </div>
          {view === "results" && selected.size > 0 && (
            <button className="btn btn-blue" style={{ marginLeft: 16 }} onClick={doAnalyze}>
              Analyze {selected.size} →
            </button>
          )}
          {view === "analysis" && selectedAnalyses.size > 0 && (
            <button className="btn btn-ink" style={{ marginLeft: 16 }} onClick={doGenerate}>
              Generate Brief →
            </button>
          )}
          {view === "brief" && brief && (
            <a href={`${API}/export/docx/${brief.id}`} download style={{ marginLeft: 16 }}>
              <button className="btn btn-outline">↓ DOCX</button>
            </a>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>

          {/* ── SEARCH ── */}
          {view === "search" && (
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  Research.<br /><span style={{ color: "#1D9BF0" }}>Brief.</span><br />Ship.
                </div>
                <div style={{ fontSize: 13, color: "#999", marginTop: 12, lineHeight: 1.7 }}>
                  Find what's working on X. Analyze hooks, tone, and visuals.<br />Generate briefs in one click.
                </div>
              </div>

              <div className="card" style={{ padding: 28, borderRadius: 0, borderTop: "3px solid #111" }}>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Search Query</label>
                  <input className="input-base" style={{ fontSize: 15 }} value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="creator economy, SaaS growth, productivity..." />
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Content Type</label>
                    <select className="input-base" value={contentType} onChange={e => setContentType(e.target.value)}>
                      <option value="mixed">All formats</option>
                      <option value="threads">Threads only</option>
                      <option value="tweets">Single tweets</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Results</label>
                    <select className="input-base" value={count} onChange={e => setCount(Number(e.target.value))}>
                      {[10,20,30,50].map(n => <option key={n} value={n}>{n} posts</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-ink" onClick={doSearch} style={{ width: "100%", padding: "13px 20px", fontSize: 12 }}>
                  Search X →
                </button>
              </div>

              {project?.brand_bible && (
                <div style={{ marginTop: 20, padding: "16px 20px", borderLeft: "3px solid #1D9BF0", background: "#F0F8FF" }}>
                  <div className="label" style={{ color: "#1D9BF0" }}>Active brand context</div>
                  <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{project.brand_bible.slice(0, 200)}{project.brand_bible.length > 200 ? "..." : ""}</div>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTS ── */}
          {view === "results" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#aaa" }}>{searchResults.length} results for "{keyword}"</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 10 }} onClick={() => setSelected(new Set(searchResults.map(t => t.id)))}>Select All</button>
                  <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 10 }} onClick={() => setSelected(new Set())}>Clear</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {searchResults.map(t => (
                  <div key={t.id} className={`tweet-card ${selected.has(t.id) ? "sel" : ""}`} style={{ padding: "18px 22px", borderRadius: 0, display: "flex", gap: 16, cursor: "pointer", background: "#fff" }} onClick={() => toggleTweet(t.id)}>
                    {/* Checkbox */}
                    <div style={{ width: 18, height: 18, border: `2px solid ${selected.has(t.id) ? "#1D9BF0" : "#ddd"}`, background: selected.has(t.id) ? "#1D9BF0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2, fontSize: 10, color: "#fff", borderRadius: 2 }}>
                      {selected.has(t.id) && "✓"}
                    </div>
                    <div style={{ flex: 1 }}>
                      {/* Author row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{t.author}</span>
                        <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'JetBrains Mono'" }}>@{t.handle}</span>
                        <span className="tag" style={{ background: typeColor(t.tweet_type) + "18", color: typeColor(t.tweet_type), marginLeft: "auto" }}>{typeLabel(t.tweet_type)}</span>
                        {t.author_followers > 0 && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#ccc" }}>{fmt(t.author_followers)} followers</span>}
                      </div>
                      {/* Tweet text */}
                      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.65, marginBottom: 12, fontFamily: "'Libre Franklin'", whiteSpace: "pre-line" }}>
                        {t.text.length > 220 ? t.text.slice(0, 220) + "…" : t.text}
                      </div>
                      {/* Stats */}
                      <div style={{ display: "flex", gap: 20, fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#aaa" }}>
                        <span>♥ {fmt(t.likes)}</span>
                        <span>↺ {fmt(t.retweets)}</span>
                        <span>💬 {fmt(t.replies)}</span>
                        {t.has_images && <span>🖼 Image</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selected.size > 0 && (
                <div style={{ position: "sticky", bottom: 0, padding: "14px 0", textAlign: "center", background: "linear-gradient(transparent, #F7F5F0)" }}>
                  <button className="btn btn-blue" onClick={doAnalyze} style={{ padding: "12px 36px", fontSize: 12 }}>
                    Analyze {selected.size} post{selected.size > 1 ? "s" : ""} with Gemini →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYSIS ── */}
          {view === "analysis" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#aaa" }}>{analyses.length} analyses complete</div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 10 }} onClick={() => setSelectedAnalyses(new Set(analyses.map(a => a.id)))}>Select All</button>
                  <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: 10 }} onClick={() => setSelectedAnalyses(new Set())}>Clear</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {analyses.map(a => {
                  const h = a.hook_analysis || {};
                  const r = a.reply_analysis || {};
                  const isExp = expanded === a.id;
                  const isSel = selectedAnalyses.has(a.id);
                  const score = h.hook_score || 0;
                  const scoreColor = score >= 8 ? "#22C55E" : score >= 6 ? "#F59E0B" : "#EF4444";

                  return (
                    <div key={a.id} style={{ background: "#fff", border: `1.5px solid ${isSel ? "#1D9BF0" : "#E8E4DC"}`, borderLeft: `4px solid ${isSel ? "#1D9BF0" : typeColor(a.tweet_type)}` }}>
                      <div style={{ padding: "18px 22px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                        {/* Select + Score */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <div style={{ width: 18, height: 18, border: `2px solid ${isSel ? "#1D9BF0" : "#ddd"}`, background: isSel ? "#1D9BF0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", cursor: "pointer", borderRadius: 2 }} onClick={() => toggleAnalysis(a.id)}>
                            {isSel && "✓"}
                          </div>
                          <div className="score-ring" style={{ border: `2px solid ${scoreColor}`, color: scoreColor }}>
                            {h.hook_score || "?"}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", align: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>@{a.handle}</span>
                            <span className="tag" style={{ background: typeColor(a.tweet_type) + "18", color: typeColor(a.tweet_type) }}>{typeLabel(a.tweet_type)}</span>
                            {h.hook_type && <span className="tag" style={{ background: "#F3F0EB", color: "#666" }}>{h.hook_type}</span>}
                            <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#aaa" }}>♥ {fmt(a.likes)}  ↺ {fmt(a.retweets)}</span>
                          </div>

                          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.65, marginBottom: 12, fontStyle: "italic", borderLeft: "2px solid #E8E4DC", paddingLeft: 12 }}>
                            "{a.text?.slice(0, 180)}{(a.text?.length || 0) > 180 ? "…" : ""}"
                          </div>

                          {h.hook_line && (
                            <div style={{ marginBottom: 10 }}>
                              <span className="label" style={{ display: "inline" }}>Hook: </span>
                              <span style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>"{h.hook_line}"</span>
                            </div>
                          )}
                          {h.hook_breakdown && (
                            <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6, marginBottom: 12 }}>{h.hook_breakdown}</div>
                          )}

                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-outline" style={{ fontSize: 9, padding: "5px 10px" }} onClick={() => setExpanded(isExp ? null : a.id)}>
                              {isExp ? "▲ Collapse" : "▼ Full Analysis"}
                            </button>
                            {a.tweet_url && a.tweet_url !== "#" && (
                              <a href={a.tweet_url} target="_blank" rel="noreferrer">
                                <button className="btn btn-outline" style={{ fontSize: 9, padding: "5px 10px" }}>View on X ↗</button>
                              </a>
                            )}
                          </div>

                          {isExp && (
                            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                              {/* Hook details */}
                              <div style={{ padding: 16, background: "#FDFCFA", border: "1px solid #E8E4DC" }}>
                                <div className="label">Hook Intelligence</div>
                                {[["Tone", h.tone], ["Format", h.format], ["Emotional Trigger", h.emotional_trigger], ["Shareability", h.shareability], ["Content Angle", h.content_angle]].filter(([,v]) => v).map(([k, v]) => (
                                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
                                    <span style={{ color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</span>
                                    <span style={{ color: "#111", fontWeight: 600 }}>{v}</span>
                                  </div>
                                ))}
                                {h.audience && <div style={{ fontSize: 11, color: "#777", marginTop: 10, lineHeight: 1.6, paddingTop: 10, borderTop: "1px solid #E8E4DC" }}><strong>Audience:</strong> {h.audience}</div>}
                                {h.writing_style && <div style={{ fontSize: 11, color: "#777", marginTop: 6, lineHeight: 1.6 }}><strong>Style:</strong> {h.writing_style}</div>}
                              </div>

                              {/* Reply insights */}
                              <div style={{ padding: 16, background: "#FDFCFA", border: "1px solid #E8E4DC" }}>
                                <div className="label">Reply Intelligence</div>
                                {r.reply_sentiment && (
                                  <div style={{ marginBottom: 10 }}>
                                    <span className="tag" style={{ background: r.reply_sentiment === "Positive" ? "#D1FAE5" : r.reply_sentiment === "Critical" ? "#FEE2E2" : "#FEF3C7", color: r.reply_sentiment === "Positive" ? "#065F46" : r.reply_sentiment === "Critical" ? "#991B1B" : "#92400E" }}>{r.reply_sentiment}</span>
                                  </div>
                                )}
                                {r.amplifier_phrases?.length > 0 && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div className="label">Amplifier Phrases</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                      {r.amplifier_phrases.map((p, i) => <span key={i} style={{ fontSize: 10, background: "#F0F8FF", border: "1px solid #BFDBFE", color: "#1D4ED8", padding: "2px 7px", borderRadius: 2 }}>"{p}"</span>)}
                                    </div>
                                  </div>
                                )}
                                {r.audience_questions?.length > 0 && (
                                  <div>
                                    <div className="label">Top Questions</div>
                                    {r.audience_questions.slice(0, 3).map((q, i) => <div key={i} style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>· {q}</div>)}
                                  </div>
                                )}
                                {r.community_insight && <div style={{ fontSize: 11, color: "#777", marginTop: 10, lineHeight: 1.6, paddingTop: 10, borderTop: "1px solid #E8E4DC" }}>{r.community_insight}</div>}
                              </div>

                              {/* Visual direction */}
                              {(h.visual_direction || a.image_urls?.length > 0) && (
                                <div style={{ padding: 16, background: "#FDFCFA", border: "1px solid #E8E4DC", gridColumn: "span 2" }}>
                                  <div className="label">Visual Direction</div>
                                  {a.image_urls?.[0] && <img src={a.image_urls[0]} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginBottom: 10, border: "1px solid #E8E4DC" }} />}
                                  {h.visual_direction && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{h.visual_direction}</div>}
                                </div>
                              )}

                              {/* Adaptation hooks */}
                              {h.adaptation_hooks?.length > 0 && (
                                <div style={{ padding: 16, background: "#F0F8FF", border: "1px solid #BFDBFE", gridColumn: "span 2" }}>
                                  <div className="label" style={{ color: "#1D9BF0" }}>✦ Adaptation Hooks</div>
                                  {h.adaptation_hooks.map((hook, i) => (
                                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 12 }}>
                                      <span style={{ color: "#1D9BF0", fontFamily: "'JetBrains Mono'", fontWeight: 500 }}>{i+1}.</span>
                                      <span style={{ color: "#1E3A5F", fontStyle: "italic" }}>"{hook}"</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedAnalyses.size > 0 && (
                <div style={{ position: "sticky", bottom: 0, textAlign: "center", padding: "14px 0", background: "linear-gradient(transparent, #F7F5F0)" }}>
                  <button className="btn btn-ink" onClick={doGenerate} style={{ padding: "12px 36px", fontSize: 12 }}>
                    Generate Brief from {selectedAnalyses.size} post{selectedAnalyses.size > 1 ? "s" : ""} →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── BRIEF ── */}
          {view === "brief" && brief && (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ borderBottom: "3px solid #111", paddingBottom: 20, marginBottom: 28, display: "flex", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display'", fontSize: 38, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {brief.client?.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Libre Franklin'", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#1D9BF0", marginTop: 4 }}>
                    X Content Brief
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#aaa", marginTop: 6 }}>
                    {brief.project_name}  ·  Based on {brief.post_count} posts  ·  {new Date(brief.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ display: "flex", background: "#F3F0EB", borderRadius: 4, padding: 3 }}>
                    {[["formatted","Styled"],["raw","Raw"]].map(([id, label]) => (
                      <div key={id} className={`tab ${briefTab === id ? "active" : ""}`} onClick={() => setBriefTab(id)}>{label}</div>
                    ))}
                  </div>
                  <button className="btn btn-outline" style={{ fontSize: 10, padding: "7px 14px" }} onClick={() => navigator.clipboard.writeText(brief.content)}>Copy</button>
                  <a href={`${API}/export/docx/${brief.id}`} download>
                    <button className="btn btn-ink" style={{ fontSize: 10, padding: "7px 14px" }}>↓ DOCX</button>
                  </a>
                </div>
              </div>

              {briefTab === "raw" ? (
                <pre style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#666", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{brief.content}</pre>
              ) : (
                <div className="brief-section">
                  {brief.content.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i}><strong>{line.slice(2,-2)}</strong></p>;
                    if (line.startsWith("- ") || line.startsWith("• ")) return <li key={i}>{line.slice(2)}</li>;
                    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                    const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
                    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
                  })}
                </div>
              )}
            </div>
          )}

          {view === "brief" && !brief && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display'", fontSize: 52, fontWeight: 900, color: "#E8E4DC", lineHeight: 1 }}>No brief yet.</div>
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 12 }}>Search → Select posts → Analyze → Generate brief</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
