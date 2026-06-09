const practiceBtn = document.getElementById('practiceBtn');
const manageBtn = document.getElementById('manageBtn');
const practicePage = document.getElementById('practicePage');
const managePage = document.getElementById('managePage');
const flipCard = document.getElementById('flipCard');
const cardInner = document.getElementById('cardInner');
const wordFront = document.getElementById('wordFront');
const wordTranslation = document.getElementById('wordTranslation');
const wordPart = document.getElementById('wordPart');
const wordExample = document.getElementById('wordExample');
const wordRoot = document.getElementById('wordRoot');
const wordList = document.getElementById('wordList');
const manageTableBody = document.getElementById('manageTableBody');
const prevWord = document.getElementById('prevWord');
const nextWord = document.getElementById('nextWord');
const wordForm = document.getElementById('wordForm');
const inputWord = document.getElementById('inputWord');
const inputTranslation = document.getElementById('inputTranslation');
const inputPart = document.getElementById('inputPart');
const inputExample = document.getElementById('inputExample');
const inputRoot = document.getElementById('inputRoot');
const autoFillBtn = document.getElementById('autoFillBtn');

let currentIndex = 0;
let wordItems = [];

const defaultWords = [
  {
    word: 'hello',
    translation: '哈囉',
    part: 'interjection',
    example: 'Hello! How are you?',
    root: '來自古英語 hǣl，意為健康或平安。'
  },
  {
    word: 'study',
    translation: '學習',
    part: 'verb',
    example: 'She likes to study every evening.',
    root: '來自拉丁語 studium，意為熱情與努力。'
  }
];

function loadWords() {
  const stored = localStorage.getItem('vocabCards');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        wordItems = parsed;
        return;
      }
    } catch (error) {
      console.warn('無法讀取本地單字資料', error);
    }
  }
  wordItems = defaultWords;
}

function saveWords() {
  localStorage.setItem('vocabCards', JSON.stringify(wordItems));
}

function renderPractice() {
  const current = wordItems[currentIndex] || wordItems[0];
  if (!current) return;
  wordFront.textContent = current.word;
  wordTranslation.textContent = current.translation || '尚未填寫';
  wordPart.textContent = current.part || '尚未填寫';
  wordExample.textContent = current.example || '尚未填寫';
  wordRoot.textContent = current.root || '尚未填寫';
  renderWordList();
}

function renderWordList() {
  wordList.innerHTML = '';
  wordItems.forEach((item, index) => {
    const listItem = document.createElement('button');
    listItem.type = 'button';
    listItem.className = 'list-group-item list-group-item-action text-start' + (index === currentIndex ? ' active' : '');
    listItem.textContent = item.word;
    listItem.addEventListener('click', () => {
      currentIndex = index;
      cardInner.classList.remove('flipped');
      renderPractice();
    });
    wordList.appendChild(listItem);
  });
}

function renderManageTable() {
  manageTableBody.innerHTML = '';
  wordItems.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.word}</td>
      <td>${item.translation || ''}</td>
      <td>${item.part || ''}</td>
      <td>${item.example || ''}</td>
      <td>${item.root || ''}</td>
    `;
    manageTableBody.appendChild(row);
  });
}

function showPage(page) {
  if (page === 'practice') {
    practicePage.classList.remove('d-none');
    managePage.classList.add('d-none');
  } else {
    practicePage.classList.add('d-none');
    managePage.classList.remove('d-none');
  }
}

practiceBtn.addEventListener('click', () => showPage('practice'));
manageBtn.addEventListener('click', () => showPage('manage'));
flipCard.addEventListener('click', () => flipCard.classList.toggle('flipped'));
prevWord.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + wordItems.length) % wordItems.length;
  cardInner.classList.remove('flipped');
  renderPractice();
});
nextWord.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % wordItems.length;
  cardInner.classList.remove('flipped');
  renderPractice();
});

wordForm.addEventListener('submit', event => {
  event.preventDefault();
  const word = inputWord.value.trim();
  if (!word) return;
  const newItem = {
    word,
    translation: inputTranslation.value.trim(),
    part: inputPart.value.trim(),
    example: inputExample.value.trim(),
    root: inputRoot.value.trim()
  };
  wordItems.push(newItem);
  saveWords();
  wordForm.reset();
  renderManageTable();
  renderPractice();
  alert('已新增單字！');
});

async function autoFill() {
  const word = inputWord.value.trim();
  if (!word) {
    alert('請先輸入英文單字，再點擊自動填入。');
    return;
  }
  autoFillBtn.disabled = true;
  autoFillBtn.textContent = '自動填入中...';

  const translationPromise = fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-TW`)
    .then(res => res.json())
    .then(data => {
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      return '';
    })
    .catch(() => '');
  const dictionaryPromise = fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    .then(res => res.json())
    .catch(() => null);

  const [translation, dictionary] = await Promise.all([translationPromise, dictionaryPromise]);

  if (translation) {
    inputTranslation.value = translation;
  }

  if (dictionary && Array.isArray(dictionary) && dictionary.length > 0) {
    const entry = dictionary[0];
    const meaning = entry.meanings && entry.meanings[0];
    const definition = meaning?.definitions && meaning.definitions[0];
    inputPart.value = meaning?.partOfSpeech || inputPart.value;
    inputExample.value = definition?.example || inputExample.value;
    inputRoot.value = entry.origin || inputRoot.value;
  } else {
    alert('自動填入完成，但未找到詞典資料。');
  }

  autoFillBtn.disabled = false;
  autoFillBtn.textContent = '自動填入';
}

autoFillBtn.addEventListener('click', autoFill);

loadWords();
renderPractice();
renderManageTable();
showPage('practice');
