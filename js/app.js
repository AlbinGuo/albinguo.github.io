// 作文纸配置
const PAPER_CONFIG = {
    CHARS_PER_LINE: 20,      // 每行字数
    LINE_HEIGHT: 28,          // 行高（像素）
    LINE_NUMBER_WIDTH: 25,     // 行号宽度
    PARAGRAPH_GAP: 25,        // 段落间距
    TOP_MARGIN: 30,           // 顶部边距
    LEFT_MARGIN: 30           // 左侧边距
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

const App = {
    data: null,
    textGrid: [],
    sideComments: [],
    comparisonMode: false,
    selectedForComparison: null,
    lastClickedCell: null,
    selectedRange: { start: null, end: null },
    annotationCount: 0,
    isSelecting: false,
    selectionStartCell: null,
    pendingTemplateComment: null,
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadHistory();
        this.loadMeta();
        this.initTextGrid();
        this.loadPaperType();
    },
    
    cacheElements() {
        this.elements = {
            gradingPage: document.getElementById('gradingPage'),
            historyPage: document.getElementById('historyPage'),
            helpPage: document.getElementById('helpPage'),
            essayTitle: document.getElementById('essayTitle'),
            essayAuthor: document.getElementById('essayAuthor'),
            charCount: document.getElementById('charCount'),
            gradeBtn: document.getElementById('gradeBtn'),
            clearBtn: document.getElementById('clearBtn'),
            essayTitleDisplay: document.getElementById('essayTitleDisplay'),
            starRating: document.getElementById('starRating'),
            totalScore: document.getElementById('totalScore'),
            overallComment: document.getElementById('overallComment'),
            summaryList: document.getElementById('summaryList'),
            detailList: document.getElementById('detailList'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            toast: document.getElementById('toast'),
            textGrid: document.getElementById('textGrid'),
            textGridContainer: document.getElementById('textGridContainer'),
            sideCommentPanel: document.getElementById('sideCommentPanel'),
            sideCommentBody: document.getElementById('sideCommentBody'),
            toggleSideComments: document.getElementById('toggleSideComments'),
            toggleTemplates: document.getElementById('toggleTemplates'),
            templatesBody: document.getElementById('templatesBody'),
            scoreDetails: document.getElementById('scoreDetails'),
            scoreContent: document.getElementById('scoreContent'),
            scoreLanguage: document.getElementById('scoreLanguage'),
            scoreStructure: document.getElementById('scoreStructure'),
            scoreStyle: document.getElementById('scoreStyle'),
            scoreContentValue: document.getElementById('scoreContentValue'),
            scoreLanguageValue: document.getElementById('scoreLanguageValue'),
            scoreStructureValue: document.getElementById('scoreStructureValue'),
            scoreStyleValue: document.getElementById('scoreStyleValue'),
            historyComparison: document.getElementById('historyComparison'),
            compareTip: document.getElementById('compareTip'),
            backToHistory: document.getElementById('backToHistory'),
            addAnnotationBtn: document.getElementById('addAnnotationBtn'),
            addCustomComment: document.getElementById('addCustomComment'),
            addCustomCommentHeader: document.getElementById('addCustomCommentHeader'),
            customComment: document.getElementById('customComment'),
            commentModal: document.getElementById('commentModal'),
            closeCommentModal: document.getElementById('closeCommentModal'),
            cancelComment: document.getElementById('cancelComment'),
            confirmComment: document.getElementById('confirmComment'),
            commentInput: document.getElementById('commentInput'),
            selectedRangeDisplay: document.getElementById('selectedRangeDisplay'),
            selectedStart: document.getElementById('selectedStart'),
            selectedEnd: document.getElementById('selectedEnd'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            fullHeightBtn: document.getElementById('fullHeightBtn')
        };
    },
    
    bindEvents() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = link.dataset.page;
                // 历史批改和帮助页面跳转到新页面
                if (page === 'history' || page === 'help') {
                    return; // 允许默认跳转行为
                }
                // 其他页面在当前页面切换
                e.preventDefault();
                this.switchPage(page);
            });
        });
        
        this.elements.clearBtn.addEventListener('click', () => this.clearTextGrid());
        this.elements.gradeBtn.addEventListener('click', () => this.startGrading());
        
        // 标题和姓名输入框自动保存
        this.elements.essayTitle.addEventListener('input', () => this.saveMeta());
        this.elements.essayAuthor.addEventListener('input', () => this.saveMeta());
        
        // 纸张类型切换
        document.querySelectorAll('.paper-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.paper-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchPaperType(btn.dataset.paper);
            });
        });
        
        // 全屏显示按钮
        this.elements.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // 100%高度显示按钮
        this.elements.fullHeightBtn.addEventListener('click', () => {
            this.toggleFullHeight();
        });
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterDetails(tab.dataset.filter);
            });
        });
        
        this.elements.clearHistoryBtn.addEventListener('click', () => {
            if (confirm('确定清空所有历史记录？')) {
                localStorage.removeItem('gradingHistory');
                this.loadHistory();
                this.showToast('历史记录已清空');
            }
        });
        
        // 旁批面板折叠
        this.elements.toggleSideComments.addEventListener('click', () => {
            const body = this.elements.sideCommentPanel.querySelector('.panel-body');
            const btn = this.elements.toggleSideComments;
            if (body.style.display === 'none') {
                body.style.display = 'block';
                btn.textContent = '收起 ▼';
            } else {
                body.style.display = 'none';
                btn.textContent = '展开 ▲';
            }
        });
        
        // 评语模板折叠
        this.elements.toggleTemplates.addEventListener('click', () => {
            this.elements.templatesBody.classList.toggle('collapsed');
            const svg = this.elements.toggleTemplates.querySelector('svg');
            if (svg) {
                svg.style.transform = this.elements.templatesBody.classList.contains('collapsed')
                    ? 'rotate(0deg)'
                    : 'rotate(180deg)';
            }
        });
        
        // 评语模板按钮点击
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 选择模板后打开弹窗
                this.pendingTemplateComment = btn.dataset.comment;
                this.openCommentModal();
            });
        });
        
        // 自定义评语添加
        this.elements.addCustomComment.addEventListener('click', () => {
            this.pendingTemplateComment = null;
            this.openCommentModal();
        });
        
        // 自定义评语按钮（顶部）
        this.elements.addCustomCommentHeader.addEventListener('click', () => {
            this.pendingTemplateComment = null;
            this.openCommentModal();
        });
        
        // 评语模板按钮点击 - 打开弹窗让用户选择颜色
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pendingTemplateComment = btn.dataset.comment;
                this.elements.commentInput.value = btn.dataset.comment;
                this.openCommentModal();
            });
        });
        
        // 添加批改按钮 - 打开输入弹窗
        this.elements.addAnnotationBtn.addEventListener('click', () => {
            this.openCommentModal();
        });
        
        // 关闭批改弹窗
        this.elements.closeCommentModal.addEventListener('click', () => {
            this.closeCommentModal();
        });
        
        // 取消批改
        this.elements.cancelComment.addEventListener('click', () => {
            this.closeCommentModal();
        });
        
        // 确认添加批改
        this.elements.confirmComment.addEventListener('click', () => {
            this.confirmAddComment();
        });
        
        // 批改弹窗按ESC关闭
        this.elements.commentModal.addEventListener('click', (e) => {
            if (e.target === this.elements.commentModal) {
                this.closeCommentModal();
            }
        });
        
        // 批改输入框按Ctrl+Enter提交
        this.elements.commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.confirmAddComment();
            }
        });
        
        // 自定义评语添加 - 打开弹窗选择颜色
        this.elements.addCustomComment.addEventListener('click', () => {
            const comment = this.elements.customComment.value.trim();
            if (comment) {
                this.pendingTemplateComment = comment;
                this.elements.commentInput.value = comment;
                this.openCommentModal();
                this.elements.customComment.value = '';
            } else {
                this.showToast('请输入评语');
            }
        });
        
        // 自定义评语回车提交 - 打开弹窗选择颜色
        this.elements.customComment.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const comment = this.elements.customComment.value.trim();
                if (comment) {
                    this.pendingTemplateComment = comment;
                    this.elements.commentInput.value = comment;
                    this.openCommentModal();
                    this.elements.customComment.value = '';
                } else {
                    this.showToast('请输入评语');
                }
            }
        });
        
        // 历史对比返回按钮
        this.elements.backToHistory.addEventListener('click', () => {
            this.exitComparisonMode();
        });
        
        // 全局粘贴事件
        document.addEventListener('paste', (e) => {
            const active = document.activeElement;
            const inCharCell = active.closest('.char-cell');
            const inTitleCell = active.closest('#titleCell');
            const inAuthorCell = active.closest('#authorCell');
            
            if (inCharCell || inTitleCell || inAuthorCell) return;
            
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (text) {
                this.insertText(text);
            }
        });
        
        // 全局鼠标释放停止选择
        document.addEventListener('mouseup', () => {
            this.isSelecting = false;
        });
        
        // 点击空白处取消选择
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.char-cell') && 
                !e.target.closest('.template-btn') && 
                !e.target.closest('.add-annotation-btn') &&
                !e.target.closest('.add-comment-btn') &&
                !e.target.closest('.color-option') &&
                !e.target.closest('.color-badge') &&
                !e.target.closest('#customComment') &&
                !e.target.closest('#commentInput') &&
                !e.target.closest('.modal')) {
                // 如果点击的不是格子或批改按钮，取消选择
                const selection = window.getSelection();
                if (selection && !selection.anchorNode?.closest?.('.char-cell')) {
                    this.clearSelection();
                }
            }
        });
    },
    
    // 页面切换
    switchPage(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        document.getElementById('gradingPage').classList.toggle('hidden', page !== 'edit');
        document.getElementById('historyPage').classList.toggle('hidden', page !== 'history');
        document.getElementById('helpPage').classList.toggle('hidden', page !== 'help');
        
        if (page === 'history') {
            this.loadHistory();
        }
    },
    
    // 纸张类型切换
    switchPaperType(type) {
        const textGrid = document.getElementById('textGrid');
        const container = document.getElementById('textGridContainer');
        
        // 移除所有类型
        textGrid.classList.remove('writing-paper', 'tian-grid');
        container.classList.remove('tian-grid-mode');
        
        if (type === 'tian') {
            textGrid.classList.add('tian-grid');
            container.classList.add('tian-grid-mode');
        }
        
        // 保存选择
        localStorage.setItem('paperType', type);
    },
    
    // 加载保存的纸张类型
    loadPaperType() {
        const savedType = localStorage.getItem('paperType') || 'tian';
        const btn = document.querySelector(`.paper-btn[data-paper="${savedType}"]`);
        if (btn) {
            document.querySelectorAll('.paper-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.switchPaperType(savedType);
        }
    },
    
    // 加载保存的标题和姓名
    loadMeta() {
        const savedTitle = localStorage.getItem('essayTitle');
        const savedAuthor = localStorage.getItem('essayAuthor');
        
        if (savedTitle) {
            this.elements.essayTitle.value = savedTitle;
        }
        if (savedAuthor) {
            this.elements.essayAuthor.value = savedAuthor;
        }
    },
    
    // 保存标题和姓名
    saveMeta() {
        localStorage.setItem('essayTitle', this.elements.essayTitle.value);
        localStorage.setItem('essayAuthor', this.elements.essayAuthor.value);
    },
    
    // 全屏显示
    toggleFullscreen() {
        const essayPanel = document.querySelector('.essay-panel');
        const btn = this.elements.fullscreenBtn;
        
        if (essayPanel.classList.contains('fullscreen')) {
            essayPanel.classList.remove('fullscreen');
            btn.classList.remove('active');
        } else {
            essayPanel.classList.add('fullscreen');
            btn.classList.add('active');
            // 退出全高度模式
            essayPanel.classList.remove('full-height');
            document.querySelectorAll('.view-btn').forEach(b => {
                if (b !== btn) b.classList.remove('active');
            });
        }
    },
    
    // 100%高度显示
    toggleFullHeight() {
        const essayPanel = document.querySelector('.essay-panel');
        const contentWrapper = document.querySelector('.content-wrapper');
        const btn = this.elements.fullHeightBtn;
        
        if (essayPanel.classList.contains('full-height')) {
            essayPanel.classList.remove('full-height');
            contentWrapper.classList.remove('full-height');
            btn.classList.remove('active');
        } else {
            essayPanel.classList.add('full-height');
            contentWrapper.classList.add('full-height');
            btn.classList.add('active');
            // 退出全屏模式
            essayPanel.classList.remove('fullscreen');
            document.querySelectorAll('.view-btn').forEach(b => {
                if (b !== btn) b.classList.remove('active');
            });
        }
    },
    
    initTextGrid() {
        this.textGrid = [];
        this.charIndexToPosition = {};
        
        const container = this.elements.textGrid;
        
        container.innerHTML = `
            <div class="writing-paper" id="writingPaper">
                <div class="title-area" id="titleArea">
                    <div class="title-row">
                        <div class="title-cell" id="titleCell">
                            <span class="title-placeholder">在此输入标题</span>
                        </div>
                    </div>
                    <div class="author-row">
                        <span class="author-label">姓名：</span>
                        <div class="author-cell" id="authorCell" contenteditable="true"></div>
                    </div>
                </div>
                <div class="content-area" id="contentArea"></div>
            </div>
        `;
        
        const contentArea = document.getElementById('contentArea');
        const titleCell = document.getElementById('titleCell');
        
        // 点击内容区域聚焦
        contentArea.addEventListener('click', (e) => {
            if (e.target === contentArea || 
                e.target.classList.contains('char-row') ||
                e.target.classList.contains('line-number')) {
                const firstCell = contentArea.querySelector('.char-cell');
                if (firstCell) this.focusCell(firstCell);
            }
        });
        
        titleCell.addEventListener('click', () => {
            const placeholder = titleCell.querySelector('.title-placeholder');
            if (placeholder) {
                placeholder.remove();
                titleCell.focus();
            }
        });
        
        titleCell.addEventListener('input', () => {
            this.elements.essayTitle.value = titleCell.textContent.trim();
        });
        
        this.showPlaceholder();
    },
    
    showPlaceholder() {
        const contentArea = document.getElementById('contentArea');
        if (this.textGrid.length === 0) {
            contentArea.innerHTML = `
                <div class="grid-placeholder" style="padding: 60px 20px;">
                    <p style="font-size: 16px; color: #999;">📝 在此输入作文内容</p>
                    <p style="font-size: 12px; color: #ccc; margin-top: 8px;">支持直接粘贴文本，自动分格</p>
                </div>
            `;
        }
    },
    
    insertText(text) {
        const contentArea = document.getElementById('textGrid');
        contentArea.innerHTML = '';
        
        this.textGrid = [];
        this.charIndexToPosition = {};
        
        const lines = text.split('\n');
        let lineNumber = 1;
        let currentRowChars = [];
        let globalIndex = 0;
        
        lines.forEach((line, lineIndex) => {
            // 段落间隔
            if (lineIndex > 0) {
                // 先渲染当前行
                if (currentRowChars.length > 0) {
                    this.renderRow(contentArea, currentRowChars, lineNumber++, globalIndex - currentRowChars.length);
                    currentRowChars = [];
                }
                
                // 添加段落分隔
                const gap = document.createElement('div');
                gap.className = 'paragraph-gap';
                gap.dataset.para = '第' + this.toChinese(lineIndex + 1) + '段';
                contentArea.appendChild(gap);
            }
            
            const chars = line.split('');
            
            chars.forEach((char) => {
                currentRowChars.push(char);
                this.textGrid.push(char);
                globalIndex++;
                
                // 如果满一行，渲染这行
                if (currentRowChars.length === PAPER_CONFIG.CHARS_PER_LINE) {
                    this.renderRow(contentArea, currentRowChars, lineNumber++, globalIndex - currentRowChars.length);
                    currentRowChars = [];
                }
            });
        });
        
        // 渲染最后一行
        if (currentRowChars.length > 0) {
            this.renderRow(contentArea, currentRowChars, lineNumber++, globalIndex - currentRowChars.length);
        }
        
        // 添加空行供继续输入
        this.addEmptyRow(contentArea, lineNumber);
        
        // 聚焦到第一个格子
        const firstCell = contentArea.querySelector('.char-cell');
        if (firstCell) {
            this.focusCell(firstCell);
        }
        
        this.updateCharCount();
        this.updateLineNumbers();
    },
    
    renderRow(container, chars, lineNum, startIndex) {
        const row = document.createElement('div');
        row.className = 'char-row';
        row.dataset.line = lineNum;
        
        // 行号
        const lineNumEl = document.createElement('div');
        lineNumEl.className = 'line-number';
        lineNumEl.textContent = lineNum;
        row.appendChild(lineNumEl);
        
        // 字符格子
        chars.forEach((char, idx) => {
            const cell = this.createCharCell(char, startIndex + idx);
            row.appendChild(cell);
        });
        
        // 补齐空格子到每行标准字数
        const emptyCount = PAPER_CONFIG.CHARS_PER_LINE - chars.length;
        for (let i = 0; i < emptyCount; i++) {
            const emptyCell = this.createEmptyCell(startIndex + chars.length + i);
            row.appendChild(emptyCell);
        }
        
        container.appendChild(row);
    },
    
    addEmptyRow(container, lineNum) {
        const row = document.createElement('div');
        row.className = 'char-row';
        row.dataset.line = lineNum;
        row.id = 'lastRow';
        
        const lineNumEl = document.createElement('div');
        lineNumEl.className = 'line-number';
        lineNumEl.textContent = lineNum;
        row.appendChild(lineNumEl);
        
        const startIndex = this.textGrid.length;
        
        // 添加一个可编辑的空格子
        const firstCell = this.createCharCell('', startIndex, true);
        row.appendChild(firstCell);
        
        // 补齐剩余空格子
        for (let i = 1; i < PAPER_CONFIG.CHARS_PER_LINE; i++) {
            const emptyCell = this.createEmptyCell(startIndex + i);
            row.appendChild(emptyCell);
            this.textGrid.push('');
        }
        
        container.appendChild(row);
    },
    
    createEmptyCell(index) {
        const cell = document.createElement('div');
        cell.className = 'char-cell empty';
        cell.dataset.index = index;
        return cell;
    },
    
    createCharCell(char, index, isEnd = false) {
        const cell = document.createElement('div');
        cell.className = 'char-cell';
        if (!char) cell.classList.add('empty');
        cell.dataset.index = index;
        
        // 用 span 包裹文字，确保居中
        const span = document.createElement('span');
        span.className = 'char-content';
        span.textContent = char || '';
        cell.appendChild(span);
        
        // 鼠标按下开始选择
        cell.addEventListener('mousedown', (e) => {
            this.isSelecting = true;
            this.selectionStartCell = cell;
            this.clearSelection();
            this.selectCell(cell);
        });
        
        // 鼠标移入继续选择
        cell.addEventListener('mouseenter', () => {
            if (this.isSelecting && this.selectionStartCell) {
                this.selectRange(this.selectionStartCell, cell);
            }
        });
        
        // 鼠标抬起结束选择
        cell.addEventListener('mouseup', () => {
            this.isSelecting = false;
        });
        
        // 点击记录最后点击的格子
        cell.addEventListener('click', () => {
            this.lastClickedCell = cell;
            this.onCellClick(parseInt(cell.dataset.index));
        });
        
        // 双击选中整个格子内容
        cell.addEventListener('dblclick', () => {
            this.selectCell(cell);
            this.selectionStartCell = cell;
        });
        
        return cell;
    },
    
    selectCell(cell) {
        const idx = parseInt(cell.dataset.index);
        this.selectedRange = { start: idx, end: idx };
        this.highlightSelectedRange();
        this.updateAddButtonState();
    },
    
    selectRange(startCell, endCell) {
        const startIdx = parseInt(startCell.dataset.index);
        const endIdx = parseInt(endCell.dataset.index);
        this.selectedRange = {
            start: Math.min(startIdx, endIdx),
            end: Math.max(startIdx, endIdx)
        };
        this.highlightSelectedRange();
        this.updateAddButtonState();
    },
    
    clearSelection() {
        this.selectedRange = { start: null, end: null };
        document.querySelectorAll('.char-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.updateAddButtonState();
    },
    
    highlightSelectedRange() {
        // 清除之前的选中状态
        document.querySelectorAll('.char-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        if (this.selectedRange.start === null) return;
        
        // 高亮选中的范围
        for (let i = this.selectedRange.start; i <= this.selectedRange.end; i++) {
            const cell = this.getCellAtIndex(i);
            if (cell) {
                cell.classList.add('selected');
            }
        }
    },
    
    updateAddButtonState() {
        if (this.elements.addAnnotationBtn) {
            const hasSelection = this.selectedRange.start !== null;
            this.elements.addAnnotationBtn.disabled = !hasSelection;
            this.elements.addAnnotationBtn.textContent = hasSelection 
                ? '+ 添加批改到选中文字' 
                : '+ 添加批改';
        }
    },
    
    handleCellKeydown(e, cell) {
        const idx = parseInt(cell.dataset.index);
        const text = cell.textContent;
        const selection = window.getSelection();
        
        // 处理方向键
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (selection.focusOffset < text.length) {
                // 光标在单元格内向右移动
                selection.modify('move', 'forward', 'character');
            } else {
                // 跳到下一个格子
                const nextCell = this.getCellAtIndex(idx + 1);
                if (nextCell) this.focusCell(nextCell);
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (selection.focusOffset > 0) {
                selection.modify('move', 'backward', 'character');
            } else {
                const prevCell = this.getCellAtIndex(idx - 1);
                if (prevCell) this.focusCell(prevCell);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const aboveCell = this.getCellAbove(idx);
            if (aboveCell) this.focusCell(aboveCell);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const belowCell = this.getCellBelow(idx);
            if (belowCell) this.focusCell(belowCell);
        } else if (e.key === 'Backspace' && text === '' && idx > 0) {
            e.preventDefault();
            this.focusCell(this.getCellAtIndex(idx - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // 在当前位置插入换行（实际上是段落分隔）
            this.insertParagraphBreak(idx);
        }
    },
    
    appendContent(index, char) {
        const contentArea = document.getElementById('contentArea');
        const rows = contentArea.querySelectorAll('.char-row');
        const lastRow = rows[rows.length - 1];
        
        // 找到当前格子所在行
        let currentRow = null;
        let cellInRow = null;
        
        rows.forEach(row => {
            const cell = row.querySelector(`.char-cell[data-index="${index}"]`);
            if (cell) {
                currentRow = row;
                cellInRow = cell;
            }
        });
        
        if (!currentRow) return;
        
        // 检查是否需要新行
        const cellsInRow = currentRow.querySelectorAll('.char-cell');
        const lastCellInRow = cellsInRow[cellsInRow.length - 1];
        
        if (index === parseInt(lastCellInRow.dataset.index)) {
            // 在最后一行，添加新行
            const lineNum = rows.length + 1;
            this.renderRow(contentArea, [char], lineNum, this.textGrid.length);
            this.addEmptyRow(contentArea, lineNum + 1);
            this.updateLineNumbers();
            
            // 聚焦到新字符
            const newCell = contentArea.querySelector(`.char-cell[data-index="${index}"]`);
            if (newCell) {
                this.focusCell(newCell);
                // 清除内容让用户继续输入
                newCell.textContent = '';
                newCell.classList.add('empty');
                this.textGrid[index] = '';
            }
        } else {
            // 在行中间，更新格子
            cellInRow.classList.remove('empty');
        }
    },
    
    insertParagraphBreak(index) {
        const contentArea = document.getElementById('contentArea');
        const rows = contentArea.querySelectorAll('.char-row');
        
        // 找到当前格子
        let currentRow = null;
        rows.forEach(row => {
            if (row.querySelector(`.char-cell[data-index="${index}"]`)) {
                currentRow = row;
            }
        });
        
        if (!currentRow) return;
        
        // 获取当前行后面的所有格子
        let foundCurrent = false;
        const charsToMove = [];
        
        rows.forEach(row => {
            if (foundCurrent) {
                row.querySelectorAll('.char-cell').forEach(cell => {
                    const idx = parseInt(cell.dataset.index);
                    if (this.textGrid[idx]) {
                        charsToMove.push({ char: this.textGrid[idx], index: idx });
                    }
                });
            }
            if (row === currentRow) foundCurrent = true;
        });
        
        // 计算新段落位置
        const currentRowIndex = Array.from(rows).indexOf(currentRow);
        const paragraphGap = document.createElement('div');
        paragraphGap.className = 'paragraph-gap';
        paragraphGap.dataset.para = '第' + this.toChinese(this.countParagraphs() + 1) + '段';
        
        currentRow.parentNode.insertBefore(paragraphGap, currentRow.nextSibling);
        
        // 重建后面的行
        this.rebuildAfterParagraph(paragraphGap, charsToMove);
    },
    
    countParagraphs() {
        const gaps = document.querySelectorAll('.paragraph-gap');
        return gaps.length;
    },
    
    rebuildAfterParagraph(startNode, chars) {
        const contentArea = document.getElementById('contentArea');
        const rows = contentArea.querySelectorAll('.char-row');
        
        // 找到起始行的下一个兄弟节点
        let nextSibling = startNode.nextSibling;
        const charsToRemove = [];
        
        // 标记要删除的节点
        while (nextSibling && !nextSibling.classList?.contains('char-row')) {
            nextSibling = nextSibling.nextSibling;
        }
        
        // 收集所有要删除的行
        while (nextSibling) {
            charsToRemove.push(nextSibling);
            nextSibling = nextSibling.nextSibling;
        }
        
        // 删除节点
        charsToRemove.forEach(node => node.remove());
        
        // 重新渲染
        if (chars.length > 0) {
            let lineNum = 1;
            const rowsBefore = contentArea.querySelectorAll('.char-row');
            if (rowsBefore.length > 0) {
                lineNum = parseInt(rowsBefore[rowsBefore.length - 1].dataset.line) + 1;
            }
            
            let rowChars = [];
            let globalIndex = this.textGrid.filter((_, i) => {
                const cell = document.querySelector(`.char-cell[data-index="${i}"]`);
                return cell && !cell.classList.contains('empty') && cell.textContent;
            }).length;
            
            chars.forEach((item, i) => {
                rowChars.push(item.char);
                if (rowChars.length === PAPER_CONFIG.CHARS_PER_LINE) {
                    this.renderRow(contentArea, rowChars, lineNum++, globalIndex);
                    rowChars = [];
                    globalIndex += PAPER_CONFIG.CHARS_PER_LINE;
                }
            });
            
            if (rowChars.length > 0) {
                this.renderRow(contentArea, rowChars, lineNum++, globalIndex);
            }
            
            // 添加空行
            this.addEmptyRow(contentArea, lineNum);
        }
        
        this.updateLineNumbers();
    },
    
    splitTextToCells(startIndex, text) {
        const targetCell = this.getCellAtIndex(startIndex);
        if (!targetCell) return;
        
        const contentArea = document.getElementById('contentArea');
        const currentRow = targetCell.closest('.char-row');
        const rows = Array.from(contentArea.querySelectorAll('.char-row'));
        const currentRowIndex = rows.indexOf(currentRow);
        
        // 收集当前行中目标格子后面的字符
        const currentCells = currentRow.querySelectorAll('.char-cell');
        const cellIndex = currentCells.indexOf(targetCell);
        const charsAfter = [];
        
        for (let i = cellIndex + 1; i < currentCells.length; i++) {
            const idx = parseInt(currentCells[i].dataset.index);
            if (this.textGrid[idx]) {
                charsAfter.push({ char: this.textGrid[idx], index: idx });
            }
        }
        
        // 合并所有要插入的字符
        const allChars = text.split('').concat(charsAfter.map(c => c.char));
        
        // 重建当前行
        const lineNum = parseInt(currentRow.dataset.line);
        
        // 移除当前行后面的所有行和段落间隔
        let nextNode = currentRow.nextSibling;
        while (nextNode) {
            const toRemove = nextNode;
            nextNode = nextNode.nextSibling;
            toRemove.remove();
        }
        
        // 清空当前行后面部分的格子
        for (let i = cellIndex; i < currentCells.length; i++) {
            const idx = parseInt(currentCells[i].dataset.index);
            this.textGrid[idx] = '';
            currentCells[i].textContent = '';
            currentCells[i].classList.add('empty');
        }
        
        // 重新填充字符
        let globalIndex = startIndex;
        let rowChars = [];
        const charsInRowBefore = cellIndex;
        
        // 当前行已有的字符
        for (let i = 0; i < charsInRowBefore; i++) {
            const idx = parseInt(currentCells[i].dataset.index);
            if (this.textGrid[idx]) {
                rowChars.push(this.textGrid[idx]);
            }
        }
        
        // 添加新字符
        allChars.forEach((char, i) => {
            if (rowChars.length === PAPER_CONFIG.CHARS_PER_LINE) {
                // 满一行，渲染并创建新行
                this.renderRow(contentArea, rowChars, lineNum, globalIndex - rowChars.length);
                rowChars = [];
                globalIndex = startIndex + i;
            }
            rowChars.push(char);
        });
        
        // 渲染剩余字符
        if (rowChars.length > 0) {
            this.renderRow(contentArea, rowChars, lineNum, globalIndex - rowChars.length + rowChars.length);
        }
        
        // 添加空行
        this.addEmptyRow(contentArea, lineNum + Math.ceil((allChars.length + charsInRowBefore) / PAPER_CONFIG.CHARS_PER_LINE));
        
        this.updateLineNumbers();
        this.updateCharCount();
        
        // 聚焦
        const newCell = this.getCellAtIndex(startIndex);
        if (newCell) {
            this.focusCell(newCell);
            newCell.textContent = text[0];
            newCell.classList.remove('empty');
            this.textGrid[startIndex] = text[0];
        }
    },
    
    getCellAtIndex(index) {
        return document.querySelector(`.char-cell[data-index="${index}"]`);
    },
    
    getCellAbove(index) {
        const currentCell = this.getCellAtIndex(index);
        if (!currentCell) return null;
        
        const currentRow = currentCell.closest('.char-row');
        const rows = document.querySelectorAll('.char-row');
        const currentRowIndex = Array.from(rows).indexOf(currentRow);
        
        if (currentRowIndex <= 0) return null;
        
        const aboveRow = rows[currentRowIndex - 1];
        const aboveCells = aboveRow.querySelectorAll('.char-cell');
        
        // 找到同一列的格子
        const currentCells = currentRow.querySelectorAll('.char-cell');
        const cellIndex = Array.from(currentCells).indexOf(currentCell);
        
        if (aboveCells[cellIndex]) {
            return aboveCells[cellIndex];
        }
        
        // 如果上方行较短，返回最后一个格子
        return aboveCells[aboveCells.length - 1];
    },
    
    getCellBelow(index) {
        const currentCell = this.getCellAtIndex(index);
        if (!currentCell) return null;
        
        const currentRow = currentCell.closest('.char-row');
        const rows = document.querySelectorAll('.char-row');
        const currentRowIndex = Array.from(rows).indexOf(currentRow);
        
        if (currentRowIndex >= rows.length - 1) return null;
        
        const belowRow = rows[currentRowIndex + 1];
        const belowCells = belowRow.querySelectorAll('.char-cell');
        
        const currentCells = currentRow.querySelectorAll('.char-cell');
        const cellIndex = Array.from(currentCells).indexOf(currentCell);
        
        if (belowCells[cellIndex]) {
            return belowCells[cellIndex];
        }
        
        return belowCells[belowCells.length - 1];
    },
    
    updateLineNumbers() {
        const rows = document.querySelectorAll('.char-row');
        rows.forEach((row, i) => {
            const lineNum = row.querySelector('.line-number');
            if (lineNum) {
                lineNum.textContent = i + 1;
            }
            row.dataset.line = i + 1;
        });
    },
    
    focusCell(cell) {
        if (!cell) return;
        
        cell.focus();
        
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(cell);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    },
    
    getTextFromGrid() {
        return this.textGrid.join('');
    },
    
    updateCharCount() {
        const text = this.getTextFromGrid();
        this.elements.charCount.textContent = text.length + ' 字';
    },
    
    clearTextGrid() {
        // 保留标题和姓名，只清空内容
        const savedTitle = this.elements.essayTitle.value;
        const savedAuthor = this.elements.essayAuthor.value;
        this.sideComments = [];
        this.annotationCount = 0;
        this.lastClickedCell = null;
        this.clearSelection();
        
        const titleCell = document.getElementById('titleCell');
        const authorCell = document.getElementById('authorCell');
        
        titleCell.innerHTML = '<span class="title-placeholder">在此输入标题</span>';
        authorCell.textContent = '';
        
        this.initTextGrid();
        this.resetGradingPanel();
        this.clearHighlights();
        this.renderSideComments();
        
        // 恢复标题和姓名
        this.elements.essayTitle.value = savedTitle;
        this.elements.essayAuthor.value = savedAuthor;
    },
    
    onCellClick(index) {
        if (this.data && this.data.annotations) {
            const annotation = this.data.annotations.find(a => 
                index >= a.charIndex && index < a.charIndex + a.text.length
            );
            if (annotation) {
                const detailItems = this.elements.detailList.querySelectorAll('.detail-item');
                detailItems.forEach((item, idx) => {
                    if (idx < this.data.annotations.length && this.data.annotations[idx] === annotation) {
                        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        item.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.5)';
                        setTimeout(() => item.style.boxShadow = '', 2000);
                    }
                });
            }
        }
    },
    
    startGrading() {
        const text = this.getTextFromGrid();
        const title = this.elements.essayTitle.value.trim() || '未命名';
        
        if (!text) {
            this.showToast('请输入作文内容');
            return;
        }
        
        if (text.length < 50) {
            this.showToast('作文内容太短，请输入更多内容');
            return;
        }
        
        this.clearHighlights();
        
        const result = Grading.process(text, title);
        
        // 添加作者和旁批到结果
        result.author = this.elements.essayAuthor.value.trim();
        result.sideComments = this.sideComments;
        
        this.data = result;
        
        this.displayResult(result);
        this.highlightAnnotations(result.annotations);
        this.saveToHistory(result);
        
        this.showToast('批改完成');
    },
    
    displayResult(result) {
        const authorDisplay = result.author ? `<span class="label">姓名：</span><span class="value">${result.author}</span>` : '';
        this.elements.essayTitleDisplay.innerHTML = `
            <span class="label">标题：</span>
            <span class="value">${result.title}</span>
        `;

        // 显示分数详情
        this.displayScoreDetails(result.scores);

        // 动画显示总分圆环
        this.animateScoreRing(result.scores.overall);

        this.elements.overallComment.innerHTML = `<p>${result.comments.overall}</p>`;

        // 显示批注数量
        const annotationCount = document.getElementById('annotationCount');
        if (annotationCount) {
            annotationCount.textContent = result.annotations ? result.annotations.length : 0;
        }

        // 加载旁批
        this.loadSideComments(result.sideComments || []);
    },

    // 动画显示分数圆环
    animateScoreRing(score) {
        const scoreRingProgress = document.getElementById('scoreRingProgress');
        if (scoreRingProgress) {
            const circumference = 163; // 圆周长
            const offset = circumference - (score / 100 * circumference);
            scoreRingProgress.style.strokeDashoffset = offset;
        }
    },
    
    renderDetails(annotations) {
        this.currentAnnotations = annotations;
        
        this.elements.detailList.innerHTML = annotations.map((item, index) => `
            <div class="detail-item ${item.type}" data-index="${index}" data-char-index="${item.charIndex}">
                <div class="detail-content">
                    <span class="detail-number">${index + 1}</span>
                    <span class="tag ${item.type}">${this.getTypeLabel(item.type)}</span>
                    <span>${item.text}</span>
                </div>
                ${item.suggestion ? `<div class="detail-suggestion">建议修改：${item.suggestion}</div>` : ''}
            </div>
        `).join('');
        
        this.elements.detailList.querySelectorAll('.detail-item').forEach(item => {
            item.addEventListener('click', () => {
                const charIndex = parseInt(item.dataset.charIndex);
                this.scrollToChar(charIndex);
            });
        });
    },
    
    highlightAnnotations(annotations) {
        document.querySelectorAll('.char-cell').forEach(cell => {
            cell.classList.remove('error', 'suggest', 'content', 'praise', 'highlighted');
        });
        
        annotations.forEach(item => {
            for (let i = item.charIndex; i < item.charIndex + item.text.length; i++) {
                const cell = this.getCellAtIndex(i);
                if (cell) {
                    cell.classList.add(item.type);
                }
            }
        });
    },
    
    clearHighlights() {
        document.querySelectorAll('.char-cell').forEach(cell => {
            cell.classList.remove('error', 'suggest', 'content', 'praise', 'highlighted');
        });
    },
    
    scrollToChar(charIndex) {
        const cell = this.getCellAtIndex(charIndex);
        if (cell) {
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cell.classList.add('highlighted');
            setTimeout(() => cell.classList.remove('highlighted'), 2000);
        }
    },
    
    getTypeLabel(type) {
        const labels = { error: '✗ 错误', suggest: '🔧 建议', content: '💡 内容', praise: '✓ 表扬' };
        return labels[type] || type;
    },
    
    filterDetails(filter) {
        if (!this.currentAnnotations) return;
        document.querySelectorAll('.detail-item').forEach(item => {
            item.style.display = (filter === 'all' || item.dataset.type === filter) ? 'block' : 'none';
        });
    },
    
    resetGradingPanel() {
        this.elements.essayTitleDisplay.innerHTML = `<span class="label">标题：</span><span class="value">未命名</span>`;
        this.elements.totalScore.textContent = '0';

        // 重置分数圆环
        const scoreRingProgress = document.getElementById('scoreRingProgress');
        if (scoreRingProgress) {
            scoreRingProgress.style.strokeDashoffset = 163;
        }

        this.elements.overallComment.innerHTML = '<p>提交作文后将显示综合评价</p>';

        // 重置批注计数
        const annotationCount = document.getElementById('annotationCount');
        if (annotationCount) {
            annotationCount.textContent = '0';
        }

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
            const isSelected = this.selectedForComparison && this.selectedForComparison.id === item.id;
            const authorDisplay = item.author ? `👤 ${item.author} · ` : '';
            return `
                <div class="history-item ${this.comparisonMode ? 'comparison-selectable' : ''} ${isSelected ? 'selected-for-compare' : ''}" data-id="${item.id}">
                    <div class="history-info">
                        <h4>${item.title}</h4>
                        <div class="history-meta">${authorDisplay}${date} · ${item.stats.chars}字</div>
                    </div>
                    <div class="history-score">
                        <span class="score-badge ${scoreClass}">
                            <span>${item.scores.overall}</span>
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        if (this.comparisonMode) {
            // 对比模式下点击选择记录
            this.elements.historyList.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = parseInt(item.dataset.id);
                    const record = history.find(h => h.id === id);
                    if (record) {
                        this.selectForComparison(record);
                    }
                });
            });
        } else {
            // 普通模式下点击加载记录
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
        }
    },
    
    loadRecord(record) {
        this.clearTextGrid();
        
        // 设置标题和姓名
        const titleCell = document.getElementById('titleCell');
        if (record.title && record.title !== '未命名') {
            titleCell.textContent = record.title;
            this.elements.essayTitle.value = record.title;
        }
        
        // 设置作者姓名
        if (record.author) {
            this.elements.essayAuthor.value = record.author;
        }
        
        // 插入内容
        this.insertText(record.originalText);
        
        // 加载旁批
        if (record.sideComments && record.sideComments.length > 0) {
            this.annotationCount = Math.max(...record.sideComments.map(c => c.number));
            this.sideComments = record.sideComments;
            
            // 恢复标注标记
            record.sideComments.forEach(annotation => {
                this.addAnnotationMarker(annotation);
            });
            
            this.renderSideComments();
        }
        
        // 显示批改结果
        this.displayResult(record);
        this.highlightAnnotations(record.annotations);
        this.data = record;
    },
    
    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.remove('hidden');
        setTimeout(() => this.elements.toast.classList.add('hidden'), 2000);
    },
    
    toChinese(num) {
        const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        if (num <= 10) return chars[num];
        if (num < 20) return '十' + (chars[num % 10] || '');
        if (num < 100) {
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            return (tens > 1 ? chars[tens] : '') + '十' + (ones > 0 ? chars[ones] : '');
        }
        return num.toString();
    },
    
    // ========== 批改选择功能 ==========
    
    selectCell(cell) {
        const idx = parseInt(cell.dataset.index);
        this.selectedRange = { start: idx, end: idx };
        this.highlightSelectedRange();
        this.updateAddButtonState();
    },
    
    selectRange(startCell, endCell) {
        const startIdx = parseInt(startCell.dataset.index);
        const endIdx = parseInt(endCell.dataset.index);
        this.selectedRange = {
            start: Math.min(startIdx, endIdx),
            end: Math.max(startIdx, endIdx)
        };
        this.highlightSelectedRange();
        this.updateAddButtonState();
    },
    
    clearSelection() {
        this.selectedRange = { start: null, end: null };
        document.querySelectorAll('.char-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.updateAddButtonState();
    },
    
    highlightSelectedRange() {
        // 清除之前的选中状态
        document.querySelectorAll('.char-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        if (this.selectedRange.start === null) return;
        
        // 高亮选中的范围
        for (let i = this.selectedRange.start; i <= this.selectedRange.end; i++) {
            const cell = this.getCellAtIndex(i);
            if (cell) {
                cell.classList.add('selected');
            }
        }
    },
    
    updateAddButtonState() {
        if (this.elements.addAnnotationBtn) {
            const hasSelection = this.selectedRange.start !== null;
            this.elements.addAnnotationBtn.disabled = !hasSelection;
            this.elements.addAnnotationBtn.textContent = hasSelection 
                ? '+ 添加批改到选中文字' 
                : '+ 添加批改';
        }
    },
    
    // ========== 批改弹窗功能 ==========
    
    openCommentModal() {
        // 检查是否有选中文字，如果没有，使用第一个非空格子
        if (this.selectedRange.start === null) {
            const firstCell = document.querySelector('.char-cell:not(.empty)');
            if (firstCell) {
                const firstIdx = parseInt(firstCell.dataset.index);
                this.selectedRange = { start: firstIdx, end: firstIdx };
            } else {
                this.showToast('请先输入作文内容');
                return;
            }
        }
        
        // 显示选中的范围
        const startIdx = this.selectedRange.start + 1;
        const endIdx = this.selectedRange.end + 1;
        this.elements.selectedStart.textContent = startIdx;
        this.elements.selectedEnd.textContent = endIdx;
        
        // 如果有预设评语，直接填入
        if (this.pendingTemplateComment) {
            this.elements.commentInput.value = this.pendingTemplateComment;
            this.pendingTemplateComment = null;
        } else {
            this.elements.commentInput.value = '';
        }
        
        this.elements.commentModal.classList.remove('hidden');
        setTimeout(() => {
            this.elements.commentInput.focus();
            // 将光标移到末尾
            this.elements.commentInput.setSelectionRange(
                this.elements.commentInput.value.length,
                this.elements.commentInput.value.length
            );
        }, 100);
    },
    
    closeCommentModal() {
        this.elements.commentModal.classList.add('hidden');
        this.pendingTemplateComment = null;
        const redRadio = document.querySelector('input[name="commentColor"][value="red"]');
        if (redRadio) redRadio.checked = true;
    },
    
    confirmAddComment() {
        const comment = this.elements.commentInput.value.trim();
        if (!comment) {
            this.showToast('请输入批注内容');
            return;
        }
        
        const color = document.querySelector('input[name="commentColor"]:checked').value;
        
        let startIndex = this.selectedRange?.start;
        let lineNum = 1;
        
        if (startIndex === null) {
            // 模板评语没有选中文字，使用第一个非空格子
            const firstCell = document.querySelector('.char-cell:not(.empty)');
            if (firstCell) {
                startIndex = parseInt(firstCell.dataset.index);
                lineNum = parseInt(firstCell.closest('.char-row').dataset.line) || 1;
            } else {
                startIndex = 0;
            }
        } else {
            const startCell = this.getCellAtIndex(startIndex);
            if (startCell) {
                lineNum = parseInt(startCell.closest('.char-row').dataset.line) || 1;
            }
        }
        
        this.addSideComment(lineNum, comment, startIndex, color);
        this.showToast(`已添加批改 #${this.annotationCount}`);
        this.closeCommentModal();
    },
    
    // 旁批功能
    addSideComment(lineNum, comment, charIndex = null, color = 'red') {
        this.annotationCount++;
        const id = Date.now();
        const startIdx = charIndex !== null ? charIndex : (this.selectedRange?.start || 0);
        const endIdx = this.selectedRange?.end !== undefined ? this.selectedRange?.end : startIdx;
        
        const annotation = {
            id,
            number: this.annotationCount,
            lineNum,
            comment,
            color,
            charIndex: startIdx,
            startIndex: startIdx,
            endIndex: endIdx,
            timestamp: new Date().toISOString()
        };
        
        this.sideComments.push(annotation);
        
        // 根据批注类型设置选中文字的背景色
        if (color === 'yellow' || color === 'green') {
            // 建议或表扬：改变背景色
            for (let i = startIdx; i <= endIdx; i++) {
                const cell = this.getCellAtIndex(i);
                if (cell) {
                    cell.classList.remove('selected');
                    cell.classList.add('has-annotation');
                    cell.classList.add(`highlight-${color}`);
                }
            }
        }
        // 纠错：保持默认红色选中背景不变
        
        // 在文字上添加标注号
        if (annotation.startIndex !== null) {
            this.addAnnotationMarker(annotation);
        }
        
        // 清除选择
        this.clearSelection();
        
        this.renderSideComments();
        this.saveSideComments();
    },
    
    addAnnotationMarker(annotation) {
        // 找到起始格子
        const startCell = this.getCellAtIndex(annotation.startIndex);
        if (startCell) {
            // 检查是否已有标注
            const existingMarker = startCell.querySelector('.annotation-marker');
            if (existingMarker) existingMarker.remove();
            
            // 添加新标注
            const marker = document.createElement('div');
            marker.className = `annotation-marker ${annotation.color || 'red'}`;
            marker.textContent = annotation.number;
            marker.dataset.annotationId = annotation.id;
            startCell.appendChild(marker);
            
            // 标记格子有批改
            startCell.classList.add('has-annotation');
        }
        
        // 高亮选中的范围
        if (annotation.startIndex !== null && annotation.endIndex !== null) {
            for (let i = annotation.startIndex; i <= annotation.endIndex; i++) {
                const cell = this.getCellAtIndex(i);
                if (cell) {
                    cell.classList.add('has-annotation');
                    // 只有建议(yellow)和表扬(green)才改变背景色
                    if (annotation.color && annotation.color !== 'red') {
                        cell.classList.add(`highlight-${annotation.color}`);
                    }
                }
            }
        }
    },
    
    clearSelection() {
        this.selectedRange = { start: null, end: null };
        document.querySelectorAll('.char-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.updateAddButtonState();
    },
    
    renderSideComments() {
        const sideCommentBody = this.elements.sideCommentBody;
        if (!sideCommentBody) return;

        if (this.sideComments.length === 0) {
            sideCommentBody.innerHTML = `
                <div class="empty-state">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>选中文字后添加批注</p>
                </div>
            `;
            return;
        }

        const colorLabels = {
            red: '纠错',
            yellow: '建议',
            green: '表扬'
        };

        sideCommentBody.innerHTML = this.sideComments.map(item => `
            <div class="side-comment-item ${item.color || 'red'}" data-id="${item.id}" onclick="App.highlightAnnotation(${item.id})">
                <div class="comment-header">
                    <span class="comment-number ${item.color || 'red'}">${item.number}</span>
                    <span class="comment-color-label ${item.color || 'red'}">${colorLabels[item.color] || '纠错'}</span>
                    ${item.startIndex !== null && item.endIndex !== null && item.startIndex !== item.endIndex
                        ? `第 ${item.startIndex + 1}-${item.endIndex + 1} 字`
                        : item.startIndex !== null
                            ? `第 ${item.startIndex + 1} 字`
                            : `第 ${item.lineNum} 行`}
                </div>
                <div class="comment-text">${item.comment}</div>
                <button class="delete-btn" onclick="event.stopPropagation(); App.deleteSideComment(${item.id})">×</button>
            </div>
        `).join('');

        // 更新批注数量
        const annotationCount = document.getElementById('annotationCount');
        if (annotationCount) {
            annotationCount.textContent = this.sideComments.length;
        }
    },
    
    // 点击批注时高亮对应文字
    highlightAnnotation(id) {
        const annotation = this.sideComments.find(c => c.id === id);
        if (!annotation) return;
        
        // 清除之前的高亮
        document.querySelectorAll('.char-cell.highlight-active').forEach(cell => {
            cell.classList.remove('highlight-active');
        });
        
        // 高亮对应文字范围
        if (annotation.startIndex !== null) {
            const endIndex = annotation.endIndex !== null ? annotation.endIndex : annotation.startIndex;
            for (let i = annotation.startIndex; i <= endIndex; i++) {
                const cell = this.getCellAtIndex(i);
                if (cell) {
                    cell.classList.add('highlight-active');
                }
            }
            
            // 滚动到对应位置
            const startCell = this.getCellAtIndex(annotation.startIndex);
            if (startCell) {
                startCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    },
    
    deleteSideComment(id) {
        const annotation = this.sideComments.find(c => c.id === id);
        if (annotation) {
            // 移除标注
            const markerCell = this.getCellAtIndex(annotation.startIndex);
            if (markerCell) {
                const marker = markerCell.querySelector(`.annotation-marker[data-annotation-id="${id}"]`);
                if (marker) marker.remove();
            }
            
            // 清除有批改标记的格子（如果没有其他批改）
            document.querySelectorAll('.has-annotation').forEach(cell => {
                const remainingMarkers = cell.querySelectorAll('.annotation-marker');
                if (remainingMarkers.length === 0) {
                    cell.classList.remove('has-annotation');
                    cell.classList.remove('highlight-red', 'highlight-yellow', 'highlight-green');
                }
            });
        }
        
        this.sideComments = this.sideComments.filter(c => c.id !== id);
        this.renderSideComments();
        this.saveSideComments();
    },
    
    saveSideComments() {
        if (this.data) {
            this.data.sideComments = this.sideComments;
            this.saveToHistory(this.data);
        }
    },
    
    loadSideComments(comments) {
        this.sideComments = comments || [];
        this.renderSideComments();
    },
    
    // 显示分数详情
    displayScoreDetails(scores) {
        if (!scores) return;

        this.elements.scoreContent.style.setProperty('--progress', scores.content + '%');
        this.elements.scoreContentValue.textContent = scores.content;

        this.elements.scoreLanguage.style.setProperty('--progress', scores.language + '%');
        this.elements.scoreLanguageValue.textContent = scores.language;

        this.elements.scoreStructure.style.setProperty('--progress', scores.structure + '%');
        this.elements.scoreStructureValue.textContent = scores.structure;

        this.elements.scoreStyle.style.setProperty('--progress', scores.style + '%');
        this.elements.scoreStyleValue.textContent = scores.style;
    },
    
    // 历史对比功能
    enableComparisonMode() {
        this.comparisonMode = true;
        this.elements.historyComparison.classList.remove('hidden');
        this.elements.compareTip.classList.remove('hidden');
    },
    
    exitComparisonMode() {
        this.comparisonMode = false;
        this.selectedForComparison = null;
        this.elements.historyComparison.classList.add('hidden');
        this.elements.compareTip.classList.add('hidden');
        this.loadHistory();
    },
    
    selectForComparison(record) {
        if (!this.comparisonMode) {
            this.enableComparisonMode();
            this.selectedForComparison = record;
            this.showComparison(record, null);
        } else if (this.selectedForComparison && this.selectedForComparison.id !== record.id) {
            this.showComparison(this.selectedForComparison, record);
        } else if (!this.selectedForComparison) {
            this.selectedForComparison = record;
            this.showComparison(record, null);
        }
    },
    
    showComparison(record1, record2) {
        if (record1) {
            const date1 = new Date(record1.timestamp).toLocaleString();
            document.getElementById('compDate1').textContent = date1;
            document.getElementById('compScores1').innerHTML = this.renderComparisonScores(record1.scores);
        }
        
        if (record2) {
            const date2 = new Date(record2.timestamp).toLocaleString();
            document.getElementById('compDate2').textContent = date2;
            document.getElementById('compScores2').innerHTML = this.renderComparisonScores(record2.scores);
            
            // 计算进步
            const contentDiff = record2.scores.content - record1.scores.content;
            const languageDiff = record2.scores.language - record1.scores.language;
            const structureDiff = record2.scores.structure - record1.scores.structure;
            const styleDiff = record2.scores.style - record1.scores.style;
            const totalDiff = record2.scores.overall - record1.scores.overall;
            
            const summary = [];
            summary.push(`总分 ${totalDiff > 0 ? '+' : ''}${totalDiff} 分`);
            if (contentDiff !== 0) summary.push(`内容 ${contentDiff > 0 ? '+' : ''}${contentDiff}`);
            if (languageDiff !== 0) summary.push(`语言 ${languageDiff > 0 ? '+' : ''}${languageDiff}`);
            if (structureDiff !== 0) summary.push(`结构 ${structureDiff > 0 ? '+' : ''}${structureDiff}`);
            if (styleDiff !== 0) summary.push(`文采 ${styleDiff > 0 ? '+' : ''}${styleDiff}`);
            
            document.getElementById('comparisonSummary').innerHTML = `
                <strong>📈 进步分析：</strong>${summary.join('，')}
            `;
        } else {
            document.getElementById('compDate2').textContent = '';
            document.getElementById('compScores2').innerHTML = '<p style="color:#999">请选择另一条记录</p>';
            document.getElementById('comparisonSummary').innerHTML = '';
        }
    },
    
    renderComparisonScores(scores) {
        return `
            <div class="comparison-score-item">
                <span class="label">内容</span>
                <span class="value">${scores.content}</span>
            </div>
            <div class="comparison-score-item">
                <span class="label">语言</span>
                <span class="value">${scores.language}</span>
            </div>
            <div class="comparison-score-item">
                <span class="label">结构</span>
                <span class="value">${scores.structure}</span>
            </div>
            <div class="comparison-score-item">
                <span class="label">文采</span>
                <span class="value">${scores.style}</span>
            </div>
            <div class="comparison-score-item" style="grid-column: span 2; background: #fef3c7;">
                <span class="label">总分</span>
                <span class="value" style="color:#d97706;">${scores.overall}</span>
            </div>
        `;
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
        const sentences = text.split(/[。！？?!]/).filter(s => s.trim()).length;
        const paragraphs = text.split(/\n/).filter(p => p.trim()).length;
        return { chars, sentences, paragraphs };
    },
    
    analyzeText(text) {
        const annotations = [];
        let globalIndex = 0;
        
        const errors = [
            { wrong: '的的确确', correct: '的确' },
            { wrong: '零零散散', correct: '零散' },
            { wrong: '雪白雪白', correct: '雪白' },
            { wrong: '整整齐齐', correct: '整齐' },
            { wrong: '打扫的干干净净', correct: '打扫得干干净净' },
            { wrong: '感动的热泪盈眶', correct: '感动得热泪盈眶' },
            { wrong: '想您说', correct: '有话想对您说' },
            { wrong: '我觉的', correct: '我觉得' }
        ];
        
        errors.forEach(item => {
            let pos = text.indexOf(item.wrong);
            while (pos !== -1) {
                annotations.push({
                    type: 'error',
                    text: item.wrong,
                    suggestion: `改为"${item.correct}"`,
                    charIndex: pos
                });
                pos = text.indexOf(item.wrong, pos + 1);
            }
        });
        
        const suggestions = [
            { pattern: /然后/g, text: '连接词略显重复', type: 'suggest' },
            { pattern: /因为所以/g, text: '因果表达过于绝对', type: 'suggest' },
            { pattern: /非常/g, text: '可替换为更具体描写', type: 'suggest' }
        ];
        
        suggestions.forEach(item => {
            let match;
            const regex = new RegExp(item.pattern.source, 'g');
            while ((match = regex.exec(text)) !== null) {
                const pos = match.index;
                if (!annotations.some(a => a.charIndex <= pos && a.charIndex + a.text.length > pos)) {
                    annotations.push({ type: item.type, text: match[0], suggestion: item.text, charIndex: pos });
                }
            }
        });
        
        const paragraphs = text.split(/\n/).filter(p => p.trim());
        paragraphs.forEach((para, idx) => {
            if (para.length < 30 && idx > 0 && idx < paragraphs.length - 1) {
                annotations.push({
                    type: 'content',
                    text: `第${this.toChinese(idx + 1)}段内容概括`,
                    suggestion: '可增加细节描写',
                    charIndex: text.indexOf(para)
                });
            }
        });
        
        const lastPara = paragraphs[paragraphs.length - 1];
        if (lastPara && lastPara.length < 20) {
            annotations.push({
                type: 'content',
                text: '结尾略显简单',
                suggestion: '建议适当升华',
                charIndex: text.indexOf(lastPara)
            });
        }
        
        const goodExpressions = ['比喻', '拟人', '排比', '对比', '设问'];
        goodExpressions.forEach(expr => {
            let pos = text.indexOf(expr);
            while (pos !== -1) {
                annotations.push({ type: 'praise', text: `运用${expr}手法`, suggestion: null, charIndex: pos });
                pos = text.indexOf(expr, pos + 1);
            }
        });
        
        return annotations.sort((a, b) => a.charIndex - b.charIndex);
    },
    
    calculateScores(stats, annotations) {
        let content = 75, language = 75, structure = 75, style = 70;
        
        if (stats.chars >= 500) content += 10;
        if (stats.chars >= 800) content += 5;
        if (stats.paragraphs >= 4) content += 5;
        
        const errorCount = annotations.filter(a => a.type === 'error').length;
        const suggestCount = annotations.filter(a => a.type === 'suggest').length;
        language -= errorCount * 5;
        language -= suggestCount * 2;
        
        if (stats.paragraphs >= 3) structure += 10;
        
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
        const praiseCount = annotations.filter(a => a.type === 'praise').length;
        
        let overall = '';
        if (scores.overall >= 85) overall = '作文整体质量优秀，内容充实，结构清晰，语言流畅，继续保持！';
        else if (scores.overall >= 70) overall = '作文整体质量良好，思路清晰，表述清楚，继续努力可更上一层楼！';
        else if (scores.overall >= 60) overall = '作文基本完成要求，但还有一些方面需要改进。';
        else overall = '作文需要较大的修改，建议重点关注文章结构和内容完整性。';
        
        const positive = praiseCount > 0 ? `本文有${praiseCount}处亮点表达。` : '文章结构完整，叙事基本清晰。';
        
        const summary = [];
        if (errorCount > 0) summary.push(`${errorCount}处语法错误`);
        if (suggestCount > 0) summary.push(`${suggestCount}处可优化`);
        
        return {
            overall,
            positive,
            suggestionsSummary: summary.join('，') || '整体表达良好。'
        };
    },
    
    toChinese(num) {
        const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        if (num <= 10) return chars[num];
        if (num < 20) return '十' + (chars[num % 10] || '');
        if (num < 100) {
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            return (tens > 1 ? chars[tens] : '') + '十' + (ones > 0 ? chars[ones] : '');
        }
        return num.toString();
    }
};
