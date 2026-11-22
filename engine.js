/* Convert: finds amounts with units in any text and converts each one to the unit Ratm wants.
   No unit picking: the target is chosen by the rules in plan() and convertMoney(). */
(function (root) {
  'use strict';

  /* ---------- units ---------- */
  const FACTORS = {
    mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
    g: 0.001, kg: 1, lb: 0.45359237, oz: 0.028349523125, st: 6.35029318,
    ml: 0.001, l: 1, floz: 0.0295735295625, gal: 3.785411784, cup: 0.2365882365,
    kmh: 1, mph: 1.609344, m2: 1, ft2: 0.09290304
  };
  const KIND = {
    mm: 'length', cm: 'length', m: 'length', km: 'length', in: 'length', ft: 'length', yd: 'length', mi: 'length',
    g: 'weight', kg: 'weight', lb: 'weight', oz: 'weight', st: 'weight',
    ml: 'volume', l: 'volume', floz: 'volume', gal: 'volume', cup: 'volume',
    kmh: 'speed', mph: 'speed', m2: 'area', ft2: 'area', c: 'temperature', f: 'temperature'
  };
  const LABEL = {
    mm: 'mm', cm: 'cm', m: 'm', km: 'km', in: 'in', ft: 'ft', yd: 'yd', mi: 'mi',
    g: 'g', kg: 'kg', lb: 'lb', oz: 'oz', st: 'st', ml: 'ml', l: 'L', floz: 'fl oz', gal: 'gal', cup: 'cups',
    kmh: 'km/h', mph: 'mph', m2: 'm²', ft2: 'sq ft', c: '°C', f: '°F'
  };
  const UNIT_ALIASES = {
    mm: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres', 'มม.', 'มม', 'มิลลิเมตร'],
    cm: ['cm', 'cms', 'centimeter', 'centimeters', 'centimetre', 'centimetres', 'ซม.', 'ซม', 'เซนติเมตร', 'เซนต์', 'เซน', 'เซ็น'],
    m: ['m', 'meter', 'meters', 'metre', 'metres', 'เมตร'],
    km: ['km', 'kms', 'kilometer', 'kilometers', 'kilometre', 'kilometres', 'กม.', 'กม', 'กิโลเมตร'],
    in: ['in', 'in.', 'inch', 'inches', '"', '″', '”', 'นิ้ว'],
    ft: ['ft', 'ft.', 'foot', 'feet', "'", '′', '’', 'ฟุต'],
    yd: ['yd', 'yds', 'yard', 'yards', 'หลา'],
    mi: ['mi', 'mile', 'miles', 'ไมล์'],
    g: ['g', 'gr', 'gram', 'grams', 'gramme', 'grammes', 'กรัม'],
    kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'kilogramme', 'kilogrammes', 'กก.', 'กก', 'กิโลกรัม'],
    lb: ['lb', 'lbs', 'lb.', 'lbs.', 'pound', 'pounds', 'ปอนด์'],
    oz: ['oz', 'ounce', 'ounces', 'ออนซ์'],
    st: ['stone', 'stones'],
    ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres', 'cc', 'มล.', 'มล', 'มิลลิลิตร'],
    l: ['l', 'liter', 'liters', 'litre', 'litres', 'ลิตร'],
    floz: ['fl oz', 'fl. oz', 'fl.oz', 'fluid ounce', 'fluid ounces'],
    gal: ['gal', 'gallon', 'gallons', 'แกลลอน', 'แกลอน'],
    cup: ['cup', 'cups', 'ถ้วย'],
    kmh: ['km/h', 'km/hr', 'kmh', 'kph', 'kmph', 'กม./ชม.', 'กม./ชม', 'กม/ชม'],
    mph: ['mph', 'mi/h', 'miles per hour'],
    m2: ['m2', 'm²', 'sqm', 'sq m', 'sq. m', 'sq.m', 'square meter', 'square meters', 'square metre', 'square metres', 'ตร.ม.', 'ตร.ม', 'ตารางเมตร'],
    ft2: ['sq ft', 'sqft', 'sq. ft', 'sq.ft', 'sq. ft.', 'ft2', 'ft²', 'square foot', 'square feet'],
    c: ['°c', 'ºc', '℃', 'degc', 'celsius', 'degrees c', 'degree c', 'degrees celsius', 'องศาเซลเซียส', 'องศา'],
    f: ['°f', 'ºf', '℉', 'degf', 'fahrenheit', 'degrees f', 'degree f', 'degrees fahrenheit', 'องศาฟาเรนไฮต์']
  };

  /* ---------- currencies ---------- */
  const CURRENCY_WORDS = {
    USD: ['usd', 'us dollar', 'us dollars', 'dollar', 'dollars', 'buck', 'bucks', 'ดอลลาร์สหรัฐ', 'ดอลลาร์', 'ดอลล่าร์', 'ดอล'],
    THB: ['thb', 'baht', 'bht', 'บาท'],
    EUR: ['eur', 'euro', 'euros', 'ยูโร'],
    GBP: ['gbp', 'sterling', 'pound sterling', 'pounds sterling', 'quid'],
    JPY: ['jpy', 'yen', 'เยน', '円'],
    CNY: ['cny', 'rmb', 'yuan', 'หยวน', '元'],
    KRW: ['krw', 'won', 'วอน', '원'],
    MYR: ['myr', 'ringgit', 'ริงกิต'],
    SGD: ['sgd', 'singapore dollar', 'singapore dollars'],
    AUD: ['aud', 'australian dollar', 'australian dollars'],
    HKD: ['hkd', 'hong kong dollar', 'hong kong dollars'],
    TWD: ['twd', 'ntd'],
    VND: ['vnd', 'dong', 'ดอง'],
    LAK: ['lak', 'kip', 'กีบ'],
    INR: ['inr', 'rupee', 'rupees', 'รูปี'],
    CHF: ['chf', 'franc', 'francs']
  };
  const CURRENCY_CODES = ['CAD', 'NZD', 'KHR', 'MMK', 'PHP', 'IDR', 'SEK', 'NOK', 'DKK', 'AED', 'SAR', 'QAR', 'KWD', 'BHD',
    'OMR', 'RUB', 'BRL', 'MXN', 'ZAR', 'TRY', 'PLN', 'CZK', 'HUF', 'ILS', 'EGP', 'PKR', 'BDT', 'LKR', 'NPR', 'BND', 'MOP'];
  const CURRENCY_SYMBOLS = [['US$', 'USD'], ['AU$', 'AUD'], ['CA$', 'CAD'], ['HK$', 'HKD'], ['NT$', 'TWD'], ['NZ$', 'NZD'],
    ['S$', 'SGD'], ['A$', 'AUD'], ['C$', 'CAD'], ['R$', 'BRL'], ['$', 'USD'], ['฿', 'THB'], ['€', 'EUR'], ['£', 'GBP'],
    ['¥', 'JPY'], ['₩', 'KRW'], ['₹', 'INR'], ['₱', 'PHP'], ['₫', 'VND'], ['₭', 'LAK'], ['RM', 'MYR'], ['Rp', 'IDR']];
  const SUFFIX_SYMBOLS = ['$', '฿', '€', '£', '¥', '₩', '₹', '₱', '₫', '₭'];
  const SYMBOL_TO_CODE = Object.fromEntries(CURRENCY_SYMBOLS);
  const MULTIPLIER = { k: 1e3, K: 1e3, thousand: 1e3, m: 1e6, M: 1e6, mn: 1e6, million: 1e6, bn: 1e9, billion: 1e9 };

  /* ---------- pattern building ---------- */
  const key = s => s.toLowerCase().replace(/\s+/g, '');
  const esc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const LOOKUP = new Map();
  for (const [u, list] of Object.entries(UNIT_ALIASES)) for (const a of list) LOOKUP.set(key(a), u);
  for (const [c, list] of Object.entries(CURRENCY_WORDS)) for (const a of list) LOOKUP.set(key(a), 'CUR:' + c);
  for (const c of CURRENCY_CODES) LOOKUP.set(c.toLowerCase(), 'CUR:' + c);

  function alternation(list) {
    return [...new Set(list)].sort((a, b) => b.length - a.length).map(a => {
      let p = esc(a).replace(/ /g, '\\s*');
      if (/[a-z.'’′]$/i.test(a) && !/[฀-๿]/.test(a)) p += '(?![a-z])';
      return p;
    }).join('|');
  }
  const ALL_ALIASES = alternation([...LOOKUP.keys()].concat(
    Object.values(UNIT_ALIASES).flat(), Object.values(CURRENCY_WORDS).flat()));
  const LENGTH_ALIASES = alternation(['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'].flatMap(u => UNIT_ALIASES[u]));
  const CURRENCY_ALIASES = alternation(Object.values(CURRENCY_WORDS).flat().concat(CURRENCY_CODES.map(c => c.toLowerCase())));
  const CODE_ALT = Object.keys(CURRENCY_WORDS).concat(CURRENCY_CODES).join('|');
  const SYMBOL_ALT = CURRENCY_SYMBOLS.map(([s]) => esc(s)).join('|');
  const SUFFIX_ALT = SUFFIX_SYMBOLS.map(esc).join('|');
  const MULT_ALT = 'thousand|million|billion|mn|bn|k|m';

  const VULGAR = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875, '⅓': 1 / 3, '⅔': 2 / 3 };
  const UNI = Object.keys(VULGAR).join('');
  const NUM = String.raw`(?:\d+[ \t]+\d+[ \t]*\/[ \t]*\d+|\d+[ \t]*\/[ \t]*\d+|\d+[ \t]?[${UNI}]|[${UNI}]|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?|\.\d+)`;

  function parseNumber(tok) {
    const t = tok.trim();
    let m;
    if ((m = t.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) return +m[1] + (+m[2]) / (+m[3]);
    if ((m = t.match(/^(\d+)\s*\/\s*(\d+)$/))) return (+m[1]) / (+m[2]);
    if ((m = t.match(new RegExp('^(\\d+)?\\s?([' + UNI + '])$')))) return (m[1] ? +m[1] : 0) + VULGAR[m[2]];
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return +t.replace(/,/g, '');
    if (/^\d+,\d+$/.test(t)) return +t.replace(',', '.');
    return +t;
  }
  const multiplier = w => (w ? MULTIPLIER[w] || MULTIPLIER[w.toLowerCase()] || 1 : 1);

  /* ---------- reading the text ---------- */
  function parse(text) {
    const src = String(text == null ? '' : text);
    const taken = [], found = [];
    const free = (s, e) => taken.every(([a, b]) => e <= a || s >= b);
    const clearBefore = i => i === 0 || !/[A-Za-z0-9.,]/.test(src[i - 1]);
    const scan = (re, fn) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        if (!m[0].length) { re.lastIndex++; continue; }
        const s = m.index, e = s + m[0].length;
        if (!free(s, e) || !clearBefore(s)) continue;
        const q = fn(m, s, e);
        if (q && [q.value].concat(q.values || []).every(v => v === undefined || isFinite(v))) {
          taken.push([s, e]);
          q.start = s;
          q.text = m[0].trim();
          found.push(q);
        }
      }
    };
    const unitOf = alias => LOOKUP.get(key(alias));
    const looksLikeWordIn = (alias, e) => key(alias) === 'in' && /^[ \t]+[a-z]/i.test(src.slice(e));

    // 1. height or length written as feet and inches: 5'9", 5 ft 9 in, 6 feet 2 inches
    scan(new RegExp(String.raw`(\d+(?:\.\d+)?)[ \t]*(?:'|′|’|ft\.?|feet|foot)[ \t]*(${NUM})[ \t]*(?:"|″|”|''|in(?:ch(?:es)?)?\.?(?![a-z]))?`, 'gi'), m => {
      const ft = +m[1], inch = parseNumber(m[2]);
      if (!(inch < 12)) return null;
      return { kind: 'length', unit: 'ftin', value: ft * 12 + inch };
    });

    // 2. sizes like 120 x 60 cm or 24 x 36"
    scan(new RegExp(String.raw`(${NUM})[ \t]*[x×*][ \t]*(${NUM})(?:[ \t]*[x×*][ \t]*(${NUM}))?[ \t]*(${LENGTH_ALIASES})`, 'gi'), m => {
      const unit = unitOf(m[4]);
      if (!unit || KIND[unit] !== 'length') return null;
      return { kind: 'length', unit, dims: true, values: [m[1], m[2], m[3]].filter(Boolean).map(parseNumber) };
    });

    // 3. ranges like 20-30 kg, 5 to 6 ft, 100-200 baht
    scan(new RegExp(String.raw`(${NUM})[ \t]*(?:-|–|—|~|to)[ \t]*(${NUM})[ \t]*(${ALL_ALIASES})`, 'gi'), (m, s, e) => {
      const unit = unitOf(m[3]);
      if (!unit || looksLikeWordIn(m[3], e)) return null;
      const values = [parseNumber(m[1]), parseNumber(m[2])];
      if (unit.startsWith('CUR:')) return { kind: 'currency', code: unit.slice(4), values };
      return { kind: KIND[unit], unit, values };
    });

    // 4. money with the symbol or code first: $30, ฿1,500, €25, US$ 9.99, $2.5k, USD 30
    scan(new RegExp(String.raw`(${SYMBOL_ALT})[ \t]?(${NUM})(?:[ \t]?(${MULT_ALT})(?![a-z]))?`, 'g'), m => {
      if (/^[A-Z]/.test(m[1]) && /[A-Za-z]/.test(src[m.index - 1] || '')) return null;
      return { kind: 'currency', code: SYMBOL_TO_CODE[m[1]], value: parseNumber(m[2]) * multiplier(m[3]) };
    });
    scan(new RegExp(String.raw`\b(${CODE_ALT})[ \t]?(${NUM})(?:[ \t]?(${MULT_ALT})(?![a-z]))?`, 'gi'), m =>
      ({ kind: 'currency', code: m[1].toUpperCase(), value: parseNumber(m[2]) * multiplier(m[3]) }));

    // 5. money with a multiplier and word: 30k baht, 2.5 million usd
    scan(new RegExp(String.raw`(${NUM})[ \t]?(${MULT_ALT})[ \t]*(${CURRENCY_ALIASES})`, 'gi'), m => {
      const unit = unitOf(m[3]);
      if (!unit || !unit.startsWith('CUR:')) return null;
      return { kind: 'currency', code: unit.slice(4), value: parseNumber(m[1]) * multiplier(m[2]) };
    });

    // 6. temperatures: 20°C, -5 °F, 350°, 68F
    scan(new RegExp(String.raw`(-?)(${NUM})[ \t]*[°º˚][ \t]*(C(?:elsius)?|F(?:ahrenheit)?)?(?![a-z])`, 'gi'), m =>
      ({ kind: 'temperature', unit: (m[3] || 'c').charAt(0).toLowerCase(), value: (m[1] ? -1 : 1) * parseNumber(m[2]) }));
    scan(new RegExp(String.raw`(-?)(${NUM})([CF])(?![A-Za-z])`, 'g'), m =>
      ({ kind: 'temperature', unit: m[3].toLowerCase(), value: (m[1] ? -1 : 1) * parseNumber(m[2]) }));

    // 7. money after the number: 30$, 500฿, 25€
    scan(new RegExp(String.raw`(${NUM})[ \t]?(${SUFFIX_ALT})`, 'g'), m =>
      ({ kind: 'currency', code: SYMBOL_TO_CODE[m[2]], value: parseNumber(m[1]) }));

    // 8. everything else: number then unit or currency word: 30usd, 1,500 baht, 175 cm, 3/4 inch, 70 กก.
    scan(new RegExp(String.raw`(-?)(${NUM})[ \t]*(${ALL_ALIASES})`, 'gi'), (m, s, e) => {
      const unit = unitOf(m[3]);
      if (!unit || looksLikeWordIn(m[3], e)) return null;
      const v = parseNumber(m[2]);
      if (unit.startsWith('CUR:')) return { kind: 'currency', code: unit.slice(4), value: v };
      return { kind: KIND[unit], unit, value: KIND[unit] === 'temperature' && m[1] ? -v : v };
    });

    found.sort((a, b) => a.start - b.start);
    return found;
  }

  /* ---------- choosing the target unit ---------- */
  function plan(unit, v) {
    const a = Math.abs(v);
    switch (unit) {
      case 'in': return a < 0.4 ? ['mm'] : a < 100 ? ['cm', a < 4 ? 'mm' : a >= 40 ? 'm' : null] : ['m', 'cm'];
      case 'ft': return a < 10 ? ['cm', 'm'] : ['m'];
      case 'ftin': return ['cm', 'm'];
      case 'yd': return ['m'];
      case 'mi': return ['km'];
      case 'mm': return ['in', 'frac'];
      case 'cm': return a >= 90 ? ['in', 'ftin'] : a < 30 ? ['in', 'frac'] : ['in'];
      case 'm': return a < 3 ? ['ftin', 'in'] : ['ft'];
      case 'km': return ['mi'];
      case 'kg': return a < 1 ? ['lb', 'oz'] : ['lb'];
      case 'g': return a >= 1000 ? ['lb'] : a >= 100 ? ['oz', 'lb'] : ['oz'];
      case 'lb': return ['kg'];
      case 'oz': return ['g'];
      case 'st': return ['kg', 'lb'];
      case 'ml': return ['floz'];
      case 'l': return a < 4 ? ['floz', 'gal'] : ['gal'];
      case 'floz': return ['ml'];
      case 'gal': return ['l'];
      case 'cup': return ['ml'];
      case 'kmh': return ['mph'];
      case 'mph': return ['kmh'];
      case 'm2': return ['ft2'];
      case 'ft2': return ['m2'];
      case 'c': return ['f'];
      case 'f': return ['c'];
      default: return [];
    }
  }

  /* ---------- formatting ---------- */
  const nf = (v, d) => {
    const r = Math.round(v * 10 ** d) / 10 ** d;
    return (r === 0 ? 0 : r).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: d });
  };
  function digits(unit, a) {
    switch (unit) {
      case 'mm': return a < 10 ? 2 : a < 100 ? 1 : 0;
      case 'cm': return a < 10 ? 2 : 1;
      case 'm': return a < 100 ? 2 : 1;
      case 'km': case 'mi': return a < 10 ? 2 : a < 1000 ? 1 : 0;
      case 'in': return a < 1 ? 3 : a < 10 ? 2 : 1;
      case 'ft': return a < 100 ? 1 : 0;
      case 'kg': case 'lb': case 'oz': return a < 10 ? 2 : 1;
      case 'g': case 'ml': return a < 10 ? 1 : 0;
      case 'c': case 'f': return 1;
      default: return a < 1 ? 3 : a < 10 ? 2 : a < 100 ? 1 : 0;
    }
  }
  const fmt = (v, unit) => nf(v, digits(unit, Math.abs(v)));
  const joinWith = q => (q && q.dims ? ' × ' : '–');
  function ftIn(totalIn) {
    let ft = Math.floor(totalIn / 12), inch = Math.round(totalIn - ft * 12);
    if (inch === 12) { ft += 1; inch = 0; }
    return ft + ' ft ' + inch + ' in';
  }
  function frac16(inches) {
    const n = Math.round(inches * 16);
    if (n <= 0 || inches >= 24) return null;
    const whole = Math.floor(n / 16);
    let num = n % 16, den = 16;
    while (num && num % 2 === 0) { num /= 2; den /= 2; }
    return '≈ ' + (whole || '') + (num ? (whole ? ' ' : '') + num + '/' + den : '') + ' in';
  }
  function toTemp(v, from) { return from === 'c' ? v * 9 / 5 + 32 : (v - 32) * 5 / 9; }

  function show(vals, to, fromUnit, j) {
    if (to === 'ftin') return vals.map(v => ftIn(fromUnit === 'in' ? v : v * FACTORS[fromUnit] / FACTORS.in)).join(j);
    if (to === 'frac') return vals.length === 1 ? frac16(vals[0] * FACTORS[fromUnit] / FACTORS.in) : null;
    if (to === 'c' || to === 'f') return vals.map(v => fmt(toTemp(v, fromUnit), to)).join(j) + ' ' + LABEL[to];
    return vals.map(v => fmt(v * FACTORS[fromUnit] / FACTORS[to], to)).join(j) + ' ' + LABEL[to];
  }
  function sourceText(q) {
    const vals = q.values || [q.value];
    if (q.unit === 'ftin') return ftInExact(q.value);
    return vals.map(v => nf(v, 3)).join(joinWith(q)) + ' ' + LABEL[q.unit];
  }
  function ftInExact(totalIn) {
    const ft = Math.floor(totalIn / 12), inch = +(totalIn - ft * 12).toFixed(2);
    return ft + ' ft ' + nf(inch, 2) + ' in';
  }

  /* ---------- money ---------- */
  const SIGN = { THB: '฿', USD: '$' };
  function money(v, code) {
    const d = code === 'THB' && Math.abs(v) >= 1000 ? 0 : 2;
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function rateText(r) { return nf(r, r < 0.01 ? 6 : r < 1 ? 4 : r < 100 ? 2 : 0); }
  function convertMoney(q, rates) {
    const from = q.code, to = from === 'THB' ? 'USD' : 'THB';
    const vals = q.values || [q.value];
    const src = vals.map(v => nf(v, 2)).join('–') + ' ' + from;
    const base = { kind: 'currency', from: src, to };
    const R = rates && rates.rates;
    if (!R) return Object.assign(base, { pending: true, main: '…', note: 'Getting today\'s rate' });
    if (!R[from] || !R[to]) return Object.assign(base, { error: true, main: '—', note: 'No rate for ' + from });
    const out = vals.map(v => v / R[from] * R[to]);
    const main = SIGN[to] + out.map(v => money(v, to)).join('–');
    const note = from === 'THB' ? '1 USD = ' + rateText(R.THB / R.USD) + ' THB' : '1 ' + from + ' = ' + rateText(R.THB / R[from]) + ' THB';
    return Object.assign(base, { main, unit: to, note, copy: out.map(v => money(v, to)).join('–') + ' ' + to });
  }

  /* ---------- one result per amount found ---------- */
  function convert(q, rates) {
    if (q.kind === 'currency') return convertMoney(q, rates);
    const vals = q.values || [q.value];
    const fromUnit = q.unit === 'ftin' ? 'in' : q.unit;
    let targets = plan(q.unit, Math.max(...vals.map(Math.abs))).filter(Boolean);
    if (q.dims) targets = [targets[0] === 'ftin' ? 'in' : targets[0]];
    const shown = targets.map(t => show(vals, t, fromUnit, joinWith(q))).filter(Boolean);
    return { kind: q.kind, from: sourceText(q), main: shown[0], more: shown.slice(1), copy: shown[0] };
  }

  function run(text, rates) {
    const items = parse(text).map(q => convert(q, rates));
    return { items, needsRates: items.some(i => i.kind === 'currency') };
  }

  const api = { parse, convert, run, parseNumber, plan };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConvertEngine = api;
})(typeof window !== 'undefined' ? window : this);
