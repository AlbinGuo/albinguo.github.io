// 智能作文批改助手 - 主应用逻辑

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

const App = {
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
    },
    
    cacheElements() {
        this.elements = {
            essayInput: document.getElementById('essayInput'),
            charCount: document.getElementById('charCount'),
            fileInput: document.getElementById('fileInput'),
            uploadZone: document.getElementById('uploadZone'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            essayType: document.getElementById('essayType'),
            submitBtn: document.getElementById('submitBtn'),
            demoBtn: document.getElementById('demoBtn'),
            toast: document.getElementById('toast')
        };
    },
    
    bindEvents() {
        const { essayInput, fileInput, uploadZone, selectFileBtn, submitBtn, demoBtn } = this.elements;
        
        // 字数统计
        essayInput.addEventListener('input', () => this.updateCharCount());
        
        // 上传区域点击
        uploadZone.addEventListener('click', () => fileInput.click());
        
        // 选择文件按钮点击
        selectFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
        
        // 文件选择
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 拖拽上传
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.readFile(file);
        });
        
        // 提交批改
        submitBtn.addEventListener('click', () => this.submitEssay());
        
        // 示例作文
        demoBtn.addEventListener('click', () => this.loadDemoEssay());
    },
    
    updateCharCount() {
        const count = this.elements.essayInput.value.length;
        this.elements.charCount.textContent = count;
    },
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.readFile(file);
        }
        // 清空input允许重新选择
        e.target.value = '';
    },
    
    readFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (ext !== 'txt') {
            this.showToast('仅支持 txt 格式文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result.trim();
            if (content.length > 0) {
                this.elements.essayInput.value = content;
                this.updateCharCount();
                this.showToast(`已加载文件 "${file.name}"（${content.length}字）`, 'success');
            } else {
                this.showToast('文件内容为空', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showToast('文件读取失败', 'error');
        };
        
        reader.readAsText(file);
    },
    
    loadDemoEssay() {
        const essay = `那是一个阳光明媚的早晨，我背着书包去上学。走到半路，突然下起了大雨。我没有带伞，只好躲在路边的屋檐下等雨停。

这时候，一个陌生的阿姨走过来，她手里撑着一把伞。她看到我狼狈的样子，微笑着问我："小朋友，你没带伞吗？我送你回家吧。"

我有点犹豫，因为妈妈说过不要随便跟陌生人走。但是看着越下越大的雨，我最终还是点了点头。一路上，阿姨撑着伞，她的肩膀却湿了一大片。我这才发现，阿姨把伞都倾斜到我这边，自己的半边身子却淋湿了。

到了家门口，我邀请阿姨进来喝杯水，但是她摆摆手说："不用了，我还要去上班呢。"说完，她就转身走进了雨中。

我站在门口，看着阿姨渐渐远去的背影，心里涌起一股暖流。虽然雨水是凉的，但是我的心却是暖暖的。我想，等我长大了，我也要像这位阿姨一样，去帮助需要帮助的人。

这件事让我明白了一个道理：人间自有真情在。只要我们每个人都献出一点爱，世界就会变得更加美好。`;
        
        this.elements.essayInput.value = essay;
        this.updateCharCount();
        this.showToast('已加载示例作文', 'success');
    },
    
    submitEssay() {
        const content = this.elements.essayInput.value.trim();
        
        // 验证
        if (!content) {
            this.showToast('请输入作文内容', 'error');
            return;
        }
        
        if (content.length < 200) {
            this.showToast(`作文不少于200字，当前${content.length}字`, 'error');
            return;
        }
        
        // 获取设置
        const type = this.elements.essayType.value;
        const focuses = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
            .map(cb => cb.dataset.focus);
        
        if (focuses.length === 0) {
            this.showToast('请至少选择一个批改重点', 'error');
            return;
        }
        
        // 显示加载状态
        this.setLoading(true);
        
        // 执行批改
        setTimeout(() => {
            try {
                const result = Grading.process(content, type, focuses);
                
                // 保存数据到localStorage
                localStorage.setItem('lastResult', JSON.stringify(result));
                
                const history = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
                history.unshift(result);
                if (history.length > 50) history.pop();
                localStorage.setItem('gradingHistory', JSON.stringify(history));
                
                // 跳转到结果页（使用localStorage传递数据，避免URL过长）
                window.location.href = 'result.html';
            } catch (e) {
                console.error('批改失败:', e);
                this.showToast('批改失败: ' + e.message, 'error');
                this.setLoading(false);
            }
        }, 100);
    },
    
    setLoading(loading) {
        const { submitBtn } = this.elements;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (loading) {
            btnText.hidden = true;
            btnLoading.hidden = false;
            submitBtn.disabled = true;
        } else {
            btnText.hidden = false;
            btnLoading.hidden = true;
            submitBtn.disabled = false;
        }
    },
    
    showToast(message, type = '') {
        const { toast } = this.elements;
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
};

// 批改算法模块
const Grading = {
    process(essay, type, focuses) {
        try {
            const stats = this.calculateStats(essay);
            const errors = this.checkGrammar(essay);
            const structureData = this.analyzeStructure(essay);
            const scores = this.calculateScores(stats, structureData, essay, type, focuses, errors);
            const comments = this.generateComments(scores);
            const suggestions = this.generateSuggestions(errors, structureData, scores, type);
            
            return {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                originalText: essay,
                annotatedText: this.annotateErrors(essay, errors),
                type: type,
                stats: stats,
                scores: scores,
                comments: comments,
                suggestions: suggestions,
                errors: errors,
                structure: structureData
            };
        } catch (e) {
            console.error('批改算法出错:', e);
            throw new Error('批改处理失败');
        }
    },
    
    calculateStats(text) {
        const chars = text.length;
        const chineseChars = text.replace(/[^\u4e00-\u9fa5]/g, '').length;
        const sentences = text.split(/[。！？]/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
        
        return {
            chars,
            chineseChars,
            sentences,
            paragraphs,
            avgSentenceLength: sentences > 0 ? Math.round(chars / sentences) : 0
        };
    },
    
    checkGrammar(text) {
        const errors = [];
        
        // 检查常见问题
        const patterns = [
            { pattern: /然后/g, type: '表达冗余', suggestion: '"然后"使用频繁，可简化连接词' },
            { pattern: /因为所以/g, type: '句式单一', suggestion: '因果关系表达过于绝对' },
            { pattern: /的的确确/g, type: '语义重复', suggestion: '建议简化为"的确"' },
            { pattern: /零零散散/g, type: '语义重复', suggestion: '建议简化为"零散"' },
            { pattern: /雪白雪白/g, type: '语义重复', suggestion: '建议简化为"雪白"' },
            { pattern: /整整齐齐/g, type: '语义重复', suggestion: '建议简化为"整齐"' },
            { pattern: /打扫的干干净净/g, type: '搭配不当', suggestion: '应为"打扫得干干净净"' },
            { pattern: /听的认认真真/g, type: '搭配不当', suggestion: '应为"听得认认真真"' },
            { pattern: /看的清清楚楚/g, type: '搭配不当', suggestion: '应为"看得清清楚楚"' },
            { pattern: /感动的热泪盈眶/g, type: '搭配不当', suggestion: '应为"感动得热泪盈眶"' }
        ];
        
        patterns.forEach(({ pattern, type, suggestion }) => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const pos = text.indexOf(match);
                    errors.push({
                        position: pos,
                        line: text.substring(0, pos).split('\n').length,
                        text: match,
                        type,
                        suggestion
                    });
                });
            }
        });
        
        // 检查段落结尾
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        paragraphs.forEach((para, index) => {
            const lastLine = para.split('\n').pop().trim();
            if (lastLine.length > 0 && index === paragraphs.length - 1) {
                if (lastLine.length < 10) {
                    errors.push({
                        position: text.indexOf(lastLine),
                        line: index + 1,
                        text: lastLine,
                        type: '结尾简略',
                        suggestion: '结尾可以更充实，适当升华主题'
                    });
                }
            }
        });
        
        return errors.slice(0, 15);
    },
    
    analyzeStructure(text) {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
        const transitionWords = ['首先', '其次', '然后', '最后', '第一', '第二', '第三', '因此', '然而', '但是'];
        const transitionCount = (text.match(new RegExp(transitionWords.join('|'), 'g')) || []).length;
        
        return {
            paragraphCount: paragraphs.length,
            transitionCount,
            hasOpening: paragraphs[0]?.length > 30,
            hasConclusion: paragraphs[paragraphs.length - 1]?.length > 20
        };
    },
    
    calculateScores(stats, structureData, text, type, focuses, errors) {
        let content = 65, strScore = 65, language = 65, style = 60;
        
        // 内容评分
        if (stats.chars >= 400) content += 10;
        if (stats.chars >= 800) content += 10;
        if (stats.paragraphs >= 3) content += 10;
        const keywords = this.extractKeywords(text);
        if (keywords.length >= 3) content += 5;
        
        // 结构评分
        if (structureData.hasOpening) strScore += 10;
        if (structureData.hasConclusion) strScore += 10;
        if (structureData.transitionCount >= 2) strScore += 10;
        if (structureData.paragraphCount >= 4) strScore += 5;
        
        // 语言评分
        const avgLen = stats.avgSentenceLength;
        if (avgLen >= 20 && avgLen <= 50) language += 10;
        const rhetoric = text.match(/比喻|拟人|排比|对比|设问|夸张/g);
        if (rhetoric?.length >= 1) language += 10;
        if (rhetoric?.length >= 2) language += 5;
        
        // 文采评分
        const phrases = text.match(/绚丽多彩|五彩斑斓|生机勃勃|晶莹剔透|波光粼粼|风和日丽|秋高气爽|春暖花开/g);
        if (phrases?.length >= 1) style += 15;
        if (phrases?.length >= 2) style += 5;
        const quotes = text.match(/曾说|有言道|古语|诗云/g);
        if (quotes) style += 10;
        
        // 错误扣分
        const errorDeduction = Math.min(errors.length * 2, 15);
        
        // 调整权重
        const adjust = (score, focus) => focus ? score : Math.round(score * 0.7);
        
        const finalScores = {
            content: Math.min(100, Math.max(0, adjust(content, focuses.includes('content')))),
            structure: Math.min(100, Math.max(0, adjust(strScore, focuses.includes('structure')))),
            language: Math.min(100, Math.max(0, adjust(language, focuses.includes('language')))),
            style: Math.min(100, Math.max(0, adjust(style, focuses.includes('style'))))
        };
        
        const weights = { content: 0.30, structure: 0.25, language: 0.25, style: 0.20 };
        let overall = 0;
        if (focuses.includes('content')) overall += finalScores.content * weights.content;
        if (focuses.includes('structure')) overall += finalScores.structure * weights.structure;
        if (focuses.includes('language')) overall += finalScores.language * weights.language;
        if (focuses.includes('style')) overall += finalScores.style * weights.style;
        
        overall = Math.round(overall - errorDeduction);
        overall = Math.max(0, Math.min(100, overall));
        
        return { ...finalScores, overall };
    },
    
    extractKeywords(text) {
        const stopWords = ['的', '了', '是', '在', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '我', '他', '她', '我们', '他们'];
        const words = text.replace(/[^\u4e00-\u9fa5]/g, ' ').split(/\s+/);
        const count = {};
        words.forEach(w => {
            if (w.length >= 2 && !stopWords.includes(w)) count[w] = (count[w] || 0) + 1;
        });
        return Object.entries(count).filter(([, c]) => c >= 2).map(([w]) => w);
    },
    
    annotateErrors(text, errors) {
        if (!errors.length) return text;
        let result = text;
        const sorted = [...errors].sort((a, b) => b.position - a.position);
        sorted.forEach(err => {
            const before = result.slice(0, err.position);
            const after = result.slice(err.position + err.text.length);
            result = before + `<mark class="error">${err.text}</mark>` + after;
        });
        return result;
    },
    
    generateComments(scores) {
        return {
            content: scores.content >= 80 ? '内容充实，主题明确' : scores.content >= 65 ? '内容较为完整' : '内容需要充实',
            structure: scores.structure >= 80 ? '结构严谨，层次分明' : scores.structure >= 65 ? '结构较为清晰' : '结构需要优化',
            language: scores.language >= 80 ? '语言流畅，表达准确' : scores.language >= 65 ? '语言通顺' : '语言需要提升',
            style: scores.style >= 80 ? '文采斐然，富有感染力' : scores.style >= 65 ? '有一定文采' : '可以增强文采',
            overall: scores.overall >= 85 ? '这是一篇优秀的作文，各方面表现都很出色！' :
                     scores.overall >= 70 ? '这是一篇较好的作文，整体质量不错' :
                     scores.overall >= 60 ? '这是一篇合格的作文，还有一些方面需要改进' :
                     '这篇作文需要较大的改进'
        };
    },
    
    generateSuggestions(errors, structure, scores, type) {
        const suggestions = [];
        
        if (errors.some(e => e.type === '搭配不当')) {
            suggestions.push('建议检查句子成分搭配，确保主谓宾关系正确');
        }
        if (errors.some(e => e.type === '语义重复')) {
            suggestions.push('注意词语重复问题，可用同义词替换或简化');
        }
        if (structure.transitionCount < 2) {
            suggestions.push('建议增加过渡词，如"首先、其次、因此"等');
        }
        if (!structure.hasConclusion) {
            suggestions.push('结尾需要进行适当升华，点明主题');
        }
        if (scores.content < 70) {
            suggestions.push('内容充实度需要加强，可增加具体事例支撑');
        }
        if (scores.language < 70) {
            suggestions.push('语言表达需要提升，注意句式变化');
        }
        if (scores.style < 70) {
            suggestions.push('可以尝试运用修辞手法增强文采');
        }
        suggestions.push('建议完成后通读全文，检查错别字和语病');
        
        return suggestions.slice(0, 6);
    }
};
