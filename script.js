const { questions, personalities } = window.ABTI_DATA;

const DIMENSIONS = [
  { key: "emotion", label: "情绪", lowCode: "C", highCode: "X", lowText: "冷静", highText: "爆炸" },
  { key: "social", label: "社交", lowCode: "S", highCode: "A", lowText: "潜水", highText: "活跃" },
  { key: "logic", label: "思维", lowCode: "B", highCode: "L", lowText: "抽象", highText: "理性" },
  { key: "selfView", label: "表达", lowCode: "H", highCode: "P", lowText: "自嘲", highText: "自信" },
];

const EXTRA_DIMENSIONS = [
  { key: "attachment", label: "上头值", lowText: "克制", highText: "沉浸" },
];

const STORAGE_KEYS = {
  lastResult: "abti-last-result",
  ranking: `abti-ranking-${new Date().toISOString().slice(0, 10)}`,
  hidden: "abti-hidden-persona",
};

const scoreRange = getScoreRange();
const enrichedPersonalities = personalities.map((personality) => ({
  ...personality,
  code: deriveCode(personality.coreTraits),
}));

const AVATAR_BASE_PATH = "assets/avatars";

const AVATAR_CONFIGS = {
  jiahao: { skin: "#f1d3bf", outfit: "#6ab89e", hair: "#54645d", accent: "#d7efe6", mood: "smirk", prop: "mask", pose: "wide" },
  emo: { skin: "#efd6ca", outfit: "#8ca6d6", hair: "#4a5066", accent: "#d7def2", mood: "sad", prop: "cloud", pose: "slouch" },
  clown: { skin: "#f2d0b4", outfit: "#f0a36b", hair: "#614a52", accent: "#ffe2ce", mood: "grin", prop: "star", pose: "wide" },
  observer: { skin: "#e8d7cb", outfit: "#8fb4a5", hair: "#566268", accent: "#dbe9e3", mood: "flat", prop: "glasses", pose: "still" },
  lickdog: { skin: "#f2d5c0", outfit: "#ee9aa7", hair: "#704f58", accent: "#ffd9de", mood: "soft", prop: "heart", pose: "lean" },
  explosive: { skin: "#f0ccb2", outfit: "#e98a6f", hair: "#5e5452", accent: "#ffd8cb", mood: "angry", prop: "spark", pose: "wide" },
  bailan: { skin: "#ead7c8", outfit: "#b5c8a1", hair: "#6f7769", accent: "#e6efdc", mood: "sleepy", prop: "zzz", pose: "slouch" },
  analyst: { skin: "#f1dac5", outfit: "#7db4cb", hair: "#4f5a63", accent: "#d8edf4", mood: "focus", prop: "book", pose: "still" },
  repeater: { skin: "#efd4bb", outfit: "#7fc7b0", hair: "#525e57", accent: "#d8f1ea", mood: "grin", prop: "echo", pose: "wide" },
  airman: { skin: "#eedccf", outfit: "#ced8d2", hair: "#7f8a86", accent: "#eef4f1", mood: "flat", prop: "ghost", pose: "still" },
  trend: { skin: "#f1d2bc", outfit: "#6fd0bf", hair: "#556364", accent: "#daf7f1", mood: "smirk", prop: "flash", pose: "wide" },
  overthinker: { skin: "#ecd9cd", outfit: "#9aabd6", hair: "#5b6176", accent: "#dde4f5", mood: "worry", prop: "thought", pose: "lean" },
  switcher: { skin: "#efd3be", outfit: "#8fd0be", hair: "#5a6264", accent: "#dcf5ee", mood: "smirk", prop: "split", pose: "switch" },
};

const elements = {
  topbarAction: document.getElementById("topbarAction"),
  startScreen: document.getElementById("startScreen"),
  quizScreen: document.getElementById("quizScreen"),
  resultScreen: document.getElementById("resultScreen"),
  startTestBtn: document.getElementById("startTestBtn"),
  jumpPreviewBtn: document.getElementById("jumpPreviewBtn"),
  shufflePreviewBtn: document.getElementById("shufflePreviewBtn"),
  previewCards: document.getElementById("previewCards"),
  previewSection: document.getElementById("previewSection"),
  posterCode: document.getElementById("posterCode"),
  posterName: document.getElementById("posterName"),
  posterAlias: document.getElementById("posterAlias"),
  posterDesc: document.getElementById("posterDesc"),
  posterTags: document.getElementById("posterTags"),
  lastResult: document.getElementById("lastResult"),
  lastResultText: document.getElementById("lastResultText"),
  restoreResultBtn: document.getElementById("restoreResultBtn"),
  progressText: document.getElementById("progressText"),
  progressCaption: document.getElementById("progressCaption"),
  progressFill: document.getElementById("progressFill"),
  liveCode: document.getElementById("liveCode"),
  questionBadge: document.getElementById("questionBadge"),
  questionTitle: document.getElementById("questionTitle"),
  optionsList: document.getElementById("optionsList"),
  restartInlineBtn: document.getElementById("restartInlineBtn"),
  resultCode: document.getElementById("resultCode"),
  resultAvatar: document.getElementById("resultAvatar"),
  resultCodeDetail: document.getElementById("resultCodeDetail"),
  resultName: document.getElementById("resultName"),
  resultAlias: document.getElementById("resultAlias"),
  resultDescription: document.getElementById("resultDescription"),
  resultTags: document.getElementById("resultTags"),
  dangerNote: document.getElementById("dangerNote"),
  memeLevel: document.getElementById("memeLevel"),
  abstractIndex: document.getElementById("abstractIndex"),
  hiddenPersona: document.getElementById("hiddenPersona"),
  metricList: document.getElementById("metricList"),
  aiCopyText: document.getElementById("aiCopyText"),
  duoMatch: document.getElementById("duoMatch"),
  rankingList: document.getElementById("rankingList"),
  shortCode: document.getElementById("shortCode"),
  secondaryMatch: document.getElementById("secondaryMatch"),
  shareIndex: document.getElementById("shareIndex"),
  lastSavedAt: document.getElementById("lastSavedAt"),
  generateShareBtn: document.getElementById("generateShareBtn"),
  nativeShareBtn: document.getElementById("nativeShareBtn"),
  copyTextBtn: document.getElementById("copyTextBtn"),
  restartBtn: document.getElementById("restartBtn"),
  refreshCopyBtn: document.getElementById("refreshCopyBtn"),
  refreshCompareBtn: document.getElementById("refreshCompareBtn"),
  shareModal: document.getElementById("shareModal"),
  closeModalBackdrop: document.getElementById("closeModalBackdrop"),
  closeShareModal: document.getElementById("closeShareModal"),
  sharePreview: document.getElementById("sharePreview"),
  downloadShareBtn: document.getElementById("downloadShareBtn"),
  copyTextModalBtn: document.getElementById("copyTextModalBtn"),
  shareCanvas: document.getElementById("shareCanvas"),
  toast: document.getElementById("toast"),
};

let heroIndex = 0;
let toastTimer = 0;
let state = createInitialState();

bindEvents();
renderPoster();
renderPreviewCards();
restoreLastResultHint();
toggleNativeShare();
maybeAutoPlay();

function createInitialState() {
  return {
    currentQuestion: 0,
    answers: [],
    rawScores: createScoreMap(),
    result: null,
    aiCopyIndex: 0,
    compareIndex: 0,
  };
}

function createScoreMap() {
  return {
    emotion: 0,
    social: 0,
    logic: 0,
    selfView: 0,
    attachment: 0,
  };
}

function bindEvents() {
  elements.startTestBtn?.addEventListener("click", startTest);
  elements.topbarAction?.addEventListener("click", () => {
    if (elements.quizScreen.classList.contains("is-active") || elements.resultScreen.classList.contains("is-active")) {
      restartTest();
      return;
    }
    startTest();
  });
  elements.jumpPreviewBtn?.addEventListener("click", () => {
    if (!elements.previewSection) return;
    elements.previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.shufflePreviewBtn?.addEventListener("click", () => {
    heroIndex += 1;
    renderPoster();
    renderPreviewCards();
  });
  elements.restoreResultBtn?.addEventListener("click", restoreLastResult);
  elements.restartInlineBtn?.addEventListener("click", restartTest);
  elements.restartBtn?.addEventListener("click", restartTest);
  elements.refreshCopyBtn?.addEventListener("click", rotateAiCopy);
  elements.refreshCompareBtn?.addEventListener("click", rotateCompare);
  elements.copyTextBtn?.addEventListener("click", copyShareText);
  elements.copyTextModalBtn?.addEventListener("click", copyShareText);
  elements.generateShareBtn?.addEventListener("click", async () => {
    await openShareModal();
  });
  elements.nativeShareBtn?.addEventListener("click", nativeShare);
  elements.closeModalBackdrop?.addEventListener("click", closeShareModal);
  elements.closeShareModal?.addEventListener("click", closeShareModal);
}

function toggleNativeShare() {
  if (!navigator.share) {
    elements.nativeShareBtn.textContent = "复制分享文案";
  }
}

function startTest() {
  state = createInitialState();
  showScreen("quiz");
  renderQuestion();
}

function restartTest() {
  state = createInitialState();
  showScreen("start");
}

function showScreen(name) {
  [elements.startScreen, elements.quizScreen, elements.resultScreen].forEach((screen) => {
    screen.classList.remove("is-active");
  });

  const target = name === "quiz" ? elements.quizScreen : name === "result" ? elements.resultScreen : elements.startScreen;
  target.classList.add("is-active");
  elements.topbarAction.textContent = name === "start" ? "开始测试" : "重新开始";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPoster() {
  if (!elements.posterCode || !elements.posterName || !elements.posterAlias || !elements.posterDesc || !elements.posterTags) {
    return;
  }
  const pool = enrichedPersonalities.filter((item) => item.memeLevel !== "B");
  const active = pool[heroIndex % pool.length];
  elements.posterCode.textContent = active.code;
  elements.posterName.textContent = active.name;
  elements.posterAlias.textContent = active.alias;
  elements.posterDesc.textContent = active.description;
  elements.posterTags.innerHTML = active.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
}

function maybeAutoPlay() {
  const params = new URLSearchParams(location.search);
  if (params.get("demo") !== "1") return;
  const shouldOpenShare = params.get("share") === "1";

  startTest();
  let answered = 0;
  const timer = window.setInterval(() => {
    const button = elements.optionsList.querySelector(".option-button");
    if (!button) {
      window.clearInterval(timer);
      return;
    }
    button.click();
    answered += 1;
    if (answered >= questions.length) {
      window.clearInterval(timer);
      if (shouldOpenShare) {
        window.setTimeout(() => {
          openShareModal();
        }, 280);
      }
    }
  }, 80);
}

function renderPreviewCards() {
  if (!elements.previewCards) return;
  const shuffled = [...enrichedPersonalities]
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(heroIndex % 4, (heroIndex % 4) + 6);

  const previewSet = shuffled.length >= 3 ? shuffled.slice(0, 3) : enrichedPersonalities.slice(0, 3);
  elements.previewCards.innerHTML = previewSet.map((item) => `
    <article class="preview-card">
      <p class="section-label">${item.code}</p>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.alias)}</small>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join("");
}

function renderQuestion() {
  const question = questions[state.currentQuestion];
  const percent = ((state.currentQuestion) / questions.length) * 100;
  elements.progressText.textContent = `${String(state.currentQuestion + 1).padStart(2, "0")} / ${questions.length}`;
  elements.progressCaption.textContent = `已完成 ${Math.round(percent)}%`;
  elements.progressFill.style.width = `${percent}%`;
  elements.questionBadge.textContent = `场景 ${String(state.currentQuestion + 1).padStart(2, "0")}`;
  elements.questionTitle.textContent = question.title;
  elements.liveCode.textContent = `趋势码 ${previewCodeFromRaw(state.rawScores)}`;
  elements.optionsList.innerHTML = question.options.map((option, index) => `
    <button class="option-button" type="button" data-index="${index}">
      <span class="option-index">${String.fromCharCode(65 + index)}</span>
      <span>${escapeHtml(option.text)}</span>
    </button>
  `).join("");

  [...elements.optionsList.querySelectorAll(".option-button")].forEach((button) => {
    button.addEventListener("click", () => selectOption(Number(button.dataset.index)));
  });
}

function selectOption(index) {
  const question = questions[state.currentQuestion];
  const option = question.options[index];

  state.answers.push({ questionId: question.id, optionIndex: index, text: option.text });
  Object.entries(option.weights).forEach(([key, value]) => {
    state.rawScores[key] += value;
  });

  if (state.currentQuestion === questions.length - 1) {
    finishTest();
    return;
  }

  state.currentQuestion += 1;
  renderQuestion();
}

function finishTest() {
  const normalized = normalizeScores(state.rawScores);
  const code = deriveCode(normalized);
  const ranked = getRankedPersonalities(normalized, code);
  const primary = ranked[0];
  const secondary = ranked[1];
  const abstractIndex = calculateAbstractIndex(normalized);

  state.result = {
    normalized,
    code,
    primary,
    secondary,
    abstractIndex,
    aiCopies: buildAiCopies(primary, code, abstractIndex),
    compareOptions: buildCompareOptions(primary, normalized),
    hiddenLabel: getHiddenPersonaLabel(abstractIndex),
    shareIndex: calculateShareIndex(primary, abstractIndex),
    savedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  };

  saveLastResult();
  updateRanking(primary.id);
  renderResult();
  showScreen("result");
}

function renderResult() {
  const { primary, secondary, code, normalized, abstractIndex, hiddenLabel, shareIndex, savedAt } = state.result;
  renderAvatar(primary.id);
  elements.resultCode.textContent = code;
  elements.resultCodeDetail.textContent = codeToText(code);
  elements.resultName.textContent = primary.name;
  elements.resultAlias.textContent = `${primary.alias} · ${primary.shortCode}`;
  elements.resultDescription.textContent = primary.description;
  elements.resultTags.innerHTML = primary.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  elements.dangerNote.textContent = primary.dangerNote;
  elements.memeLevel.textContent = `梗感 ${primary.memeLevel}`;
  elements.abstractIndex.textContent = `${abstractIndex}%`;
  elements.hiddenPersona.textContent = hiddenLabel;
  elements.shortCode.textContent = primary.shortCode;
  elements.secondaryMatch.textContent = secondary.name;
  elements.shareIndex.textContent = `${shareIndex}%`;
  elements.lastSavedAt.textContent = savedAt;
  renderMetrics(normalized);
  state.aiCopyIndex = 0;
  state.compareIndex = 0;
  renderAiCopy();
  renderCompare();
  renderRanking(primary.id);
}

function renderAvatar(personalityId) {
  if (!elements.resultAvatar) return;
  const img = document.createElement("img");
  img.src = `${AVATAR_BASE_PATH}/${personalityId}.png`;
  img.alt = "人格形象";
  img.loading = "eager";
  img.decoding = "async";
  img.addEventListener("error", () => {
    const fallback = document.createElement("img");
    fallback.src = `${AVATAR_BASE_PATH}/${personalityId}.svg`;
    fallback.alt = "人格形象";
    fallback.loading = "eager";
    fallback.decoding = "async";
    fallback.addEventListener("error", () => {
      elements.resultAvatar.innerHTML = createAvatarSvg(personalityId);
    }, { once: true });
    elements.resultAvatar.replaceChildren(fallback);
  }, { once: true });
  elements.resultAvatar.replaceChildren(img);
}

function createAvatarSvg(personalityId) {
  const config = AVATAR_CONFIGS[personalityId] || AVATAR_CONFIGS.jiahao;
  const moodMap = {
    smirk: '<path d="M90 99 Q104 108 120 100" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
    sad: '<path d="M90 105 Q105 95 120 104" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
    grin: '<path d="M87 100 Q105 114 123 100" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M92 101 L118 101" stroke="#243a33" stroke-width="2" opacity=".55"/>',
    flat: '<line x1="90" y1="101" x2="120" y2="101" stroke="#243a33" stroke-width="4" stroke-linecap="round"/>',
    soft: '<path d="M92 101 Q104 108 118 101" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
    angry: '<path d="M88 104 Q104 94 122 100" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
    sleepy: '<path d="M92 103 Q106 108 118 103" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>',
    focus: '<path d="M92 102 Q106 106 120 102" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
    worry: '<path d="M90 106 Q104 96 120 106" stroke="#243a33" stroke-width="4" stroke-linecap="round" fill="none"/>',
  };

  const eyeMap = {
    angry: '<path d="M78 82 L92 78" stroke="#243a33" stroke-width="4" stroke-linecap="round"/><path d="M108 78 L122 82" stroke="#243a33" stroke-width="4" stroke-linecap="round"/>',
    sleepy: '<line x1="78" y1="82" x2="90" y2="82" stroke="#243a33" stroke-width="4" stroke-linecap="round"/><line x1="110" y1="82" x2="122" y2="82" stroke="#243a33" stroke-width="4" stroke-linecap="round"/>',
    focus: '<circle cx="84" cy="82" r="4" fill="#243a33"/><circle cx="116" cy="82" r="4" fill="#243a33"/><rect x="74" y="74" width="52" height="18" rx="8" fill="none" stroke="#243a33" stroke-width="3"/>',
    soft: '<circle cx="84" cy="82" r="4" fill="#243a33"/><circle cx="116" cy="82" r="4" fill="#243a33"/>',
    worry: '<circle cx="84" cy="83" r="4" fill="#243a33"/><circle cx="116" cy="83" r="4" fill="#243a33"/><path d="M76 73 Q84 68 92 73" stroke="#243a33" stroke-width="3" fill="none"/><path d="M108 73 Q116 68 124 73" stroke="#243a33" stroke-width="3" fill="none"/>',
  };

  const propMap = {
    mask: '<path d="M48 74 L63 64 L71 74 L57 84 Z" fill="#ffffff" opacity=".8"/><path d="M51 73 Q57 70 62 74" stroke="#243a33" stroke-width="2" fill="none"/>',
    cloud: '<g opacity=".92"><circle cx="146" cy="40" r="14" fill="#d7def2"/><circle cx="162" cy="44" r="12" fill="#d7def2"/><circle cx="132" cy="46" r="11" fill="#d7def2"/></g>',
    star: '<polygon points="154,38 160,50 173,52 163,61 165,74 154,67 143,74 145,61 135,52 148,50" fill="#ffd27f"/>',
    glasses: '<g opacity=".9"><rect x="72" y="73" width="24" height="16" rx="5" fill="none" stroke="#243a33" stroke-width="3"/><rect x="104" y="73" width="24" height="16" rx="5" fill="none" stroke="#243a33" stroke-width="3"/><line x1="96" y1="81" x2="104" y2="81" stroke="#243a33" stroke-width="3"/></g>',
    heart: '<path d="M148 54 C148 44 162 43 162 54 C162 62 154 68 148 74 C142 68 134 62 134 54 C134 43 148 44 148 54 Z" fill="#ffb2bf"/>',
    spark: '<path d="M149 38 L155 51 L169 57 L155 62 L149 76 L143 62 L129 57 L143 51 Z" fill="#ffbc96"/>',
    zzz: '<text x="140" y="46" font-size="24" font-family="Space Grotesk, sans-serif" fill="#8aa49b">Zz</text>',
    book: '<rect x="136" y="50" width="30" height="36" rx="6" fill="#ffffff" opacity=".9"/><line x1="151" y1="50" x2="151" y2="86" stroke="#7db4cb" stroke-width="3"/>',
    echo: '<text x="136" y="52" font-size="18" font-family="Space Grotesk, sans-serif" fill="#5ea88d">ha</text><text x="145" y="68" font-size="14" font-family="Space Grotesk, sans-serif" fill="#85c7b1">ha</text>',
    ghost: '<path d="M146 42 C157 42 164 50 164 61 V74 L157 68 L152 74 L146 68 L140 74 L134 68 V61 C134 50 139 42 146 42 Z" fill="#f4f7f6" stroke="#9fb0aa" stroke-width="2"/>',
    flash: '<path d="M150 38 L162 38 L154 56 L165 56 L147 82 L151 60 L140 60 Z" fill="#ffd26f"/>',
    thought: '<circle cx="148" cy="44" r="16" fill="#dde4f5"/><circle cx="132" cy="62" r="7" fill="#dde4f5"/><circle cx="124" cy="76" r="4" fill="#dde4f5"/>',
    split: '<path d="M146 38 L158 50 L146 62 L134 50 Z" fill="#ffffff" opacity=".8"/><line x1="146" y1="38" x2="146" y2="62" stroke="#243a33" stroke-width="2"/>',
  };

  const hair = createHairShape(config);
  const body = createBodyShape(config, personalityId);
  const armTransform = config.pose === "wide" ? "" : config.pose === "lean" ? 'transform="rotate(10 52 146)"' : 'transform="rotate(-4 52 146)"';
  const rightArmTransform = config.pose === "wide" ? "" : config.pose === "lean" ? 'transform="rotate(-12 148 146)"' : 'transform="rotate(4 148 146)"';

  return `
    <svg viewBox="0 0 200 240" role="img" aria-label="ABTI avatar">
      <defs>
        <linearGradient id="bodyGrad-${personalityId}" x1="0" x2="1">
          <stop offset="0%" stop-color="${config.outfit}"/>
          <stop offset="100%" stop-color="${shadeColor(config.outfit, -18)}"/>
        </linearGradient>
      </defs>
      <rect x="24" y="18" width="152" height="204" rx="34" fill="${config.accent}" opacity=".28"/>
      ${propMap[config.prop] || ""}
      <g>
        <g ${armTransform}>
          <polygon points="54,126 76,126 70,176 44,174" fill="url(#bodyGrad-${personalityId})"/>
          <polygon points="42,172 54,170 58,190 44,194 34,182" fill="${config.skin}"/>
        </g>
        <g ${rightArmTransform}>
          <polygon points="124,126 146,126 156,174 130,176" fill="url(#bodyGrad-${personalityId})"/>
          <polygon points="146,170 158,174 164,192 148,196 138,184" fill="${config.skin}"/>
        </g>
        ${body}
        <polygon points="72,186 92,186 88,224 64,224" fill="${shadeColor(config.outfit, -10)}"/>
        <polygon points="108,186 128,186 136,224 112,224" fill="${shadeColor(config.outfit, -6)}"/>
        <polygon points="58,220 90,220 82,234 54,234" fill="${shadeColor(config.outfit, -24)}"/>
        <polygon points="112,220 146,220 138,234 108,234" fill="${shadeColor(config.outfit, -24)}"/>
        <polygon points="62,50 138,50 132,126 68,126" fill="${config.skin}"/>
        ${hair}
        <polygon points="62,52 100,52 100,126 70,126" fill="rgba(255,255,255,0.05)"/>
        ${eyeMap[config.mood] || '<circle cx="84" cy="82" r="4" fill="#243a33"/><circle cx="116" cy="82" r="4" fill="#243a33"/>'}
        ${moodMap[config.mood] || moodMap.smirk}
      </g>
    </svg>
  `;
}

function createHairShape(config) {
  if (config.pose === "switch") {
    return `
      <polygon points="54,52 80,32 100,46 100,52" fill="${config.hair}"/>
      <polygon points="100,52 100,40 142,34 150,52" fill="${shadeColor(config.hair, -10)}"/>
    `;
  }
  if (config.mood === "sad" || config.mood === "worry") {
    return `<polygon points="54,52 72,28 134,32 146,56 126,54 110,70 86,54" fill="${config.hair}"/>`;
  }
  if (config.mood === "sleepy") {
    return `<polygon points="54,52 70,38 138,38 146,60 126,58 104,66 82,58" fill="${config.hair}"/>`;
  }
  return `<polygon points="52,54 72,30 136,32 148,56 128,58 100,42 74,58" fill="${config.hair}"/>`;
}

function createBodyShape(config, personalityId) {
  if (config.pose === "slouch") {
    return `<polygon points="74,122 126,128 120,186 70,182" fill="url(#bodyGrad-${personalityId})"/>`;
  }
  if (config.pose === "lean") {
    return `<polygon points="70,124 126,118 132,184 68,188" fill="url(#bodyGrad-${personalityId})"/>`;
  }
  if (config.pose === "switch") {
    return `
      <polygon points="72,122 100,120 100,186 66,186" fill="url(#bodyGrad-${personalityId})"/>
      <polygon points="100,120 126,124 136,186 100,186" fill="${shadeColor(config.outfit, -12)}"/>
    `;
  }
  if (config.pose === "still") {
    return `<polygon points="74,122 126,122 128,186 72,186" fill="url(#bodyGrad-${personalityId})"/>`;
  }
  return `<polygon points="72,122 126,122 136,186 64,186" fill="url(#bodyGrad-${personalityId})"/>`;
}

function shadeColor(hex, amount) {
  const value = hex.replace("#", "");
  const num = parseInt(value, 16);
  const r = clamp(((num >> 16) & 255) + amount, 0, 255);
  const g = clamp(((num >> 8) & 255) + amount, 0, 255);
  const b = clamp((num & 255) + amount, 0, 255);
  return `#${[r, g, b].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
}

function renderMetrics(scores) {
  const allMetrics = [...DIMENSIONS, ...EXTRA_DIMENSIONS];
  elements.metricList.innerHTML = allMetrics.map((metric) => {
    const value = Math.round(scores[metric.key]);
    return `
      <div class="metric-row">
        <div class="metric-head">
          <span>${metric.label}</span>
          <strong>${value}%</strong>
        </div>
        <div class="metric-fill"><span style="width:${value}%"></span></div>
        <div class="metric-foot">
          <span>${metric.lowText}</span>
          <span>${metric.highText}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderAiCopy() {
  elements.aiCopyText.textContent = state.result.aiCopies[state.aiCopyIndex % state.result.aiCopies.length];
}

function rotateAiCopy() {
  if (!state.result) return;
  state.aiCopyIndex += 1;
  renderAiCopy();
}

function renderCompare() {
  const item = state.result.compareOptions[state.compareIndex % state.result.compareOptions.length];
  elements.duoMatch.innerHTML = `
    <strong class="duo-title">你：${escapeHtml(state.result.primary.name)} ｜ 朋友：${escapeHtml(item.friend.name)}</strong>
    <p class="duo-sub">${escapeHtml(item.summary)}</p>
    <p>${escapeHtml(item.conclusion)}</p>
  `;
}

function rotateCompare() {
  if (!state.result) return;
  state.compareIndex += 1;
  renderCompare();
}

function getScoreRange() {
  const base = createScoreMap();
  const range = {};
  Object.keys(base).forEach((key) => {
    range[key] = { min: 0, max: 0 };
  });

  questions.forEach((question) => {
    Object.keys(base).forEach((key) => {
      const values = question.options.map((option) => option.weights[key] ?? 0);
      range[key].min += Math.min(...values);
      range[key].max += Math.max(...values);
    });
  });

  return range;
}

function normalizeScores(rawScores) {
  const normalized = {};
  Object.keys(rawScores).forEach((key) => {
    const { min, max } = scoreRange[key];
    normalized[key] = max === min ? 50 : clamp(((rawScores[key] - min) / (max - min)) * 100, 0, 100);
  });
  return normalized;
}

function previewCodeFromRaw(rawScores) {
  return [
    rawScores.emotion >= 0 ? "X" : "C",
    rawScores.social >= 0 ? "A" : "S",
    rawScores.logic >= 0 ? "L" : "B",
    rawScores.selfView >= 0 ? "P" : "H",
  ].join("");
}

function deriveCode(scores) {
  return [
    scores.emotion >= 50 ? "X" : "C",
    scores.social >= 50 ? "A" : "S",
    scores.logic >= 50 ? "L" : "B",
    scores.selfView >= 50 ? "P" : "H",
  ].join("");
}

function codeToText(code) {
  const labels = [];
  DIMENSIONS.forEach((dimension, index) => {
    labels.push(code[index] === dimension.highCode ? dimension.highText : dimension.lowText);
  });
  return labels.join(" × ");
}

function getRankedPersonalities(scores, code) {
  return [...enrichedPersonalities]
    .map((item) => {
      let distance = 0;
      distance += Math.abs(scores.emotion - item.coreTraits.emotion) * 1.2;
      distance += Math.abs(scores.social - item.coreTraits.social) * 1.1;
      distance += Math.abs(scores.logic - item.coreTraits.logic) * 1.25;
      distance += Math.abs(scores.selfView - item.coreTraits.selfView) * 1.1;
      distance += Math.abs(scores.attachment - item.coreTraits.attachment) * 0.85;
      distance -= compareCode(code, item.code) * 8;
      return { ...item, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

function compareCode(left, right) {
  return [...left].reduce((sum, char, index) => sum + (char === right[index] ? 1 : 0), 0);
}

function calculateAbstractIndex(scores) {
  return Math.round(clamp(
    scores.emotion * 0.28 +
      scores.social * 0.22 +
      (100 - scores.logic) * 0.28 +
      scores.selfView * 0.12 +
      scores.attachment * 0.1,
    0,
    100,
  ));
}

function calculateShareIndex(primary, abstractIndex) {
  const memeBoost = primary.memeLevel === "S" ? 16 : primary.memeLevel === "A" ? 10 : 4;
  return clamp(Math.round(abstractIndex * 0.7 + memeBoost + primary.coreTraits.social * 0.15), 0, 100);
}

function getHiddenPersonaLabel(abstractIndex) {
  const unlocked = getStoredValue(STORAGE_KEYS.hidden) === "1";
  if (abstractIndex >= 85 || unlocked) {
    return "终极抽象体";
  }
  return "分享后解锁";
}

function buildAiCopies(primary, code, abstractIndex) {
  return [
    `我是 ${primary.name}（${code}）。\n我不讲复杂逻辑，我讲我的互联网气场。\n抽象指数 ${abstractIndex}% ，今天的群聊我负责出梗。`,
    `测出来我是 ${primary.name}。\n别问准不准，问就是太像了。\n${primary.dangerNote}`,
    `${primary.name} 已上线。\n人格别名：${primary.alias}。\n如果你也测出来离谱的，记得发给我对比。`,
  ];
}

function buildCompareOptions(primary, scores) {
  const others = enrichedPersonalities.filter((item) => item.id !== primary.id);
  const sorted = [...others].sort((a, b) => {
    const diffA = Math.abs(scores.social - a.coreTraits.social) + Math.abs(scores.logic - a.coreTraits.logic);
    const diffB = Math.abs(scores.social - b.coreTraits.social) + Math.abs(scores.logic - b.coreTraits.logic);
    return diffB - diffA;
  }).slice(0, 3);

  return sorted.map((friend) => {
    const summary = `${primary.name} × ${friend.name}`;
    const conclusion = scores.social >= friend.coreTraits.social
      ? `结论：你负责输出和带气氛，${friend.alias}负责在旁边观察、补刀或兜底。`
      : `结论：${friend.alias}负责往前冲，你负责旁观、分析，或者默默记下这次离谱现场。`;
    return { friend, summary, conclusion };
  });
}

function renderRanking(activeId) {
  const ranking = getRankingData();
  const total = Object.values(ranking).reduce((sum, value) => sum + value, 0) || 1;
  const items = [...enrichedPersonalities]
    .map((item) => ({
      item,
      count: ranking[item.id] ?? 0,
      percent: Math.round(((ranking[item.id] ?? 0) / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  elements.rankingList.innerHTML = items.map((entry, index) => `
    <div class="rank-item">
      <div class="rank-left">
        <span class="rank-num">${index + 1}</span>
        <div>
          <strong>${escapeHtml(entry.item.name)}${entry.item.id === activeId ? " · 你" : ""}</strong>
          <span>${escapeHtml(entry.item.alias)}</span>
        </div>
      </div>
      <strong>${entry.percent}%</strong>
    </div>
  `).join("");
}

function getRankingData() {
  const stored = getStoredJson(STORAGE_KEYS.ranking);
  if (stored) return stored;

  const seed = {};
  enrichedPersonalities.forEach((item, index) => {
    seed[item.id] = 8 + (item.memeLevel === "S" ? 6 : item.memeLevel === "A" ? 4 : 2) + (index % 4);
  });
  setStoredJson(STORAGE_KEYS.ranking, seed);
  return seed;
}

function updateRanking(id) {
  const ranking = getRankingData();
  ranking[id] = (ranking[id] ?? 0) + 1;
  setStoredJson(STORAGE_KEYS.ranking, ranking);
}

function saveLastResult() {
  const payload = {
    ...state.result,
    primary: state.result.primary,
    secondary: state.result.secondary,
  };
  setStoredJson(STORAGE_KEYS.lastResult, payload);
  restoreLastResultHint();
}

function restoreLastResultHint() {
  const stored = getStoredJson(STORAGE_KEYS.lastResult);
  if (!stored) return;
  elements.lastResult.classList.remove("hidden");
  elements.lastResultText.textContent = `${stored.primary.name} · ${stored.code}`;
}

function restoreLastResult() {
  const stored = getStoredJson(STORAGE_KEYS.lastResult);
  if (!stored) return;
  state = createInitialState();
  state.result = stored;
  renderResult();
  showScreen("result");
}

async function copyShareText() {
  if (!state.result) return;
  const text = buildShareText();
  await copyToClipboard(text);
  unlockHiddenPersona();
  showToast("结果文案已复制");
}

function buildShareText() {
  const link = location.protocol === "http:" || location.protocol === "https:" ? `\n来测：${location.href}` : "";
  return `${state.result.aiCopies[state.aiCopyIndex % state.result.aiCopies.length]}\n\n我的人格：${state.result.primary.name}（${state.result.code}）${link}`;
}

async function nativeShare() {
  if (!state.result) return;
  if (!navigator.share) {
    await copyShareText();
    return;
  }

  try {
    const blob = await buildShareBlob();
    const shareData = {
      title: "ABTI",
      text: buildShareText(),
    };

    if (blob && navigator.canShare) {
      const file = new File([blob], `abti-${state.result.code}.png`, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }
    }

    await navigator.share(shareData);
    unlockHiddenPersona();
  } catch (error) {
    if (error && error.name !== "AbortError") {
      showToast("系统分享未完成，试试生成图片");
    }
  }
}

async function openShareModal() {
  if (!state.result) return;
  const url = await drawShareCanvas();
  elements.sharePreview.src = url;
  elements.downloadShareBtn.href = url;
  elements.shareModal.classList.remove("hidden");
  unlockHiddenPersona();
}

function closeShareModal() {
  elements.shareModal.classList.add("hidden");
}

function unlockHiddenPersona() {
  setStoredValue(STORAGE_KEYS.hidden, "1");
  if (state.result) {
    state.result.hiddenLabel = "终极抽象体";
    elements.hiddenPersona.textContent = "终极抽象体";
  }
}

async function drawShareCanvas() {
  const canvas = elements.shareCanvas;
  const context = canvas.getContext("2d");
  const { primary, code, abstractIndex } = state.result;
  const avatarImage = await loadImageAsset(`${AVATAR_BASE_PATH}/${primary.id}.png`).catch(async () => {
    return loadImageAsset(`${AVATAR_BASE_PATH}/${primary.id}.svg`).catch(() => null);
  });

  canvas.width = 1080;
  canvas.height = 1350;

  const bg = context.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#f8fcfa");
  bg.addColorStop(0.5, "#eef8f4");
  bg.addColorStop(1, "#f7fbfa");
  context.fillStyle = bg;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(169,226,205,0.42)";
  context.beginPath();
  context.arc(182, 152, 220, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "rgba(203,229,247,0.36)";
  context.beginPath();
  context.arc(920, 240, 240, 0, Math.PI * 2);
  context.fill();

  roundRect(context, 72, 72, 936, 1206, 40, "rgba(255,255,255,0.86)", "rgba(101,137,125,0.12)");
  roundRect(context, 622, 146, 292, 292, 34, "rgba(255,255,255,0.74)", "rgba(101,137,125,0.12)");

  if (avatarImage) {
    context.drawImage(avatarImage, 640, 164, 256, 256);
  }

  context.fillStyle = "#789289";
  context.font = '500 32px "Space Grotesk", "Noto Sans SC", sans-serif';
  context.fillText("ABTI", 120, 144);

  context.fillStyle = "#203832";
  context.font = '700 156px "Space Grotesk", "Noto Sans SC", sans-serif';
  context.fillText(code, 112, 340);

  context.font = '700 60px "Noto Sans SC", sans-serif';
  wrapCanvasText(context, primary.name, 120, 430, 470, 76);

  context.fillStyle = "#58aa91";
  context.font = '500 34px "Noto Sans SC", sans-serif';
  context.fillText(primary.alias, 120, 560);

  context.fillStyle = "#4d675f";
  context.font = '400 34px "Noto Sans SC", sans-serif';
  wrapCanvasText(context, primary.description, 120, 640, 780, 52);

  roundRect(context, 120, 794, 840, 120, 26, "rgba(88,194,164,0.08)", "rgba(101,137,125,0.1)");
  context.fillStyle = "#213831";
  context.font = '700 28px "Noto Sans SC", sans-serif';
  context.fillText("风险提示", 152, 848);
  context.fillStyle = "#6f887f";
  context.font = '400 28px "Noto Sans SC", sans-serif';
  wrapCanvasText(context, primary.dangerNote, 152, 892, 760, 42);

  context.fillStyle = "#6f887f";
  context.font = '500 26px "Noto Sans SC", sans-serif';
  context.fillText(`抽象指数 ${abstractIndex}%`, 120, 988);
  context.fillText(codeToText(code), 120, 1036);

  const metrics = [...DIMENSIONS, ...EXTRA_DIMENSIONS];
  metrics.forEach((metric, index) => {
    const y = 1084 + index * 44;
    const value = Math.round(state.result.normalized[metric.key]);
    context.fillStyle = "#6f887f";
    context.fillText(metric.label, 120, y);
    roundRect(context, 236, y - 22, 580, 16, 999, "rgba(88,194,164,0.12)");
    roundRect(context, 236, y - 22, 5.8 * value, 16, 999, "#58c2a4");
    context.fillStyle = "#213831";
    context.fillText(`${value}%`, 838, y);
  });

  context.fillStyle = "#7a948b";
  context.font = '500 24px "Space Grotesk", "Noto Sans SC", sans-serif';
  context.fillText("Made for screenshots and shared chaos.", 120, 1234);

  return canvas.toDataURL("image/png");
}

async function buildShareBlob() {
  await drawShareCanvas();
  return new Promise((resolve) => {
    elements.shareCanvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function loadImageAsset(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = "";
  let cursorY = y;
  [...text].forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) {
    ctx.fillText(line, x, cursorY);
  }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (error) {
    // Fall through to textarea method.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 1800);
}

function getStoredJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
}

function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write failures.
  }
}

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore storage write failures.
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
