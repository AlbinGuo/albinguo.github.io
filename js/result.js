// 批改结果页面逻辑

document.addEventListener('DOMContentLoaded', function() {
    ResultPage.init();
});

const ResultPage = {
    data: null,
    
    init() {
        this.loadData();
        
        if (!this.data) {
            this.showEmpty();
            return;
        }
        
        this.render();
        this.bindEvents();
    },
    
    loadData() {
        try {
            // 从URL参数获取ID
            const urlParams = new URLSearchParams(window.location.search);
            const id = parseInt(urlParams.get('id'));
            console.log('URL参数ID:', id);
            
            if (id) {
                // 从历史记录中查找
                const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
                console.log('历史记录数量:', history.length);
                this.data = history.find(item => item.id === id);
                console.log('找到的数据:', this.data ? '有数据' : '无数据');
                if (this.data) {
                    console.log('数据内容:', this.data.originalText ? '有原文' : '无原文');
                }
            } else {
                // 从lastResult读取
                const stored = localStorage.getItem('lastResult');
                console.log('lastResult数据:', stored ? '有数据' : '无数据');
                if (stored) {
                    this.data = JSON.parse(stored);
                }
            }
        } catch (e) {
            console.error('数据加载失败:', e);
            this.data = null;
        }
    },
    
    showEmpty() {
        const essayEl = document.getElementById('essayContent');
        const titleEl = document.getElementById('essayTitleDisplay');
        const authorEl = document.getElementById('essayAuthor');
        const dateEl = document.getElementById('essayDate');

        if (titleEl) titleEl.textContent = '暂无数据';
        if (authorEl) authorEl.parentElement.style.display = 'none';
        if (dateEl) dateEl.parentElement.style.display = 'none';

        if (essayEl) {
            essayEl.innerHTML = `
                <div class="empty-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p>请从历史记录中选择一条批改结果查看</p>
                </div>
            `;
        }
    },
    
    loadDemo() {
        const sampleResult = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            originalText: '这是一篇示例作文。点击"开始批改"按钮提交您的作文后，这里将显示批改结果。',
            annotatedText: '这是一篇示例作文。点击"开始批改"按钮提交您的作文后，这里将显示批改结果。',
            type: 'narrative',
            stats: { chars: 42, sentences: 2, paragraphs: 1, avgSentenceLength: 21 },
            scores: { content: 75, structure: 70, language: 72, style: 68, overall: 72 },
            comments: {
                content: '内容较为完整',
                structure: '结构较为清晰',
                language: '语言通顺',
                style: '有一定文采',
                overall: '这是一篇较好的作文'
            },
            suggestions: ['建议增加更多内容细节', '可以增加一些修辞手法'],
            errors: [],
            structure: { paragraphCount: 1, transitionCount: 0, hasOpening: false, hasConclusion: false }
        };
        
        localStorage.setItem('lastResult', JSON.stringify(sampleResult));
        location.reload();
    },
    
    render() {
        console.log('=== 开始渲染 ===');
        console.log('this.data:', this.data);
        
        if (!this.data) {
            console.log('数据为空，显示空状态');
            this.showEmpty();
            return;
        }
        
        console.log('数据存在，继续渲染');
        console.log('originalText:', this.data.originalText);
        console.log('title:', this.data.title);
        console.log('author:', this.data.author);
        console.log('sideComments:', this.data.sideComments);

        const { scores, stats, comments, suggestions, originalText, title, author, sideComments } = this.data;
        const errors = this.data.errors || [];

        // 显示标题和作者
        const titleEl = document.getElementById('essayTitleDisplay');
        const authorEl = document.getElementById('essayAuthor');
        const dateEl = document.getElementById('essayDate');

        if (titleEl) titleEl.textContent = title || '未命名';
        if (dateEl) dateEl.textContent = new Date(this.data.timestamp).toLocaleDateString();

        if (authorEl && author) {
            authorEl.textContent = author;
            authorEl.parentElement.style.display = 'flex';
        } else if (authorEl) {
            authorEl.parentElement.style.display = 'none';
        }
        if (dateEl) dateEl.parentElement.style.display = 'flex';

        // 总分圆环
        const scoreValueEl = document.getElementById('scoreValue');
        const scoreRing = document.getElementById('scoreRing');
        const scoreRingProgress = document.getElementById('scoreRingProgress');

        if (scoreValueEl) {
            scoreValueEl.textContent = scores.overall;
        }

        // 计算圆环进度 (327是圆周长)
        const circumference = 327;
        const offset = circumference - (scores.overall / 100 * circumference);

        if (scoreRingProgress) {
            scoreRingProgress.style.strokeDashoffset = offset;
        }

        const level = document.getElementById('scoreLevel');

        if (scoreRing) {
            scoreRing.classList.remove('excellent', 'good', 'average', 'poor');
            if (scores.overall >= 85) {
                if (level) level.textContent = '优秀';
                scoreRing.classList.add('excellent');
            } else if (scores.overall >= 70) {
                if (level) level.textContent = '良好';
                scoreRing.classList.add('good');
            } else if (scores.overall >= 60) {
                if (level) level.textContent = '合格';
                scoreRing.classList.add('average');
            } else {
                if (level) level.textContent = '待提高';
                scoreRing.classList.add('poor');
            }
        }

        const overallComment = document.getElementById('overallComment');
        if (overallComment) overallComment.textContent = comments.overall || '暂无评语';
        
        // 分项评分
        const contentScoreEl = document.getElementById('contentScore');
        const structureScoreEl = document.getElementById('structureScore');
        const languageScoreEl = document.getElementById('languageScore');
        const styleScoreEl = document.getElementById('styleScore');

        if (contentScoreEl) contentScoreEl.textContent = scores.content;
        if (structureScoreEl) structureScoreEl.textContent = scores.structure;
        if (languageScoreEl) languageScoreEl.textContent = scores.language;
        if (styleScoreEl) styleScoreEl.textContent = scores.style;

        // 进度条
        const contentBar = document.getElementById('contentBar');
        const structureBar = document.getElementById('structureBar');
        const languageBar = document.getElementById('languageBar');
        const styleBar = document.getElementById('styleBar');

        if (contentBar) contentBar.style.setProperty('--progress', scores.content + '%');
        if (structureBar) structureBar.style.setProperty('--progress', scores.structure + '%');
        if (languageBar) languageBar.style.setProperty('--progress', scores.language + '%');
        if (styleBar) styleBar.style.setProperty('--progress', scores.style + '%');

        // 统计
        const charCount = document.getElementById('charCount');
        const paraCount = document.getElementById('paraCount');
        const errorCount = document.getElementById('errorCount');

        if (charCount) charCount.textContent = stats.chars;
        if (paraCount) paraCount.textContent = stats.paragraphs;
        if (errorCount) errorCount.textContent = errors.length;

        // 批注数量
        const annotationCount = document.getElementById('annotationCount');
        if (annotationCount) {
            const count = sideComments ? sideComments.length : 0;
            annotationCount.textContent = count;
        }
        
        // 原文和批注
        const essayEl = document.getElementById('essayContent');
        console.log('essayEl:', essayEl);
        
        if (essayEl && originalText) {
            console.log('开始渲染原文');
            let essayHTML = '';
            const chars = originalText.split('');
            
            // 创建字符到批注的映射
            const annotationMap = {};
            if (sideComments && sideComments.length > 0) {
                sideComments.forEach(annotation => {
                    if (annotation.startIndex !== null) {
                        const endIndex = annotation.endIndex !== null ? annotation.endIndex : annotation.startIndex;
                        for (let i = annotation.startIndex; i <= endIndex; i++) {
                            annotationMap[i] = annotation;
                        }
                    }
                });
            }
            
            // 构建原文HTML
            chars.forEach((char, index) => {
                const annotation = annotationMap[index];
                if (annotation) {
                    // 只在范围的第一个字符上显示标注号
                    const isFirstInRange = annotation.startIndex === index;
                    const badgeHTML = isFirstInRange ? `<span class="annotation-badge">${annotation.number}</span>` : '';
                    essayHTML += `<span class="char-with-annotation ${annotation.color || 'red'}" title="${annotation.comment}">${char}${badgeHTML}</span>`;
                } else {
                    essayHTML += `<span class="char">${char}</span>`;
                }
            });
            
            essayEl.innerHTML = essayHTML;
            console.log('原文渲染完成');
        } else if (essayEl) {
            essayEl.innerHTML = '<p class="placeholder">暂无内容</p>';
        }
        
        // 批注列表
        const sugEl = document.getElementById('suggestionsList');
        if (sugEl) {
            if (sideComments && sideComments.length > 0) {
                sugEl.innerHTML = sideComments.map(item => `
                    <li class="annotation-item ${item.color || 'red'}">
                        <div class="annotation-header">
                            <span class="annotation-number">${item.number}</span>
                            <span class="annotation-label">${item.color === 'yellow' ? '建议' : item.color === 'green' ? '表扬' : '纠错'}</span>
                            ${item.startIndex !== null ? `<span class="annotation-position">第 ${item.startIndex + 1} 字</span>` : ''}
                        </div>
                        <div class="annotation-content">${item.comment}</div>
                    </li>
                `).join('');
            } else if (suggestions && suggestions.length > 0) {
                sugEl.innerHTML = suggestions.map((s, i) => `
                    <li class="annotation-item red">
                        <div class="annotation-header">
                            <span class="annotation-number">${i + 1}</span>
                            <span class="annotation-label">建议</span>
                        </div>
                        <div class="annotation-content">${s}</div>
                    </li>
                `).join('');
            } else {
                sugEl.innerHTML = `
                    <li class="empty-state">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                            <line x1="9" y1="9" x2="9.01" y2="9"></line>
                            <line x1="15" y1="9" x2="15.01" y2="9"></line>
                        </svg>
                        <p>暂无批注</p>
                    </li>
                `;
            }
        }

        console.log('渲染完成');
    },
    
    animateScore(id, target, callback) {
        const el = document.getElementById(id);
        let current = 0;
        const step = target / 30;
        
        const animate = () => {
            current += step;
            if (current >= target) {
                current = target;
                callback(current, el);
                return;
            }
            callback(Math.round(current), el);
            requestAnimationFrame(animate);
        };
        
        setTimeout(animate, 100);
    },
    
    setBarWidth(id, value) {
        const bar = document.getElementById(id);
        bar.style.setProperty('--width', value + '%');
    },
    
    bindEvents() {
        document.getElementById('newGradingBtn').onclick = () => {
            window.location.href = 'index.html';
        };
        
        document.getElementById('downloadBtn').onclick = () => {
            this.download();
        };
        
        document.getElementById('saveBtn').onclick = () => {
            this.save();
        };
    },
    
    download() {
        if (!this.data) return;
        
        const { scores, stats, comments, suggestions, errors, originalText, type, timestamp, title, author } = this.data;
        
        const typeNames = {
            narrative: '记叙文',
            argumentative: '议论文',
            expository: '说明文',
            other: '其他'
        };
        
        let content = `═══════════════════════════════
      智能作文批改结果
══════════════════════════════

作文标题：${title || '未命名'}
${author ? `姓名：${author}` : ''}
批改时间：${new Date(timestamp).toLocaleString()}
作文类型：${typeNames[type] || '未知'}
总字数：${stats.chars} 字
段落数：${stats.paragraphs} 段

───────────────────────────────────────
【总体评分】${scores.overall} 分
───────────────────────────────────────
内容：${scores.content} 分
结构：${scores.structure} 分
语言：${scores.language} 分
文采：${scores.style} 分

───────────────────────────────────────
【评语】
───────────────────────────────────────
${comments.overall}

───────────────────────────────────────
【修改建议】
───────────────────────────────────────
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

───────────────────────────────────────
【原文】
───────────────────────────────────────
${originalText}

═══════════════════════════════`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `批改结果_${new Date().toLocaleDateString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('已下载', 'success');
    },
    
    save() {
        if (!this.data) return;
        
        const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
        const exists = history.some(r => r.id === this.data.id);
        
        if (exists) {
            this.showToast('已保存过', '');
            return;
        }
        
        history.unshift(this.data);
        if (history.length > 50) history.pop();
        localStorage.setItem('gradingHistory', JSON.stringify(history));
        
        this.showToast('已保存到历史记录', 'success');
    },
    
    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
};
