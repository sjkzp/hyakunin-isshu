// localStorageから選択された歌を読み込む、なければ1-10首をデフォルト
let selected = JSON.parse(localStorage.getItem('hyakunin-selected') || '[1,2,3,4,5,6,7,8,9,10]');
let currentQuiz = [];
let index = 0;

let correct = 0;
let wrong = 0;
let combo = 0;
let maxCombo = 0;
let highScore = 0;

// 設定
let soundEnabled = true;
let choiceCount = 3;
let autoSpeakEnabled = true;
let hintMode = 'toggle'; // 'toggle' or 'always'
let quizCount = 10; // 出題件数

// フィードバック表示用のタイマーID
let feedbackTimer = null;

// 現在の問題で既に不正解したかどうか
let hasWrongAnswerInCurrentQuestion = false;

// 選択パターン保存ボタンの有効化用
let initialSelected = [...selected]; // 初期選択状態を保存

// デフォルト選択パターン
const defaultPatterns = [
  {
    name: "🔰 初級編（1-20首）",
    selected: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    quizCount: 10,
    isDefault: true
  },
  {
    name: "⭐ むすめふさほせ（一字決まり）",
    selected: [87, 18, 57, 22, 70, 81, 77],
    quizCount: 7,
    isDefault: true
  },
  {
    name: "📚 有名な歌トップ10",
    selected: [1,2,4,7,15,17,35,77,96,100],
    quizCount: 10,
    isDefault: true
  }
];

// ローカルストレージから最高記録を読み込み
window.addEventListener('load', () => {
  highScore = parseInt(localStorage.getItem('hyakunin-high-score') || '0');
  updateHighScore();
  createSakura();
  loadSettings();
  loadSelectedSongs();  // 選択された歌を読み込む
  updateQuizCountOptions(); // 出題件数の選択肢を初期化
  initializeDefaultPatterns(); // デフォルトパターンを初期化
  
  // 設定変更時に自動保存（要素が存在する場合のみ）
  const soundCheckbox = document.getElementById('sound-enabled');
  const choiceSelect = document.getElementById('choice-count');
  const autoSpeakCheckbox = document.getElementById('auto-speak-enabled');
  const hintModeSelect = document.getElementById('hint-mode');
  const quizCountSelect = document.getElementById('quiz-count');
  
  if (soundCheckbox) soundCheckbox.addEventListener('change', saveSettings);
  if (choiceSelect) choiceSelect.addEventListener('change', saveSettings);
  if (autoSpeakCheckbox) autoSpeakCheckbox.addEventListener('change', saveSettings);
  if (hintModeSelect) hintModeSelect.addEventListener('change', saveSettings);
  if (quizCountSelect) quizCountSelect.addEventListener('change', saveSettings);
});

// 設定を読み込み
function loadSettings() {
  soundEnabled = localStorage.getItem('sound-enabled') !== 'false';
  choiceCount = parseInt(localStorage.getItem('choice-count') || '3');
  autoSpeakEnabled = localStorage.getItem('auto-speak-enabled') !== 'false';
  hintMode = localStorage.getItem('hint-mode') || 'toggle';
  
  // quizCountの読み込み（数値または"all"）
  const savedQuizCount = localStorage.getItem('quiz-count') || '10';
  if (savedQuizCount === 'all' || savedQuizCount === '9999') {
    quizCount = 9999; // "all"の場合は大きな数値
  } else {
    quizCount = parseInt(savedQuizCount) || 10;
  }
  
  const soundCheckbox = document.getElementById('sound-enabled');
  const choiceSelect = document.getElementById('choice-count');
  const autoSpeakCheckbox = document.getElementById('auto-speak-enabled');
  const hintModeSelect = document.getElementById('hint-mode');
  const quizCountSelect = document.getElementById('quiz-count');
  
  if (soundCheckbox) soundCheckbox.checked = soundEnabled;
  if (choiceSelect) choiceSelect.value = choiceCount;
  if (autoSpeakCheckbox) autoSpeakCheckbox.checked = autoSpeakEnabled;
  if (hintModeSelect) hintModeSelect.value = hintMode;
  if (quizCountSelect) {
    // 選択可能な最大数を設定（デフォルト値も自動設定される）
    updateQuizCountOptions();
  }
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
  choiceCount = parseInt(document.getElementById('choice-count').value);
  autoSpeakEnabled = document.getElementById('auto-speak-enabled').checked;
  hintMode = document.getElementById('hint-mode').value;
  const quizCountValue = document.getElementById('quiz-count').value;
  quizCount = quizCountValue === 'all' ? 9999 : parseInt(quizCountValue);
  
  localStorage.setItem('sound-enabled', soundEnabled);
  localStorage.setItem('choice-count', choiceCount);
  localStorage.setItem('auto-speak-enabled', autoSpeakEnabled);
  localStorage.setItem('hint-mode', hintMode);
  localStorage.setItem('quiz-count', quizCount);
}

// 出題件数の選択肢を更新
function updateQuizCountOptions() {
  const quizCountSelect = document.getElementById('quiz-count');
  if (!quizCountSelect) return;
  
  // 0首選択の場合は100首として扱う
  const selectedCount = selected.length === 0 ? 100 : selected.length;
  const options = [5, 10, 20, 30, 50, 100];
  
  // 現在の選択肢をクリア
  quizCountSelect.innerHTML = '';
  
  // 選択可能な件数のオプションを追加（選択数まで）
  options.forEach(count => {
    if (count <= selectedCount) {
      const option = document.createElement('option');
      option.value = count;
      option.textContent = `${count}問`;
      quizCountSelect.appendChild(option);
    }
  });
  
  // 「全て」オプションを追加（選択数が100未満の場合）
  if (selectedCount < 100) {
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = `全て（${selectedCount}問）`;
    quizCountSelect.appendChild(allOption);
  }
  
  // デフォルト値を設定：10以下の最大数
  const defaultValue = Math.min(selectedCount, 10);
  
  // デフォルト値が選択肢に存在するか確認
  const availableOptions = Array.from(quizCountSelect.options).map(opt => opt.value);
  if (availableOptions.includes(String(defaultValue))) {
    quizCountSelect.value = defaultValue;
    quizCount = defaultValue;
  } else if (availableOptions.length > 0) {
    // 存在しない場合は最後のオプションを選択
    const lastOption = quizCountSelect.options[quizCountSelect.options.length - 1];
    quizCountSelect.value = lastOption.value;
    quizCount = lastOption.value === 'all' ? 9999 : parseInt(lastOption.value);
  }
}

// 最高記録を更新
function updateHighScore() {
  document.getElementById('high-score-display').textContent = highScore;
}

// 桜の花びらを生成
function createSakura() {
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
  
  // クイズ状態を完全にリセット（強制終了後の不具合対策）
  index = 0;
  correct = 0;
  wrong = 0;
  combo = 0;
  maxCombo = 0;
  currentQuiz = [];
  hasWrongAnswerInCurrentQuestion = false;
  
  // チェックされた歌だけ抽出（0首の場合は全100首を対象）
  if (selected.length > 0) {
    currentQuiz = hyaku.filter(x => selected.includes(x.id));
  } else {
    // 0首選択の場合は全100首から出題
    currentQuiz = [...hyaku];
  }

  shuffle(currentQuiz);
  
  // 出題件数で制限（9999は"all"を意味する）
  let actualQuizCount;
  if (quizCount >= 9999) {
    actualQuizCount = currentQuiz.length; // 全て出題
  } else {
    actualQuizCount = Math.min(quizCount, currentQuiz.length);
  }
  
  currentQuiz = currentQuiz.slice(0, actualQuizCount);
  
  // 万が一問題が0の場合は、強制的に全100首から出題
  if (currentQuiz.length === 0) {
    currentQuiz = [...hyaku];
    shuffle(currentQuiz);
    
    // 出題件数を決定（設定値または最大10問）
    if (quizCount >= 9999) {
      actualQuizCount = currentQuiz.length;
    } else {
      actualQuizCount = Math.min(quizCount, 10); // 最大10問
    }
    currentQuiz = currentQuiz.slice(0, actualQuizCount);
  }
  
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("quiz-screen").classList.remove("hidden");

  showQuiz();
  updateStats();
}

function showQuiz() {
  if (index >= currentQuiz.length) {
    showResult();
    return;
  }

  const q = currentQuiz[index];
  
  // 新しい問題なので不正解フラグをリセット
  hasWrongAnswerInCurrentQuestion = false;
  
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
  
  // 前回の正解表示をクリア
  const existingAnswer = document.getElementById('correct-answer-display');
  if (existingAnswer) {
    existingAnswer.remove();
  }
  
  updateStats();
  
  // ヒントモードに応じて表示を制御
  const hintContainer = document.getElementById('hint-container');
  const hintBtn = document.getElementById('hint-btn');
  const hintText = document.getElementById('hint-text');
  
  if (hintText) hintText.textContent = q.meaning || '現代語訳が登録されていません';
  
  if (hintMode === 'always') {
    // 常に表示モード
    if (hintContainer) hintContainer.classList.remove('hidden');
    if (hintBtn) hintBtn.style.display = 'none'; // ボタンを非表示
  } else {
    // 表示・非表示を選択モード
    if (hintContainer) hintContainer.classList.add('hidden');
    if (hintBtn) {
      hintBtn.style.display = 'block';
      hintBtn.textContent = '💡 ヒントを表示';
    }
  }
  
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
  const q = currentQuiz[index];
  
  if (isCorrect) {
    // 選択肢ボタンを無効化
    const choiceButtons = document.querySelectorAll('#choices button');
    choiceButtons.forEach(btn => btn.disabled = true);
    
    // 一度も不正解していない場合のみ正解数をカウント
    if (!hasWrongAnswerInCurrentQuestion) {
      correct++;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
    } else {
      // 不正解後の正解なのでコンボはリセット済み（維持）
      combo = 0;
    }
    
    // 選択したボタンを正解色に
    selectedButton.classList.add('selected-correct');
    
    showFeedback('⭕ 正解', 'correct');
    if (soundEnabled) playSound('correct');
    
    // コンボが3以上の時は炎エフェクト
    if (combo >= 3) {
      document.querySelector('.combo-box').classList.add('active');
    } else {
      document.querySelector('.combo-box').classList.remove('active');
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
    // 不正解時は選択したボタンのみをグレーアウト（再選択可能）
    // 不正解カウントは1問につき1回のみ
    if (!hasWrongAnswerInCurrentQuestion) {
      wrong++;
      hasWrongAnswerInCurrentQuestion = true;
    }
    combo = 0;
    
    // 選択したボタンをグレーアウトして無効化
    selectedButton.classList.add('selected-wrong');
    selectedButton.disabled = true;
    
    showFeedback('❌ 残念', 'wrong');
    if (soundEnabled) playSound('wrong');
    
    document.querySelector('.combo-box').classList.remove('active');
    
    // 不正解時は正解を表示せず、再選択を促す
    // 下の句の読み上げもしない
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
  
  // 最終問題かどうかを判定
  const isLastQuestion = (index + 1) >= currentQuiz.length;
  const buttonText = isLastQuestion ? '結果を見る ▶' : '次の問題へ ▶';
  
  const buttonDiv = document.createElement('div');
  buttonDiv.id = 'correct-answer-display';
  buttonDiv.className = 'next-button-container';
  buttonDiv.innerHTML = `
    <button class="next-question-btn ${isCorrect ? 'correct-style' : ''}" onclick="goToNextQuestion()">${buttonText}</button>
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
  
  // 最終問題かどうかを判定
  const isLastQuestion = (index + 1) >= currentQuiz.length;
  const buttonText = isLastQuestion ? '結果を見る ▶' : '次の問題へ ▶';
  
  const answerDiv = document.createElement('div');
  answerDiv.id = 'correct-answer-display';
  answerDiv.className = 'correct-answer-display';
  answerDiv.innerHTML = `
    <div class="correct-label">正解</div>
    <div class="correct-shimo">${correctShimo}</div>
    <button class="next-question-btn" onclick="goToNextQuestion()">${buttonText}</button>
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
  const feedback = document.getElementById('feedback');
  
  // 前回のタイマーをクリア
  if (feedbackTimer !== null) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }
  
  // 一旦hiddenクラスを追加してリセット
  feedback.classList.add('hidden');
  
  // 次のフレームで表示を開始（アニメーションをリセット）
  requestAnimationFrame(() => {
    feedback.textContent = text;
    feedback.className = `feedback ${type}`;
    
    // アニメーションをリセットするために一旦削除して再追加
    feedback.style.animation = 'none';
    feedback.offsetHeight; // リフロー強制
    feedback.style.animation = '';
    
    // hiddenクラスを削除して表示
    feedback.classList.remove('hidden');
    
    // 新しいタイマーを設定
    feedbackTimer = setTimeout(() => {
      feedback.classList.add('hidden');
      feedbackTimer = null;
    }, 1200); // アニメーション時間と同じ
  });
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
    { name: "No.1 (1-10首)", range: [1, 10] },
    { name: "No.2 (11-20首)", range: [11, 20] },
    { name: "No.3 (21-30首)", range: [21, 30] },
    { name: "No.4 (31-40首)", range: [31, 40] },
    { name: "No.5 (41-50首)", range: [41, 50] },
    { name: "No.6 (51-60首)", range: [51, 60] },
    { name: "No.7 (61-70首)", range: [61, 70] },
    { name: "No.8 (71-80首)", range: [71, 80] },
    { name: "No.9 (81-90首)", range: [81, 90] },
    { name: "No.10 (91-100首)", range: [91, 100] }
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
        <label class="list-label">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelect(${x.id}, this.checked)">
          <span class="list-number">${x.id}.</span>
          <span class="list-text">${x.kanji}</span>
        </label>
        <button class="detail-btn" onclick="showWakaDetail(${x.id})">詳細</button>
      `;
      categoryContent.appendChild(div);
    });
    
    container.appendChild(categoryContent);
  });
  
  updateSelectedCount();
  loadSavedPatterns(); // 保存済みパターンをプルダウンに表示
  updateSaveButtonState(); // 保存ボタンの状態を更新
}

// カテゴリ全体を選択
function selectCategory(start, end) {
  for (let i = start; i <= end; i++) {
    if (!selected.includes(i)) {
      selected.push(i);
    }
  }
  saveSelectedSongs();  // 選択を保存
  showList(); // 再描画
}

// カテゴリ全体を解除
function deselectCategory(start, end) {
  selected = selected.filter(id => id < start || id > end);
  saveSelectedSongs();  // 選択を保存
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
  saveSelectedSongs();  // 選択を保存
  updateSelectedCount();
  updateQuizCountOptions(); // 出題件数の選択肢を更新
  updateSaveButtonState(); // 保存ボタンの状態を更新
}

// 選択された歌を保存
function saveSelectedSongs() {
  localStorage.setItem('hyakunin-selected', JSON.stringify(selected));
}

// 選択された歌を読み込み
function loadSelectedSongs() {
  const savedSelected = localStorage.getItem('hyakunin-selected');
  if (savedSelected) {
    selected = JSON.parse(savedSelected);
  }
}

function selectAll() {
  selected = hyaku.map(x => x.id);
  saveSelectedSongs();  // 選択を保存
  showList();
  updateQuizCountOptions(); // 出題件数の選択肢を更新
}

function deselectAll() {
  selected = [];
  saveSelectedSongs();  // 選択を保存
  showList();
  updateQuizCountOptions(); // 出題件数の選択肢を更新
}

function updateSelectedCount() {
  const countElement = document.getElementById('selected-count');
  countElement.textContent = selected.length;
}

// ヒント表示切り替え
function toggleHint() {
  const hintContainer = document.getElementById('hint-container');
  const hintBtn = document.getElementById('hint-btn');
  
  if (hintContainer.classList.contains('hidden')) {
    hintContainer.classList.remove('hidden');
    hintBtn.textContent = '💡 ヒントを非表示';
  } else {
    hintContainer.classList.add('hidden');
    hintBtn.textContent = '💡 ヒントを表示';
  }
}

// 歌の詳細をダイアログで表示
function showWakaDetail(id) {
  const waka = hyaku.find(x => x.id === id);
  if (!waka) return;
  
  // モーダルを作成
  const modal = document.createElement('div');
  modal.className = 'waka-detail-modal';
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
  
  const content = document.createElement('div');
  content.className = 'waka-detail-content';
  content.innerHTML = `
    <div class="waka-detail-header">
      <h3>📜 第${waka.id}首</h3>
      <button class="modal-close-btn" onclick="this.closest('.waka-detail-modal').remove()">×</button>
    </div>
    <div class="waka-detail-body">
      <div class="waka-detail-section">
        <div class="waka-detail-label">上の句</div>
        <div class="waka-detail-text">${waka.kanji}</div>
      </div>
      <div class="waka-detail-section">
        <div class="waka-detail-label">下の句</div>
        <div class="waka-detail-text">${waka.shimo}</div>
      </div>
      <div class="waka-detail-section">
        <div class="waka-detail-label">現代語訳</div>
        <div class="waka-detail-text">${waka.meaning || '現代語訳が登録されていません'}</div>
      </div>
    </div>
    <div class="waka-detail-footer">
      <button class="modal-ok-btn" onclick="this.closest('.waka-detail-modal').remove()">閉じる</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function backToTitle() {
  // クイズ状態を完全にリセット（次回のstartGameで正常動作するように）
  index = 0;
  correct = 0;
  wrong = 0;
  combo = 0;
  maxCombo = 0;
  currentQuiz = [];
  
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("title-screen").classList.remove("hidden");
}

function quitGame() {
  if (confirm('挑戦を中断しますか？')) {
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
  
  document.getElementById('result-rank').textContent = ''; // ランク表示を空に
  document.getElementById('result-correct').textContent = correct;
  document.getElementById('result-wrong').textContent = wrong;
  document.getElementById('result-rate').textContent = rate + '%';
  document.getElementById('result-combo').textContent = maxCombo;
  document.getElementById('result-message').textContent = ''; // メッセージを空に
  
  // 最高記録を更新した場合
  if (maxCombo > 0 && maxCombo === highScore) {
    document.getElementById('result-message').textContent = '🎉 最高記録を更新しました！';
  }
}

function speakKami() {
  const q = currentQuiz[index];
  
  // 句点で区切られたyomiを使用（句点は自然な間になる）
  let kamiText = q.yomi;
  
  // 「はな」「はし」「はま」など、名詞の「は」をカタカナに変換して誤読を防ぐ
  kamiText = kamiText
    .replace(/はな/g, 'ハナ')
    .replace(/はし/g, 'ハシ')
    .replace(/はる/g, 'ハル')
    .replace(/はや/g, 'ハヤ')
    .replace(/はて/g, 'ハテ')
    .replace(/はら/g, 'ハラ')
    .replace(/はじ/g, 'ハジ')
    .replace(/はま/g, 'ハマ')
    .replace(/はか/g, 'ハカ')
    .replace(/はこ/g, 'ハコ');
  
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
  
  if (soundEnabled) {
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
    // 特定の単語の変換（より具体的なパターンから順に）
    .replace(/かよひじ/g, 'かよいじ')
    // 「じや」を含む特定パターンを保護（「かけじや」など）
    .replace(/かけじや/g, 'かけじ や')
    .replace(/じや/g, 'じ や')
    .replace(/ぞや/g, 'ぞ や')
    // 「はな」「はし」「はる」など、変換してはいけない「は」を保護
    .replace(/はな/g, '__HANA__')
    .replace(/はし/g, '__HASHI__')
    .replace(/はる/g, '__HARU__')
    .replace(/はや/g, '__HAYA__')
    .replace(/はて/g, '__HATE__')
    .replace(/はら/g, '__HARA__')
    .replace(/はじ/g, '__HAJI__')
    .replace(/はま/g, '__HAMA__')
    .replace(/はか/g, '__HAKA__')
    .replace(/はこ/g, '__HAKO__')
    // 「こひ」→「こい」
    .replace(/こひ/g, 'こい')
    // 「かひ」→「かい」
    .replace(/かひ/g, 'かい')
    // 「あひ」「あふ」「あは」系
    .replace(/あひ/g, 'あい')
    .replace(/あふ/g, 'あう')
    .replace(/あは/g, 'あわ')
    // 「おもひ」「おもふ」「おもへ」系
    .replace(/おもひ/g, 'おもい')
    .replace(/おもふ/g, 'おもう')
    .replace(/おもへ/g, 'おもえ')
    .replace(/おもは/g, 'おもわ')
    // 「いひ」「いふ」系
    .replace(/いひ/g, 'いい')
    .replace(/いふ/g, 'いう')
    // 保護した「は」をカタカナに復元（誤読を防ぐ）
    .replace(/__HANA__/g, 'ハナ')
    .replace(/__HASHI__/g, 'ハシ')
    .replace(/__HARU__/g, 'ハル')
    .replace(/__HAYA__/g, 'ハヤ')
    .replace(/__HATE__/g, 'ハテ')
    .replace(/__HARA__/g, 'ハラ')
    .replace(/__HAJI__/g, 'ハジ')
    .replace(/__HAMA__/g, 'ハマ')
    .replace(/__HAKA__/g, 'ハカ')
    .replace(/__HAKO__/g, 'ハコ')
    // 「ひ」が助詞の場合（より一般的なルール）
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

// localStorageを初期化する関数
function resetAllData() {
  if (confirm('本当にすべてのデータを初期化しますか？\n\n・最高記録\n・設定内容\n・選択した歌\n・保存した選択パターン\n\nすべてがリセットされます。')) {
    if (confirm('最終確認：本当に初期化しますか？\nこの操作は取り消せません。')) {
      // localStorageをすべてクリア
      localStorage.clear();
      
      // デフォルトパターンを復元
      localStorage.setItem('hyakunin-patterns', JSON.stringify(defaultPatterns));
      
      // グローバル変数をデフォルトに戻す
      selected = [1,2,3,4,5,6,7,8,9,10];
      highScore = 0;
      soundEnabled = true;
      choiceCount = 3;
      autoSpeakEnabled = true;
      hintMode = 'toggle';
      quizCount = 10;
      
      // クイズ状態もリセット
      index = 0;
      correct = 0;
      wrong = 0;
      combo = 0;
      maxCombo = 0;
      currentQuiz = [];
      
      // UIを更新
      updateHighScore();
      loadSettings();
      loadSelectedSongs();
      
      alert('すべてのデータを初期化しました。');
      
      // タイトル画面に戻る
      backToTitle();
    }
  }
}

// ========================================
// 選択パターンの保存・読み込み機能
// ========================================

// 保存済みパターンをプルダウンに表示
// デフォルトパターンを初期化
function initializeDefaultPatterns() {
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  
  // デフォルトパターンが既に存在するかチェック
  const hasDefaultPatterns = patterns.some(p => p.isDefault);
  
  if (!hasDefaultPatterns) {
    // デフォルトパターンを先頭に追加
    const newPatterns = [...defaultPatterns, ...patterns];
    localStorage.setItem('hyakunin-patterns', JSON.stringify(newPatterns));
  }
}

// 保存済みパターンをプルダウンに表示
function loadSavedPatterns() {
  const select = document.getElementById('pattern-select');
  if (!select) return;
  
  // 既存のオプションをクリア（最初のデフォルトオプション以外）
  select.innerHTML = '<option value="">保存済みパターンを選択</option>';
  
  // localStorageから保存済みパターンを取得
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  
  // プルダウンに追加
  patterns.forEach((pattern, index) => {
    const option = document.createElement('option');
    option.value = index;
    // デフォルトパターンには名前をそのまま、ユーザーパターンには首数を追加
    if (pattern.isDefault) {
      option.textContent = pattern.name;
    } else {
      option.textContent = `${pattern.name} (${pattern.selected.length}首)`;
    }
    select.appendChild(option);
  });
}

// 選択パターンを保存
function savePattern() {
  // 既存のパターンを取得
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  
  // デフォルト名を生成（選択1、選択2...）
  let defaultName = '';
  let counter = 1;
  while (true) {
    defaultName = `選択${counter}`;
    // 同名が存在しない場合はこの名前を使用
    if (!patterns.find(p => p.name === defaultName)) {
      break;
    }
    counter++;
  }
  
  // 保存名を入力
  const name = prompt('選択パターンの名前を入力してください：', defaultName);
  
  if (name === null) {
    return; // キャンセル
  }
  
  if (name.trim() === '') {
    alert('名前を入力してください。');
    return;
  }
  
  // 現在の選択状態を保存
  const pattern = {
    name: name.trim(),
    selected: [...selected],
    quizCount: quizCount,
    timestamp: new Date().toISOString()
  };
  
  // 同名のパターンがあるか確認
  const existingIndex = patterns.findIndex(p => p.name === pattern.name);
  
  if (existingIndex >= 0) {
    // 上書き確認
    if (confirm(`「${pattern.name}」は既に存在します。上書きしますか？`)) {
      patterns[existingIndex] = pattern;
    } else {
      return;
    }
  } else {
    // 新規追加
    patterns.push(pattern);
  }
  
  // localStorageに保存
  localStorage.setItem('hyakunin-patterns', JSON.stringify(patterns));
  
  // 保存成功したら初期選択状態を更新
  initialSelected = [...selected];
  updateSaveButtonState();
  
  alert(`「${pattern.name}」を保存しました。`);
  
  // プルダウンを更新
  loadSavedPatterns();
}

// 選択パターンを読み込み
function loadPattern() {
  const select = document.getElementById('pattern-select');
  const selectedIndex = select.value;
  
  if (selectedIndex === '') {
    alert('読み込むパターンを選択してください。');
    return;
  }
  
  // パターンを取得
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  const pattern = patterns[parseInt(selectedIndex)];
  
  if (!pattern) {
    alert('パターンが見つかりません。');
    return;
  }
  
  // 選択状態を復元
  selected = [...pattern.selected];
  initialSelected = [...pattern.selected]; // 初期選択状態も更新
  
  // 出題件数も復元
  if (pattern.quizCount !== undefined) {
    quizCount = pattern.quizCount;
  }
  
  // localStorageに保存
  saveSelectedSongs();
  saveSettings();
  
  // 一覧を再描画
  showList();
  
  // チェックボックスの状態を明示的に更新（念のため）
  document.querySelectorAll('.list-item input[type="checkbox"]').forEach(checkbox => {
    const id = parseInt(checkbox.getAttribute('onchange').match(/\d+/)[0]);
    checkbox.checked = selected.includes(id);
  });
  
  // 出題件数の選択肢を更新
  updateQuizCountOptions();
  
  alert(`「${pattern.name}」を読み込みました。`);
}

// 選択パターンを削除
// 選択パターンの名前を変更
function renamePattern() {
  const select = document.getElementById('pattern-select');
  const selectedIndex = select.value;
  
  if (selectedIndex === '') {
    alert('名前を変更するパターンを選択してください。');
    return;
  }
  
  // パターンを取得
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  const pattern = patterns[parseInt(selectedIndex)];
  
  if (!pattern) {
    alert('パターンが見つかりません。');
    return;
  }
  
  // デフォルトパターンは編集不可
  if (pattern.isDefault) {
    alert('このパターンの名前は変更できません。');
    return;
  }
  
  // 新しい名前を入力
  const newName = prompt('新しい名前を入力してください：', pattern.name);
  
  if (newName === null) {
    return; // キャンセル
  }
  
  if (newName.trim() === '') {
    alert('名前を入力してください。');
    return;
  }
  
  // 同名のパターンがあるか確認（自分自身以外）
  const duplicateIndex = patterns.findIndex((p, index) => 
    p.name === newName.trim() && index !== parseInt(selectedIndex)
  );
  
  if (duplicateIndex >= 0) {
    alert(`「${newName.trim()}」は既に存在します。別の名前を入力してください。`);
    return;
  }
  
  // 名前を変更
  const oldName = pattern.name;
  pattern.name = newName.trim();
  patterns[parseInt(selectedIndex)] = pattern;
  
  // localStorageに保存
  localStorage.setItem('hyakunin-patterns', JSON.stringify(patterns));
  
  alert(`「${oldName}」を「${pattern.name}」に変更しました。`);
  
  // プルダウンを更新
  loadSavedPatterns();
  
  // 変更したパターンを選択状態に保つ
  select.value = selectedIndex;
}

// 選択パターンを削除
function deletePattern() {
  const select = document.getElementById('pattern-select');
  const selectedIndex = select.value;
  
  if (selectedIndex === '') {
    alert('削除するパターンを選択してください。');
    return;
  }
  
  // パターンを取得
  const patterns = JSON.parse(localStorage.getItem('hyakunin-patterns') || '[]');
  const pattern = patterns[parseInt(selectedIndex)];
  
  if (!pattern) {
    alert('パターンが見つかりません。');
    return;
  }
  
  // デフォルトパターンは削除不可
  if (pattern.isDefault) {
    alert('このパターンは削除できません。');
    return;
  }
  
  // 削除確認
  if (!confirm(`「${pattern.name}」を削除しますか？`)) {
    return;
  }
  
  // パターンを削除
  patterns.splice(parseInt(selectedIndex), 1);
  
  // localStorageに保存
  localStorage.setItem('hyakunin-patterns', JSON.stringify(patterns));
  
  alert(`「${pattern.name}」を削除しました。`);
  
  // プルダウンを更新
  loadSavedPatterns();
}

// ========================================
// 選択パターン保存ボタンの有効化制御
// ========================================

// 選択が初期状態から変更されたかチェック
function hasSelectionChanged() {
  // 長さが違う場合は変更あり
  if (selected.length !== initialSelected.length) {
    return true;
  }
  
  // ソートして比較
  const sortedSelected = [...selected].sort((a, b) => a - b);
  const sortedInitial = [...initialSelected].sort((a, b) => a - b);
  
  for (let i = 0; i < sortedSelected.length; i++) {
    if (sortedSelected[i] !== sortedInitial[i]) {
      return true;
    }
  }
  
  return false;
}

// 保存ボタンの有効/無効を更新
function updateSaveButtonState() {
  const saveButton = document.querySelector('.btn-save-pattern');
  if (!saveButton) return;
  
  const hasChanged = hasSelectionChanged();
  saveButton.disabled = !hasChanged;
  
  // 無効時のスタイル
  if (!hasChanged) {
    saveButton.style.opacity = '0.5';
    saveButton.style.cursor = 'not-allowed';
  } else {
    saveButton.style.opacity = '1';
    saveButton.style.cursor = 'pointer';
  }
}
