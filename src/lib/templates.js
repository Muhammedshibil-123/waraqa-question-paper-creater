import { uid, clone } from './utils';
import { MODEL } from './models';

export const DEFAULT_SETTINGS = {
  arFont: 'Noto Naskh Arabic',
  laFont: 'Tinos',
  mlFont: 'Noto Sans Malayalam',
  size: 17,
  headSize: 18,
  lineHeight: 1.75,
  gap: 16,
  itemGap: 3,
  margin: 14,
  dir: 'rtl',
  secNum: 'roman',
  numeral: 'auto',
  continuous: false,
  marksFmt: 'paren',
  marksPos: 'end',
  headStyle: 'plain',
  blank: 'dots',
  border: false,
  pageNo: true,
  footer: '',
  labels: 'en',
  fieldLine: 'dots',
  boldTitle: true,
};

export const DEFAULT_HEADER = {
  style: 'classic',
  school: '',
  logo: null,
  serial: '',
  code: '',
  examTitle: 'HALF YEARLY EXAMINATION 2025-26',
  subject: 'ARABIC',
  classLabel: 'Class',
  className: '',
  marks: 40,
  time: '',
  date: '',
  fields: { name: true, roll: false, classDiv: false, subjectLine: false, date: false, obtained: false },
};

/* sample builders */
const I = (o) => ({ id: uid(), ...o });
const S = (type, title, marks, patch = {}) => ({ id: uid(), type, hidden: false, ...MODEL[type].make(), title, marks, ...patch });
const words = (list) => list.map((w) => (Array.isArray(w) ? I({ word: w[0], answer: w[1] || '' }) : I({ word: w, answer: '' })));
const qs = (list) => list.map((q) => (Array.isArray(q) ? I({ text: q[0], answer: q[1] || '' }) : I({ text: q, answer: '' })));
const ch = (list) => list.map(([text, options, answer = '']) => I({ text, options, answer }));
const pairs = (list) => list.map(([a, b]) => I({ a, b }));

/* ---------- sample papers (from the teacher's own papers) ---------- */

const halfYearly = () => [
  S('choose', 'اختر الإجابة الصحيحة', 2.5, { items: ch([
    ['هاجرت أسرة آزاد إلى ____', ['الهند', 'باكستان', 'بنغلاديش'], 'الهند'],
    ['الأولاد ____ إلى المدرسة', ['خرج', 'خرجوا', 'خرجن'], 'خرجوا'],
    ['إلى أين ____ أنت يا فالح؟', ['خرجتَ', 'خرجتِ', 'خرج'], 'خرجتَ'],
    ['عندي ____ كتب', ['ثلاث', 'ثلاثة', 'أربع'], 'ثلاثة'],
    ['اثنتا عشرة ____', ['كراسة', 'كراسات', 'كراستان'], 'كراسة'],
  ]) }),
  S('words', 'اكتب الجمع', 4, { connector: '(ج)', items: words([['رائد', 'روّاد'], ['مؤلف', 'مؤلفون'], ['حبيب', 'أحباء'], ['زعيم', 'زعماء']]) }),
  S('words', 'اكتب المضارع', 4, { connector: ':', items: words([['سَعِدَ', 'يَسْعَدُ'], ['نَهَضَ', 'يَنْهَضُ'], ['رَجَا', 'يَرْجُو'], ['كَتَبَ', 'يَكْتُبُ']]) }),
  S('words', 'اكتب البيانات الشخصية', 3.5, { connector: ':', columns: 1, items: words(['الاسم الكامل', 'اسم الوالد', 'الجنسية', 'تاريخ الميلاد', 'الصف', 'المدرسة']) }),
  S('short', 'أجب عن الأسئلة الآتية', 6, { lines: 1, items: qs(['أين ولد آزاد؟', 'من ذهب إلى الكلية؟', 'متى رجع عبد الله من المدرسة؟', 'إلى أين يذهب خالد وفواز؟']) }),
  S('match', 'نصل بين العدد والمعدود', 5, { items: pairs([['قلمان', 'اثنان'], ['أحد عشر', 'كتاباً'], ['ثلاثة', 'أقلام'], ['كراسة', 'واحدة'], ['بقرتان', 'اثنتان']]) }),
  S('poem', 'اكتب النشيدة', 3, { items: [I({ r: 'أحب العيد', l: '' }), I({ r: '', l: 'إذا نهضت مع الفجر' })] }),
  S('table', 'نصرّف الأفعال التالية ونكتبها', 6, { wordBox: 'جلس / شرب', heads: ['الضمير', 'جلس', 'شرب'], rows: 6, cells: { '0_0': 'هو', '1_0': 'هما', '2_0': 'هم', '3_0': 'هي', '4_0': 'هما', '5_0': 'هنّ' } }),
  S('translate', 'نعرب', 6, { lines: 1, items: qs(['Jasim and Jasir went to school.', 'I like my uncle.', 'There are 11 teachers in the school.']) }),
];

const periodic = () => [
  S('choose', 'أكمل الجمل التالية باختيار الكلمة الصحيحة من بين القوسين', 4, { items: ch([
    ['آكل الطعام ____', ['باليسرى', 'باليمنى', 'باليد'], 'باليمنى'],
    ['لا أعيب ____ أبداً', ['الرجل', 'الكتاب', 'الطعام'], 'الطعام'],
    ['يقوم الولد ____ المدرسة', ['وسط', 'أمام', 'وراء'], 'أمام'],
    ['____ الشجرة قطة', ['بجانب', 'وراء', 'عند'], 'بجانب'],
  ]) }),
  S('words', 'اكتب الجمع للكلمات التالية', 4, { connector: '(ج)', columns: 2, items: words([['مركب', 'مراكب'], ['وطن', 'أوطان'], ['أخ', 'إخوة'], ['لون', 'ألوان']]) }),
  S('words', 'حوّل الأفعال التالية إلى المضارع', 4, { connector: ':', columns: 2, items: words([['فرّق', 'يفرّق'], ['مزّق', 'يمزّق'], ['ركب', 'يركب'], ['اشترى', 'يشتري']]) }),
  S('short', 'أجب عن الأسئلة التالية', 3, { lines: 1, items: qs(['من يركب الدراجة؟', 'أين تقف الحافلة؟', 'أين يقوم الشرطي؟']) }),
  S('poem', 'أكمل النشيدة', 2, { items: [I({ r: 'كتاب الله', l: '' }), I({ r: '', l: 'عباد الله إخواني' })] }),
  S('words', 'اكتب المعنى', 3, { connector: ':', columns: 1, items: words(['جائع', 'وطن', 'لون', 'وسط', 'اشترى']) }),
];

const annual = () => [
  S('passage', 'اكتب مع التغييرات اللازمة', 8, { passage: 'وصلَ عبدُ الله إلى بيتِ هشامٍ، دخلَ الحمّامَ ثمّ اغتسلَ ولبسَ ملابسَ جديدةً، وسألَ رقمَ الهاتفِ، وشكرَ عبدُ الله هشاماً.', starter: 'وصلتْ فاطمةُ إلى بيتِ عائشةَ', rewriteLines: 3, items: [] }),
  S('choose', 'اختر الجواب الصحيح من القوسين', 5, { items: ch([
    ['____ الناس في المسجد', ['يُصلّي', 'صلّى', 'أُصلّي'], 'يُصلّي'],
    ['ذهب هشام ____ جديدة', ['كتاب', 'قلماً', 'ملابس'], 'ملابس'],
    ['أعطى هشام ____ جديداً', ['عجيباً', 'قلماً', 'ملابسَ'], 'قلماً'],
    ['____ سيارة وراء الحافلة', ['يجيء', 'تجيء', 'أجيء'], 'تجيء'],
    ['دارسٌ ____', ['نشيطٌ', 'نشيطةٌ', 'نشيطاً'], 'نشيطٌ'],
  ]) }),
  S('words', 'اكتب الجمع', 4, { connector: '(ج)', items: words([['ثوب', 'ثياب'], ['شكل', 'أشكال'], ['ملبس', 'ملابس'], ['مركب', 'مراكب']]) }),
  S('words', 'اكتب المضارع', 4, { connector: ':', items: words([['سقط', 'يسقط'], ['ساعد', 'يساعد'], ['دخل', 'يدخل'], ['غسل', 'يغسل']]) }),
  S('fill', 'أكمل بكلمة مناسبة من المربع', 5, { wordBox: 'الحمد لله / قبل / الطعام / بسم الله / بعد / يليني / الأكل', items: qs([['أغسل يدي ____ الأكل، وأقول ____ عند بدء الأكل، وآكل باليد اليمنى، وآكل مما ____', ''], ['وأقول ____ وأغسل يدي بعد ____', '']]) }),
  S('passage', 'اقرأ الفقرة وأجب عن الأسئلة', 5, { passage: 'يوماً خرج عبد الله إلى السوق، فرأى في الشارع مركبات كثيرة، وهناك ولد يركب على دراجة، وشرطي يقوم وسط الشارع، وبجانب الشارع مسجد.', lines: 1, items: qs(['إلى أين خرج عبد الله؟', 'من يركب الدراجة؟', 'أين المسجد؟', 'أين يقوم الشرطي؟', 'ماذا رأى في الشارع؟']) }),
  S('words', 'اكتب المعنى', 5, { connector: ':', columns: 1, items: words(['لا تعجل', 'سقط', 'أجاب', 'وسط', 'أمام']) }),
  S('arrange', 'نرتب الجمل الآتية', 4, { mode: 'sentences', lines: 0, items: qs([['فجأة امتدت إليه يد هشام', '3'], ['أصبح في ثيابه الوحل', '2'], ['وصل عبد الله إلى بيت هشام', '4'], ['سقط عبد الله من الدراجة', '1']]) }),
];

const junior = () => [
  S('choose', 'Write the correct choice from the given options', 5, { shared: 'هو / هي', columns: 2, items: ch([['____ ولد', [], 'هو'], ['____ تاجر', [], 'هو'], ['____ أم', [], 'هي'], ['____ ممرضة', [], 'هي'], ['____ طالب', [], 'هو']]) }),
  S('words', 'Write the number names in Arabic words', 10, { connector: '-', columns: 2, items: words(['١١', '١٢', '١٣', '١٤', '١٥', '١٦', '١٧', '١٨', '١٩', '٢٠']) }),
  S('match', 'Match the following', 5, { items: pairs([['أخضر', 'ورق'], ['أبيض', 'لبن'], ['أحمر', 'زهر'], ['أسود', 'فيل'], ['أصفر', 'موز']]) }),
  S('choose', 'Fill the blanks', 5, { items: ch([['لون الموز ____', ['أبيض', 'أصفر', 'أسود'], 'أصفر'], ['هذا ولد ____', ['صغير', 'صغيرة'], 'صغير'], ['ذلك قارب ____', ['جميل', 'جميلة'], 'جميل'], ['تلك شجرة ____', ['كبيرة', 'كبير'], 'كبيرة']]) }),
  S('table', 'Write the fruits and vegetables separately', 5, { wordBox: 'رمان / طماطم / تفاحة / باميا / ثوم / عنب / بصل / موز / جزر / شمام', heads: ['الفواكه', 'الخضروات'], rows: 5 }),
  S('words', 'Add (ال) to the following words', 5, { connector: '', columns: 1, items: words([['وجه', 'الوجه'], ['موز', 'الموز'], ['لبن', 'اللبن'], ['زهر', 'الزهر']]) }),
  S('colour', 'Colour the circle with the given colour', 5, { columns: 2, items: ['أحمر', 'أسود', 'أخضر', 'أبيض', 'أصفر'].map((label) => I({ label })) }),
];

const senior = () => [
  S('passage', 'اقرأ الفقرة التالية وأجب عن الأسئلة', 6, { passage: 'منير دارس في الصف السابع، وهو يعيش في القرية. يوماً شاهد منير دخاناً كثيفاً يتصاعد من منزل جاره الذي ذهب إلى النزهة.', lines: 0, items: qs([['اكتب الماضي:  يعيش ____   يتصاعد ____', ''], ['اكتب المضارع:  شاهد ____   ذهب ____', ''], ['اكتب الجمع:  دارس ____   جار ____', '']]) }),
  S('words', 'اكتب المترادفات', 3, { connector: ':', items: words(['منزل', 'إطفاء', 'رجع']) }),
  S('table', 'نقرأ الكلمات الآتية ونميّز منها أنواع الجمع', 6, { wordBox: 'أولاد / مؤمنات / حافظون / صائمات / كتب / مسلمون', heads: ['جمع المذكر السالم', 'جمع المؤنث السالم', 'جمع التكسير'], rows: 2 }),
  S('choose', 'نختار الإجابة الصحيحة', 6, { items: ch([['خرطوم ____ طويل', ['الفيل', 'الأسد', 'القط'], 'الفيل'], ['ماذا بلّل الصبي؟', ['الرمل', 'الموج', 'السمك'], 'الموج'], ['منير دارس في الصف ____', ['الثامن', 'السابع', 'الخامس'], 'السابع'], ['لا تؤجل عمل اليوم إلى ____', ['أمس', 'غد', 'اليوم'], 'غد']]) }),
  S('match', 'صل بما يناسب', 4, { items: pairs([['ICU', 'وحدة العناية المركزة'], ['الصبي', 'أمام البحر'], ['لا بأس', 'طهور إن شاء الله'], ['دخاناً', 'شاهد منير']]) }),
  S('short', 'أجب عن الأسئلة', 12, { lines: 1, items: qs(['إلى أين ذهب منير؟', 'إلى من كتب فارس طلب الإجازة؟', 'بماذا نصح الطبيب فارساً؟', 'أين أُدخل الولد في المستشفى؟', 'من أين كتب فارس طلب الإجازة؟', 'أين يعيش منير؟']) }),
  S('translate', 'عرّب', 3, { lines: 1, items: qs(["Muhammed's bag is new.", "Muhsina's father is a doctor."]) }),
];

const english = () => [
  S('text', '', '', { body: 'Answer all the questions.', align: 'center', bold: false }),
  S('choose', 'Choose the correct answer', 4, { items: ch([['The sun rises in the ____', ['east', 'west', 'north'], 'east'], ['A ____ has four legs.', ['bird', 'cow', 'fish'], 'cow'], ['She ____ to school every day.', ['go', 'goes', 'going'], 'goes'], ['We drink ____ every day.', ['water', 'stone', 'paper'], 'water']]) }),
  S('fill', 'Fill in the blanks with suitable words', 4, { wordBox: 'library / honest / garden / quickly', items: qs([['We borrow books from the ____ .', 'library'], ['The rabbit ran ____ .', 'quickly'], ['Flowers grow in the ____ .', 'garden'], ['An ____ boy never lies.', 'honest']]) }),
  S('match', 'Match the following', 4, { items: pairs([['Doctor', 'Hospital'], ['Teacher', 'School'], ['Farmer', 'Field'], ['Pilot', 'Aeroplane']]) }),
  S('truefalse', 'Write True or False', 4, { items: [I({ text: 'The earth is round.', answer: true }), I({ text: 'Fish can fly.', answer: false }), I({ text: 'A week has seven days.', answer: true }), I({ text: 'Ice is hot.', answer: false })] }),
  S('words', 'Write the opposites', 4, { connector: '×', items: words([['big', 'small'], ['happy', 'sad'], ['day', 'night'], ['open', 'close']]) }),
  S('short', 'Answer the following questions', 6, { lines: 2, items: qs(['What is your favourite season? Why?', 'Name any two domestic animals.', 'Who is your best friend?']) }),
  S('arrange', 'Rearrange the words to make sentences', 4, { mode: 'words', lines: 1, items: qs([['school / to / I / go', 'I go to school'], ['is / sky / the / blue', 'The sky is blue']]) }),
  S('translate', 'Translate into Malayalam', 4, { lines: 1, items: qs(['I love my country.', 'Water is precious.']) }),
  S('short', 'Write a paragraph about your school', 6, { lines: 7, items: [] }),
];

export const TEMPLATES = [
  {
    id: 'half-yearly',
    name: 'Half yearly',
    desc: 'Centred title with Grade and Marks — like your Half Yearly papers',
    header: { style: 'classic', examTitle: 'HALF YEARLY EXAMINATION 2025-26', subject: 'ARABIC', classLabel: 'Grade', className: 'V', marks: 40, time: '', fields: { name: false, roll: false, classDiv: false, subjectLine: false, date: false, obtained: false } },
    settings: { secNum: 'roman', marksPos: 'end' },
    sample: halfYearly,
  },
  {
    id: 'periodic',
    name: 'Periodic test',
    desc: 'Serial No, code box, Roll No, date and a marks-obtained box',
    header: { style: 'periodic', serial: 'NLS 02', code: '011', examTitle: 'PERIODIC TEST II - JANUARY (2025-26)', subject: 'ARABIC', classLabel: 'Class', className: 'IV', marks: 20, time: '1 hr', fields: { name: true, roll: true, classDiv: true, subjectLine: true, date: true, obtained: true } },
    settings: { secNum: 'none', marksPos: 'below', headStyle: 'plain' },
    sample: periodic,
  },
  {
    id: 'annual',
    name: 'Annual exam',
    desc: 'Serial No, code box, big subject title and continuous numbering',
    header: { style: 'annual', serial: 'NLS 02', code: '013', examTitle: 'ANNUAL EXAMINATION – MARCH (2025–26)', subject: 'ARABIC', classLabel: 'Class', className: 'IV', marks: 40, time: '2 hr', fields: { name: true, roll: false, classDiv: false, subjectLine: false, date: false, obtained: false } },
    settings: { secNum: 'none', continuous: true, marksPos: 'inline' },
    sample: annual,
  },
  {
    id: 'junior',
    name: 'Junior classes',
    desc: 'English instructions with Arabic content, colouring and tables',
    header: { style: 'annual', serial: 'NLS', code: '013', examTitle: 'ANNUAL EXAMINATION – MARCH (2025–26)', subject: 'ARABIC', classLabel: 'Class', className: 'II', marks: 40, time: '2 hr', fields: { name: true, roll: false, classDiv: false, subjectLine: false, date: false, obtained: false } },
    settings: { secNum: 'roman', marksPos: 'inline', size: 18, headSize: 17, dir: 'ltr' },
    sample: junior,
  },
  {
    id: 'boxed',
    name: 'School boxed',
    desc: 'School name and logo in a framed header, page border',
    header: { style: 'boxed', school: 'Your School Name', examTitle: 'ANNUAL EXAMINATION 2025-26', subject: 'ARABIC', classLabel: 'Class', className: 'VII', marks: 40, time: '2 hr', fields: { name: true, roll: true, classDiv: false, subjectLine: false, date: false, obtained: true } },
    settings: { secNum: 'ordinal', marksPos: 'end', headStyle: 'shaded', border: true, arFont: 'Amiri' },
    sample: senior,
  },
  {
    id: 'english',
    name: 'English paper',
    desc: 'Left-to-right paper for English, with a Malayalam translation part',
    header: { style: 'classic', examTitle: 'HALF YEARLY EXAMINATION 2025-26', subject: 'ENGLISH', classLabel: 'Class', className: 'IV', marks: 40, time: '2 hrs', fields: { name: true, roll: false, classDiv: false, subjectLine: false, date: false, obtained: false } },
    settings: { dir: 'ltr', secNum: 'roman', numeral: 'western', marksPos: 'end', laFont: 'Tinos', size: 16, headSize: 16 },
    sample: english,
  },
];

/** structure-only copy: keep section titles, marks and settings, clear the questions */
export function emptyLike(sections) {
  return sections.map((s) => {
    const c = clone(s);
    c.id = uid();
    if (Array.isArray(c.items)) {
      const n = Math.max(1, Math.min(c.items.length, 3));
      c.items = Array.from({ length: c.type === 'passage' && c.starter ? 0 : n }, () => blankItem(c.type));
    }
    if ('passage' in c) c.passage = '';
    if ('starter' in c) c.starter = '';
    if ('wordBox' in c) c.wordBox = '';
    if ('cells' in c && c.type === 'table') c.cells = {};
    if ('image' in c) c.image = null;
    if (c.type === 'text') c.body = c.body || '';
    return c;
  });
}
function blankItem(type) {
  const base = { id: uid() };
  switch (type) {
    case 'choose': return { ...base, text: '', options: ['', ''], answer: '' };
    case 'words': return { ...base, word: '', answer: '' };
    case 'match': return { ...base, a: '', b: '' };
    case 'truefalse': return { ...base, text: '', answer: true };
    case 'poem': return { ...base, r: '', l: '' };
    case 'dialogue': return { ...base, speaker: '', text: '' };
    case 'colour': return { ...base, label: '' };
    default: return { ...base, text: '', answer: '' };
  }
}

export function makePaper({ template, mode = 'sample', profile = {}, overrides = {} }) {
  const t = template;
  const header = { ...clone(DEFAULT_HEADER), ...clone(t.header || {}) };
  header.fields = { ...DEFAULT_HEADER.fields, ...(t.header?.fields || {}) };
  if (profile.school && (header.style === 'boxed' || !header.school)) header.school = header.style === 'boxed' ? profile.school : header.school;
  if (profile.logo) header.logo = profile.logo;
  if (profile.serial && header.serial) header.serial = profile.serial;
  Object.assign(header, overrides);
  let sections = [];
  const src = t.sections ? clone(t.sections) : t.sample ? t.sample() : [];
  if (mode === 'sample') sections = src.map((s) => ({ ...s, id: uid() }));
  else if (mode === 'structure') sections = emptyLike(src);
  const now = Date.now();
  const nameBits = [header.subject, header.className && `${header.classLabel} ${header.className}`, header.examTitle?.split(/[-–(]/)[0]?.trim()].filter(Boolean);
  return {
    id: uid(),
    kind: 'paper',
    name: overrides.name || nameBits.join(', ') || 'New paper',
    templateId: t.id,
    createdAt: now,
    updatedAt: now,
    header,
    settings: { ...DEFAULT_SETTINGS, ...(t.settings || {}) },
    sections,
  };
}
