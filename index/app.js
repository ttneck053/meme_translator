(function () {
    const directionSelect = document.getElementById('directionSelect');
    const vibeToggle = document.getElementById('vibeToggle');
    const llmToggle = document.getElementById('llmToggle');
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
    // const API_BASE = 'http://localhost:8787'; // 정적 호스팅에서는 비활성화
    let lastLogText = '';
    let lastLogAt = 0;
    
    // ASAP 스마트 변환 함수 (한국어에 최적화)
    function smartTranslateASAP(text, direction) {
      if (direction === 'toPangyo') {
        return text
          .replace(/빨리/g, 'ASAP')
          .replace(/빠르게/g, 'ASAP')
          .replace(/조속히/g, 'ASAP')
          .replace(/급하게/g, 'ASAP')
          .replace(/서둘러서/g, 'ASAP');
      } else {
        return text
          // 구체적인 패턴들을 먼저 처리 (한국어 단어 경계 고려)
          .replace(/ASAP하게/g, '빨리')
          .replace(/아삽하게/g, '빨리')
          .replace(/아쌉하게/g, '빨리')
          .replace(/ASAP로/g, '빠르게')
          .replace(/아삽로/g, '빠르게')
          .replace(/아쌉로/g, '빠르게')
          .replace(/ASAP이/g, '빠르게')
          .replace(/아삽이/g, '빠르게')
          .replace(/아쌉이/g, '빠르게')
          .replace(/ASAP을/g, '빠르게')
          .replace(/아삽을/g, '빠르게')
          .replace(/아쌉을/g, '빠르게')
          .replace(/ASAP가/g, '빠르게')
          .replace(/아삽가/g, '빠르게')
          .replace(/아쌉가/g, '빠르게')
          .replace(/ASAP에/g, '빠르게')
          .replace(/아삽에/g, '빠르게')
          .replace(/아쌉에/g, '빠르게')
          .replace(/ASAP에서/g, '빠르게')
          .replace(/아삽에서/g, '빠르게')
          .replace(/아쌉에서/g, '빠르게')
          .replace(/ASAP에게/g, '빠르게')
          .replace(/아삽에게/g, '빠르게')
          .replace(/아쌉에게/g, '빠르게')
          .replace(/ASAP와/g, '빠르게')
          .replace(/아삽와/g, '빠르게')
          .replace(/아쌉와/g, '빠르게')
          .replace(/ASAP과/g, '빠르게')
          .replace(/아삽과/g, '빠르게')
          .replace(/아쌉과/g, '빠르게')
          .replace(/ASAP는/g, '빠르게')
          .replace(/아삽는/g, '빠르게')
          .replace(/아쌉는/g, '빠르게')
          .replace(/ASAP은/g, '빠르게')
          .replace(/아삽은/g, '빠르게')
          .replace(/아쌉은/g, '빠르게')
          .replace(/ASAP도/g, '빠르게')
          .replace(/아삽도/g, '빠르게')
          .replace(/아쌉도/g, '빠르게')
          .replace(/ASAP만/g, '빠르게')
          .replace(/아삽만/g, '빠르게')
          .replace(/아쌉만/g, '빠르게')
          .replace(/ASAP부터/g, '빠르게')
          .replace(/아삽부터/g, '빠르게')
          .replace(/아쌉부터/g, '빠르게')
          .replace(/ASAP까지/g, '빠르게')
          .replace(/아삽까지/g, '빠르게')
          .replace(/아쌉까지/g, '빠르게')
          .replace(/ASAP처럼/g, '빠르게')
          .replace(/아삽처럼/g, '빠르게')
          .replace(/아쌉처럼/g, '빠르게')
          .replace(/ASAP같이/g, '빠르게')
          .replace(/아삽같이/g, '빠르게')
          .replace(/아쌉같이/g, '빠르게')
          // 기본 ASAP 처리 (마지막에)
          .replace(/ASAP/g, '빠르게')
          .replace(/아삽/g, '빠르게')
          .replace(/아쌉/g, '빠르게');
      }
    }
    
    // 개념 단위(Concept) 기반 번역 시스템
    const concepts = {
      // 보안 관련 개념
      SECURITY: {
        pangyo: ['세커티', '시큐리티', '보안'],
        standard: ['보안', '안전', '보호'],
        patterns: {
          toPangyo: [
            { from: /\b보안\b/g, to: '세커티' },
            { from: /\b시큐리티\b/g, to: '세커티' }
          ],
          toStandard: [
            { from: /\b세커티\b/g, to: '보안' },
            { from: /\b시큐리티\b/g, to: '보안' }
          ]
        }
      },
      
      // 마감일 관련 개념
      DEADLINE: {
        pangyo: ['듀데잇', '데드라인', '마감일'],
        standard: ['마감일', '기한', '데드라인', '마감'],
        patterns: {
          toPangyo: [
            { from: /\b마감일\b/g, to: '듀데잇' },
            { from: /\b데드라인\b/g, to: '듀데잇' }
          ],
          toStandard: [
            { from: /\b듀데잇\b/g, to: '마감일' },
            { from: /\b데드라인\b/g, to: '마감일' }
          ]
        }
      },
      
      // 회의 관련 개념
      MEETING: {
        pangyo: ['미팅', '회의'],
        standard: ['회의', '미팅'],
        patterns: {
          toPangyo: [
            { from: /\b회의\b/g, to: '미팅' }
          ],
          toStandard: [
            { from: /\b미팅\b/g, to: '회의' }
          ]
        }
      },
      
      // 문제/이슈 관련 개념
      ISSUE: {
        pangyo: ['이슈', '문제'],
        standard: ['문제', '이슈', '사안'],
        patterns: {
          toPangyo: [
            { from: /\b문제\b/g, to: '이슈' }
          ],
          toStandard: [
            { from: /\b이슈\b/g, to: '문제' }
          ]
        }
      },
      
      // 확인 관련 개념
      CONFIRM: {
        pangyo: ['컨펌', '확인'],
        standard: ['확인', '컨펌', '체크'],
        patterns: {
          toPangyo: [
            { from: /\b확인\b/g, to: '컨펌' }
          ],
          toStandard: [
            { from: /\b컨펌\b/g, to: '확인' }
          ]
        }
      },
      
      // 공유 관련 개념
      SHARE: {
        pangyo: ['쉐어', '공유'],
        standard: ['공유', '쉐어'],
        patterns: {
          toPangyo: [
            { from: /\b공유\b/g, to: '쉐어' }
          ],
          toStandard: [
            { from: /\b쉐어\b/g, to: '공유' }
          ]
        }
      },
      
      // 검토 관련 개념
      REVIEW: {
        pangyo: ['리뷰', '검토'],
        standard: ['검토', '리뷰', '검토'],
        patterns: {
          toPangyo: [
            { from: /\b검토\b/g, to: '리뷰' }
          ],
          toStandard: [
            { from: /\b리뷰\b/g, to: '검토' }
          ]
        }
      },
      
      // 일정 관련 개념
      SCHEDULE: {
        pangyo: ['스케줄', '일정'],
        standard: ['일정', '스케줄', '계획'],
        patterns: {
          toPangyo: [
            { from: /\b일정\b/g, to: '스케줄' }
          ],
          toStandard: [
            { from: /\b스케줄\b/g, to: '일정' }
          ]
        }
      },
      
      // 자료 관련 개념
      REFERENCE: {
        pangyo: ['레퍼런스', '자료'],
        standard: ['자료', '레퍼런스', '참고자료'],
        patterns: {
          toPangyo: [
            { from: /\b자료\b/g, to: '레퍼런스' }
          ],
          toStandard: [
            { from: /\b레퍼런스\b/g, to: '자료' }
          ]
        }
      },
      
      // 시작 관련 개념
      KICKOFF: {
        pangyo: ['킥오프', '시작'],
        standard: ['시작', '킥오프', '개시'],
        patterns: {
          toPangyo: [
            { from: /\b시작\b/g, to: '킥오프' }
          ],
          toStandard: [
            { from: /\b킥오프\b/g, to: '시작' }
          ]
        }
      },
      
      // 정리 관련 개념
      WRAPUP: {
        pangyo: ['랩업', '정리'],
        standard: ['정리', '랩업', '마무리'],
        patterns: {
          toPangyo: [
            { from: /\b정리\b/g, to: '랩업' }
          ],
          toStandard: [
            { from: /\b랩업\b/g, to: '정리' }
          ]
        }
      },
      
      // 부탁 관련 개념
      REQUEST: {
        pangyo: ['리퀘스트', '부탁'],
        standard: ['부탁', '리퀘스트', '요청'],
        patterns: {
          toPangyo: [
            { from: /(\w+)\s*부탁드립니다/g, to: '$1 리퀘스트 드립니다' },
            { from: /(\w+)\s*부탁드려요/g, to: '$1 리퀘스트 드려요' }
          ],
          toStandard: [
            { from: /(\w+)\s*리퀘스트\s*드립니다/g, to: '$1 부탁드립니다' },
            { from: /(\w+)\s*리퀘스트\s*드려요/g, to: '$1 부탁드려요' }
          ]
        }
      }
    };

    // 개념 기반 번역 함수
    function translateByConcept(text, direction) {
      let result = text;
      
      // 각 개념별로 패턴 적용
      Object.values(concepts).forEach(concept => {
        const patterns = direction === 'toPangyo' ? concept.patterns.toPangyo : concept.patterns.toStandard;
        
        patterns.forEach(pattern => {
          result = result.replace(pattern.from, pattern.to);
        });
      });
      
      return result;
    }

    // 바이브 추가 함수
    function applyVibe(text) {
      return text
        .replace(/(부탁(?:드려요|드립니다|합니다)?)([.!?]?)/g, '$1 🙏$2')
        .replace(/\b(빠르게|빨리|조속히)\b/g, 'ASAP로')
        .replace(/\b(정리|정돈)\b/g, '랩업');
    }

    // 메인 번역 함수
    function translate(text, direction, vibe) {
      let result = text;
      
      if (direction === 'toPangyo') {
        // 1. ASAP 스마트 변환 적용
        result = smartTranslateASAP(result, 'toPangyo');
        // 2. 개념 기반 번역
        result = translateByConcept(result, 'toPangyo');
        // 3. 바이브 추가
        if (vibe) result = applyVibe(result);
      } else {
        // 1. ASAP 스마트 변환 적용 (우선순위 높음)
        result = smartTranslateASAP(result, 'toStandard');
        // 2. 개념 기반 번역 (역방향)
        result = translateByConcept(result, 'toStandard');
      }
      
      return result;
    }

    function setOutput(v) { outputText.value = v; outputCount.textContent = `${v.length}자`; }
    function setInput(v) { inputText.value = v; inputCount.textContent = `${v.length}자`; }
    
    async function maybeLogInput(text) {
      // 정적 호스팅에서는 로깅 비활성화
      return;
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

      // 정적 호스팅에서는 항상 로컬 규칙 기반 번역 사용
      setOutput(translate(text, dir, vibe));
      persist();
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
        '이거 내일까지 ASAP하게 끝내주세요.',
        '세커티 쪽 이슈 있나요? 듀데잇은 내일로 잡을게요.',
        '오늘 미팅에서 결정된 내용 쉐어 부탁드립니다.',
        '해당 안건은 내일 아침에 빠르게 리뷰 부탁드려요.',
        '새 기능 적용 스케줄 쉐어드립니다.',
        '문제 원인 랩업해서 오후에 쉐어드립니다.',
        '초기 킥오프 미팅 잡고 아젠다 랩업하겠습니다.'
      ];
      examples.innerHTML = '';
      for (const s of sampleSentences) examples.appendChild(makeChip(s));
    }

    inputText.addEventListener('input', () => { inputCount.textContent = `${inputText.value.length}자`; persist(); });
    directionSelect.addEventListener('change', doTranslate);
    vibeToggle.addEventListener('change', doTranslate);
    if (llmToggle) llmToggle.addEventListener('change', () => { doTranslate(); persist(); });
    translateBtn.addEventListener('click', () => { 
      const text = inputText.value || '';
      doTranslate(); 
      maybeLogInput(text);
    });
    clearBtn.addEventListener('click', () => { setInput(''); setOutput(''); persist(); });
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(outputText.value || ''); copyBtn.textContent = '복사됨!'; setTimeout(() => (copyBtn.textContent = '복사'), 1200); }
      catch { copyBtn.textContent = '복사 실패'; setTimeout(() => (copyBtn.textContent = '복사'), 1200); }
    });
    swapBtn.addEventListener('click', swapSides);

    restore();
    renderExamples();
    doTranslate();
})();