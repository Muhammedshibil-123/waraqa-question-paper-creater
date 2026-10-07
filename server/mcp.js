/* Waraqa MCP connector: a tiny, stateless MCP server (Streamable HTTP, JSON responses).
   ChatGPT / Claude call `create_question_paper`; we store the paper for 30 days and hand back a short link
   that opens it in the Waraqa app, where the teacher checks it and downloads the PDF.
   Uses only web-standard Request/Response; served by the Vercel Function in api/mcp.js. */

const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_BYTES = 256 * 1024;

export const TYPES = ['choose', 'fill', 'words', 'short', 'match', 'truefalse', 'arrange', 'translate', 'passage', 'poem', 'dialogue', 'table', 'colour', 'text', 'pagebreak'];
const TEMPLATES = ['half-yearly', 'periodic', 'annual', 'junior', 'boxed', 'english'];

const SECTION_GUIDE = `Questions of the paper, in order. Each section is one numbered question with its own instruction (title) and marks.
Write the content in the paper's language (Arabic, English or Malayalam) exactly as it should be printed. Mark a blank with ____ (four underscores).
Section types and the fields they use:
- choose: multiple choice. items: [{text: "الأولاد ____ إلى المدرسة", options: ["خرج","خرجوا","خرجن"], answer: "خرجوا"}]. Use "shared": "هو / هي" with empty options when every line has the same choices.
- fill: fill in the blanks. items: [{text: "اغسل يدي ____ الأكل", answer: "قبل"}]. Optional "wordBox": "قبل / بعد" for a word box.
- words: one word per row with a blank for the student (plural, present tense, meaning, opposite…). items: [{word: "كتاب", answer: "كتب"}]. "connector" is printed between word and blank, e.g. "(ج)", ":", "×", "-".
- short: questions with writing lines. items: [{text, answer}], "lines": writing lines per answer (0 = none). For an essay/paragraph use items: [] and lines: 8 with the topic in the title.
- match: match the following. items: [{a, b}] with the CORRECT pairs; the app shuffles column b on the paper.
- truefalse: items: [{text, answer: true|false}].
- arrange: "mode": "words" (items: [{text: "school / to / I / go", answer: "I go to school"}]) or "sentences" (students number sentences; answer = correct position).
- translate: items: [{text, answer}], "lines".
- passage: reading comprehension. "passage": the paragraph, items: [{text, answer}] questions. For "rewrite with changes": "starter" + "rewriteLines" and items: [].
- poem: complete the poem. items: [{r: "first half", l: "second half"}]; leave a half "" to make it the blank.
- dialogue: complete the conversation. items: [{speaker, text}]; leave text "" for a blank line.
- table: classify words into columns. "heads": ["الفواكه","الخضروات"], "rows": 5, "wordBox": "موز / بصل / …".
- colour: young classes colour the circle. items: [{label: "أحمر"}].
- text: un-numbered note or instructions. "body": "Answer all the questions." (no marks).
- pagebreak: start a new page.
Section marks are numbers (2.5 allowed). They should add up to the header's total marks.`;

export const TOOLS = [
  {
    name: 'create_question_paper',
    title: 'Create question paper',
    description: `Create an exam question paper in the Waraqa app (Arabic, English and Malayalam school papers). Use it when the user asks to make, type up or recreate a question paper or worksheet, for example from a photo, PDF or list of questions.
Copy the user's questions faithfully (do not invent extra questions unless asked), pick the matching section type for each question, and fill the header from what the user said or what is printed on the original paper.
Returns a short link. Always show that link to the user exactly as given: opening it loads the paper in Waraqa, where they can check it, change the design and download the PDF or Word file.`,
    inputSchema: {
      type: 'object',
      required: ['sections'],
      properties: {
        name: { type: 'string', description: 'Short file name for the paper list, e.g. "Arabic Class IV Annual".' },
        template: {
          type: 'string',
          enum: TEMPLATES,
          description: 'Layout. half-yearly: centred title with grade and marks (default). periodic: serial no, code box, roll no, date, marks-obtained box. annual: serial no, code box, big subject title, continuous numbering. junior: English instructions with Arabic content for small classes. boxed: school name in a framed header. english: left-to-right English paper.',
        },
        direction: { type: 'string', enum: ['rtl', 'ltr'], description: 'rtl for Arabic papers, ltr for English or Malayalam papers. Defaults to the template.' },
        header: {
          type: 'object',
          description: 'Paper header. Leave out what is unknown.',
          properties: {
            examTitle: { type: 'string', description: 'e.g. "ANNUAL EXAMINATION – MARCH (2025–26)"' },
            subject: { type: 'string', description: 'e.g. "ARABIC"' },
            className: { type: 'string', description: 'Class or grade, e.g. "IV"' },
            marks: { type: 'number', description: 'Total marks. Defaults to the sum of section marks.' },
            time: { type: 'string', description: 'e.g. "2 hr"' },
            date: { type: 'string' },
            school: { type: 'string', description: 'School name (shown by the boxed template).' },
          },
        },
        sections: {
          type: 'array',
          minItems: 1,
          description: SECTION_GUIDE,
          items: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: TYPES },
              title: { type: 'string', description: 'The instruction line, e.g. "اختر الإجابة الصحيحة" or "Fill in the blanks".' },
              marks: { type: 'number' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    answer: { type: ['string', 'boolean'] },
                    word: { type: 'string' },
                    a: { type: 'string' },
                    b: { type: 'string' },
                    r: { type: 'string' },
                    l: { type: 'string' },
                    speaker: { type: 'string' },
                    label: { type: 'string' },
                  },
                },
              },
              shared: { type: 'string' },
              wordBox: { type: 'string' },
              connector: { type: 'string' },
              columns: { type: 'number', description: '1–3 columns for short items.' },
              lines: { type: 'number' },
              mode: { type: 'string', enum: ['words', 'sentences'] },
              passage: { type: 'string' },
              starter: { type: 'string' },
              rewriteLines: { type: 'number' },
              heads: { type: 'array', items: { type: 'string' } },
              rows: { type: 'number' },
              body: { type: 'string' },
            },
          },
        },
      },
    },
    annotations: { title: 'Create question paper', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

const INSTRUCTIONS = 'Waraqa makes printable school question papers. When the user wants a question paper, call create_question_paper once with the whole paper, then give the user the returned link.';

/* ---------- tool logic ---------- */

function checkPaper(p) {
  if (!p || typeof p !== 'object') return 'The arguments must be an object.';
  if (!Array.isArray(p.sections) || !p.sections.length) return 'sections must be a non-empty array.';
  for (const [i, s] of p.sections.entries()) {
    if (!s || !TYPES.includes(s.type)) return `sections[${i}].type must be one of: ${TYPES.join(', ')}.`;
    if (s.items != null && !Array.isArray(s.items)) return `sections[${i}].items must be an array.`;
  }
  if (p.template != null && !TEMPLATES.includes(p.template)) return `template must be one of: ${TEMPLATES.join(', ')}.`;
  return null;
}

const newId = () => {
  const b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => 'abcdefghijkmnpqrstuvwxyz23456789'[x % 32]).join('');
};

async function createPaper(args, ctx) {
  const problem = checkPaper(args);
  if (problem) return toolError(problem + ' Fix it and call the tool again.');
  const paper = { app: 'waraqa', version: 1, createdAt: new Date().toISOString(), spec: args };
  const json = JSON.stringify(paper);
  if (json.length > MAX_BYTES) return toolError('The paper is too large. Split it into two papers.');
  const id = newId();
  try { await ctx.store.put(id, json, TTL_SECONDS); } catch (e) { return toolError(`Waraqa could not save the paper: ${e.message}. Tell the user to try again later.`); }
  const link = `${ctx.appUrl}#/import/${id}`;
  const marks = args.sections.reduce((a, s) => a + (+s.marks || 0), 0);
  return {
    content: [{ type: 'text', text: `Paper created: ${args.sections.length} sections${marks ? `, ${marks} marks` : ''}.\nLink (show it to the user exactly as written): ${link}\nOpening the link loads the paper in Waraqa, where it can be checked, edited and downloaded as PDF. The link works for 30 days.` }],
    structuredContent: { link, id, sections: args.sections.length, marks },
  };
}

const toolError = (text) => ({ content: [{ type: 'text', text }], isError: true });

/* ---------- JSON-RPC ---------- */

async function dispatch(msg, ctx) {
  const { method, params = {} } = msg;
  switch (method) {
    case 'initialize': {
      const v = PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOLS[0];
      return { protocolVersion: v, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'waraqa', title: 'Waraqa question papers', version: '1.0.0' }, instructions: INSTRUCTIONS };
    }
    case 'ping': return {};
    case 'tools/list': return { tools: TOOLS };
    case 'tools/call': {
      if (params.name !== 'create_question_paper') throw rpcError(-32602, `Unknown tool: ${params.name}`);
      return createPaper(params.arguments || {}, ctx);
    }
    case 'resources/list': return { resources: [] };
    case 'prompts/list': return { prompts: [] };
    default: throw rpcError(-32601, `Method not found: ${method}`);
  }
}

const rpcError = (code, message) => Object.assign(new Error(message), { rpc: { code, message } });

async function answer(msg, ctx) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return msg && 'id' in msg && !('method' in msg) ? null : { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid request' } };
  }
  if (!('id' in msg)) return null; // notification
  try {
    return { jsonrpc: '2.0', id: msg.id, result: await dispatch(msg, ctx) };
  } catch (e) {
    return { jsonrpc: '2.0', id: msg.id, error: e.rpc || { code: -32603, message: 'Internal error' } };
  }
}

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

/** ctx = { store: { put(id, json, ttl) }, appUrl } */
export async function handleMcp(request, ctx) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST', ...CORS } });
  let body;
  try { body = await request.json(); } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => answer(m, ctx)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await answer(body, ctx);
  return out ? json(out) : new Response(null, { status: 202, headers: CORS });
}
