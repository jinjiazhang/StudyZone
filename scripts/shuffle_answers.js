const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../apps/api/prisma/lesson-data');

// Fisher-Yates shuffle
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function findJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      // Skip top-level indexes
      if (file !== 'subjects.json' && file !== 'courses.json' && file !== 'units.json' && file !== 'lessons.json') {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function processFile(filePath) {
  let content;
  try {
    content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return;
  }

  if (!content || !Array.isArray(content.exercises)) {
    return;
  }

  let modified = false;

  for (const ex of content.exercises) {
    if (
      ex.prompt &&
      Array.isArray(ex.prompt.options) &&
      ex.answer &&
      typeof ex.answer.correctIndex === 'number'
    ) {
      const options = ex.prompt.options;
      const correctIdx = ex.answer.correctIndex;

      if (correctIdx < 0 || correctIdx >= options.length) {
        console.warn(`Warning in ${filePath}: correctIndex ${correctIdx} is out of bounds for options of length ${options.length}`);
        continue;
      }

      const correctValue = options[correctIdx];

      // Shuffle options
      const shuffledOptions = shuffle(options);

      // Find new index
      const newCorrectIdx = shuffledOptions.indexOf(correctValue);

      if (newCorrectIdx === -1) {
        console.error(`Error: Could not find correct value "${correctValue}" in shuffled options in file ${filePath}`);
        continue;
      }

      ex.prompt.options = shuffledOptions;
      ex.answer.correctIndex = newCorrectIdx;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`Shuffled choices in ${path.relative(DATA_DIR, filePath)}`);
  }
}

function main() {
  console.log('Searching for lesson JSON files in:', DATA_DIR);
  const files = findJsonFiles(DATA_DIR);
  console.log(`Found ${files.length} lesson files. Processing...`);

  for (const file of files) {
    processFile(file);
  }

  console.log('Shuffle process completed!');
}

main();
