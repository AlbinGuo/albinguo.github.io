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
        // 只在原文区域显示空状态
        const essayEl = document.getElementById('essayContent');
        const headerInfo = document.getElementById('essayHeaderInfo');
        
        if (headerInfo) {
            headerInfo.innerHTML = '<div class="meta">暂无数据</div>';
        }
        if (essayEl) {
            essayEl.innerHTML = '<p class="placeholder">请从历史记录中选择一条批改结果查看</p>';
        }
        
        // 显示调试信息
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
        console.log('URL参数ID:', id);
        console.log('历史记录数量:', history.length);
        console.log('历史记录IDs:', history.map(h => h.id));
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
        const headerInfo = document.getElementById('essayHeaderInfo');
        if (headerInfo) {
            const date = new Date(this.data.timestamp).toLocaleDateString();
            headerInfo.innerHTML = `
                <div class="title">${title || '未命名'}</div>
                <div class="meta">
                    ${author ? `👤 ${author} · ` : ''}📅 ${date}
                </div>
            `;
        }
        
        // 总分
        const scoreValueEl = document.getElementById('scoreValue');
        if (scoreValueEl) {
            scoreValueEl.textContent = scores.overall;
        }
        
        // 等级
        const level = document.getElementById('scoreLevel');
        const circle = document.getElementById('scoreCircle');
        
        if (scores.overall >= 85) {
            if (level) level.textContent = '优秀';
            if (circle) circle.className = 'score-circle excellent';
        } else if (scores.overall >= 70) {
            if (level) level.textContent = '良好';
            if (circle) circle.className = 'score-circle good';
        } else if (scores.overall >= 60) {
            if (level) level.textContent = '合格';
            if (circle) circle.className = 'score-circle average';
        } else {
            if (level) level.textContent = '待提高';
            if (circle) circle.className = 'score-circle poor';
        }
        
        const overallComment = document.getElementById('overallComment');
        if (overallComment) overallComment.textContent = comments.overall;
        
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
        
        if (contentBar) contentBar.style.width = scores.content + '%';
        if (structureBar) structureBar.style.width = scores.structure + '%';
        if (languageBar) languageBar.style.width = scores.language + '%';
        if (styleBar) styleBar.style.width = scores.style + '%';
        
        // 统计
        const charCount = document.getElementById('charCount');
        const paraCount = document.getElementById('paraCount');
        const errorCount = document.getElementById('errorCount');
        
        if (charCount) charCount.textContent = stats.chars;
        if (paraCount) paraCount.textContent = stats.paragraphs;
        if (errorCount) errorCount.textContent = errors.length;
        
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
                    essayHTML += `<span class="char-with-annotation ${annotation.color || 'red'}" title="${annotation.comment}">${char}<span class="annotation-badge">${annotation.number}</span></span>`;
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
                    <li class="annotation-item annotation-${item.color || 'red'}">
                        <div class="annotation-header">
                            <span class="annotation-number">${item.number}</span>
                            <span class="annotation-label">${item.color === 'yellow' ? '建议' : item.color === 'green' ? '表扬' : '纠错'}</span>
                            ${item.startIndex !== null ? `<span class="annotation-position">第 ${item.startIndex + 1} 字</span>` : ''}
                        </div>
                        <div class="annotation-content">${item.comment}</div>
                    </li>
                `).join('');
            } else if (suggestions && suggestions.length > 0) {
                sugEl.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
            } else {
                sugEl.innerHTML = '<li class="placeholder">暂无批注</li>';
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
