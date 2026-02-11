// 历史记录页面逻辑

document.addEventListener('DOMContentLoaded', function() {
    HistoryPage.init();
});

const HistoryPage = {
    list: [],
    filtered: [],
    currentPage: 1,
    perPage: 10,
    
    init() {
        this.loadData();
        this.bindEvents();
        
        if (this.list.length === 0) {
            this.renderEmpty();
            return;
        }
        
        this.updateStats();
        this.applyFilters();
    },
    
    loadData() {
        try {
            this.list = JSON.parse(localStorage.getItem('gradingHistory') || '[]');
        } catch (e) {
            this.list = [];
        }
    },
    
    updateStats() {
        const total = this.list.length;
        const avgScore = total > 0 ? Math.round(this.list.reduce((s, i) => s + i.scores.overall, 0) / total) : 0;
        const avgChars = total > 0 ? Math.round(this.list.reduce((s, i) => s + i.stats.chars, 0) / total) : 0;
        const highScore = total > 0 ? Math.max(...this.list.map(i => i.scores.overall)) : 0;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('avgScore').textContent = avgScore;
        document.getElementById('avgChars').textContent = avgChars;
        document.getElementById('highScore').textContent = highScore;
    },
    
    applyFilters() {
        const typeFilter = document.getElementById('typeFilter').value;
        const scoreFilter = document.getElementById('scoreFilter').value;
        
        this.filtered = this.list.filter(item => {
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            
            if (scoreFilter !== 'all') {
                const score = item.scores.overall;
                if (scoreFilter === 'high' && score < 85) return false;
                if (scoreFilter === 'medium' && (score < 60 || score >= 85)) return false;
                if (scoreFilter === 'low' && score >= 60) return false;
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.renderList();
        this.updatePagination();
    },
    
    renderEmpty() {
        document.getElementById('pagination').hidden = true;
    },
    
    renderList() {
        const container = document.getElementById('historyList');
        const start = (this.currentPage - 1) * this.perPage;
        const items = this.filtered.slice(start, start + this.perPage);
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>没有符合条件的记录</h3>
                    <p>尝试调整筛选条件</p>
                </div>
            `;
            return;
        }
        
        const typeNames = {
            narrative: '记叙文',
            argumentative: '议论文',
            expository: '说明文',
            other: '其他'
        };
        
        container.innerHTML = items.map(item => {
            const scoreClass = item.scores.overall >= 85 ? 'excellent' : 
                              item.scores.overall >= 70 ? 'good' : 
                              item.scores.overall >= 60 ? 'average' : 'poor';
            
            const preview = item.originalText.substring(0, 50) + (item.originalText.length > 50 ? '...' : '');
            const date = new Date(item.timestamp).toLocaleDateString();
            const authorDisplay = item.author ? `👤 ${item.author} · ` : '';
            
            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="item-score ${scoreClass}">
                        <span class="score-num">${item.scores.overall}</span>
                        <span class="score-label">分</span>
                    </div>
                    <div class="item-info">
                        <span class="item-type">${typeNames[item.type] || '未知'}</span>
                        <div class="item-meta">
                            <span>${authorDisplay}📅 ${date}</span>
                            <span>📝 ${item.stats.chars}字</span>
                        </div>
                        <p class="item-preview">${preview}</p>
                    </div>
                    <div class="item-actions">
                        <button class="item-btn view-btn">查看</button>
                        <button class="item-btn danger del-btn">删除</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 绑定事件
        container.querySelectorAll('.history-item').forEach((el, idx) => {
            const item = items[idx];
            
            el.querySelector('.view-btn').onclick = (e) => {
                e.stopPropagation();
                this.showDetail(item);
            };
            
            el.querySelector('.del-btn').onclick = (e) => {
                e.stopPropagation();
                this.deleteItem(item.id);
            };
        });
    },
    
    updatePagination() {
        const totalPages = Math.ceil(this.filtered.length / this.perPage);
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (totalPages <= 1) {
            pagination.hidden = true;
            return;
        }
        
        pagination.hidden = false;
        pageInfo.textContent = `${this.currentPage} / ${totalPages}`;
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages;
    },
    
    bindEvents() {
        document.getElementById('typeFilter').onchange = () => this.applyFilters();
        document.getElementById('scoreFilter').onchange = () => this.applyFilters();
        
        document.getElementById('prevPage').onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderList();
                this.updatePagination();
            }
        };
        
        document.getElementById('nextPage').onclick = () => {
            const totalPages = Math.ceil(this.filtered.length / this.perPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderList();
                this.updatePagination();
            }
        };
        
        document.getElementById('closeModal').onclick = () => {
            document.getElementById('detailModal').hidden = true;
        };
        
        document.getElementById('detailModal').onclick = (e) => {
            if (e.target.id === 'detailModal') {
                document.getElementById('detailModal').hidden = true;
            }
        };
    },
    
    showDetail(item) {
        const typeNames = {
            narrative: '记叙文',
            argumentative: '议论文',
            expository: '说明文',
            other: '其他'
        };
        
        const scoreClass = item.scores.overall >= 85 ? 'excellent' : 
                          item.scores.overall >= 70 ? 'good' : 
                          item.scores.overall >= 60 ? 'average' : 'poor';
        
        const authorDisplay = item.author ? `<p>👤 ${item.author}</p>` : '';
        
        const body = document.getElementById('modalBody');
        body.innerHTML = `
            <div class="modal-score-row">
                <div class="modal-score-badge ${scoreClass}">
                    <span class="score">${item.scores.overall}</span>
                    <span class="unit">综合</span>
                </div>
                <div class="modal-score-info">
                    <h4>${item.title || '未命名'}</h4>
                    <p>${typeNames[item.type] || '未知'}</p>
                    ${authorDisplay}
                    <p>${new Date(item.timestamp).toLocaleString()}</p>
                </div>
            </div>
            
            <div class="modal-scores-grid">
                <div class="modal-score-item">
                    <span class="val">${item.scores.content}</span>
                    <span class="lbl">内容</span>
                </div>
                <div class="modal-score-item">
                    <span class="val">${item.scores.structure}</span>
                    <span class="lbl">结构</span>
                </div>
                <div class="modal-score-item">
                    <span class="val">${item.scores.language}</span>
                    <span class="lbl">语言</span>
                </div>
                <div class="modal-score-item">
                    <span class="val">${item.scores.style}</span>
                    <span class="lbl">文采</span>
                </div>
            </div>
            
            <div class="modal-section">
                <h4>评语</h4>
                <p>${item.comments.overall}</p>
            </div>
            
            <div class="modal-section">
                <h4>建议</h4>
                <ul>
                    ${item.suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <h4>信息</h4>
                <p>字数：${item.stats.chars}字 | 段落：${item.stats.paragraphs}段</p>
            </div>
        `;
        
        document.getElementById('detailModal').hidden = false;
    },
    
    deleteItem(id) {
        if (!confirm('确定删除这条记录？')) return;
        
        const idx = this.list.findIndex(i => i.id === id);
        if (idx > -1) {
            this.list.splice(idx, 1);
            localStorage.setItem('gradingHistory', JSON.stringify(this.list));
            
            this.updateStats();
            this.applyFilters();
            this.showToast('已删除');
            
            if (this.list.length === 0) {
                location.reload();
            }
        }
    },
    
    addSampleData() {
        const samples = [
            {
                id: Date.now() - 100000,
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                type: 'narrative',
                scores: { overall: 82, content: 80, structure: 85, language: 78, style: 75 },
                stats: { chars: 520, sentences: 15, paragraphs: 5 },
                comments: { overall: '这是一篇较好的作文', content: '内容较为完整', structure: '结构严谨', language: '语言通顺', style: '有一定文采' },
                suggestions: ['建议增加过渡词', '注意句子搭配'],
                originalText: '那是一个阳光明媚的早晨，我背着书包去上学。走到半路，突然下起了大雨...'
            },
            {
                id: Date.now() - 200000,
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                type: 'argumentative',
                scores: { overall: 75, content: 78, structure: 72, language: 75, style: 70 },
                stats: { chars: 680, sentences: 12, paragraphs: 4 },
                comments: { overall: '议论文结构清晰', content: '论点明确', structure: '层次分明', language: '表达准确', style: '可以增强文采' },
                suggestions: ['论据可以更充分', '结尾需要升华'],
                originalText: '我认为勤奋是成功的关键。勤奋能够弥补智力的不足...'
            },
            {
                id: Date.now() - 300000,
                timestamp: new Date(Date.now() - 259200000).toISOString(),
                type: 'narrative',
                scores: { overall: 88, content: 90, structure: 85, language: 87, style: 90 },
                stats: { chars: 750, sentences: 18, paragraphs: 6 },
                comments: { overall: '优秀作文', content: '内容充实', structure: '结构清晰', language: '语言优美', style: '文采斐然' },
                suggestions: ['继续保持', '可以尝试更多修辞手法'],
                originalText: '那是一个难忘的日子。阳光明媚，微风轻拂...'
            }
        ];
        
        this.list = samples;
        localStorage.setItem('gradingHistory', JSON.stringify(samples));
        
        this.updateStats();
        this.applyFilters();
        
        this.showToast('已添加3条示例数据');
    },
    
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show';
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
};
