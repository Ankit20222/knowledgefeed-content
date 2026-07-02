// Shared post schema + validator for the KnowledgeFeed content pipeline.
// Kept in lock-step with the Swift models (Post.swift / Slide.swift / etc.).

export const CATEGORIES = [
  "AI Innovations", "AI News", "AI Concepts", "Prompt Engineering", "LLMs",
  "RAG", "MCP", "AI Agents", "Cloud", "AWS", "Azure", "GCP", "Docker",
  "Kubernetes", "System Design", "Backend", "Databases", "Networking",
  "Security", "Operating Systems", "Productivity", "Career", "Interview Prep"
];

export const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export const SLIDE_KINDS = [
  "cover", "problem", "solution", "architecture",
  "example", "comparison", "takeaways", "concept"
];

// A curated SF Symbol per category, used as the deterministic hero/illustration
// when no AI image is generated.
export const CATEGORY_SYMBOL = {
  "AI Innovations": "sparkles",
  "AI News": "newspaper.fill",
  "AI Concepts": "brain.head.profile",
  "Prompt Engineering": "text.bubble.fill",
  "LLMs": "cpu.fill",
  "RAG": "doc.text.magnifyingglass",
  "MCP": "point.3.connected.trianglepath.dotted",
  "AI Agents": "figure.walk.motion",
  "Cloud": "cloud.fill",
  "AWS": "shippingbox.fill",
  "Azure": "square.stack.3d.up.fill",
  "GCP": "cube.transparent.fill",
  "Docker": "shippingbox.fill",
  "Kubernetes": "helm",
  "System Design": "square.grid.3x3.topleft.filled",
  "Backend": "server.rack",
  "Databases": "cylinder.split.1x2.fill",
  "Networking": "network",
  "Security": "lock.shield.fill",
  "Operating Systems": "memorychip.fill",
  "Productivity": "bolt.fill",
  "Career": "chart.line.uptrend.xyaxis",
  "Interview Prep": "checklist"
};

/**
 * Validate a single generated post. Returns an array of error strings (empty = valid).
 * IDs, publishedDate, and heroImageURL are assigned by the pipeline, so they are
 * NOT required here.
 */
export function validatePost(p) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(msg); };

  need(typeof p?.title === "string" && p.title.length > 0, "title missing");
  need(typeof p?.subtitle === "string" && p.subtitle.length > 0, "subtitle missing");
  need(CATEGORIES.includes(p?.category), `bad category: ${p?.category}`);
  need(DIFFICULTIES.includes(p?.difficulty), `bad difficulty: ${p?.difficulty}`);
  need(Array.isArray(p?.tags), "tags must be an array");
  need(Number.isInteger(p?.estimatedMinutes) && p.estimatedMinutes > 0, "estimatedMinutes must be a positive int");
  need(typeof p?.summary === "string" && p.summary.length > 0, "summary missing");
  need(Array.isArray(p?.slides) && p.slides.length >= 3, "need at least 3 slides");

  (p?.slides ?? []).forEach((s, i) => {
    need(SLIDE_KINDS.includes(s?.kind), `slide ${i}: bad kind ${s?.kind}`);
    need(typeof s?.title === "string" && s.title.length > 0, `slide ${i}: title missing`);
    need(s?.bullets === undefined || Array.isArray(s.bullets), `slide ${i}: bullets must be an array`);
    if (s?.table) {
      need(Array.isArray(s.table.headers) && Array.isArray(s.table.rows), `slide ${i}: malformed table`);
    }
  });

  if (p?.quiz) {
    need(Array.isArray(p.quiz.questions) && p.quiz.questions.length > 0, "quiz has no questions");
    (p.quiz.questions ?? []).forEach((q, i) => {
      need(typeof q?.prompt === "string", `quiz ${i}: prompt missing`);
      need(Array.isArray(q?.options) && q.options.length >= 2, `quiz ${i}: need >=2 options`);
      need(Number.isInteger(q?.correctIndex) && q.correctIndex >= 0 && q.correctIndex < (q?.options?.length ?? 0),
        `quiz ${i}: correctIndex out of range`);
    });
  }

  (p?.references ?? []).forEach((r, i) => {
    need(typeof r?.title === "string", `ref ${i}: title missing`);
    need(typeof r?.url === "string" && /^https?:\/\//.test(r.url), `ref ${i}: bad url`);
  });

  return errs;
}

/** The JSON shape we ask Claude to produce (ids/date/image are added later). */
export const POST_SCHEMA_HINT = `{
  "title": "string (<=60 chars, specific, no clickbait)",
  "subtitle": "string (one vivid line)",
  "category": "one of: ${CATEGORIES.join(" | ")}",
  "difficulty": "Beginner | Intermediate | Advanced",
  "tags": ["3-6 lowercase keywords"],
  "estimatedMinutes": 2,
  "heroSymbol": "an SF Symbol name that fits the topic",
  "summary": "2-sentence recap shown after finishing",
  "artPrompt": "a vivid image-generation prompt for a premium, abstract tech hero illustration (dark indigo/purple, glassy, no text)",
  "slides": [
    { "kind": "cover|problem|solution|architecture|example|comparison|takeaways|concept",
      "title": "string",
      "body": "optional short paragraph (<=220 chars)",
      "bullets": ["optional 2-4 punchy points"],
      "symbol": "optional SF Symbol name",
      "table": { "headers": ["A","B"], "rows": [["...","..."]] } }
  ],
  "quiz": { "questions": [
    { "prompt": "string", "options": ["...","...","...","..."], "correctIndex": 0, "explanation": "why" }
  ]},
  "references": [ { "title": "string", "url": "https://..." } ]
}`;
