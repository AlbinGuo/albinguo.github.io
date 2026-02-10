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
            // 从localStorage读取
            const stored = localStorage.getItem('lastResult');
            if (stored) {
                this.data = JSON.parse(stored);
                console.log('数据加载成功:', this.data ? '有数据' : '无数据');
            } else {
                console.log('localStorage中没有数据');
            }
        } catch (e) {
            console.error('数据加载失败:', e);
            this.data = null;
        }
    },
    
    showEmpty() {
        document.querySelector('.result-main').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                <h2 style="margin-bottom: 0.5rem;">暂无批改结果</h2>
                <p style="color: var(--gray-500); margin-bottom: 1.5rem;">请先提交作文进行批改</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="index.html" class="btn-primary" style="display: inline-block;">去批改</a>
                    <button onclick="ResultPage.loadDemo()" class="btn-secondary" style="display: inline-block;">查看示例</button>
                </div>
                <p style="font-size: 0.8rem; color: var(--gray-400); margin-top: 1rem;" id="debugInfo"></p>
            </div>
        `;
        // 显示调试信息
        const stored = localStorage.getItem('lastResult');
        document.getElementById('debugInfo').textContent = stored ? 'localStorage中有数据' : 'localStorage中无数据';
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
        const { scores, stats, errors, comments, suggestions, originalText, annotatedText } = this.data;
        
        // 总分
        this.animateScore('scoreValue', scores.overall, (value, el) => {
            el.textContent = value;
        });
        
        // 等级
        const level = document.getElementById('scoreLevel');
        const circle = document.getElementById('scoreCircle');
        
        if (scores.overall >= 85) {
            level.textContent = '优秀';
            circle.className = 'score-circle excellent';
        } else if (scores.overall >= 70) {
            level.textContent = '良好';
            circle.className = 'score-circle good';
        } else if (scores.overall >= 60) {
            level.textContent = '合格';
            circle.className = 'score-circle average';
        } else {
            level.textContent = '待提高';
            circle.className = 'score-circle poor';
        }
        
        document.getElementById('overallComment').textContent = comments.overall;
        
        // 统计
        document.getElementById('charCount').textContent = stats.chars;
        document.getElementById('paraCount').textContent = stats.paragraphs;
        document.getElementById('errorCount').textContent = errors.length;
        
        // 分项评分
        this.animateScore('contentScore', scores.content, (v, el) => el.textContent = v);
        this.animateScore('structureScore', scores.structure, (v, el) => el.textContent = v);
        this.animateScore('languageScore', scores.language, (v, el) => el.textContent = v);
        this.animateScore('styleScore', scores.style, (v, el) => el.textContent = v);
        
        // 进度条
        this.setBarWidth('contentBar', scores.content);
        this.setBarWidth('structureBar', scores.structure);
        this.setBarWidth('languageBar', scores.language);
        this.setBarWidth('styleBar', scores.style);
        
        // 原文
        const essayEl = document.getElementById('essayContent');
        if (annotatedText && annotatedText !== originalText && errors.length > 0) {
            essayEl.innerHTML = annotatedText;
        } else {
            essayEl.innerHTML = `<p>${originalText.replace(/\n/g, '<br>')}</p>`;
        }
        
        // 建议
        const sugEl = document.getElementById('suggestionsList');
        if (suggestions.length > 0) {
            sugEl.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
        } else {
            sugEl.innerHTML = '<li class="placeholder">暂无建议</li>';
        }
        
        // 评语
        const comEl = document.getElementById('commentsBox');
        comEl.innerHTML = `
            <p><strong>内容：</strong>${comments.content}</p>
            <p><strong>结构：</strong>${comments.structure}</p>
            <p><strong>语言：</strong>${comments.language}</p>
            <p><strong>文采：</strong>${comments.style}</p>
        `;
        
        // 错误详情
        const errorCard = document.getElementById('errorCard');
        const errorList = document.getElementById('errorList');
        
        if (errors.length > 0) {
            errorCard.hidden = false;
            errorList.innerHTML = errors.map(e => `
                <li>
                    <div class="error-type">${e.type}</div>
                    <div class="error-text">"${e.text}"</div>
                    <div class="error-suggestion">💡 ${e.suggestion}</div>
                </li>
            `).join('');
        } else {
            errorCard.hidden = true;
        }
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
        
        const { scores, stats, comments, suggestions, errors, originalText, type, timestamp } = this.data;
        
        const typeNames = {
            narrative: '记叙文',
            argumentative: '议论文',
            expository: '说明文',
            other: '其他'
        };
        
        let content = `═══════════════════════════════
      智能作文批改结果
═══════════════════════════════

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
