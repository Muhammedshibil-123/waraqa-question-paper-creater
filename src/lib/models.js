import { uid } from './utils';

/* Every section = { id, type, title, marks, hidden, ...type fields }
   Items always carry an id so lists can be re-ordered safely. */

const it = (o = {}) => ({ id: uid(), ...o });

export const MODELS = [
  {
    type: 'choose',
    name: 'Choose the answer',
    ar: 'اختر الإجابة الصحيحة',
    sample: 'الأولاد …… إلى المدرسة (خرج / خرجوا)',
    help: 'Sentence with a blank and options in brackets. Use shared options when every line uses the same choices (هو / هي).',
    make: () => ({ title: 'اختر الإجابة الصحيحة', shared: '', optStyle: 'paren', columns: 1, items: [it({ text: '', options: ['', '', ''], answer: '' })] }),
    presets: [
      { label: 'اختر الإجابة الصحيحة', title: 'اختر الإجابة الصحيحة' },
      { label: 'نكمل الجمل بالمناسب من القوسين', title: 'أكمل الجمل التالية باختيار الكلمة الصحيحة من بين القوسين' },
      { label: 'Write the correct choice (shared options)', title: 'Write the correct choice from the given options', patch: { shared: 'هذا / هذه', columns: 2 } },
      { label: 'Choose the correct answer', title: 'Choose the correct answer' },
    ],
  },
  {
    type: 'fill',
    name: 'Fill in the blanks',
    ar: 'املأ الفراغ',
    sample: 'اغسل يدي …… الأكل  [قبل / بعد]',
    help: 'Type ____ (two underscores) or …… where the blank should go. Add a word box for “choose from the box”.',
    make: () => ({ title: 'أكمل الفراغ بكلمة مناسبة', wordBox: '', boxStyle: 'box', columns: 1, items: [it({ text: '', answer: '' })] }),
    presets: [
      { label: 'أكمل بكلمة مناسبة من المربع', title: 'أكمل بكلمة مناسبة من المربع', patch: { wordBox: 'قبل / بعد / بسم الله / الحمد لله' } },
      { label: 'نكون جملاً بوضع خبر مناسب', title: 'نكوّن جملاً بوضع خبر مناسب' },
      { label: 'Fill in the blanks', title: 'Fill in the blanks' },
    ],
  },
  {
    type: 'words',
    name: 'Word → answer',
    ar: 'اكتب الجمع / المضارع / المعنى',
    sample: 'كتاب (ج) ……    ولد (ج) ……',
    help: 'Plural, present tense, meaning, singular, dual, opposites, add ال, number names, personal details… one word per row.',
    make: () => ({ title: 'اكتب الجمع', connector: '(ج)', blankPos: 'after', columns: 2, items: [it({ word: '', answer: '' }), it({ word: '', answer: '' })] }),
    presets: [
      { label: 'اكتب الجمع  (ج)', title: 'اكتب الجمع', patch: { connector: '(ج)' } },
      { label: 'اكتب المضارع', title: 'اكتب المضارع', patch: { connector: ':' } },
      { label: 'اكتب الماضي', title: 'اكتب الماضي', patch: { connector: ':' } },
      { label: 'اكتب المعنى', title: 'اكتب المعنى', patch: { connector: ':' } },
      { label: 'اكتب المفرد', title: 'اكتب صيغة المفرد للكلمات الآتية', patch: { connector: ':' } },
      { label: 'اكتب المثنى', title: 'اكتب صيغة المثنى للكلمات الآتية', patch: { connector: ':' } },
      { label: 'اكتب المترادفات', title: 'اكتب المترادفات', patch: { connector: ':' } },
      { label: 'اكتب الضد', title: 'اكتب الضد', patch: { connector: '×' } },
      { label: 'حوّل إلى المجهول', title: 'حوّل الأفعال المعروفة إلى أفعال مجهولة', patch: { connector: ':' } },
      { label: 'أدخل (ال)', title: 'Add (ال) to the following words', patch: { connector: '' } },
      { label: 'Number names', title: 'Write the number names in Arabic words', patch: { connector: '-' } },
      { label: 'البيانات الشخصية', title: 'اكتب البيانات الشخصية', patch: { connector: ':', columns: 1, items: ['الاسم الكامل', 'اسم الوالد', 'الجنسية', 'تاريخ الميلاد', 'الصف', 'المدرسة'].map((w) => it({ word: w, answer: '' })) } },
      { label: 'Write the meaning', title: 'Write the meaning', patch: { connector: '-' } },
    ],
  },
  {
    type: 'short',
    name: 'Answer the questions',
    ar: 'أجب عن الأسئلة',
    sample: 'أين ولد آزاد؟  ………………………',
    help: 'Questions with writing lines. Set how many lines each answer gets (0 = no lines).',
    make: () => ({ title: 'أجب عن الأسئلة الآتية', lines: 1, items: [it({ text: '', answer: '' })] }),
    presets: [
      { label: 'أجب عن الأسئلة الآتية', title: 'أجب عن الأسئلة الآتية' },
      { label: 'نميز المبتدأ والخبر', title: 'نميّز المبتدأ والخبر من الجمل', patch: { lines: 1 } },
      { label: 'Write a paragraph / letter', title: 'Write a paragraph', patch: { lines: 8 } },
      { label: 'Answer the questions', title: 'Answer the following questions' },
    ],
  },
  {
    type: 'match',
    name: 'Match the following',
    ar: 'صل بين العمودين',
    sample: 'أحمر ↔ موز   أصفر ↔ ورد',
    help: 'Type the correct pairs. The second column is shuffled automatically on the paper, the answer key keeps the right pairs.',
    make: () => ({ title: 'صل بما يناسب', shuffle: true, seed: 7, headA: '', headB: '', lettered: true, items: [it({ a: '', b: '' }), it({ a: '', b: '' }), it({ a: '', b: '' })] }),
    presets: [
      { label: 'صل بما يناسب', title: 'صل بما يناسب' },
      { label: 'نصل بين العدد والمعدود', title: 'نصل بين العدد والمعدود' },
      { label: 'صل كل كلمة بمعناها', title: 'صل كل كلمة بمعناها' },
      { label: 'Match the following', title: 'Match the following' },
    ],
  },
  {
    type: 'truefalse',
    name: 'True or false',
    ar: 'صح أم خطأ',
    sample: 'الفيل حيوان صغير  (   )',
    help: 'Statements with a box for ✓ / ✗.',
    make: () => ({ title: 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام العبارة الخاطئة', items: [it({ text: '', answer: true })] }),
    presets: [
      { label: 'صح أم خطأ', title: 'ضع علامة (✓) أمام العبارة الصحيحة وعلامة (✗) أمام العبارة الخاطئة' },
      { label: 'True or false', title: 'Write True or False' },
    ],
  },
  {
    type: 'arrange',
    name: 'Rearrange',
    ar: 'رتّب الكلمات / الجمل',
    sample: 'الهند / مواطن / لكل / الهندي',
    help: 'Words mode: separate words with “/”. Tap shuffle to mix them. Sentences mode: students number the sentences in order.',
    make: () => ({ title: 'نرتب الكلمات الآتية حتى تكون جملة', mode: 'words', lines: 1, items: [it({ text: '', answer: '' })] }),
    presets: [
      { label: 'نرتب الكلمات (جملة)', title: 'نرتب الكلمات الآتية حتى تكون جملة', patch: { mode: 'words' } },
      { label: 'نرتب الجمل (القصة)', title: 'نرتب الجمل الآتية', patch: { mode: 'sentences', lines: 0 } },
      { label: 'Rearrange the words', title: 'Rearrange the words to make sentences', patch: { mode: 'words' } },
    ],
  },
  {
    type: 'translate',
    name: 'Translate / عرّب',
    ar: 'ترجم / عرّب',
    sample: 'Jasim went to school.  ……………',
    help: 'Sentences to translate. English, Arabic and Malayalam lines each keep their own direction.',
    make: () => ({ title: 'عرّب', lines: 1, items: [it({ text: '', answer: '' })] }),
    presets: [
      { label: 'عرّب (English → Arabic)', title: 'عرّب' },
      { label: 'ترجم إلى الإنجليزية', title: 'ترجم إلى اللغة الإنجليزية' },
      { label: 'ترجم إلى المالايالامية', title: 'ترجم إلى اللغة المالايالامية' },
      { label: 'Translate into English', title: 'Translate into English' },
    ],
  },
  {
    type: 'passage',
    name: 'Reading passage',
    ar: 'اقرأ الفقرة وأجب',
    sample: 'يوماً خرج عبد الله إلى السوق… ١. إلى أين خرج؟',
    help: 'A paragraph with questions under it. Also use it for “rewrite with changes” — add a starting line and writing lines.',
    make: () => ({ title: 'اقرأ الفقرة التالية وأجب عن الأسئلة', passage: '', starter: '', rewriteLines: 0, lines: 1, items: [it({ text: '', answer: '' })] }),
    presets: [
      { label: 'اقرأ الفقرة وأجب', title: 'اقرأ الفقرة التالية وأجب عن الأسئلة' },
      { label: 'اكتب مع التغييرات اللازمة', title: 'اكتب مع التغييرات اللازمة', patch: { starter: 'وصلت فاطمة إلى بيت عائشة', rewriteLines: 3, items: [] } },
      { label: 'Read and answer', title: 'Read the passage and answer the questions' },
    ],
  },
  {
    type: 'poem',
    name: 'Poem / نشيدة',
    ar: 'اكتب النشيدة',
    sample: 'أحب العيد ……    إذا نهضت مع الفجر',
    help: 'Each line has two halves. Leave a half empty, or type ____ inside it, to make the blank.',
    make: () => ({ title: 'اكتب النشيدة', wordBox: '', items: [it({ r: '', l: '' }), it({ r: '', l: '' })] }),
    presets: [
      { label: 'اكتب النشيدة', title: 'اكتب النشيدة' },
      { label: 'أكمل النشيدة (مع كلمات)', title: 'أكمل النشيدة', patch: { wordBox: '' } },
      { label: 'Fill the poem', title: 'Fill the poem' },
    ],
  },
  {
    type: 'dialogue',
    name: 'Conversation',
    ar: 'أكمل المحادثة',
    sample: 'جاسم: السلام عليكم   والد: ……',
    help: 'Speaker and line. Leave the line empty to make it a blank for students.',
    make: () => ({ title: 'أكمل المحادثة', items: [it({ speaker: '', text: '' }), it({ speaker: '', text: '' })] }),
    presets: [
      { label: 'أكمل المحادثة', title: 'أكمل المحادثة' },
      { label: 'Complete the conversation', title: 'Complete the conversation' },
    ],
  },
  {
    type: 'table',
    name: 'Classify / table',
    ar: 'صنّف في الجدول',
    sample: 'الفواكه | الخضروات',
    help: 'Words to sort into columns (fruits / vegetables, past / present / imperative, types of plural). Cells can also be pre-filled.',
    make: () => ({ title: 'صنّف الكلمات الآتية', wordBox: '', heads: ['', ''], rows: 4, cells: {} }),
    presets: [
      { label: 'الفواكه والخضروات', title: 'Write the fruits and vegetables separately', patch: { heads: ['الفواكه', 'الخضروات'], rows: 5 } },
      { label: 'الماضي / المضارع / الأمر', title: 'أميّز الفعل الماضي والمضارع والأمر', patch: { heads: ['الماضي', 'المضارع', 'الأمر'], rows: 3 } },
      { label: 'أنواع الجمع', title: 'نقرأ الكلمات الآتية ونميّز منها أنواع الجمع', patch: { heads: ['جمع المذكر السالم', 'جمع المؤنث السالم', 'جمع التكسير'], rows: 2 } },
      { label: 'المعروف / المجهول', title: 'نميّز الأفعال المعروفة والمجهولة', patch: { heads: ['المعروف', 'المجهول'], rows: 3 } },
      { label: 'نصرّف الأفعال (جدول)', title: 'نصرّف الأفعال التالية ونكتبها', patch: { heads: ['الضمير', 'الماضي', 'المضارع'], rows: 6, cells: { '0_0': 'هو', '1_0': 'هما', '2_0': 'هم', '3_0': 'هي', '4_0': 'هما', '5_0': 'هنّ' } } },
    ],
  },
  {
    type: 'picture',
    name: 'Picture question',
    ar: 'سؤال بالصورة',
    sample: '🖼  + كلمات + سطور',
    help: 'Add a picture from your phone. Words and writing lines go beside or under it.',
    make: () => ({ title: 'Make the sentence', image: null, imgWidth: 45, layout: 'side', wordBox: '', lines: 4, items: [] }),
    presets: [
      { label: 'كوّن جملاً (تلك / ذلك)', title: 'Make the sentence (تلك أو ذلك)' },
      { label: 'Look and write', title: 'Look at the picture and write' },
      { label: 'Label the picture', title: 'Label the picture', patch: { lines: 0 } },
    ],
  },
  {
    type: 'colour',
    name: 'Colour / draw',
    ar: 'لوّن الدائرة',
    sample: 'أحمر ◯   أسود ◯',
    help: 'Labels with empty circles or boxes for young classes to colour or draw in.',
    make: () => ({ title: 'Colour the circle with the given colour', shape: 'circle', size: 60, columns: 2, items: [it({ label: '' }), it({ label: '' })] }),
    presets: [
      { label: 'لوّن الدائرة', title: 'Colour the circle with the given colour' },
      { label: 'Draw and name', title: 'Draw and write the name', patch: { shape: 'square', size: 110 } },
    ],
  },
  {
    type: 'text',
    name: 'Note / instructions',
    ar: 'ملاحظة',
    sample: 'Answer all questions. أجب عن جميع الأسئلة',
    help: 'Free text with no number — general instructions, a part title, a story… Marks are optional.',
    make: () => ({ title: '', body: '', align: 'center', bold: true, marks: '' }),
    presets: [
      { label: 'Instructions', title: '', patch: { body: 'Answer all the questions.  أجب عن جميع الأسئلة' } },
      { label: 'Part title', title: '', patch: { body: 'Part A', align: 'center' } },
    ],
  },
  {
    type: 'pagebreak',
    name: 'Page break',
    ar: 'صفحة جديدة',
    sample: '— new page —',
    help: 'Everything after this starts on a new page.',
    make: () => ({ title: '', marks: '' }),
    presets: [],
  },
];

export const MODEL = Object.fromEntries(MODELS.map((m) => [m.type, m]));

export function newSection(type, preset) {
  const m = MODEL[type];
  const base = { id: uid(), type, marks: type === 'text' || type === 'pagebreak' ? '' : 4, hidden: false, ...m.make() };
  if (preset) {
    base.title = preset.title;
    if (preset.patch) Object.assign(base, JSON.parse(JSON.stringify(preset.patch)));
    if (base.items) base.items = base.items.map((x) => ({ ...x, id: uid() }));
  }
  return base;
}

export function emptyItemFor(type) {
  switch (type) {
    case 'choose': return it({ text: '', options: ['', ''], answer: '' });
    case 'words': return it({ word: '', answer: '' });
    case 'match': return it({ a: '', b: '' });
    case 'truefalse': return it({ text: '', answer: true });
    case 'poem': return it({ r: '', l: '' });
    case 'dialogue': return it({ speaker: '', text: '' });
    case 'colour': return it({ label: '' });
    default: return it({ text: '', answer: '' });
  }
}

/* -------- bulk paste: one item per line -------- */
export const BULK_HINT = {
  choose: 'One sentence per line. Put the blank as ____ and options in brackets:\nالأولاد ____ إلى المدرسة (خرج / خرجوا / خرجن)',
  fill: 'One sentence per line, blank as ____ . Add = answer if you want an answer key:\nاغسل يدي ____ الأكل = قبل',
  words: 'One word per line. Add = answer for the answer key:\nكتاب = كتب\nولد = أولاد',
  short: 'One question per line (add = answer if you like).',
  match: 'One pair per line, separated by = :\nأحمر = ورد\nأصفر = موز',
  truefalse: 'One statement per line. End with = T or = F for the answer key.',
  arrange: 'One item per line. Words separated by / or spaces.',
  translate: 'One sentence per line.',
  passage: 'One question per line.',
  poem: 'One line per row. Split the two halves with | :\nأحب العيد | إذا نهضت مع الفجر',
  dialogue: 'One line per row as  speaker: text\nجاسم: السلام عليكم\nالوالد:',
  colour: 'One label per line.',
};

export function parseBulk(type, raw) {
  const lines = String(raw).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const eq = (l) => { const i = l.lastIndexOf('='); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, '']; };
  return lines.map((l) => {
    switch (type) {
      case 'choose': {
        const m = l.match(/^(.*)\(([^()]*)\)\s*$/);
        if (m && /[\/،,]/.test(m[2])) return it({ text: m[1].trim(), options: m[2].split(/\s*[\/،,]\s*/).filter(Boolean), answer: '' });
        return it({ text: l, options: [], answer: '' });
      }
      case 'words': { const [w, a] = eq(l); return it({ word: w, answer: a }); }
      case 'match': { const [a, b] = eq(l); return it({ a, b }); }
      case 'truefalse': { const [t, a] = eq(l); return it({ text: t, answer: !/^(f|false|خ|خطأ|x|✗)$/i.test(a) }); }
      case 'poem': { const [r, lft] = l.split('|').map((s) => (s || '').trim()); return it({ r, l: lft || '' }); }
      case 'dialogue': { const i = l.search(/[:：]/); return i > 0 ? it({ speaker: l.slice(0, i).trim(), text: l.slice(i + 1).trim() }) : it({ speaker: l, text: '' }); }
      case 'colour': return it({ label: l });
      default: { const [t, a] = eq(l); return it({ text: t, answer: a }); }
    }
  });
}

/* how many "questions" a section contributes to continuous numbering */
export function itemCount(s) {
  if (['text', 'pagebreak', 'table', 'picture', 'colour'].includes(s.type)) return s.type === 'colour' ? 0 : 0;
  if (s.type === 'passage') return (s.items || []).length + (s.starter || s.rewriteLines ? 1 : 0);
  if (s.type === 'poem' || s.type === 'dialogue') return 0;
  return (s.items || []).length;
}

export function totalMarks(sections) {
  return sections.filter((s) => !s.hidden).reduce((a, s) => a + (parseFloat(s.marks) || 0), 0);
}
