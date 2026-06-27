#!/usr/bin/env node

/**
 * Convert Markdown study plans to JSON seed files.
 *
 * Usage: node scripts/convert-plans.mjs
 *
 * Reads Plan_de_Estudio/mes-*.md and outputs to src/data/seed/mes-*.json.
 * This is a best-effort parser — the markdown is written by a human and
 * follows loose conventions. Manual review of output is expected.
 *
 * The parser looks for:
 *   - Day headers: "## 📆 Día N — Title" or "### 📆 Día N"
 *   - Discipline sections: "### 🌅 Inglés", "### 🎵 Música", "### 🇯🇵 Japonés"
 *   - Task list items: "- **Task name** (duration min)" with description
 *   - Difficulty indicators: "Fácil" → easy, "Medio" → medium, "Difícil" → hard
 *
 * Conventions this parser expects:
 *   - Each day starts with a ## or ### header containing "Día"
 *   - Each discipline section starts with a ### header
 *   - Tasks are list items (-) with bold text as task name
 *   - Duration in parentheses at end of task: (N min)
 *   - Every discipline section ends before the next ## or end of file
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PLANS_DIR = join(ROOT, 'Plan_de_Estudio');
const OUTPUT_DIR = join(ROOT, 'src', 'data', 'seed');

// Difficulty mapping
const DIFFICULTY_MAP = {
  fácil: 'easy',
  facil: 'easy',
  easy: 'easy',
  medio: 'medium',
  medium: 'medium',
  normal: 'medium',
  difícil: 'hard',
  dificil: 'hard',
  hard: 'hard',
  duro: 'hard'
};

// Discipline detection
const DISCIPLINE_PATTERNS = [
  { pattern: /ingl[ée]s|english/i, id: 'english' },
  { pattern: /m[uú]sica|music|música/i, id: 'music' },
  { pattern: /japon[ée]s|japanese/i, id: 'japanese' },
  { pattern: /español|spanish/i, id: 'spanish' }
];

const DISCIPLINE_EMOJI = {
  english: ['🇬🇧'],
  music: ['🎵', '🎶'],
  japanese: ['🇯🇵'],
  spanish: ['🇪🇸']
};

function detectDiscipline(line) {
  for (const dp of DISCIPLINE_PATTERNS) {
    if (dp.pattern.test(line)) return dp.id;
  }
  // Try emoji
  for (const [id, emojis] of Object.entries(DISCIPLINE_EMOJI)) {
    if (emojis.some((e) => line.includes(e))) return id;
  }
  return null;
}

function detectDifficulty(text) {
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(DIFFICULTY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'medium'; // default
}

function extractDuration(line) {
  // Match patterns like "(10 min)" or "(15 minutos)" or "~55 min/día"
  const match = line.match(/\(?(\d+)\s*(?:min|minutos|minutes?)\)?/);
  if (match) return parseInt(match[1], 10);
  return 10; // default duration
}

function extractCategory(taskText, discipline) {
  const lower = taskText.toLowerCase();
  if (lower.includes('anki') || lower.includes('vocab') || lower.includes('palabras')) return 'vocab';
  if (lower.includes('listen') || lower.includes('shadow') || lower.includes('audio')) return 'listening';
  if (lower.includes('speak') || lower.includes('record') || lower.includes('self-rec') || lower.includes('monologue') || lower.includes('introduc')) return 'speaking';
  if (lower.includes('read') || lower.includes('text') || lower.includes('british council')) return 'reading';
  if (lower.includes('grammar') || lower.includes('present simple') || lower.includes('past simple') || lower.includes('present perfect') || lower.includes('to be') || lower.includes('tense') || lower.includes('conjuga')) return 'grammar';
  if (lower.includes('music theory') || lower.includes('clef') || lower.includes('interval') || lower.includes('scale') || lower.includes('dynamics') || lower.includes('tempo') || lower.includes('articulation') || lower.includes('key sign')) return 'theory';
  if (lower.includes('clap') || lower.includes('rhythm') || lower.includes('sight-read') || lower.includes('practice')) return 'practice';
  if (lower.includes('write') || lower.includes('essay') || lower.includes('journal') || lower.includes('error log')) return 'writing';
  if (lower.includes('minimal') || lower.includes('pronunciación') || lower.includes('pronunciation')) return 'speaking';
  if (lower.includes('hiragana') || lower.includes('katakana') || lower.includes('kanji')) return 'reading';
  if (lower.includes('calibration')) return 'practice';
  if (discipline === 'music') return lower.includes('theory') ? 'theory' : 'practice';
  return 'practice';
}

function parseMonthFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract month name from first H1
  const monthNameMatch = content.match(/^#\s*(.+)$/m);
  const monthName = monthNameMatch ? monthNameMatch[1].trim() : 'Unknown Month';

  let currentWeek = 1;
  let currentDay = 0;
  let currentDiscipline = null;
  let days = [];
  let weekLabel = '';

  const dayBlocks = [];
  let inDay = false;
  let currentDayLines = [];
  let dayLabel = '';
  let dayHeaderLine = '';

  // Phase detection
  let phase = 'Foundation';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for week header
    const weekMatch = line.match(/^#+\s+Semana\s+(\d+)/i);
    if (weekMatch) {
      const weekNum = parseInt(weekMatch[1], 10);
      // Map: weeks 1-3 → Foundation, 5-7 → Expansion, 9-11 → Consolidation
      if (weekNum >= 5 && weekNum <= 7) phase = 'Expansion';
      else if (weekNum >= 9) phase = 'Consolidation';
      else phase = 'Foundation';

      weekLabel = line.replace(/^#+\s+/, '').trim();
      currentWeek = weekNum;
      continue;
    }

    // Check for day header
    const dayMatch = line.match(/^#{2,4}\s*[📆]?\s*D[ií]a\s+(\d+)/i);
    if (dayMatch) {
      if (inDay && currentDayLines.length > 0) {
        dayBlocks.push({ day: currentDay, label: dayLabel, header: dayHeaderLine, lines: [...currentDayLines] });
      }
      currentDay = parseInt(dayMatch[1], 10);
      dayLabel = line.replace(/^#+\s*/, '').trim();
      dayHeaderLine = lines[i];
      currentDayLines = [];
      inDay = true;
      currentDiscipline = null;
      continue;
    }

    if (inDay) {
      // Check for discipline header
      const discLine = detectDiscipline(line);
      if (discLine && line.startsWith('#')) {
        currentDiscipline = discLine;
      }
      currentDayLines.push(line);
    }
  }

  // Push last day
  if (inDay && currentDayLines.length > 0) {
    dayBlocks.push({ day: currentDay, label: dayLabel, header: dayHeaderLine, lines: [...currentDayLines] });
  }

  // Parse each day block into tasks
  const parsedDays = [];
  for (const block of dayBlocks) {
    const tasks = [];
    let discipline = null;

    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i];

      // Track current discipline from headers
      const disc = detectDiscipline(line);
      if (disc && line.startsWith('#')) {
        discipline = disc;
        continue;
      }

      // Skip non-task lines
      if (!line.startsWith('- ') && !line.startsWith('* ')) continue;
      if (line.includes('```')) continue;
      if (line.match(/^\s*[-*]\s*$/) || line.trim() === '') continue;

      const taskText = line.replace(/^[-*]\s+/, '').trim();
      const duration = extractDuration(taskText);
      const difficulty = detectDifficulty(taskText);

      // Get the discipline for this task
      let taskDiscipline = discipline;
      // Check if there's an emoji indication on this line
      const lineDisc = detectDiscipline(line);
      if (lineDisc && !line.startsWith('#')) {
        taskDiscipline = lineDisc;
      }

      // Clean up task text: remove duration, bold markers
      let cleanText = taskText
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\(?\d+\s*min(?:utos?)?(?:utes?)?\)?\s*/gi, '') // Remove duration
        .replace(/\s+/g, ' ')
        .trim();

      // Remove leading dashes or list markers
      cleanText = cleanText.replace(/^[-*]\s+/, '').trim();

      if (cleanText.length < 3) continue; // Skip empty/too short tasks

      const category = extractCategory(cleanText, taskDiscipline);

      tasks.push({
        discipline: taskDiscipline || 'english',
        difficulty,
        description: cleanText.substring(0, 200),
        durationMin: Math.min(duration, 120), // Cap at 2h
        order: tasks.length + 1,
        category
      });
    }

    parsedDays.push({
      day: block.day,
      label: block.label,
      tasks: tasks.length > 0 ? tasks : [
        {
          discipline: 'english',
          difficulty: 'medium',
          description: 'Study session (task details from markdown)',
          durationMin: 40,
          order: 1,
          category: 'practice'
        }
      ]
    });
  }

  return {
    monthName,
    phase,
    weeks: [{
      week: currentWeek >= 5 ? Math.ceil(parsedDays[0]?.day / 7) || 1 : 1,
      phase,
      label: weekLabel || monthName,
      days: parsedDays
    }],
    dayCount: parsedDays.length
  };
}

function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find all mes-*.md files in PLANS_DIR
  const files = readdirSync(PLANS_DIR)
    .filter((f) => /^mes-?\d/.test(f) && f.endsWith('.md'))
    .sort();

  console.log(`Found ${files.length} month files to process`);

  for (const file of files) {
    const filePath = join(PLANS_DIR, file);
    console.log(`Processing ${file}...`);

    try {
      const result = parseMonthFile(filePath);
      const outputFileName = file.replace(/\.md$/, '.json');
      const outputPath = join(OUTPUT_DIR, outputFileName);

      // Map day numbers across months
      const firstDay = result.weeks[0]?.days[0]?.day || 1;
      const weeks = result.weeks;

      const seedEntry = {
        plan: {
          id: outputFileName.replace(/\.json$/, ''),
          name: result.monthName,
          totalDays: result.dayCount,
          totalWeeks: weeks.length,
          startDate: '',
          description: `Phase: ${result.phase} — ${result.monthName}`
        },
        weeks
      };

      writeFileSync(outputPath, JSON.stringify(seedEntry, null, 2));
      console.log(`  → Written to ${outputPath} (${result.dayCount} days, ${weeks.length} week(s))`);
    } catch (err) {
      console.error(`  ✗ Error processing ${file}:`, err.message);
    }
  }

  console.log('\nDone. Review the output JSON files for accuracy.');
}

main();
