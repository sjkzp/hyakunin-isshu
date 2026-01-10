let selected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
let currentQuiz = [];
let index = 0;

let correct = 0;
let wrong = 0;
let combo = 0;
let maxCombo = 0;
let highScore = 0;

// 設定
let soundEnabled = true;
let animationEnabled = true;
let choiceCount = 3;
let autoSpeakEnabled = true;

// ローカルストレージから最高記録を読み込み
window.addEventListener('load', () => {
  highScore = parseInt(localStorage.getItem('hyakunin-high-score') || '0');
  updateHighScore();
  createSakura();
  loadSettings();
  
  // 設定変更時に自動保存（要素が存在する場合のみ）
  const soundCheckbox = document.getElementById('sound-enabled');
  const animationCheckbox = document.getElementById('animation-enabled');
  const choiceSelect = document.getElementById('choice-count');
  const autoSpeakCheckbox = document.getElementById('auto-speak-enabled');
  
  if (soundCheckbox) soundCheckbox.addEventListener('change', saveSettings);
  if (animationCheckbox) animationCheckbox.addEventListener('change', saveSettings);
  if (choiceSelect) choiceSelect.addEventListener('change', saveSettings);
  if (autoSpeakCheckbox) autoSpeakCheckbox.addEventListener('change', saveSettings);
});

// 設定を読み込み
function loadSettings() {
  soundEnabled = localStorage.getItem('sound-enabled') !== 'false';
  animationEnabled = localStorage.getItem('animation-enabled') !== 'false';
  choiceCount = parseInt(localStorage.getItem('choice-count') || '3');
  autoSpeakEnabled = localStorage.getItem('auto-speak-enabled') !== 'false';
  
  const soundCheckbox = document.getElementById('sound-enabled');
  const animationCheckbox = document.getElementById('animation-enabled');
  const choiceSelect = document.getElementById('choice-count');
  const autoSpeakCheckbox = document.getElementById('auto-speak-enabled');
  
  if (soundCheckbox) soundCheckbox.checked = soundEnabled;
  if (animationCheckbox) animationCheckbox.checked = animationEnabled;
  if (choiceSelect) choiceSelect.value = choiceCount;
  if (autoSpeakCheckbox) autoSpeakCheckbox.checked = autoSpeakEnabled;
}

// 設定画面を表示
function showSettings() {
  document.getElementById("title-screen").classList.add("hidden");
  document.getElementById("settings-screen").classList.remove("hidden");
  loadSettings();
}

// 設定を保存
function saveSettings() {
  soundEnabled = document.getElementById('sound-enabled').checked;
  animationEnabled = document.getElementById('animation-enabled').checked;
  choiceCount = parseInt(document.getElementById('choice-count').value);
  autoSpeakEnabled = document.getElementById('auto-speak-enabled').checked;
  
  localStorage.setItem('sound-enabled', soundEnabled);
  localStorage.setItem('animation-enabled', animationEnabled);
  localStorage.setItem('choice-count', choiceCount);
  localStorage.setItem('auto-speak-enabled', autoSpeakEnabled);
}

// 最高記録を更新
function updateHighScore() {
  document.getElementById('high-score-display').textContent = highScore;
}

// 桜の花びらを生成
function createSakura() {
  if (!animationEnabled) return;
  
  const container = document.getElementById('sakura-container');
  const sakuraCount = 20;
  
  for (let i = 0; i < sakuraCount; i++) {
    const sakura = document.createElement('div');
    sakura.className = 'sakura';
    sakura.style.left = Math.random() * 100 + '%';
    sakura.style.animationDuration = (Math.random() * 10 + 10) + 's';
    sakura.style.animationDelay = Math.random() * 5 + 's';
    sakura.style.opacity = Math.random() * 0.5 + 0.3;
    container.appendChild(sakura);
  }
}

function startGame() {
  saveSettings(); // 設定を保存
  
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("quiz-screen").classList.remove("hidden");

  // チェックされた歌だけ抽出
  if (selected.length > 0) {
    currentQuiz = hyaku.filter(x => selected.includes(x.id));
  } else {
    currentQuiz = [...hyaku];
  }

  shuffle(currentQuiz);

  index = 0;
  correct = 0;
  wrong = 0;
  combo = 0;
  maxCombo = 0;

  showQuiz();
  updateStats();
}

function showQuiz() {
  if (index >= currentQuiz.length) {
    showResult();
    return;
  }

  const q = currentQuiz[index];
  
  // カード番号を表示
  document.getElementById("card-number").textContent = `第${q.id}首`;
  
  // 漢字とルビを表示
  const kamiElement = document.getElementById("kami");
  kamiElement.innerHTML = createRubyText(q.kanji, q.yomi);

  // 選択肢を生成
  const choices = [q.shimo];
  while (choices.length < choiceCount) {
    const rand = hyaku[Math.floor(Math.random() * hyaku.length)].shimo;
    if (!choices.includes(rand)) choices.push(rand);
  }
  shuffle(choices);

  const container = document.getElementById("choices");
  container.innerHTML = "";

  choices.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.onclick = () => answer(c === q.shimo, btn, q.shimo);
    btn.style.animationDelay = (i * 0.1) + 's';
    container.appendChild(btn);
  });
  
  updateStats();
  
  // 自動読み上げがONの場合は自動的に読み上げ
  if (autoSpeakEnabled) {
    setTimeout(() => {
      speakKami();
    }, 300); // 少し遅延してから読み上げ
  }
}

// 漢字とひらがなからルビ付きHTMLを生成
function createRubyText(kanji, yomi) {
  // yomiから句点を除去
  const cleanYomi = yomi.replace(/、/g, ' ');
  
  const kanjiWords = kanji.split(/\s+/);
  const yomiWords = cleanYomi.split(/\s+/);
  
  let result = '';
  for (let i = 0; i < kanjiWords.length; i++) {
    const k = kanjiWords[i];
    const y = yomiWords[i] || '';
    
    if (k === y || /^[ぁ-ん]+$/.test(k)) {
      // ひらがなのみの場合はそのまま
      result += k;
    } else {
      // 漢字が含まれる場合はrubyタグで
      result += `<ruby>${k}<rt>${y}</rt></ruby>`;
    }
    
    if (i < kanjiWords.length - 1) {
      result += ' ';
    }
  }
  
  return result;
}

function answer(isCorrect, selectedButton, correctAnswer) {
  // 選択肢ボタンを無効化
  const choiceButtons = document.querySelectorAll('#choices button');
  choiceButtons.forEach(btn => btn.disabled = true);
  
  const q = currentQuiz[index];
  
  if (isCorrect) {
    correct++;
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    
    // 選択したボタンを正解色に
    selectedButton.classList.add('selected-correct');
    
    showFeedback('⭕ 正解！', 'correct');
    if (soundEnabled) playSound('correct');
    
    // コンボが3以上の時は炎エフェクト
    if (combo >= 3) {
      document.querySelector('.combo-box').classList.add('active');
    }
    
    // 正解時も下の句を読み上げ
    if (autoSpeakEnabled) {
      setTimeout(() => {
        speakShimo(q.shimo);
      }, 400);
    }
    
    // 正解時も次へボタンを表示
    showNextButton(true);
  } else {
    wrong++;
    combo = 0;
    
    // 選択したボタンを不正解色に
    selectedButton.classList.add('selected-wrong');
    
    showFeedback('❌ 残念', 'wrong');
    if (soundEnabled) playSound('wrong');
    
    document.querySelector('.combo-box').classList.remove('active');
    
    // 不正解時も下の句を読み上げ
    if (autoSpeakEnabled) {
      setTimeout(() => {
        speakShimo(q.shimo);
      }, 400);
    }
    
    // カードの下に正解と次へボタンを表示
    showCorrectAnswerWithButton(q.shimo);
  }

  updateStats();
}

// 次へボタンのみを表示（正解時）
function showNextButton(isCorrect) {
  const container = document.getElementById('question-container');
  
  // 既存の表示があれば削除
  const existing = document.getElementById('correct-answer-display');
  if (existing) {
    existing.remove();
  }
  
  const buttonDiv = document.createElement('div');
  buttonDiv.id = 'correct-answer-display';
  buttonDiv.className = 'next-button-container';
  buttonDiv.innerHTML = `
    <button class="next-question-btn ${isCorrect ? 'correct-style' : ''}" onclick="goToNextQuestion()">次の問題へ ▶</button>
  `;
  
  // カードコンテナの後に挿入
  const cardContainer = container.querySelector('.card-container');
  cardContainer.insertAdjacentElement('afterend', buttonDiv);
}

// 正解の下の句と次へボタンを表示（不正解時）
function showCorrectAnswerWithButton(correctShimo) {
  const container = document.getElementById('question-container');
  
  // 既存の正解表示があれば削除
  const existing = document.getElementById('correct-answer-display');
  if (existing) {
    existing.remove();
  }
  
  const answerDiv = document.createElement('div');
  answerDiv.id = 'correct-answer-display';
  answerDiv.className = 'correct-answer-display';
  answerDiv.innerHTML = `
    <div class="correct-label">正解</div>
    <div class="correct-shimo">${correctShimo}</div>
    <button class="next-question-btn" onclick="goToNextQuestion()">次の問題へ ▶</button>
  `;
  
  // カードコンテナの後に挿入
  const cardContainer = container.querySelector('.card-container');
  cardContainer.insertAdjacentElement('afterend', answerDiv);
}

// 次の問題へ進む
function goToNextQuestion() {
  hideCorrectAnswer();
  index++;
  showQuiz();
}

// 正解表示を非表示
function hideCorrectAnswer() {
  const answerDiv = document.getElementById('correct-answer-display');
  if (answerDiv) {
    answerDiv.remove();
  }
}

function showFeedback(text, type) {
  if (!animationEnabled) return;
  
  const feedback = document.getElementById('feedback');
  feedback.textContent = text;
  feedback.className = `feedback ${type}`;
  
  setTimeout(() => {
    feedback.classList.add('hidden');
  }, 800);
}

function playSound(type) {
  // Web Audio APIを使って簡単な音を生成
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (type === 'correct') {
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } else {
    oscillator.frequency.value = 220; // A3
    oscillator.type = 'triangle';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }
}

function updateStats() {
  const total = correct + wrong;
  const rate = total === 0 ? 0 : Math.round((correct / total) * 100);

  document.getElementById("correct-count").textContent = rate + "%";
  document.getElementById("combo-count").textContent = combo;
  document.getElementById("progress-count").textContent = `${index}/${currentQuiz.length}`;
}

function showList() {
  document.getElementById("title-screen").classList.add("hidden");
  document.getElementById("list-screen").classList.remove("hidden");

  const container = document.getElementById("list-container");
  container.innerHTML = "";

  // 20首ごとにカテゴリ分け
  const categories = [
    { name: "No.1 (1-20首)", range: [1, 20] },
    { name: "No.2 (21-40首)", range: [21, 40] },
    { name: "No.3 (41-60首)", range: [41, 60] },
    { name: "No.4 (61-80首)", range: [61, 80] },
    { name: "No.5 (81-100首)", range: [81, 100] }
  ];

  categories.forEach((category, catIndex) => {
    // カテゴリヘッダー
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category-header";
    categoryDiv.innerHTML = `
      <div class="category-title">
        <span class="category-name">${category.name}</span>
        <button class="category-select-btn" onclick="selectCategory(${category.range[0]}, ${category.range[1]})">
          このカテゴリを選択
        </button>
        <button class="category-deselect-btn" onclick="deselectCategory(${category.range[0]}, ${category.range[1]})">
          解除
        </button>
      </div>
    `;
    container.appendChild(categoryDiv);

    // カテゴリ内の歌
    const categoryContent = document.createElement("div");
    categoryContent.className = "category-content";
    
    const wakaInCategory = hyaku.filter(x => x.id >= category.range[0] && x.id <= category.range[1]);
    
    wakaInCategory.forEach(x => {
      const div = document.createElement("div");
      div.className = "list-item";
      const isChecked = selected.includes(x.id);
      div.innerHTML = `
        <label>
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelect(${x.id}, this.checked)">
          <span class="list-number">${x.id}.</span>
          <span class="list-text">${x.kanji}</span>
        </label>
      `;
      categoryContent.appendChild(div);
    });
    
    container.appendChild(categoryContent);
  });
  
  updateSelectedCount();
}

// カテゴリ全体を選択
function selectCategory(start, end) {
  for (let i = start; i <= end; i++) {
    if (!selected.includes(i)) {
      selected.push(i);
    }
  }
  showList(); // 再描画
}

// カテゴリ全体を解除
function deselectCategory(start, end) {
  selected = selected.filter(id => id < start || id > end);
  showList(); // 再描画
}

function toggleSelect(id, checked) {
  if (checked) {
    if (!selected.includes(id)) {
      selected.push(id);
    }
  } else {
    selected = selected.filter(x => x !== id);
  }
  updateSelectedCount();
}

function selectAll() {
  selected = hyaku.map(x => x.id);
  showList();
}

function deselectAll() {
  selected = [];
  showList();
}

function updateSelectedCount() {
  document.getElementById('selected-count').textContent = selected.length;
}

function backToTitle() {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("title-screen").classList.remove("hidden");
}

function quitGame() {
  if (confirm('修行を中断しますか？')) {
    showResult();
  }
}

function showResult() {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("result-screen").classList.remove("hidden");

  const total = correct + wrong;
  const rate = total === 0 ? 0 : Math.round((correct / total) * 100);
  
  // 最高記録を更新
  if (maxCombo > highScore) {
    highScore = maxCombo;
    localStorage.setItem('hyakunin-high-score', highScore);
    updateHighScore();
  }

  // ランクを判定
  let rank = '';
  let rankClass = '';
  let message = '';
  
  if (rate >= 95) {
    rank = '🏆 歌仙';
    message = '素晴らしい！まさに平安の歌人の如し。';
  } else if (rate >= 85) {
    rank = '🥇 上級';
    message = '見事！百人一首をよく理解していますね。';
  } else if (rate >= 70) {
    rank = '🥈 中級';
    message = 'よくできました！更なる高みを目指しましょう。';
  } else if (rate >= 50) {
    rank = '🥉 初級';
    message = 'いい調子です。繰り返し修行を積みましょう。';
  } else {
    rank = '📝 見習';
    message = 'これからです。一首一首、心を込めて。';
  }
  
  document.getElementById('result-rank').textContent = rank;
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = wrong;
  document.getElementById('result-rate').textContent = rate + '%';
  document.getElementById('result-combo').textContent = maxCombo;
  document.getElementById('result-message').textContent = message;
  
  // 最高記録を更新した場合
  if (maxCombo > 0 && maxCombo === highScore) {
    document.getElementById('result-message').textContent += '\n\n🎉 最高記録を更新しました！';
  }
}

function speakKami() {
  const q = currentQuiz[index];
  
  // 句点で区切られたyomiを使用（句点は自然な間になる）
  const kamiText = q.yomi;
  
  // Web Speech APIで日本語の自然な読み上げ
  const uttr = new SpeechSynthesisUtterance(kamiText);
  uttr.lang = "ja-JP";
  uttr.rate = 0.7; // ゆっくり詠む
  uttr.pitch = 1.2; // 少し高めの声
  uttr.volume = 1.0; // 音量最大
  
  // 利用可能な日本語音声を探す
  const voices = speechSynthesis.getVoices();
  const japaneseVoice = voices.find(voice => 
    voice.lang === 'ja-JP' && (
      voice.name.includes('Google') || 
      voice.name.includes('Kyoko') || 
      voice.name.includes('Otoya') ||
      voice.name.includes('Female')
    )
  ) || voices.find(voice => voice.lang === 'ja-JP');
  
  if (japaneseVoice) {
    uttr.voice = japaneseVoice;
  }
  
  // 読み上げ開始時のイベント
  uttr.onstart = () => {
    const btn = document.querySelector('.speak-btn');
    if (btn) {
      btn.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #4169e1 100%)';
    }
  };
  
  // 読み上げ終了時のイベント
  uttr.onend = () => {
    const btn = document.querySelector('.speak-btn');
    if (btn) {
      btn.style.background = 'linear-gradient(135deg, #4169e1 0%, #1e3a8a 100%)';
    }
  };
  
  speechSynthesis.cancel(); // 前の読み上げをキャンセル
  speechSynthesis.speak(uttr);
  
  if (soundEnabled && animationEnabled) {
    const btn = document.querySelector('.speak-btn');
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 200);
  }
}

// 下の句を読み上げる
function speakShimo(shimoText) {
  // 歴史的仮名遣いを現代仮名遣いに変換
  let readableText = shimoText
    // 「てふ」「でふ」等
    .replace(/てふ/g, 'ちょう')
    .replace(/てう/g, 'ちょう')
    .replace(/でふ/g, 'じょう')
    .replace(/でう/g, 'じょう')
    // 「ゐ」「ゑ」
    .replace(/ゐ/g, 'い')
    .replace(/ゑ/g, 'え')
    // 「ひ」が助詞の場合
    .replace(/([^ぁ-ん])ひ /g, '$1い ')
    .replace(/([^ぁ-ん])ひ([^ぁ-ん])/g, '$1い$2')
    // その他の歴史的仮名遣い
    .replace(/くわ/g, 'か')
    .replace(/ぐわ/g, 'が')
    .replace(/ゐる/g, 'いる')
    .replace(/ゑる/g, 'える');
  
  // Web Speech APIで日本語の自然な読み上げ
  const uttr = new SpeechSynthesisUtterance(readableText);
  uttr.lang = "ja-JP";
  uttr.rate = 0.7; // ゆっくり詠む
  uttr.pitch = 1.2; // 少し高めの声
  uttr.volume = 1.0; // 音量最大
  
  // 利用可能な日本語音声を探す
  const voices = speechSynthesis.getVoices();
  const japaneseVoice = voices.find(voice => 
    voice.lang === 'ja-JP' && (
      voice.name.includes('Google') || 
      voice.name.includes('Kyoko') || 
      voice.name.includes('Otoya') ||
      voice.name.includes('Female')
    )
  ) || voices.find(voice => voice.lang === 'ja-JP');
  
  if (japaneseVoice) {
    uttr.voice = japaneseVoice;
  }
  
  speechSynthesis.cancel(); // 前の読み上げをキャンセル
  speechSynthesis.speak(uttr);
}

// 音声の読み込みを確実にするため
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
