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
    const API_BASE = 'http://localhost:8787';
    let lastLogText = '';
    let lastLogAt = 0;
    
    // 개념 단위(Concept) 기반 번역 시스템
    const concepts = {
      // 시간 관련 개념
      URGENCY: {
        pangyo: ['ASAP', '아삽', '아쌉', 'ASAP하게', '아삽하게', '아쌉하게'],
        standard: ['빠르게', '빨리', '조속히', '급하게', '서둘러서'],
        patterns: {
          toPangyo: [
            { from: /\b(빠르게|빨리|조속히|급하게|서둘러서)\b/g, to: 'ASAP' },
            { from: /\b(빠르게|빨리|조속히|급하게|서둘러서)\s*하게\b/g, to: 'ASAP하게' }
          ],
          toStandard: [
            { from: /\bASAP\b/g, to: '빠르게' },
            { from: /\b(아삽|아쌉)\b/g, to: '빠르게' },
            { from: /\b(아삽|아쌉|ASAP)하게\b/g, to: '빠르게' }
          ]
        }
      },
      
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
        // 1. 개념 기반 번역
        result = translateByConcept(result, 'toPangyo');
        // 2. 바이브 추가
        if (vibe) result = applyVibe(result);
      } else {
        // 1. 개념 기반 번역 (역방향)
        result = translateByConcept(result, 'toStandard');
      }
      
      return result;
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
          body: JSON.stringify({ text: t })
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