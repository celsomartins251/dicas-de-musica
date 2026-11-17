const STEP_SEMITONES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const SHARP_ORDER = ['F','C','G','D','A','E','B'];
const FLAT_ORDER = ['B','E','A','D','G','C','F'];
const TYPE_BEATS = { maxima:32, long:16, breve:8, whole:4, half:2, quarter:1, eighth:.5, '16th':.25, '32nd':.125, '64th':.0625, '128th':.03125 };

function children(el, name) {
  return Array.from(el?.children || []).filter(x => x.localName === name);
}
function child(el, name) { return children(el, name)[0] || null; }
function value(el, name) { return (child(el, name)?.textContent || '').trim(); }
function numberValue(el, name, fallback) {
  const n = Number(value(el, name));
  return Number.isFinite(n) && n !== 0 ? n : fallback;
}
function keyMap(fifths) {
  const map = {};
  const count = Math.max(-7, Math.min(7, Number(fifths) || 0));
  const order = count > 0 ? SHARP_ORDER : FLAT_ORDER;
  for (let i = 0; i < Math.abs(count); i++) map[order[i]] = count > 0 ? 1 : -1;
  return map;
}
function accidentalValue(name) {
  return ({ sharp:1, flat:-1, natural:0, 'double-sharp':2, 'sharp-sharp':2, 'flat-flat':-2, 'quarter-sharp':.5, 'quarter-flat':-.5 })[name] ?? null;
}
function fallbackDuration(note) {
  const type = value(note, 'type');
  let beats = TYPE_BEATS[type] || 0;
  const dots = children(note, 'dot').length;
  if (dots) beats *= 2 - Math.pow(.5, dots);
  return beats;
}
function pitchFromNote(note, activeKey, measureAccidentals) {
  const pitch = child(note, 'pitch');
  if (!pitch) return null;
  const step = value(pitch, 'step').toUpperCase();
  const octave = Number(value(pitch, 'octave'));
  if (!(step in STEP_SEMITONES) || !Number.isFinite(octave)) return null;
  const alterNode = child(pitch, 'alter');
  const accidentalNode = child(note, 'accidental');
  const accidentalKey = step + ':' + octave;
  let alter;
  if (alterNode) alter = Number(alterNode.textContent);
  else if (accidentalNode && accidentalValue(accidentalNode.textContent.trim()) !== null) alter = accidentalValue(accidentalNode.textContent.trim());
  else if (Object.prototype.hasOwnProperty.call(measureAccidentals, accidentalKey)) alter = measureAccidentals[accidentalKey];
  else alter = activeKey[step] || 0;
  if (alterNode || accidentalNode) measureAccidentals[accidentalKey] = alter;
  return { step, octave, alter, midi:(octave + 1) * 12 + STEP_SEMITONES[step] + alter };
}
function rootLabel(step, alter) {
  const accidental = Number(alter) === 1 ? '#' : Number(alter) === -1 ? 'b' : Number(alter) === 2 ? '##' : Number(alter) === -2 ? 'bb' : '';
  return String(step || '') + accidental;
}
function chordKind(kind) {
  const map = {
    major:'', minor:'m', dominant:'7', diminished:'dim', augmented:'aug',
    'major-seventh':'maj7', 'minor-seventh':'m7', 'dominant-seventh':'7',
    'half-diminished':'m7b5', 'diminished-seventh':'dim7', 'minor-major':'m(maj7)',
    'suspended-fourth':'sus4', 'suspended-second':'sus2', power:'5'
  };
  return map[kind] ?? kind ?? '';
}
function parseHarmony(node, xmlIndex, measure, beat) {
  const root = child(node, 'root');
  const step = value(root, 'root-step');
  if (!step) return null;
  const alter = Number(value(root, 'root-alter') || 0);
  const kindNode = child(node, 'kind');
  const kind = kindNode?.getAttribute('text') || chordKind(kindNode?.textContent?.trim());
  return { xmlIndex, measure, beat, text:rootLabel(step, alter) + kind, rootStep:step, rootAlter:alter, kindValue:kindNode?.textContent?.trim() || 'major' };
}
function parseMusicXML(xmlText) {
  if (typeof DOMParser === 'undefined') throw new Error('Este navegador não oferece leitura XML.');
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('O arquivo MusicXML está malformado.');
  const root = doc.documentElement;
  if (!root || root.localName !== 'score-partwise') throw new Error('Formato não suportado. Importe MusicXML score-partwise.');
  const partNames = {};
  for (const p of Array.from(doc.getElementsByTagName('*')).filter(x => x.localName === 'score-part')) {
    const id = p.getAttribute('id');
    partNames[id] = value(p, 'part-name') || id;
  }
  const partEls = children(root, 'part');
  if (!partEls.length) throw new Error('O MusicXML não contém partes musicais.');
  let xmlNoteIndex = 0, xmlChordIndex = 0;
  const parsedParts = [];
  const warnings = [];
  let initialBpm = 120, hasInitialTempo = false;
  for (let partIndex = 0; partIndex < partEls.length; partIndex++) {
    const part = partEls[partIndex];
    let divisions = 1, fifths = 0, beats = 4, beatType = 4;
    const measures = [];
    for (let mi = 0; mi < children(part, 'measure').length; mi++) {
      const measure = children(part, 'measure')[mi];
      let cursor = 0, maxCursor = 0, lastOnset = 0;
      let activeKey = keyMap(fifths);
      const measureAccidentals = {};
      const notes = [], chords = [], tempos = [];
      const measureNumber = measure.getAttribute('number') || String(mi + 1);
      for (const node of Array.from(measure.children)) {
        if (node.localName === 'attributes') {
          const div = Number(value(node, 'divisions'));
          if (Number.isFinite(div) && div > 0) divisions = div;
          const key = child(node, 'key');
          if (key) { fifths = Number(value(key, 'fifths') || 0); activeKey = keyMap(fifths); }
          const time = child(node, 'time');
          if (time) { beats = Number(value(time, 'beats') || beats); beatType = Number(value(time, 'beat-type') || beatType); }
        } else if (node.localName === 'note') {
          const thisXmlIndex = xmlNoteIndex++;
          const durationNode = child(node, 'duration');
          const durationDivisions = durationNode ? Number(durationNode.textContent) : fallbackDuration(node) * divisions;
          const durationBeats = Number.isFinite(durationDivisions) && durationDivisions > 0 ? durationDivisions / divisions : 0;
          const isChordTone = !!child(node, 'chord');
          const onset = isChordTone ? lastOnset : cursor;
          if (!isChordTone) lastOnset = cursor;
          const pitch = pitchFromNote(node, activeKey, measureAccidentals);
          if (pitch && durationBeats > 0) {
            notes.push({
              xmlIndex:thisXmlIndex, partIndex, partId:part.getAttribute('id') || String(partIndex + 1),
              partName:partNames[part.getAttribute('id')] || ('Parte ' + (partIndex + 1)),
              measureIndex:mi, measure:measureNumber, beat:onset, startBeat:0,
              durationBeats, divisions, midi:pitch.midi, step:pitch.step, alter:pitch.alter,
              octave:pitch.octave, voice:value(node, 'voice') || '1', staff:value(node, 'staff') || '1',
              chordTone:isChordTone
            });
          } else if (!child(node, 'rest') && !pitch) {
            warnings.push('Nota sem altura identificável no compasso ' + measureNumber + '.');
          }
          if (!isChordTone) cursor += durationBeats;
          maxCursor = Math.max(maxCursor, cursor, onset + durationBeats);
        } else if (node.localName === 'backup') {
          cursor = Math.max(0, cursor - numberValue(node, 'duration', 0) / divisions);
        } else if (node.localName === 'forward') {
          cursor += numberValue(node, 'duration', 0) / divisions;
          maxCursor = Math.max(maxCursor, cursor);
        } else if (node.localName === 'harmony') {
          const chord = parseHarmony(node, xmlChordIndex++, measureNumber, cursor);
          if (chord) chords.push(chord);
        } else if (node.localName === 'direction') {
          const sound = child(node, 'sound');
          const soundTempo = Number(sound?.getAttribute('tempo'));
          const metronome = child(node, 'metronome');
          const printedTempo = Number(value(metronome, 'per-minute'));
          const bpm = soundTempo > 0 ? soundTempo : printedTempo;
          if (bpm > 0) {
            tempos.push({ beat:cursor, bpm });
            if (!hasInitialTempo) { initialBpm = bpm; hasInitialTempo = true; }
          }
        }
      }
      const nominal = beats * 4 / beatType;
      measures.push({ measureNumber, notes, chords, tempos, length:maxCursor || nominal, nominal, meter:{beats,beatType} });
    }
    parsedParts.push({ id:part.getAttribute('id') || String(partIndex + 1), name:partNames[part.getAttribute('id')] || ('Parte ' + (partIndex + 1)), measures });
  }
  const measureCount = Math.max(...parsedParts.map(p => p.measures.length));
  const measureLengths = [];
  for (let i = 0; i < measureCount; i++) {
    let length = 0, nominal = 0;
    for (const part of parsedParts) {
      const m = part.measures[i];
      if (m) { length = Math.max(length, m.length); nominal = Math.max(nominal, m.nominal); }
    }
    measureLengths[i] = length || nominal || 4;
  }
  const measureStarts = [];
  let totalBeats = 0;
  for (let i = 0; i < measureCount; i++) { measureStarts[i] = totalBeats; totalBeats += measureLengths[i]; }
  const notes = [], chords = [], tempoChanges = [];
  for (const part of parsedParts) {
    part.measures.forEach((m, mi) => {
      const start = measureStarts[mi] || 0;
      for (const n of m.notes) notes.push({ ...n, startBeat:start + n.beat });
      for (const c of m.chords) chords.push({ ...c, startBeat:start + c.beat, partName:part.name });
      for (const t of m.tempos) tempoChanges.push({ startBeat:start + t.beat, bpm:t.bpm });
    });
  }
  notes.sort((a,b) => a.startBeat - b.startBeat || a.midi - b.midi);
  chords.sort((a,b) => a.startBeat - b.startBeat);
  tempoChanges.sort((a,b) => a.startBeat - b.startBeat);
  const firstMeasure = parsedParts[0]?.measures[0];
  return {
    title:value(root, 'movement-title') || value(child(root, 'work'), 'work-title') || 'Partitura importada',
    parts:parsedParts.map(p => ({id:p.id,name:p.name})), notes, chords, tempoChanges,
    bpm:initialBpm, meter:firstMeasure?.meter || {beats:4,beatType:4},
    measureCount, durationBeats:totalBeats, warnings, xmlNoteCount:xmlNoteIndex
  };
}
function secondsAtBeat(beat, score) {
  const changes = [{ startBeat:0, bpm:score.bpm || 120 }, ...(score.tempoChanges || [])].sort((a,b) => a.startBeat - b.startBeat);
  let seconds = 0, lastBeat = 0, bpm = changes[0].bpm;
  for (const change of changes) {
    if (change.startBeat <= lastBeat) { bpm = change.bpm; continue; }
    if (change.startBeat >= beat) break;
    seconds += (change.startBeat - lastBeat) * 60 / bpm;
    lastBeat = change.startBeat; bpm = change.bpm;
  }
  return seconds + Math.max(0, beat - lastBeat) * 60 / bpm;
}
function musicXmlPlaybackEvents(score) {
  const events = [];
  for (const n of score.notes) {
    const channel = n.partIndex % 16;
    events.push({ type:'on', time:secondsAtBeat(n.startBeat, score), note:n.midi, velocity:88, channel });
    events.push({ type:'off', time:secondsAtBeat(n.startBeat + n.durationBeats, score), note:n.midi, channel });
  }
  events.sort((a,b) => a.time - b.time || (a.type === 'off' ? -1 : 1));
  return events;
}
export function formatPitch(midi) {
  const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const n = Math.round(Number(midi));
  if (!Number.isFinite(n) || n < 0 || n > 127) return '';
  return names[n % 12] + (Math.floor(n / 12) - 1);
}
export function isValidChordText(text) { return !!parseChordText(text); }
export function parsePitchText(text) {
  const m = String(text).trim().match(/^([A-Ga-g])([#b♯♭]?)(-?\d{1,2})$/);
  if (!m) return null;
  const step = m[1].toUpperCase(), accidental = m[2].replace('♯','#').replace('♭','b'), octave = Number(m[3]);
  const alter = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midi = (octave + 1) * 12 + STEP_SEMITONES[step] + alter;
  return Number.isInteger(midi) && midi >= 0 && midi <= 127 ? midi : null;
}
function parseChordText(text) {
  const m = String(text).trim().match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!m) return null;
  const suffix = m[3].trim();
  const kinds = {
    '':'major','maj':'major','m':'minor','min':'minor','7':'dominant','maj7':'major-seventh',
    'm7':'minor-seventh','m7b5':'half-diminished','ø':'half-diminished','dim':'diminished',
    'dim7':'diminished-seventh','aug':'augmented','+':'augmented','sus4':'suspended-fourth',
    'sus2':'suspended-second','5':'power'
  };
  const kind = kinds[suffix];
  if (!kind) return null;
  return { step:m[1].toUpperCase(), alter:m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, kind, text:suffix };
}
function notationForDuration(beats) {
  const values = Object.entries(TYPE_BEATS).sort((a,b) => b[1] - a[1]);
  for (const [type, base] of values) for (let dots = 0; dots <= 2; dots++) {
    const value = base * (2 - Math.pow(.5, dots));
    if (Math.abs(value - beats) < .0001) return { type, dots };
  }
  return null;
}
function setChildText(parent, name, text) {
  let el = child(parent, name);
  if (!el) {
    el = parent.ownerDocument.createElement(name);
    const order = parent.localName === 'pitch' ? ['step','alter','octave'] : parent.localName === 'root' ? ['root-step','root-alter','root-degree'] : parent.localName === 'attributes' ? ['divisions','key','time','staves','part-symbol','instruments','clef','staff-details','transpose'] : [];
    const target = order.indexOf(name);
    const next = target < 0 ? null : Array.from(parent.children).find(x => order.indexOf(x.localName) > target);
    if (next) parent.insertBefore(el, next); else parent.appendChild(el);
  }
  el.textContent = String(text);
  return el;
}
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}
export function applyMusicXmlEdits(xmlText, edits = {}) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Não foi possível atualizar o MusicXML.');
  const root = doc.documentElement;
  let noteIndex = 0;
  for (const part of children(root, 'part')) {
    let currentDivisions = 1;
    const measureInfos = [];
    for (const measure of children(part, 'measure')) {
      const noteRecords = [], durationRecords = [];
      for (const node of Array.from(measure.children)) {
        if (node.localName === 'attributes') {
          const d = Number(value(node, 'divisions'));
          if (d > 0) currentDivisions = d;
        } else if (node.localName === 'note' || node.localName === 'backup' || node.localName === 'forward') {
          const duration = child(node, 'duration');
          if (duration) durationRecords.push({ duration, divisions:currentDivisions });
          if (node.localName === 'note') noteRecords.push({ node, index:noteIndex++, edit:edits.notes?.[noteIndex-1], divisions:currentDivisions });
        }
      }
      measureInfos.push({ measure, noteRecords, durationRecords });
    }
    const hasDurationEdit = measureInfos.some(info => info.noteRecords.some(record => Number.isFinite(record.edit?.durationBeats) && record.edit.durationBeats > 0));
    let commonDivisions = 1;
    for (const info of measureInfos) for (const record of info.durationRecords) commonDivisions = lcm(commonDivisions, record.divisions);
    if (hasDurationEdit) commonDivisions = lcm(commonDivisions, 16);
    if (commonDivisions > 65536) throw new Error('A divisão rítmica deste arquivo é complexa demais para a revisão automática.');
    for (const info of measureInfos) {
      if (hasDurationEdit) {
        for (const record of info.durationRecords) {
          const factor = commonDivisions / record.divisions;
          record.duration.textContent = String(Math.round(Number(record.duration.textContent) * factor));
        }
        let attrs = children(info.measure, 'attributes')[0];
        if (!attrs) {
          attrs = doc.createElement('attributes');
          info.measure.insertBefore(attrs, info.measure.firstChild);
        }
        setChildText(attrs, 'divisions', commonDivisions);
        for (const otherAttrs of children(info.measure, 'attributes')) setChildText(otherAttrs, 'divisions', commonDivisions);
      }
      for (const record of info.noteRecords) {
        const { node, edit } = record;
        if (!edit) continue;
        if (Number.isFinite(edit.midi)) {
          const pitch = child(node, 'pitch');
          if (pitch) {
            const names = ['C','C','D','D','E','F','F','G','G','A','A','B'];
            const alters = [0,1,0,1,0,0,1,0,1,0,1,0];
            const midi = Math.round(edit.midi), pc = midi % 12, alter = alters[pc];
            setChildText(pitch, 'step', names[pc]);
            setChildText(pitch, 'alter', alter);
            setChildText(pitch, 'octave', Math.floor(midi / 12) - 1);
            const accidental = child(node, 'accidental');
            if (accidental) accidental.textContent = alter ? 'sharp' : 'natural';
          }
        }
        if (Number.isFinite(edit.durationBeats) && edit.durationBeats > 0) {
          const ticks = Math.max(1, Math.round(edit.durationBeats * (hasDurationEdit ? commonDivisions : record.divisions)));
          setChildText(node, 'duration', ticks);
          const notation = notationForDuration(edit.durationBeats);
          if (notation) {
            setChildText(node, 'type', notation.type);
            for (const dot of children(node, 'dot')) dot.remove();
            const typeNode = child(node, 'type');
            for (let d = 0; d < notation.dots; d++) {
              const dot = doc.createElement('dot');
              if (typeNode) node.insertBefore(dot, typeNode.nextSibling); else node.appendChild(dot);
            }
          }
        }
      }
    }
  }
  const harmonyNodes = Array.from(doc.getElementsByTagName('*')).filter(x => x.localName === 'harmony');
  harmonyNodes.forEach((node, index) => {
    const text = edits.chords?.[index];
    if (!text) return;
    const parsed = parseChordText(text);
    if (!parsed) return;
    const harmonyRoot = child(node, 'root');
    if (harmonyRoot) {
      setChildText(harmonyRoot, 'root-step', parsed.step);
      const oldAlter = child(harmonyRoot, 'root-alter');
      if (parsed.alter) setChildText(harmonyRoot, 'root-alter', parsed.alter);
      else if (oldAlter) oldAlter.remove();
    }
    const kind = child(node, 'kind');
    if (kind) {
      kind.textContent = parsed.kind;
      kind.setAttribute('text', parsed.text);
    }
  });
  return new XMLSerializer().serializeToString(doc);
}
export { parseMusicXML, musicXmlPlaybackEvents };