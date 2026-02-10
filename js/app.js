// 智能作文批改系统 - 主逻辑

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

const App = {
    data: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadHistory();
    },
    
    cacheElements() {
        this.elements = {
            // 页面
            gradingPage: document.getElementById('gradingPage'),
            historyPage: document.getElementById('historyPage'),
            helpPage: document.getElementById('helpPage'),
            
            // 作文输入
            essayInput: document.getElementById('essayInput'),
            essayTitle: document.getElementById('essayTitle'),
            charCount: document.getElementById('charCount'),
            gradeBtn: document.getElementById('gradeBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // 批改面板
            essayTitleDisplay: document.getElementById('essayTitleDisplay'),
            starRating: document.getElementById('starRating'),
            totalScore: document.getElementById('totalScore'),
            overallComment: document.getElementById('overallComment'),
            summaryList: document.getElementById('summaryList'),
            detailList: document.getElementById('detailList'),
            
            // 筛选标签
            filterTabs: document.querySelectorAll('.filter-tab'),
            
            // 历史
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    },
    
    bindEvents() {
        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchPage(link.dataset.page);
            });
        });
        
        // 字数统计
        this.elements.essayInput.addEventListener('input', () => {
            const count = this.elements.essayInput.value.length;
            this.elements.charCount.textContent = count + ' 字';
        });
        
        // 清空
        this.elements.clearBtn.addEventListener('click', () => {
            this.elements.essayInput.value = '';
            this.elements.essayTitle.value = '';
            this.elements.charCount.textContent = '0 字';
            this.resetGradingPanel();
        });
        
        // 开始批改
        this.elements.gradeBtn.addEventListener('click', () => this.startGrading());
        
        // 筛选标签
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterDetails(tab.dataset.filter);
            });
        });
        
        // 清空历史
        this.elements.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('确定清空所有历史记录？')) {
                localStorage.removeItem('gradingHistory');
                this.loadHistory();
                this.showToast('历史记录已清空');
            }
        });
    },
    
    switchPage(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        this.elements.gradingPage.classList.toggle('hidden', page !== 'edit');
        this.elements.historyPage.classList.toggle('hidden', page !== 'history');
        this.elements.helpPage.classList.toggle('hidden', page !== 'help');
        
        if (page === 'history') {
            this.loadHistory();
        }
    },
    
    startGrading() {
        const content = this.elements.essayInput.value.trim();
        const title = this.elements.essayTitle.value.trim() || '未命名';
        
        if (!content) {
            this.showToast('请输入作文内容');
            return;
        }
        
        if (content.length < 50) {
            this.showToast('作文内容太短，请输入更多内容');
            return;
        }
        
        // 执行批改
        const result = Grading.process(content, title);
        this.data = result;
        
        // 显示结果
        this.displayResult(result);
        
        // 保存到历史
        this.saveToHistory(result);
        
        this.showToast('批改完成');
    },
    
    displayResult(result) {
        // 标题
        this.elements.essayTitleDisplay.innerHTML = `
            <span class="label">作文标题：</span>
            <span class="value">${result.title}</span>
        `;
        
        // 分数
        this.elements.totalScore.textContent = result.scores.overall;
        
        // 星级
        const stars = this.elements.starRating.querySelectorAll('.star');
        const filledCount = Math.round(result.scores.overall / 20);
        stars.forEach((star, i) => {
            star.classList.toggle('filled', i < filledCount);
        });
        
        // 综合评语
        this.elements.overallComment.innerHTML = `
            <p><strong>【整体评价】</strong> ${result.comments.overall}</p>
        `;
        
        // 总评列表
        this.elements.summaryList.innerHTML = `
            <li class="summary-item">
                <span class="tag positive">✓ 优点</span>
                <p>${result.comments.positive}</p>
            </li>
            <li class="summary-item">
                <span class="tag suggest">💡 建议</span>
                <p>${result.comments.suggestionsSummary}</p>
            </li>
        `;
        
        // 详细批改列表
        this.renderDetails(result.annotations);
    },
    
    renderDetails(annotations) {
        this.currentAnnotations = annotations;
        
        this.elements.detailList.innerHTML = annotations.map((item, index) => `
            <div class="detail-item ${item.type}" data-index="${index}" data-type="${item.type}">
                <div class="detail-content">
                    <span class="detail-number">${index + 1}</span>
                    <span class="tag ${item.type}">${this.getTypeLabel(item.type)}</span>
                    <span>${item.text}</span>
                </div>
                ${item.suggestion ? `<div class="detail-suggestion">建议修改：${item.suggestion}</div>` : ''}
            </div>
        `).join('');
        
        // 绑定点击事件
        this.elements.detailList.querySelectorAll('.detail-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.highlightAnnotation(index);
            });
        });
    },
    
    getTypeLabel(type) {
        const labels = {
            error: '✗ 错误',
            suggest: '🔧 建议',
            content: '💡 内容',
            praise: '✓ 表扬'
        };
        return labels[type] || type;
    },
    
    filterDetails(filter) {
        if (!this.currentAnnotations) return;
        
        const items = this.elements.detailList.querySelectorAll('.detail-item');
        items.forEach(item => {
            const type = item.dataset.type;
            if (filter === 'all' || type === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    },
    
    highlightAnnotation(index) {
        const annotation = this.currentAnnotations[index];
        if (!annotation) return;
        
        // 在输入框中滚动到对应位置
        const textarea = this.elements.essayInput;
        const startPos = annotation.start;
        const endPos = annotation.end;
        
        textarea.focus();
        textarea.setSelectionRange(startPos, endPos);
        
        // 滚动到视野
        const lineHeight = 24;
        const lines = textarea.value.substring(0, startPos).split('\n').length;
        textarea.scrollTop = (lines - 1) * lineHeight - 100;
        
        // 临时高亮
        textarea.blur();
        setTimeout(() => textarea.focus(), 100);
    },
    
    resetGradingPanel() {
        this.elements.essayTitleDisplay.innerHTML = `
            <span class="label">作文标题：</span>
            <span class="value">未命名</span>
        `;
        this.elements.totalScore.textContent = '0';
        this.elements.starRating.querySelectorAll('.star').forEach(s => s.classList.remove('filled'));
        this.elements.overallComment.innerHTML = '<p>提交作文后将显示综合评价</p>';
        this.elements.summaryList.innerHTML = `
            <li class="summary-item">
                <span class="tag positive">✓ 优点</span>
                <p>提交作文后将显示优点总结</p>
            </li>
        `;
        this.elements.detailList.innerHTML = '<div class="empty-state"><p>提交作文后显示详细批改</p></div>';
        this.data = null;
    },
    
    saveToHistory(result) {
        const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
        history.unshift(result);
        if (history.length > 50) history.pop();
        localStorage.setItem('gradingHistory', JSON.stringify(history));
    },
    
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
        
        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<div class="empty-state"><p>暂无历史记录</p></div>';
            return;
        }
        
        this.elements.historyList.innerHTML = history.map(item => {
            const scoreClass = item.scores.overall >= 80 ? 'high' : item.scores.overall >= 60 ? 'medium' : 'low';
            const date = new Date(item.timestamp).toLocaleDateString();
            
            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-info">
                        <h4>${item.title}</h4>
                        <div class="history-meta">
                            ${date} · ${item.stats.chars}字
                        </div>
                    </div>
                    <div class="history-score">
                        <span class="score-badge ${scoreClass}">
                            <span>${item.scores.overall}</span>
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定点击事件
        this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const record = history.find(h => h.id === id);
                if (record) {
                    this.loadRecord(record);
                    this.switchPage('edit');
                }
            });
        });
    },
    
    loadRecord(record) {
        this.elements.essayInput.value = record.originalText;
        this.elements.essayTitle.value = record.title;
        this.elements.charCount.textContent = record.stats.chars + ' 字';
        this.displayResult(record);
        this.data = record;
    },
    
    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.remove('hidden');
        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, 2000);
    }
};

// 批改算法
const Grading = {
    process(text, title) {
        const annotations = this.analyzeText(text);
        const stats = this.calculateStats(text);
        const scores = this.calculateScores(stats, annotations);
        const comments = this.generateComments(scores, annotations);
        
        return {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            title: title,
            originalText: text,
            stats: stats,
            scores: scores,
            comments: comments,
            annotations: annotations
        };
    },
    
    calculateStats(text) {
        const chars = text.length;
        const sentences = text.split(/[。！？]/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
        const words = text.replace(/[^\u4e00-\u9fa5]/g, '').length;
        
        return { chars, sentences, paragraphs, words };
    },
    
    analyzeText(text) {
        const annotations = [];
        let index = 0;
        
        // 错别字检测
        const errors = [
            { wrong: '想您说', correct: '有话想对您说', type: 'error' },
            { wrong: '的的确确', correct: '的确', type: 'error' },
            { wrong: '零零散散', correct: '零散', type: 'error' },
            { wrong: '雪白雪白', correct: '雪白', type: 'error' },
            { wrong: '整整齐齐', correct: '整齐', type: 'error' },
            { wrong: '打扫的干干净净', correct: '打扫得干干净净', type: 'error' },
            { wrong: '感动的热泪盈眶', correct: '感动得热泪盈眶', type: 'error' }
        ];
        
        errors.forEach(item => {
            let pos = text.indexOf(item.wrong);
            while (pos !== -1) {
                annotations.push({
                    type: item.type,
                    text: item.wrong,
                    suggestion: `应改为"${item.correct}"`,
                    start: pos,
                    end: pos + item.wrong.length
                });
                pos = text.indexOf(item.wrong, pos + 1);
            }
        });
        
        // 表达优化建议
        const suggestions = [
            { pattern: /然后/g, suggestion: '连接词略显重复，可适当简化', type: 'suggest' },
            { pattern: /因为所以/g, suggestion: '因果表达过于绝对，可使用更丰富的连接词', type: 'suggest' },
            { pattern: /非常/g, suggestion: '可替换为更具体的描写，如"十分""格外"', type: 'suggest' },
            { pattern: /很/g, suggestion: '可替换为更生动的表达', type: 'suggest' }
        ];
        
        suggestions.forEach(item => {
            let match;
            const regex = new RegExp(item.pattern.source, 'g');
            while ((match = regex.exec(text)) !== null) {
                // 避免重复标注已标注的位置
                const pos = match.index;
                const overlapping = annotations.some(a => a.start <= pos && a.end >= pos);
                if (!overlapping) {
                    annotations.push({
                        type: item.type,
                        text: match[0],
                        suggestion: item.suggestion,
                        start: pos,
                        end: pos + match[0].length
                    });
                }
            }
        });
        
        // 内容建议
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        paragraphs.forEach((para, idx) => {
            if (para.length < 50 && idx > 0 && idx < paragraphs.length - 1) {
                const pos = text.indexOf(para);
                annotations.push({
                    type: 'content',
                    text: `第${idx + 1}段内容较为概括`,
                    suggestion: '可增加细节描写，丰富内容',
                    start: pos,
                    end: pos + Math.min(20, para.length)
                });
            }
        });
        
        // 结尾检查
        const lastPara = paragraphs[paragraphs.length - 1];
        if (lastPara && lastPara.length < 30) {
            const pos = text.indexOf(lastPara);
            annotations.push({
                type: 'content',
                text: '结尾略显简单',
                suggestion: '建议适当升华，点明主题',
                start: pos,
                end: pos + Math.min(20, lastPara.length)
            });
        }
        
        // 优点表扬
        const goodExpressions = ['比喻', '拟人', '排比', '对比', '设问'];
        goodExpressions.forEach(expr => {
            if (text.includes(expr)) {
                const pos = text.indexOf(expr);
                annotations.push({
                    type: 'praise',
                    text: `运用了${expr}手法`,
                    suggestion: null,
                    start: pos,
                    end: pos + expr.length
                });
            }
        });
        
        // 开头检查
        if (paragraphs[0] && paragraphs[0].length > 30) {
            annotations.push({
                type: 'praise',
                text: '开头开门见山，点明主题',
                suggestion: null,
                start: 0,
                end: 10
            });
        }
        
        // 结尾升华
        if (lastPara && (lastPara.includes('明白') || lastPara.includes('懂得') || lastPara.includes('感受到'))) {
            const pos = text.indexOf(lastPara) + lastPara.length - 20;
            annotations.push({
                type: 'praise',
                text: '结尾有所升华，情感真挚',
                suggestion: null,
                start: Math.max(0, pos),
                end: Math.min(text.length, pos + 20)
            });
        }
        
        return annotations.sort((a, b) => a.start - b.start);
    },
    
    calculateScores(stats, annotations) {
        let content = 75, language = 75, structure = 75, style = 70;
        
        // 内容评分
        if (stats.chars >= 500) content += 10;
        if (stats.chars >= 800) content += 5;
        if (stats.paragraphs >= 4) content += 5;
        const contentAnnotations = annotations.filter(a => a.type === 'content').length;
        if (contentAnnotations > 0) content -= contentAnnotations * 3;
        
        // 语言评分
        const errorAnnotations = annotations.filter(a => a.type === 'error').length;
        const suggestAnnotations = annotations.filter(a => a.type === 'suggest').length;
        language -= errorAnnotations * 5;
        language -= suggestAnnotations * 2;
        
        // 结构评分
        if (stats.paragraphs >= 3) structure += 10;
        if (stats.paragraphs <= 6) structure += 5;
        
        // 文采评分
        const praiseCount = annotations.filter(a => a.type === 'praise').length;
        style += praiseCount * 5;
        
        const overall = Math.round(content * 0.3 + language * 0.3 + structure * 0.25 + style * 0.15);
        
        return {
            content: Math.min(100, Math.max(0, Math.round(content))),
            language: Math.min(100, Math.max(0, Math.round(language))),
            structure: Math.min(100, Math.max(0, Math.round(structure))),
            style: Math.min(100, Math.max(0, Math.round(style))),
            overall: Math.min(100, Math.max(0, overall))
        };
    },
    
    generateComments(scores, annotations) {
        const errorCount = annotations.filter(a => a.type === 'error').length;
        const suggestCount = annotations.filter(a => a.type === 'suggest').length;
        const contentCount = annotations.filter(a => a.type === 'content').length;
        const praiseCount = annotations.filter(a => a.type === 'praise').length;
        
        let overall = '';
        if (scores.overall >= 85) {
            overall = '作文整体质量优秀，内容充实，结构清晰，语言流畅，继续保持！';
        } else if (scores.overall >= 70) {
            overall = '作文整体质量良好，思路清晰，表述清楚，继续努力可更上一层楼！';
        } else if (scores.overall >= 60) {
            overall = '作文基本完成要求，但还有一些方面需要改进，建议多参考优秀范文。';
        } else {
            overall = '作文需要较大的修改，建议重点关注文章结构和内容完整性。';
        }
        
        const positive = praiseCount > 0 
            ? `本文有${praiseCount}处亮点表达，如恰当运用修辞手法、开头结尾点题等。`
            : '文章结构完整，叙事基本清晰。';
        
        const suggestionsSummary = [];
        if (errorCount > 0) suggestionsSummary.push(`发现${errorCount}处语法错误需修正`);
        if (suggestCount > 0) suggestionsSummary.push(`${suggestCount}处表达可优化`);
        if (contentCount > 0) suggestionsSummary.push(`${contentCount}处内容可丰富细节`);
        
        return {
            overall,
            positive,
            suggestionsSummary: suggestionsSummary.join('，') || '整体表达良好，可进一步丰富内容。'
        };
    }
};
