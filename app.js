(function () {
    const directionSelect = document.getElementById('directionSelect');
    const vibeToggle = document.getElementById('vibeToggle');
    const llmToggle = document.getElementById('llmToggle'); // 없어도 동작
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const swapBtn = document.getElementById('swapBtn');
    const inputCount = document.getElementById('inputCount');
    const outputCount = document.getElementById('outputCount');
    const examples = document.getElementById('examples');
  
    const STORAGE_KEY = 'pangyo-translator-state-v1';
    const LEARNED_PATTERNS_KEY = 'pangyo-learned-patterns-v1';
    const API_BASE = 'http://localhost:8787';
    let lastLogText = '';
    let lastLogAt = 0;
  
    // 학습 기반 패턴 시스템
    class PatternLearner {
      constructor() {
        this.patterns = new Map();
        this.loadFromStorage();
      }
      
      loadFromStorage() {
        try {
          const stored = localStorage.getItem(LEARNED_PATTERNS_KEY);
          if (stored) {
            const data = JSON.parse(stored);
            this.patterns = new Map(Object.entries(data));
          }
        } catch (e) {
          console.warn('학습 패턴 로드 실패:', e);
        }
      }
      
      saveToStorage() {
        try {
          const data = Object.fromEntries(this.patterns);
          localStorage.setItem(LEARNED_PATTERNS_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn('학습 패턴 저장 실패:', e);
        }
      }
      
      learn(input, output) {
        const key = input.toLowerCase().trim();
        if (key && key !== output.toLowerCase().trim()) {
          this.patterns.set(key, output);
          this.saveToStorage();
          console.log('새 패턴 학습:', key, '→', output);
        }
      }
      
      apply(text, direction) {
        let result = text;
        
        for (const [pattern, translation] of this.patterns) {
          if (direction === 'toStandard') {
            // 패턴을 정규식으로 변환 (단어 경계 고려)
            const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            result = result.replace(regex, translation);
          } else {
            // 역방향도 지원
            const regex = new RegExp(`\\b${translation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
            result = result.replace(regex, pattern);
          }
        }
        
        return result;
      }
      
      getPatternCount() {
        return this.patterns.size;
      }
      
      clearPatterns() {
        this.patterns.clear();
        this.saveToStorage();
      }
    }
    
    const learner = new PatternLearner();

    // ASAP 관련 스마트 변환 함수
    function smartTranslateASAP(text, direction) {
      if (direction === 'toPangyo') {
        return text
          .replace(/\b빨리\b/g, 'ASAP')
          .replace(/\b빠르게\b/g, 'ASAP')
          .replace(/\b조속히\b/g, 'ASAP')
          .replace(/\b급하게\b/g, 'ASAP')
          .replace(/\b서둘러서\b/g, 'ASAP');
      } else {
        return text
          // 구체적인 패턴들을 먼저 처리
          .replace(/\b(아삽|아쌉|ASAP)하게\b/g, '빨리')
          .replace(/\b(아삽|아쌉|ASAP)로\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)이\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)을\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)가\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)에\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)에서\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)에게\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)와\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)과\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)는\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)은\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)도\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)만\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)부터\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)까지\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)처럼\b/g, '빠르게')
          .replace(/\b(아삽|아쌉|ASAP)같이\b/g, '빠르게')
          // 기본 ASAP 처리
          .replace(/\b(아삽|아쌉|ASAP)\b/g, '빠르게');
      }
    }
  
    const phrasePairs = [
      ['공유 부탁드립니다', '쉐어 부탁드립니다'],
      ['공유 부탁드려요', '쉐어 부탁드려요'],
      ['공유드립니다', '쉐어드립니다'],
      ['확인 부탁드립니다', '체크 부탁드립니다'],
      ['확인 부탁드려요', '체크 부탁드려요'],
      ['확인했습니다', '컨펌했습니다'],
      ['검토 부탁드립니다', '리뷰 부탁드립니다'],
      ['검토 부탁드려요', '리뷰 부탁드려요'],
      ['회의실', '미팅룸'],
      ['자료 요청드립니다', '레퍼런스 리퀘스트 드립니다'],
      ['일정 공유드립니다', '스케줄 쉐어드립니다'],
      ['시작 회의', '킥오프 미팅'],
      ['마무리 회의', '랩업 미팅']
    ];
  
    const wordPairs = [
      ['회의', '미팅'],
      ['회의록', '미팅 노트'],
      ['점심', '런치'],
      ['저녁', '디너'],
      ['일정', '스케줄'],
      ['안건', '아젠다'],
      ['문제', '이슈'],
      ['해결', '리졸브'],
      ['검토', '리뷰'],
      ['수정', '픽스'],
      ['적용', '어플라이'],
      ['진행', '프로세스'],
      ['시작', '킥오프'],
      ['자료', '레퍼런스'],
      ['지표', '메트릭'],
      ['목표', '타깃'],
      ['담당자', '오너'],
      ['책임', '오너십'],
      ['협의', '싱크'],
      ['도와주세요', '서포트 부탁드립니다'],
      ['중요', '크리티컬'],
      ['결과', '아웃풋'],
      ['성과', '임팩트'],
      ['발전', '디벨롭']
    ];
  
    const pangyoVibeExtras = [
      { name: 'polite-boost', apply: (t) => t.replace(/(부탁(?:드려요|드립니다|합니다)?)([.!?]?)/g, '$1 🙏$2') },
      { name: 'asap', apply: (t) => t.replace(/\b(빠르게|빨리|조속히)\b/g, 'ASAP로') },
      { name: 'context', apply: (t) => t.replace(/\b(정리|정돈)\b/g, '랩업') }
    ];
  
    function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function boundaryRegex(phrase) {
      return new RegExp(`(?<![0-9A-Za-z가-힣])${escapeRegExp(phrase)}(?![0-9A-Za-z가-힣])`, 'g');
    }
  
    function buildMaps() {
      const toPangyo = [], toStandard = [];
      const add = (a, b) => { toPangyo.push([a, b]); toStandard.push([b, a]); };
      [...phrasePairs, ...wordPairs].sort((p, q) => q[0].length - p[0].length).forEach(([a, b]) => add(a, b));
      return { toPangyo, toStandard };
    }
    const maps = buildMaps();
  
    function applyPairs(text, pairs) {
      let result = text;
      for (const [from, to] of pairs) result = result.replace(boundaryRegex(from), to);
      return result;
    }
    function applyVibe(text) { return pangyoVibeExtras.reduce((t, ex) => ex.apply(t), text); }
  
    function translate(text, direction, vibe) {
      const pairs = direction === 'toPangyo' ? maps.toPangyo : maps.toStandard;
      let out = applyPairs(text, pairs);
      
      // ASAP 스마트 변환 적용 (기본 번역보다 우선)
      out = smartTranslateASAP(out, direction);
      
      // 학습된 패턴 적용
      out = learner.apply(out, direction);
      
      if (direction === 'toPangyo' && vibe) out = applyVibe(out);
      return out;
    }
  
    function setOutput(v) { outputText.value = v; outputCount.textContent = `${v.length}자`; }
    function setInput(v) { inputText.value = v; inputCount.textContent = `${v.length}자`; }
    
    async function maybeLogInput(text) {
      const t = (text || '').trim();
      if (!t) return;
      const now = Date.now();
      if (t === lastLogText && now - lastLogAt < 60000) return;
      lastLogText = t;
      lastLogAt = now;
      try {
        await fetch(`${API_BASE}/api/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'input', text: t })
        });
      } catch {}
    }
  
    function persist() {
      const state = {
        direction: directionSelect.value,
        vibe: vibeToggle.checked,
        llm: llmToggle ? llmToggle.checked : false,
        input: inputText.value
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }
  
    function restore() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.direction) directionSelect.value = s.direction;
        if (typeof s.vibe === 'boolean') vibeToggle.checked = s.vibe;
        if (llmToggle && typeof s.llm === 'boolean') llmToggle.checked = s.llm;
        if (s.input) setInput(s.input);
      } catch {}
    }
  
    async function doTranslate() {
      const text = inputText.value || '';
      const dir = directionSelect.value;
      const vibe = vibeToggle.checked;
  
      if (llmToggle && llmToggle.checked) {
        setOutput('번역 중...');
        try {
          const res = await fetch(`${API_BASE}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, direction: dir, vibe })
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          setOutput(data.text || '');
        } catch {
          setOutput('[LLM 오류] 로컬 규칙 기반으로 대체합니다.');
          setOutput(translate(text, dir, vibe));
        }
      } else {
        setOutput(translate(text, dir, vibe));
      }
      persist();
      maybeLogInput(text);
    }
  
    function swapSides() {
      const currentDir = directionSelect.value;
      directionSelect.value = currentDir === 'toPangyo' ? 'toStandard' : 'toPangyo';
      const tmp = inputText.value;
      setInput(outputText.value);
      setOutput(tmp);
      persist();
    }
  
    function makeChip(text) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.textContent = text;
      chip.addEventListener('click', () => { setInput(text); doTranslate(); });
      return chip;
    }
  
    function renderExamples() {
      const sampleSentences = [
        '오늘 회의에서 결정된 내용 공유 부탁드립니다.',
        '해당 안건은 내일 아침에 빠르게 검토 부탁드려요.',
        '새 기능 적용 일정 공유드립니다.',
        '문제 원인 정리해서 오후에 공유드립니다.',
        '초기 시작 회의 잡고 아젠다 정리하겠습니다.'
      ];
      examples.innerHTML = '';
      for (const s of sampleSentences) examples.appendChild(makeChip(s));
    }
  
    // 학습 기능 추가
    function learnFromUser() {
      const input = inputText.value.trim();
      const output = outputText.value.trim();
      
      if (input && output && input !== output) {
        learner.learn(input, output);
        console.log(`학습 완료: "${input}" → "${output}"`);
        console.log(`현재 학습된 패턴 수: ${learner.getPatternCount()}`);
      }
    }
    
    // 학습 버튼 추가 (개발자 도구에서 사용)
    window.learnPattern = learnFromUser;
    window.clearLearnedPatterns = () => {
      learner.clearPatterns();
      console.log('학습된 패턴이 모두 삭제되었습니다.');
    };
    window.getLearnedPatterns = () => {
      console.log('학습된 패턴들:', Object.fromEntries(learner.patterns));
      return Object.fromEntries(learner.patterns);
    };
  
    inputText.addEventListener('input', () => { inputCount.textContent = `${inputText.value.length}자`; persist(); });
    directionSelect.addEventListener('change', doTranslate);
    vibeToggle.addEventListener('change', doTranslate);
    if (llmToggle) llmToggle.addEventListener('change', () => { doTranslate(); persist(); });
    translateBtn.addEventListener('click', doTranslate);
    clearBtn.addEventListener('click', () => { setInput(''); setOutput(''); persist(); });
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(outputText.value || ''); copyBtn.textContent = '복사됨!'; setTimeout(() => (copyBtn.textContent = '복사'), 1200); }
      catch { copyBtn.textContent = '복사 실패'; setTimeout(() => (copyBtn.textContent = '복사'), 1200); }
    });
    swapBtn.addEventListener('click', swapSides);
  
    restore();
    renderExamples();
    doTranslate();
    
    // 초기화 시 학습된 패턴 수 표시
    console.log(`학습된 패턴 ${learner.getPatternCount()}개 로드됨`);
  })();