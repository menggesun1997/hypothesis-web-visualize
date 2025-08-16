/**
 * 排序筛选系统专用JavaScript
 * 专注于排序、筛选和数据分析功能
 */

class SortingApp {
    constructor() {
        this.currentFilters = {
            search: '',
            searchType: 'all',
            strategies: ['evolve', 'high_impact', 'similar'],
            minScore: null,
            maxScore: null,
            sortBy: 'overall_winner_score',
            sortOrder: 'desc'
        };
        this.currentPage = 1;
        this.perPage = 20;
        this.viewMode = 'grid';
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing sorting and filtering system...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Default load all hypotheses
            await this.loadAllHypotheses();
            
            console.log('✅ Sorting and filtering system initialization complete');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('System initialization failed: ' + error.message);
        }
    }









    async loadAllHypotheses() {
        try {
            console.log('🚀 Loading all hypotheses...');
            
            // 获取所有假设数据
            const response = await fetch('/api/hypotheses?per_page=100');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const hypotheses = data.hypotheses || data;
            console.log(`✅ Loaded ${hypotheses.length} hypotheses`);
            
            this.renderHypotheses(hypotheses, 'All Research Hypotheses');
            
        } catch (error) {
            console.error('Failed to load hypotheses:', error);
            this.showError('Failed to load hypotheses: ' + error.message);
        }
    }

    async showScoreAnalysis() {
        try {
            const response = await fetch('/api/analytics/score_distribution');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.showScoreAnalysisModal(data);
            
        } catch (error) {
            console.error('Failed to load score analysis:', error);
            this.showError('Failed to load score analysis: ' + error.message);
        }
    }

    showScoreAnalysisModal(data) {
        const modal = new bootstrap.Modal(document.getElementById('scoreAnalysisModal'));
        const modalBody = document.getElementById('scoreAnalysisModalBody');
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <canvas id="scoreDistributionChart"></canvas>
                </div>
                <div class="col-md-6">
                    <canvas id="scoreTrendChart"></canvas>
                </div>
            </div>
        `;
        
        modal.show();
        
        // 渲染图表
        this.renderScoreCharts(data);
    }

    renderScoreCharts(data) {
        // 评分分布饼图
        const ctx1 = document.getElementById('scoreDistributionChart').getContext('2d');
        new Chart(ctx1, {
            type: 'pie',
            data: {
                labels: Object.keys(data.score_distribution),
                datasets: [{
                    data: Object.values(data.score_distribution),
                    backgroundColor: [
                        '#28a745',
                        '#17a2b8',
                        '#ffc107',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Score Distribution'
                    }
                }
            }
        });
    }

    async exportToCSV() {
        try {
            const response = await fetch('/api/export/hypotheses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentFilters)
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hypotheses_export_${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('导出失败');
            }
            
        } catch (error) {
            console.error('Failed to export CSV:', error);
            this.showError('Failed to export CSV: ' + error.message);
        }
    }

    renderHypotheses(hypotheses, title) {
        const container = document.getElementById('content-area');
        const titleElement = document.getElementById('content-title');
        const countElement = document.getElementById('result-count');
        
        titleElement.innerHTML = `<i class="bi bi-info-circle"></i> ${title}`;
        countElement.textContent = `${hypotheses.length} results`;
        
        // 调试：查看第一个假设的数据结构
        if (hypotheses.length > 0) {
            console.log('🔍 First hypothesis data structure:', hypotheses[0]);
            console.log('🔍 Available score fields:', Object.keys(hypotheses[0]).filter(key => key.includes('score')));
            console.log('🔍 Overall score value:', hypotheses[0].overall_score);
            console.log('🔍 Overall winner score value:', hypotheses[0].overall_winner_score);
            console.log('🔍 Scores object:', hypotheses[0].scores);
        }
        
        let html = '<div class="row">';
        hypotheses.forEach(hypothesis => {
            // 获取假设的title，优先从hypothesis_content中解析
            let hypothesisTitle = 'Hypothesis #' + hypothesis.hypothesis_id;
            try {
                if (hypothesis.hypothesis_content) {
                    const content = JSON.parse(hypothesis.hypothesis_content);
                    if (content.title) {
                        hypothesisTitle = content.title;
                    }
                }
            } catch (e) {
                console.log('Could not parse hypothesis_content for title');
            }
            
            html += `
                <div class="col-lg-6 col-xl-4 mb-4">
                    <div class="card hypothesis-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-start">
                            <h6 class="card-title mb-0">${hypothesisTitle}</h6>
                            <span class="badge bg-success fs-6">${this.formatScore(hypothesis.scores?.overall_winner || hypothesis.scores?.overall || hypothesis.overall_winner_score || hypothesis.overall_score)}</span>
                        </div>
                        <div class="card-body">
                            <div class="hypothesis-metrics mb-3">
                                <div class="metric-item">
                                    <i class="bi bi-lightbulb text-success"></i>
                                    <span class="metric-label">Novelty:</span>
                                    <span class="metric-value">${this.formatScore(hypothesis.scores?.novelty || hypothesis.novelty_score || 'N/A')}</span>
                                </div>
                                <div class="metric-item">
                                    <i class="bi bi-star text-success"></i>
                                    <span class="metric-label">Significance:</span>
                                    <span class="metric-value">${this.formatScore(hypothesis.scores?.significance || hypothesis.significance_score || 'N/A')}</span>
                                </div>
                                <div class="metric-item">
                                    <i class="bi bi-check-circle text-success"></i>
                                    <span class="metric-label">Soundness:</span>
                                    <span class="metric-value">${this.formatScore(hypothesis.scores?.soundness || hypothesis.soundness_score || 'N/A')}</span>
                                </div>
                                <div class="metric-item">
                                    <i class="bi bi-gear text-success"></i>
                                    <span class="metric-label">Feasibility:</span>
                                    <span class="metric-value">${this.formatScore(hypothesis.scores?.feasibility || hypothesis.feasibility_score || 'N/A')}</span>
                                </div>
                            </div>
                            <div class="hypothesis-tags">
                                <span class="badge bg-secondary me-1">${hypothesis.subtopic_title || 'Topic ' + hypothesis.topic}</span>
                                <span class="badge bg-primary">${hypothesis.strategy}</span>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-primary btn-sm w-100" onclick="sortingApp.showHypothesisDetails(${hypothesis.id})">
                                <i class="bi bi-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    async showHypothesisDetails(hypothesisId) {
        try {
            const response = await fetch(`/api/hypothesis/${hypothesisId}`);
            const hypothesis = await response.json();
            
            if (hypothesis.error) {
                throw new Error(hypothesis.error);
            }
            
            this.showHypothesisModal(hypothesis);
            
        } catch (error) {
            console.error('Failed to load hypothesis details:', error);
            this.showError('Failed to load hypothesis details: ' + error.message);
        }
    }

    showHypothesisModal(hypothesis) {
        const modal = new bootstrap.Modal(document.getElementById('hypothesisModal'));
        const modalBody = document.getElementById('hypothesisModalBody');
        
        // 解析hypothesis_content
        let contentData = {};
        try {
            if (hypothesis.hypothesis_content) {
                contentData = JSON.parse(hypothesis.hypothesis_content);
            }
        } catch (e) {
            console.log('Could not parse hypothesis_content');
        }
        
        let contentHtml = '';
        if (Object.keys(contentData).length > 0) {
            Object.entries(contentData).forEach(([key, value]) => {
                if (value && typeof value === 'string' && value.trim()) {
                    const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                    contentHtml += `
                        <div class="content-field mb-3">
                            <h6 class="field-label">${displayKey}:</h6>
                            <div class="field-content">${value}</div>
                        </div>
                    `;
                }
            });
        } else {
            contentHtml = '<p class="text-muted">No content available</p>';
        }
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h6>Hypothesis Content</h6>
                    ${contentHtml}
                </div>
                <div class="col-md-4">
                    <h6>Score Details</h6>
                    <div class="score-details">
                        <div class="score-item">
                            <span class="score-label">Novelty:</span>
                            <span class="score-value">${this.formatScore(hypothesis.scores?.novelty || hypothesis.novelty_score || 'N/A')}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Significance:</span>
                            <span class="score-value">${this.formatScore(hypothesis.scores?.significance || hypothesis.significance_score || 'N/A')}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Soundness:</span>
                            <span class="score-value">${this.formatScore(hypothesis.scores?.soundness || hypothesis.soundness_score || 'N/A')}</span>
                        </div>
                        <div class="score-item">
                            <span class="score-label">Feasibility:</span>
                            <span class="score-value">${this.formatScore(hypothesis.scores?.feasibility || hypothesis.feasibility_score || 'N/A')}</span>
                        </div>
                        <div class="score-item total-score">
                            <span class="score-label">Overall Score:</span>
                            <span class="score-value">${this.formatScore(hypothesis.scores?.overall_winner || hypothesis.scores?.overall || hypothesis.overall_winner_score || hypothesis.overall_score || 'N/A')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.show();
    }

    setupEventListeners() {
        // 排序事件
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            this.loadHypotheses();
        });
        
        document.getElementById('sortOrder').addEventListener('change', (e) => {
            this.currentFilters.sortOrder = e.target.value;
            this.loadHypotheses();
        });
        
        // 显示数量事件
        document.getElementById('displayCount').addEventListener('change', (e) => {
            this.perPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadHypotheses();
        });
    }



    async loadHypotheses() {
        try {
            const params = new URLSearchParams({
                sort_by: this.currentFilters.sortBy,
                sort_order: this.currentFilters.sortOrder,
                page: this.currentPage,
                per_page: this.perPage,
                ...this.currentFilters.strategies.map(s => ['strategy', s]).flat()
            });
            
            const response = await fetch(`/api/hypotheses?${params}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.renderHypotheses(data.hypotheses || data, 'Filtered Results');
            
        } catch (error) {
            console.error('Failed to load hypotheses:', error);
            this.showError('Failed to load hypotheses: ' + error.message);
        }
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        // Re-render content
        this.loadHypotheses();
    }

    showStrategyModal() {
        // 显示策略筛选模态框
        const modal = new bootstrap.Modal(document.getElementById('strategyModal'));
        
        // 同步当前选中的策略状态
        document.getElementById('modalFilterEvolve').checked = this.currentFilters.strategies.includes('evolve');
        document.getElementById('modalFilterHighImpact').checked = this.currentFilters.strategies.includes('high_impact');
        document.getElementById('modalFilterSimilar').checked = this.currentFilters.strategies.includes('similar');
        
        modal.show();
    }
    
    applyStrategyFilters() {
        // 应用策略筛选
        const evolve = document.getElementById('modalFilterEvolve').checked;
        const highImpact = document.getElementById('modalFilterHighImpact').checked;
        const similar = document.getElementById('modalFilterSimilar').checked;
        
        // 更新策略筛选
        this.currentFilters.strategies = [];
        if (evolve) this.currentFilters.strategies.push('evolve');
        if (highImpact) this.currentFilters.strategies.push('high_impact');
        if (similar) this.currentFilters.strategies.push('similar');
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('strategyModal'));
        modal.hide();
        
        // 重新加载假设
        this.loadHypotheses();
    }

    showError(message) {
        const container = document.getElementById('content-area');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
    }

    formatScore(score) {
        // Format score value with proper handling
        if (score === null || score === undefined || score === '') {
            return 'N/A';
        }
        
        if (typeof score === 'number') {
            return score.toFixed(2);
        }
        
        if (typeof score === 'string') {
            const numScore = parseFloat(score);
            if (!isNaN(numScore)) {
                return numScore.toFixed(2);
            }
        }
        
        return score;
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Initialize application after page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded, initializing sorting and filtering system...');
    window.sortingApp = new SortingApp();
});
