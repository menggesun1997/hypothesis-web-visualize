/**
 * Research Hypothesis Visualization System
 * Topic Navigation Version
 */

class HypothesisApp {
    constructor() {
        this.currentTopic = null;
        this.currentSubtopic = null;
        this.currentCategory = null;
        this.currentPage = 1;
        this.perPage = 20;
        this.viewMode = 'grid';
        this.selectedStrategies = [];
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Research Hypothesis Visualization System...');
        
        try {
            // Initialize selected strategies - empty by default
            this.selectedStrategies = [];
            
            // Load topics for navigation
            await this.loadTopics();
            
            // Load quick stats for sidebar
            await this.loadQuickStats();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup initial strategy state
            this.setupInitialStrategyState();
            
            console.log('✅ System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize system:', error);
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Strategy filter change events
        document.addEventListener('change', (e) => {
            if (e.target.id === 'filterEvolve' || 
                e.target.id === 'filterHighImpact' || 
                e.target.id === 'filterSimilar') {
                
                console.log('🎯 Strategy filter changed:', e.target.id, e.target.checked);
                
                // Update selected strategies
                this.selectedStrategies = this.getSelectedStrategies();
                console.log('🔍 Updated selected strategies:', this.selectedStrategies);
                
                // If we have a current selection, reload hypotheses
                if (this.currentTopic && this.currentSubtopic !== undefined && this.currentCategory !== undefined) {
                    console.log('🔄 Reloading hypotheses with new strategy selection...');
                    this.loadHypotheses(this.currentTopic, this.currentSubtopic, this.currentCategory, this.selectedStrategies);
                }
                
                // Update UI
                this.updateStrategyUI();
            }
        });
        
        // Export CSV button
        const exportBtn = document.querySelector('button[onclick="app.exportToCSV()"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportToCSV();
            });
        }
        
        // Toggle view mode button
        const toggleBtn = document.querySelector('button[onclick="app.toggleViewMode()"]');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleViewMode();
            });
        }
        
        console.log('✅ Event listeners setup completed');
    }

    setupInitialStrategyState() {
        console.log('🔧 Setting up initial strategy state...');
        
        // Set initial checkbox states based on selectedStrategies
        const evolveCheckbox = document.getElementById('filterEvolve');
        const highImpactCheckbox = document.getElementById('filterHighImpact');
        const similarCheckbox = document.getElementById('filterSimilar');
        
        if (evolveCheckbox) evolveCheckbox.checked = this.selectedStrategies.includes('evolve');
        if (highImpactCheckbox) highImpactCheckbox.checked = this.selectedStrategies.includes('high_impact');
        if (similarCheckbox) similarCheckbox.checked = this.selectedStrategies.includes('similar');
        
        // Update UI to reflect current state
        this.updateStrategyUI();
        
        console.log('✅ Initial strategy state setup completed');
    }

    updateStrategyFilter(strategy, isChecked) {
        console.log(`🔍 Strategy filter change: ${strategy} -> ${isChecked}`);
        
        if (isChecked) {
            if (!this.selectedStrategies.includes(strategy)) {
                this.selectedStrategies.push(strategy);
                console.log(`✅ Added strategy: ${strategy}`);
            }
        } else {
            this.selectedStrategies = this.selectedStrategies.filter(s => s !== strategy);
            console.log(`❌ Removed strategy: ${strategy}`);
        }
        
        console.log('🔍 Currently selected strategies:', this.selectedStrategies);
        
        // Reload hypotheses if topic is selected
        if (this.currentTopic !== null && this.currentSubtopic !== null && this.currentCategory !== null) {
            console.log('🔄 Reloading hypotheses with strategy filter...');
            this.handleCategoryClick(this.currentTopic, this.currentSubtopic, this.currentCategory);
        } else {
            console.log('ℹ️ No topic selected, skipping reload');
        }
        
        // Update UI
        this.updateStrategyUI();
    }

    updateStrategyUI() {
        console.log('🎨 Updating strategy filter UI...');
        
        // Update button states based on checkbox states
        const evolveCheckbox = document.getElementById('filterEvolve');
        const highImpactCheckbox = document.getElementById('filterHighImpact');
        const similarCheckbox = document.getElementById('filterSimilar');
        
        if (evolveCheckbox) {
            const evolveLabel = evolveCheckbox.nextElementSibling;
            if (evolveLabel) {
                evolveLabel.classList.toggle('active', evolveCheckbox.checked);
            }
        }
        
        if (highImpactCheckbox) {
            const highImpactLabel = highImpactCheckbox.nextElementSibling;
            if (highImpactLabel) {
                highImpactLabel.classList.toggle('active', highImpactCheckbox.checked);
            }
        }
        
        if (similarCheckbox) {
            const similarLabel = similarCheckbox.nextElementSibling;
            if (similarLabel) {
                similarLabel.classList.toggle('active', similarCheckbox.checked);
            }
        }
        
        console.log('🎨 Strategy filter UI updated');
    }

    async loadQuickStats() {
        try {
            const response = await fetch('/api/analytics/score_distribution');
            const data = await response.json();
            
            console.log('🔍 Quick stats API response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.renderQuickStats(data);
            
        } catch (error) {
            console.error('Failed to load quick stats:', error);
            // 即使失败也尝试渲染默认状态
            this.renderQuickStats(null);
        }
    }

    renderQuickStats(data) {
        const container = document.getElementById('quick-stats-content');
        if (!container) return;
        
        let html = '';
        
        // 检查data和data.score_ranges是否存在
        if (data && data.score_ranges && typeof data.score_ranges === 'object') {
            Object.entries(data.score_ranges).forEach(([range, count]) => {
                const color = this.getScoreRangeColor(range);
                const icon = this.getScoreRangeIcon(range);
                
                html += `
                    <div class="quick-stat-item p-2 mb-2 rounded">
                        <div class="d-flex align-items-center">
                            <i class="bi ${icon} text-white me-2"></i>
                            <div class="text-white">
                                <small>${range}</small>
                                <div class="fw-bold">${count}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            // 如果没有数据，显示默认信息
            html = `
                <div class="quick-stat-item p-2 mb-2 rounded">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-info-circle text-white me-2"></i>
                        <div class="text-white">
                            <small>No data</small>
                            <div class="fw-bold">Available</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    getScoreRangeColor(range) {
        const colors = {
            '0-2': 'bg-danger',
            '2-4': 'bg-warning',
            '4-6': 'bg-info',
            '6-8': 'bg-primary',
            '8-10': 'bg-success'
        };
        return colors[range] || 'bg-secondary';
    }

    getScoreRangeIcon(range) {
        const icons = {
            '0-2': 'bi-exclamation-triangle',
            '2-4': 'bi-exclamation-circle',
            '4-6': 'bi-info-circle',
            '6-8': 'bi-check-circle',
            '8-10': 'bi-star'
        };
        return icons[range] || 'bi-question-circle';
    }

    async loadTopics() {
        try {
            const response = await fetch('/api/topics');
            const topics = await response.json();
            
            if (topics.error) {
                throw new Error(topics.error);
            }
            
            this.renderTopics(topics);
            
        } catch (error) {
            console.error('Failed to load topics:', error);
        }
    }

    async renderTopics(topics) {
        const container = document.getElementById('topics-tree');
        container.innerHTML = '';
        
        for (const topic of topics) {
            try {
                // Get subtopic titles for this topic
                const subtopicResponse = await fetch(`/api/subtopics/${topic.id}`);
                const subtopics = await subtopicResponse.json();
                
                let displayTitle = `Topic ${topic.id}`;
                let originalTitle = topic.title || `Topic ${topic.id}`;
                
                if (subtopics && subtopics.length > 0) {
                    displayTitle = subtopics[0].title || `Topic ${topic.id}`;
                }
                
                const topicHtml = `
                    <div class="topic-item mb-3">
                        <div class="topic-header" onclick="app.toggleTopic(${topic.id})">
                            <div class="topic-icon">
                                <i class="bi bi-chevron-right" id="topic-icon-${topic.id}"></i>
                    </div>
                            <div class="topic-title-container">
                                <div class="topic-main-title">${displayTitle}</div>
                                <div class="topic-subtitle">${originalTitle}</div>
                            </div>
                        </div>
                        <div class="topic-content" id="topic-content-${topic.id}" style="display: none;">
                            <div class="subtopics-container" id="subtopics-${topic.id}">
                                <!-- Subtopics will be loaded here -->
                        </div>
                    </div>
                </div>
            `;
                
                container.innerHTML += topicHtml;
            } catch (error) {
                console.error(`Failed to load subtopics for topic ${topic.id}:`, error);
                // Fallback: render topic without subtopics
                const topicHtml = `
                    <div class="topic-item mb-3">
                        <div class="topic-header" onclick="app.toggleTopic(${topic.id})">
                            <div class="topic-icon">
                                <i class="bi bi-chevron-right" id="topic-icon-${topic.id}"></i>
                            </div>
                            <div class="topic-title-container">
                                <div class="topic-main-title">Topic ${topic.id}</div>
                                <div class="topic-subtitle">${topic.title || `Topic ${topic.id}`}</div>
                            </div>
                        </div>
                        <div class="topic-content" id="topic-content-${topic.id}" style="display: none;">
                            <div class="subtopics-container" id="subtopics-${topic.id}">
                                <!-- Subtopics will be loaded here -->
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += topicHtml;
            }
        }
    }

    async toggleTopic(topicId) {
        const content = document.getElementById(`topic-content-${topicId}`);
        const icon = document.getElementById(`topic-icon-${topicId}`);
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.className = 'bi bi-chevron-down';
            await this.loadSubtopics(topicId);
        } else {
            content.style.display = 'none';
            icon.className = 'bi bi-chevron-right';
        }
    }

    async loadSubtopics(topicId) {
        try {
            const response = await fetch(`/api/subtopics/${topicId}`);
            const subtopics = await response.json();
            
            if (subtopics.error) {
                throw new Error(subtopics.error);
            }
            
            this.renderSubtopics(topicId, subtopics);
            
        } catch (error) {
            console.error('Failed to load subtopics:', error);
        }
    }

        renderSubtopics(topicId, subtopics) {
        const container = document.getElementById(`subtopics-${topicId}`);
        if (!container) return;
        
        // 获取literature_agent数据来显示category
        this.loadSubtopicCategories(topicId, subtopics, container);
    }

    async loadSubtopicCategories(topicId, subtopics, container) {
        let html = '';
        
        for (let index = 0; index < subtopics.length; index++) {
            try {
                const response = await fetch(`/api/literature_agent/${topicId}/${index}`);
                const literatureData = await response.json();
                
                html += `
                    <div class="subtopic-item mb-2">
                        <div class="subtopic-header" onclick="app.handleSubtopicClick(${topicId}, ${index})">
                            <div class="subtopic-icon">
                                <i class="bi bi-lightbulb text-warning"></i>
                            </div>
                            <div class="subtopic-content">
                                <div class="subtopic-title">${subtopics[index].title || `Subtopic ${index}`}</div>
                                ${literatureData.topic_category ? `<div class="subtopic-category">${literatureData.topic_category}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`Error loading category for subtopic ${index}:`, error);
                html += `
                    <div class="subtopic-item mb-2">
                        <div class="subtopic-header" onclick="app.handleSubtopicClick(${topicId}, ${index})">
                            <div class="subtopic-icon">
                                <i class="bi bi-lightbulb text-warning"></i>
                            </div>
                            <div class="subtopic-content">
                                <div class="subtopic-title">${subtopics[index].title || `Subtopic ${index}`}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
    }

    async handleSubtopicClick(topicId, subtopicIndex) {
        console.log(`🎯 Subtopic clicked: Topic ${topicId}, Subtopic ${subtopicIndex}`);
        
        // Update current selection
        this.currentTopic = topicId;
        this.currentSubtopic = subtopicIndex;
        this.currentCategory = 0; // Default category
        
        // Load subtopic details and current analysis
        await this.loadSubtopicDetails(topicId, subtopicIndex);
        
        // Clear any existing hypotheses
        this.clearHypotheses();
        
        // Show message to select strategies
        this.showMessage('Please select strategies above to view hypotheses', 'info');
        
        // Update strategy filter UI
        this.updateStrategyUI();
        
        // Highlight selected subtopic
        this.highlightSelectedSubtopic(topicId, subtopicIndex);
    }

    async loadCategories(topicId, subtopicIndex) {
        try {
            const response = await fetch(`/api/categories/${topicId}/${subtopicIndex}`);
            const categories = await response.json();
            
            if (categories.error) {
                throw new Error(categories.error);
            }
            
            this.renderCategories(topicId, subtopicIndex, categories);
            
        } catch (error) {
            console.error(`Failed to load categories for topic ${topicId}, subtopic ${subtopicIndex}:`, error);
        }
    }

    renderCategories(topicId, subtopicIndex, categories) {
        const container = document.getElementById(`categories-${topicId}-${subtopicIndex}`);
            
            let html = '';
        categories.forEach((category, index) => {
                html += `
                <div class="category-item mb-2">
                    <div class="category-header" onclick="app.handleCategoryClick(${topicId}, ${subtopicIndex}, ${index})">
                        <div class="category-name">${category.name || `Category ${index}`}</div>
                        <div class="category-count">${category.count || 0}</div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
    }

    async handleCategoryClick(topicId, subtopicIndex, categoryIndex) {
        console.log(`🎯 Category clicked: Topic ${topicId}, Subtopic ${subtopicIndex}, Category ${categoryIndex}`);
        
        // Update current selection
        this.currentTopic = topicId;
        this.currentSubtopic = subtopicIndex;
        this.currentCategory = categoryIndex;
        
        // Update UI to show we're in a subtopic
        this.updateContentTitle(`Topic ${topicId} - Subtopic ${subtopicIndex}`);
        
        // Load subtopic details and current analysis
        await this.loadSubtopicDetails(topicId, subtopicIndex);
        
        // Clear any existing hypotheses
        this.clearHypotheses();
        
        // Show message to select strategies
        this.showMessage('Please select strategies above to view hypotheses', 'info');
        
        // Update strategy filter UI
        this.updateStrategyUI();
    }

    async loadSubtopicDetails(topicId, subtopicIndex) {
        try {
            console.log(`🔍 Loading subtopic details for Topic ${topicId}, Subtopic ${subtopicIndex}`);
            
            // Load description and search_queries from literature_agent table
            const literatureResponse = await fetch(`/api/literature_agent/${topicId}/${subtopicIndex}`);
            if (literatureResponse.ok) {
                const literatureData = await literatureResponse.json();
                this.renderSubtopicKeywords(topicId, subtopicIndex, literatureData);
            } else {
                console.warn('⚠️ Failed to load literature agent data');
            }
            
            // Load current analysis from analyzer_agent table
            const analysisResponse = await fetch(`/api/analyzer_analysis/${topicId}/${subtopicIndex}`);
            if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();
                this.renderCurrentAnalysis(topicId, subtopicIndex, analysisData);
            } else {
                console.warn('⚠️ Failed to load analyzer agent data');
            }
            
        } catch (error) {
            console.error('Failed to load subtopic details:', error);
        }
    }

    renderSubtopicKeywords(topicId, subtopicIndex, literatureData) {
        const container = document.getElementById('subtopic-keywords');
        if (!container) return;
        
        console.log('🎨 Rendering subtopic keywords with data:', literatureData);
        
        let html = '<div class="info-cards-container">';
        

        
        // Research Description Card
        if (literatureData.description) {
            html += `
                <div class="info-card research-desc">
                    <div class="info-card-header">
                        <i class="bi bi-file-text info-card-icon"></i>
                        <h6 class="info-card-title">Research Description</h6>
                    </div>
                    <div class="info-card-content">
                        <p class="description-text">${literatureData.description}</p>
                </div>
            </div>
        `;
        }
        
        // Search Queries Card
        if (literatureData.search_queries) {
            // Parse search_queries if it's a string
            let searchQueries = literatureData.search_queries;
            if (typeof searchQueries === 'string') {
                try {
                    // Try to parse as JSON first
                    searchQueries = JSON.parse(searchQueries);
                } catch (e) {
                    // If not JSON, treat as plain text
                    searchQueries = [searchQueries];
                }
            }
            
            if (Array.isArray(searchQueries)) {
                html += `
                    <div class="info-card search-queries">
                        <div class="info-card-header">
                            <i class="bi bi-search info-card-icon"></i>
                            <h6 class="info-card-title">Search Queries & Keywords</h6>
                    </div>
                        <div class="info-card-content">
                            <div class="keywords-container">
                                ${searchQueries.map(query => 
                                    `<span class="badge">${query.replace(/[\[\]"]/g, '')}</span>`
                                ).join('')}
                </div>
                    </div>
                    </div>
                `;
            } else if (typeof searchQueries === 'string') {
                // Clean up the string by removing brackets and quotes
                const cleanQuery = searchQueries.replace(/[\[\]"]/g, '');
                html += `
                    <div class="info-card search-queries">
                        <div class="info-card-header">
                            <i class="bi bi-search info-card-icon"></i>
                            <h6 class="info-card-title">Search Queries</h6>
                    </div>
                        <div class="info-card-content">
                            <p class="search-query-text">${cleanQuery}</p>
                </div>
                    </div>
                `;
            }
        }
        


        html += '</div>';
        container.innerHTML = html;
        
        console.log('✅ Subtopic keywords rendered successfully');
    }

    renderCurrentAnalysis(topicId, subtopicIndex, analysisData) {
        const container = document.getElementById('current-analysis');
        if (!container) return;
        
        if (analysisData.current_analysis) {
            try {
                // Parse the current_analysis JSON to extract the analysis field
                const analysis = JSON.parse(analysisData.current_analysis);
                let analysisContent = '';
                
                if (analysis && analysis.analysis) {
                    // Extract all analysis field content
                    const analysisObj = analysis.analysis;
                    analysisContent = '';
                    
                    if (analysisObj.title) {
                        analysisContent += `<strong>Title:</strong> ${analysisObj.title}<br><br>`;
                    }
                    
                    if (analysisObj.current_research_landscape) {
                        analysisContent += `<strong>Current Research Landscape:</strong><br>${analysisObj.current_research_landscape}<br><br>`;
                    }
                    
                    if (analysisObj.critical_gaps) {
                        analysisContent += `<strong>Critical Gaps:</strong><br>${analysisObj.critical_gaps}<br><br>`;
                    }
                    
                    if (analysisObj.high_potential_innovation_opportunities) {
                        analysisContent += `<strong>High Potential Innovation Opportunities:</strong><br>${analysisObj.high_potential_innovation_opportunities}<br><br>`;
                    }
                    
                    // Remove the last <br><br> if content exists
                    if (analysisContent) {
                        analysisContent = analysisContent.replace(/<br><br>$/, '');
                    }
                    
                    // If no specific fields found, show the whole analysis object
                    if (!analysisContent && typeof analysisObj === 'object') {
                        analysisContent = JSON.stringify(analysisObj, null, 2);
                    }
                } else {
                    // If no analysis field, show the raw content
                    analysisContent = analysisData.current_analysis;
                }
                
                const html = `
                    <div class="info-card analysis">
                        <div class="info-card-header">
                            <i class="bi bi-graph-up info-card-icon"></i>
                            <h6 class="info-card-title">Current Research Analysis</h6>
                        </div>
                        <div class="info-card-content">
                            <div class="analysis-content">${analysisContent}</div>
                        </div>
                    </div>
                `;
                container.innerHTML = html;
            } catch (e) {
                // If parsing fails, show the raw content
                const html = `
                    <div class="info-card analysis">
                        <div class="info-card-header">
                            <i class="bi bi-graph-up info-card-icon"></i>
                            <h6 class="info-card-title">Current Research Analysis</h6>
                        </div>
                        <div class="info-card-content">
                            <div class="analysis-content">${analysisData.current_analysis}</div>
                        </div>
                    </div>
                `;
                container.innerHTML = html;
            }
        } else {
            container.innerHTML = '';
        }
    }

    async loadHypotheses() {
        if (!this.currentTopic || this.currentSubtopic === null) {
            console.warn('⚠️ No topic or subtopic selected');
            return;
        }

        try {
            // Get selected strategies
            const selectedStrategies = this.getSelectedStrategies();
            if (selectedStrategies.length === 0) {
                this.showMessage('Please select at least one strategy to view hypotheses', 'warning');
                return;
            }

            console.log(`🔍 Loading hypotheses for Topic ${this.currentTopic}, Subtopic ${this.currentSubtopic}`);
            console.log(`📋 Selected strategies:`, selectedStrategies);

            // Build query parameters
            const params = new URLSearchParams();
            params.append('topic', this.currentTopic);
            params.append('subtopic', this.currentSubtopic);
            params.append('category', 0); // 添加category参数
            
            // Add strategy parameters
            selectedStrategies.forEach(strategy => {
                params.append('strategy', strategy);
            });

            console.log('🔍 Fetching from URL:', `/api/hypotheses?${params.toString()}`);
            
            const response = await fetch(`/api/hypotheses?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log('🔍 API response data:', data);
            console.log(`✅ Loaded ${data.hypotheses.length} hypotheses`);
            
            // 检查第一个假设的数据结构
            if (data.hypotheses.length > 0) {
                const firstHypothesis = data.hypotheses[0];
                console.log('🔍 First hypothesis raw data:', firstHypothesis);
                console.log('🔍 First hypothesis scores:', {
                    novelty_score: firstHypothesis.novelty_score,
                    significance_score: firstHypothesis.significance_score,
                    soundness_score: firstHypothesis.soundness_score,
                    feasibility_score: firstHypothesis.feasibility_score,
                    overall_winner_score: firstHypothesis.overall_winner_score
                });
            }
            
            this.renderHypotheses(data.hypotheses);
            
        } catch (error) {
            console.error('Failed to load hypotheses:', error);
            this.showMessage(`Failed to load hypotheses: ${error.message}`, 'error');
        }
    }

        renderHypotheses(hypotheses) {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) {
            console.error('❌ Content area not found');
            return;
        }

        if (!hypotheses || hypotheses.length === 0) {
            contentArea.innerHTML = `
                <div class="message-container warning">
                    <p class="message-text">
                        <i class="bi bi-exclamation-triangle"></i>
                        No hypotheses found for the selected criteria.
                    </p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="hypotheses-container">
                <div class="row">
        `;

        hypotheses.forEach((hypothesis, index) => {
            // 获取标题和分数
            let title = '';
            let scores = {};
            
            // 尝试从hypothesis_content中获取标题
            if (hypothesis.hypothesis_content) {
                try {
                    const content = typeof hypothesis.hypothesis_content === 'string' 
                        ? JSON.parse(hypothesis.hypothesis_content) 
                        : hypothesis.hypothesis_content;
                    
                    console.log('🔍 Parsed content:', content);
                    console.log('🔍 Content scores:', content.scores);
                    
                    // 获取标题
                    title = content.title || content.hypothesis_title || content.hypothesis || `Hypothesis ${index + 1}`;
                    
                    // 获取分数
                    if (content.scores) {
                        scores = {
                            novelty_score: content.scores.novelty_score || content.scores.novelty || 'N/A',
                            significance_score: content.scores.significance_score || content.scores.significance || 'N/A',
                            soundness_score: content.scores.soundness_score || content.scores.soundness || 'N/A',
                            feasibility_score: content.scores.feasibility_score || content.scores.feasibility || 'N/A',
                            overall_score: content.scores.overall_score || content.scores.overall || content.scores.overall_winner || 'N/A'
                        };
                        console.log('🔍 Extracted scores from content:', scores);
                    } else {
                        console.log('🔍 No scores found in content.scores');
                    }
                    
                    // 如果从hypothesis_content中没有获取到分数，尝试从API返回的scores字段获取
                    if (Object.keys(scores).length === 0 || Object.values(scores).every(score => score === 'N/A')) {
                        console.log('🔍 Trying to get scores from API scores field');
                        if (hypothesis.scores) {
                            scores = {
                                novelty_score: hypothesis.scores.novelty_score || hypothesis.scores.novelty || 'N/A',
                                significance_score: hypothesis.scores.significance_score || hypothesis.scores.significance || 'N/A',
                                soundness_score: hypothesis.scores.soundness_score || hypothesis.scores.soundness || 'N/A',
                                feasibility_score: hypothesis.scores.feasibility_score || hypothesis.scores.feasibility || 'N/A',
                                overall_score: hypothesis.scores.overall_score || hypothesis.scores.overall || hypothesis.scores.overall_winner || 'N/A'
                            };
                            console.log('🔍 Extracted scores from API scores field:', scores);
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse hypothesis content:', e);
                    title = `Hypothesis ${index + 1}`;
                }
            } else {
                console.log('🔍 No hypothesis_content found');
            }
            
            // 如果从hypothesis_content中没有获取到分数，尝试从数据库字段获取
            if (Object.keys(scores).length === 0 || Object.values(scores).every(score => score === 'N/A')) {
                console.log('🔍 Falling back to database fields');
                scores = {
                    novelty_score: hypothesis.novelty_score || 'N/A',
                    significance_score: hypothesis.significance_score || 'N/A',
                    soundness_score: hypothesis.soundness_score || 'N/A',
                    feasibility_score: hypothesis.feasibility_score || 'N/A',
                    overall_score: hypothesis.overall_winner_score || 'N/A'
                };
                console.log('🔍 Database scores:', scores);
            }
            
            // 如果还是没有标题，使用默认标题
            if (!title) {
                title = `Hypothesis ${index + 1}`;
            }

            // 详细调试信息
            console.log('🔍 Hypothesis data:', {
                id: hypothesis.id,
                title: title,
                hypothesis_content: hypothesis.hypothesis_content ? 'EXISTS' : 'NULL',
                hypothesis_content_type: typeof hypothesis.hypothesis_content,
                parsed_scores: scores,
                db_scores: {
                    novelty_score: hypothesis.novelty_score,
                    significance_score: hypothesis.significance_score,
                    soundness_score: hypothesis.soundness_score,
                    feasibility_score: hypothesis.feasibility_score,
                    overall_winner_score: hypothesis.overall_winner_score
                },
                raw_hypothesis: hypothesis
            });

            html += `
                <div class="col-lg-6 col-xl-4 mb-4">
                    <div class="hypothesis-card">
                        <div class="hypothesis-header">
                            <h6 class="hypothesis-title">${title}</h6>
                            <div class="hypothesis-meta">
                                <span class="badge bg-secondary">${hypothesis.strategy || 'Unknown'}</span>
                                <span class="badge bg-info">${hypothesis.sub_topic !== null && hypothesis.sub_topic !== undefined ? hypothesis.sub_topic : 'Unknown'}</span>
                            </div>
                        </div>
                        
                        <div class="score-panel">
                            <div class="score-item">
                                <span class="score-label">Novelty:</span>
                                <span class="score-value">${typeof scores.novelty_score === 'number' ? scores.novelty_score.toFixed(2) : scores.novelty_score}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Significance:</span>
                                <span class="score-value">${typeof scores.significance_score === 'number' ? scores.significance_score.toFixed(2) : scores.significance_score}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Soundness:</span>
                                <span class="score-value">${typeof scores.soundness_score === 'number' ? scores.soundness_score.toFixed(2) : scores.soundness_score}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Feasibility:</span>
                                <span class="score-value">${typeof scores.feasibility_score === 'number' ? scores.feasibility_score.toFixed(2) : scores.feasibility_score}</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">Overall:</span>
                                <span class="score-value">${typeof scores.overall_score === 'number' ? scores.overall_score.toFixed(2) : scores.overall_score}</span>
                            </div>
                        </div>
                        
                        <div class="hypothesis-actions">
                            <button class="btn btn-primary btn-sm" onclick="app.showHypothesisModal(${JSON.stringify(hypothesis).replace(/"/g, '&quot;')})">
                                <i class="bi bi-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        contentArea.innerHTML = html;
        console.log('✅ Hypotheses rendered successfully');
    }

    async showHypothesisDetails(hypothesisId) {
        try {
            // Try different API endpoints
            let response = await fetch(`/api/hypothesis/${hypothesisId}`);
            
            if (!response.ok) {
                // Fallback to another endpoint
                response = await fetch(`/api/hypotheses?hypothesis_id=${hypothesisId}`);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Handle different data formats
            const hypothesis = Array.isArray(data) ? data[0] : data;
            
            this.showHypothesisModal(hypothesis);
            
        } catch (error) {
            console.error('Failed to load hypothesis details:', error);
            this.showError('Failed to load hypothesis details: ' + error.message);
        }
    }

    showHypothesisModal(hypothesis) {
        const modal = new bootstrap.Modal(document.getElementById('hypothesisModal'));
        const modalBody = document.getElementById('hypothesisModalBody');
        
        // Handle different input types
        let hypothesisData = hypothesis;
        if (typeof hypothesis === 'string') {
            try {
                hypothesisData = JSON.parse(hypothesis);
            } catch (e) {
                console.error('Failed to parse hypothesis string:', e);
                return;
            }
        }
        
        console.log('🔍 Modal hypothesis data:', hypothesisData);
        
        // Parse hypothesis_content JSON data
        let contentData = {};
        try {
            if (hypothesisData.hypothesis_content && typeof hypothesisData.hypothesis_content === 'string') {
                contentData = JSON.parse(hypothesisData.hypothesis_content);
            } else if (hypothesisData.hypothesis_content && typeof hypothesisData.hypothesis_content === 'object') {
                contentData = hypothesisData.hypothesis_content;
            }
        } catch (e) {
            console.warn('Failed to parse hypothesis_content:', e);
        }
        
        // Parse feedback_results JSON data
        let feedbackData = {};
        try {
            if (hypothesisData.feedback_results && typeof hypothesisData.feedback_results === 'string') {
                feedbackData = JSON.parse(hypothesisData.feedback_results);
            } else if (hypothesisData.feedback_results && typeof hypothesisData.feedback_results === 'object') {
                feedbackData = hypothesisData.feedback_results;
            }
        } catch (e) {
            console.warn('Failed to parse feedback_results:', e);
        }
        
        console.log('🔍 Parsed feedback data:', feedbackData);
        console.log('🔍 Feedback results structure:', Object.keys(feedbackData));
        
        // 处理嵌套结构：如果feedback_results内部还有feedback_results字段
        if (feedbackData.feedback_results && typeof feedbackData.feedback_results === 'object') {
            feedbackData = feedbackData.feedback_results;
            console.log('🔍 Unwrapped nested feedback_results:', feedbackData);
        }
        
        console.log('🔍 Internal review field:', feedbackData.internal_review);
        
        // Create single-column layout for simplicity
        let singleColumnHtml = '';
        if (hypothesisData.hypothesis_content) {
            try {
                const contentData = typeof hypothesisData.hypothesis_content === 'string' 
                    ? JSON.parse(hypothesisData.hypothesis_content) 
                    : hypothesisData.hypothesis_content;
                
                if (Object.keys(contentData).length > 0) {
                    singleColumnHtml += '<div class="content-section">';
                    singleColumnHtml += '<h6 class="section-title">Hypothesis Content</h6>';
                    
                    Object.entries(contentData).forEach(([key, value]) => {
                        if (value && (typeof value === 'string' || typeof value === 'number' || Array.isArray(value))) {
                            const displayKey = this.formatKeyName(key);
                            
                            if (Array.isArray(value)) {
                                singleColumnHtml += `
                                    <div class="content-item">
                                        <h6 class="item-label">${displayKey}:</h6>
                                        <ul class="item-list">
                                            ${value.map(item => `<li>${item}</li>`).join('')}
                                        </ul>
                                    </div>
                                `;
                            } else {
                                const contentLength = String(value).length;
                                const isLongContent = contentLength > 500;
                                const isMediumContent = contentLength > 200 && contentLength <= 500;
                                const contentType = this.getContentType(key);
                                
                                singleColumnHtml += `
                                    <div class="content-item ${isLongContent ? 'content-long' : isMediumContent ? 'content-medium' : 'content-short'}" 
                                         data-content-type="${contentType}" 
                                         data-content-length="${contentLength}">
                                        <h6 class="item-label">${displayKey}:</h6>
                                        <div class="item-content ${isLongContent ? 'content-expandable' : ''}"></div>
                                        ${isLongContent ? '<button class="btn btn-sm btn-outline-primary mt-1 toggle-content">Show More</button>' : ''}
                                    </div>
                                `;
                            }
                        } else if (typeof value === 'object' && value !== null) {
                            const displayKey = this.formatKeyName(key);
                            singleColumnHtml += `<h6 class="item-label">${displayKey}:</h6>`;
                            singleColumnHtml += '<div class="nested-content ms-3">';
                            singleColumnHtml += this.renderContentData(value);
                            singleColumnHtml += '</div>';
                        }
                    });
                    singleColumnHtml += '</div>';
                }
            } catch (e) {
                console.warn('Failed to parse hypothesis content:', e);
                singleColumnHtml += `
                    <div class="content-section">
                        <h6 class="section-title">Hypothesis Content</h6>
                        <div class="content-item">
                            <div class="item-content">${hypothesisData.hypothesis_content}</div>
                        </div>
                    </div>
                `;
            }
        } else {
            singleColumnHtml += `
                <div class="content-section">
                    <h6 class="section-title">Hypothesis Content</h6>
                    <div class="content-item">
                        <div class="item-content text-muted">No hypothesis content available</div>
                    </div>
                </div>
            `;
        }

        
        // Internal Review Section
        if (feedbackData && Object.keys(feedbackData).length > 0) {
            const internalReview = feedbackData.internal_review;
            console.log('🔍 Internal review found:', internalReview);
            
            if (internalReview) {
                singleColumnHtml += `
                    <div class="feedback-section">
                        <h6 class="section-title">Internal Review</h6>
                `;
                
                if (typeof internalReview === 'object' && internalReview !== null) {
                    if (Array.isArray(internalReview)) {
                        internalReview.forEach((item, index) => {
                            if (item && typeof item === 'object') {
                                singleColumnHtml += `
                                    <div class="feedback-item">
                                        <h6 class="item-label">Review ${index + 1}:</h6>
                                        <div class="feedback-content">
                                            ${this.renderFeedbackItem(item)}
                                        </div>
                                    </div>
                                `;
                            }
                        });
                    } else if (internalReview.critiques && Array.isArray(internalReview.critiques)) {
                        console.log('🔍 Found critiques array:', internalReview.critiques);
                        internalReview.critiques.forEach((item, index) => {
                            if (item && typeof item === 'object') {
                                singleColumnHtml += `
                                    <div class="feedback-item">
                                        <h6 class="item-label">Review ${index + 1}:</h6>
                                        <div class="feedback-content">
                                            ${this.renderFeedbackItem(item)}
                                        </div>
                                    </div>
                                `;
                            }
                        });
                    } else {
                        Object.entries(internalReview).forEach(([key, value]) => {
                            if (value && (typeof value === 'string' || typeof value === 'number' || Array.isArray(value))) {
                                const displayKey = this.formatKeyName(key);
                                singleColumnHtml += `
                                    <div class="feedback-item">
                                        <h6 class="item-label">${displayKey}:</h6>
                                        <div class="feedback-content">${this.renderContentWithLineBreaks(value)}</div>
                                    </div>
                                `;
                                }
                            });
                        }
                    } else if (typeof internalReview === 'string') {
                        singleColumnHtml += `
                            <div class="feedback-item">
                                <div class="feedback-content">${this.renderContentWithLineBreaks(internalReview)}</div>
                            </div>
                        `;
                    }
                    
                    singleColumnHtml += '</div>';
                } else {
                                    singleColumnHtml += `
                    <div class="feedback-section">
                        <h6 class="section-title">Internal Review</h6>
                        <div class="feedback-item">
                            <div="feedback-content">No internal_review field found in feedback_results</div>
                        </div>
                    </div>
                `;
                }
            } else {
                            singleColumnHtml += `
                <div class="feedback-section">
                    <h6 class="section-title">Internal Review</h6>
                    <div class="feedback-item">
                        <div class="feedback-content">No feedback_results data available</div>
                    </div>
                </div>
            `;
            }
        

        

        
        // Create single-column layout
        modalBody.innerHTML = `
            <div class="single-column-container">
                ${singleColumnHtml}
            </div>
        `;
        
        // Set content with proper HTML parsing
        this.setContentWithLineBreaks(hypothesisData);
        
        // Show modal
        modal.show();
        
        // Add event listeners
        this.setupModalEventListeners();
    }
    
    setupModalEventListeners() {
        // Handle toggle content buttons
        const toggleButtons = document.querySelectorAll('.toggle-content');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const contentItem = e.target.closest('.content-item');
                const contentDiv = contentItem.querySelector('.content-expandable');
                const button = e.target;
                
                if (contentDiv.classList.contains('expanded')) {
                    contentDiv.classList.remove('expanded');
                    button.textContent = 'Show More';
                } else {
                    contentDiv.classList.add('expanded');
                    button.textContent = 'Show Less';
                }
            });
        });
    }

    renderContentData(data, html) {
        if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([key, value]) => {
                if (value && (typeof value === 'string' || typeof value === 'number' || Array.isArray(value))) {
                    const displayKey = this.formatKeyName(key);
                    
                    if (Array.isArray(value)) {
                        html += `
                            <div class="content-item mb-3">
                                <h6 class="item-label">${displayKey}:</h6>
                                <ul class="item-list">
                                    ${value.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="content-item mb-3">
                                <h6 class="item-label">${displayKey}:</h6>
                                <div class="item-content">${value}</div>
                            </div>
                        `;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Recursive handling of nested objects
                    const displayKey = this.formatKeyName(key);
                    html += `<h6 class="item-label">${displayKey}:</h6>`;
                    html += '<div class="nested-content ms-3">';
                    this.renderContentData(value, html);
                    html += '</div>';
                }
            });
        }
    }
    
    renderFeedbackData(data, html) {
        if (typeof data === 'object' && data !== null) {
            Object.entries(data).forEach(([key, value]) => {
                if (value && (typeof value === 'string' || typeof value === 'number' || Array.isArray(value))) {
                    const displayKey = this.formatKeyName(key);
                    
                    if (Array.isArray(value)) {
                        html += `
                            <div class="feedback-item mb-3">
                                <h6 class="item-label">${displayKey}:</h6>
                                <ul class="item-list">
                                    ${value.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                </div>
                        `;
                    } else {
                        html += `
                            <div class="feedback-item mb-3">
                                <h6 class="item-label">${displayKey}:</h6>
                                <div class="item-content">${value}</div>
            </div>
        `;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Recursive handling of nested objects
                    const displayKey = this.formatKeyName(key);
                    html += `<h6 class="item-label">${displayKey}:</h6>`;
                    html += '<div class="nested-content ms-3">';
                    this.renderFeedbackData(value, html);
                    html += '</div>';
                }
            });
        }
    }
    
    formatKeyName(key) {
        // Convert snake_case keys to readable labels
        const keyMap = {
            'title': 'Title',
            'problem_statement': 'Problem Statement',
            'motivation': 'Motivation',
            'proposed_method': 'Proposed Method',
            'experiment_plan': 'Experiment Plan',
            'feedback_results': 'Feedback Results',
            'keywords_query': 'Keywords Query',
            'direct_cooccurrence_count': 'Direct Co-occurrence Count',
            'min_pmi_score_value': 'Min PMI Score',
            'avg_pmi_score_value': 'Average PMI Score',
            'novelty': 'Novelty',
            'future_suggestions_categories': 'Future Suggestions Categories',
            'future_suggestions_concepts': 'Future Suggestions Concepts',
            'internal_review': 'Internal Review',
            'critiques': 'Critiques',
            'feedback_code': 'Feedback Code',
            'feedback_content': 'Feedback Content'
        };
        
        return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    formatContentWithLineBreaks(content) {
        if (typeof content === 'string') {
            console.log('🔍 Original content:', content);
            console.log('🔍 Contains \\n:', content.includes('\n'));
            console.log('🔍 Contains \\n\\n:', content.includes('\n\n'));
            
            // 将\n\n替换为HTML换行符，\n替换为<br>
            const formatted = content
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>');
            
            console.log('🔍 Formatted HTML:', formatted);
            return formatted;
        }
        return content;
    }
    
    getContentType(key) {
        const typeMap = {
            'title': 'title',
            'problem_statement': 'problem',
            'motivation': 'motivation',
            'proposed_method': 'method',
            'experiment_plan': 'experiment',
            'feedback_results': 'feedback',
            'keywords_query': 'keywords',
            'direct_cooccurrence_count': 'metrics',
            'min_pmi_score_value': 'metrics',
            'avg_pmi_score_value': 'metrics',
            'novelty': 'scores',
            'future_suggestions_categories': 'suggestions',
            'future_suggestions_concepts': 'suggestions',
            'internal_review': 'review',
            'critiques': 'critiques',
            'feedback_code': 'feedback',
            'feedback_content': 'feedback'
        };
        return typeMap[key] || 'general';
    }
    
    renderContentWithLineBreaks(content) {
        if (typeof content === 'string') {
            // 直接返回处理后的HTML内容
            return this.formatContentWithLineBreaks(content);
        }
        return content;
    }
    
    renderFeedbackItem(item) {
        if (!item || typeof item !== 'object') {
            return 'Invalid feedback item';
        }
        
        let html = '';
        
        // 处理feedback_code
        if (item.feedback_code) {
            html += `<div class="feedback-code"><strong>Code:</strong> ${item.feedback_code}</div>`;
        }
        
        // 处理feedback_content
        if (item.feedback_content) {
            html += `<div class="feedback-text">${this.renderContentWithLineBreaks(item.feedback_content)}</div>`;
        }
        
        // 处理其他可能的字段
        Object.entries(item).forEach(([key, value]) => {
            if (key !== 'feedback_code' && key !== 'feedback_content' && value) {
                const displayKey = this.formatKeyName(key);
                html += `<div class="feedback-field"><strong>${displayKey}:</strong> ${this.renderContentWithLineBreaks(value)}</div>`;
            }
        });
        
        return html;
    }
    
    setContentWithLineBreaks(hypothesisData) {
        // Set content for each content item with proper HTML parsing
        const contentItems = document.querySelectorAll('.content-item .item-content');
        let contentIndex = 0;
        
        if (hypothesisData.hypothesis_content) {
            try {
                const contentData = typeof hypothesisData.hypothesis_content === 'string' 
                    ? JSON.parse(hypothesisData.hypothesis_content) 
                    : hypothesisData.hypothesis_content;
                
                if (Object.keys(contentData).length > 0) {
                    Object.entries(contentData).forEach(([key, value]) => {
                        if (value && (typeof value === 'string' || typeof value === 'number' || Array.isArray(value))) {
                            if (contentItems[contentIndex]) {
                                if (Array.isArray(value)) {
                                    contentItems[contentIndex].innerHTML = `
                                        <ul class="item-list">
                                            ${value.map(item => `<li>${item}</li>`).join('')}
                                        </ul>
                                    `;
                                } else {
                                    contentItems[contentIndex].innerHTML = this.formatContentWithLineBreaks(value);
                                }
                                contentIndex++;
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to parse hypothesis content:', e);
                if (contentItems[contentIndex]) {
                    contentItems[contentIndex].innerHTML = hypothesisData.hypothesis_content;
                }
            }
        }
        
        // Set feedback content
        const feedbackItems = document.querySelectorAll('.feedback-content');
        feedbackItems.forEach((item, index) => {
            if (index === 0 && hypothesisData.feedback_results) {
                try {
                    const feedbackData = JSON.parse(hypothesisData.feedback_results);
                    if (feedbackData.internal_review) {
                        if (typeof feedbackData.internal_review === 'string') {
                            item.innerHTML = this.formatContentWithLineBreaks(feedbackData.internal_review);
                        } else {
                            item.innerHTML = this.formatContentWithLineBreaks(JSON.stringify(feedbackData.internal_review, null, 2));
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse feedback results:', e);
                    item.innerHTML = 'Failed to parse feedback results';
                }
            }
        });
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        // Re-render content
        if (this.currentTopic !== null && this.currentSubtopic !== null) {
            this.handleSubtopicClick(this.currentTopic, this.currentSubtopic);
        }
    }

    async exportToCSV() {
        try {
            if (this.currentTopic === null) {
                alert('Please select a research topic first');
                return;
            }
            
            const response = await fetch('/api/export/hypotheses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: this.currentTopic,
                    subtopic: this.currentSubtopic || 0
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hypotheses_topic_${this.currentTopic}_export_${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Export failed');
            }
            
        } catch (error) {
            console.error('Failed to export CSV:', error);
            this.showError('Failed to export CSV: ' + error.message);
        }
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

    // Clear hypotheses display
    clearHypotheses() {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = '';
        }
        
        // Hide pagination
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.style.display = 'none';
        }
    }

    // Get selected strategies from checkboxes
    getSelectedStrategies() {
        const strategies = [];
        if (document.getElementById('filterEvolve')?.checked) strategies.push('evolve');
        if (document.getElementById('filterHighImpact')?.checked) strategies.push('high_impact');
        if (document.getElementById('filterSimilar')?.checked) strategies.push('similar');
        return strategies;
    }

    // Load hypotheses for specific strategies
    async loadHypotheses(topicId, subtopicIndex, categoryIndex, strategies) {
        try {
            console.log(`🔍 Loading hypotheses for strategies: ${strategies.join(', ')}`);
            
            // Build query parameters
            const params = new URLSearchParams({
                topic: topicId,
                subtopic: subtopicIndex,
                category: categoryIndex,
                page: 1,
                per_page: 20
            });
            
            // Add strategy filters
            strategies.forEach(strategy => {
                params.append('strategy', strategy);
            });
            
            console.log('🔍 Sending request:', params.toString());
            
            const response = await fetch(`/api/hypotheses?${params.toString()}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log('✅ Strategy filter result:', data.hypotheses?.length || 0, 'hypotheses');
            
            this.renderHypotheses(data.hypotheses || data);
            
        } catch (error) {
            console.error('Failed to load hypotheses:', error);
            this.showError('Failed to load hypotheses: ' + error.message);
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;
        
        const messageHtml = `
            <div class="message-container ${type}">
                <p class="message-text">
                    <i class="bi bi-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'x-circle'}"></i>
                    ${message}
                </p>
                </div>
            `;
        
        contentArea.innerHTML = messageHtml;
    }

    // Update content title
    updateContentTitle(title) {
        const titleElement = document.getElementById('content-title');
        if (titleElement) {
            titleElement.innerHTML = `<i class="bi bi-info-circle"></i> ${title}`;
        }
    }

    highlightSelectedSubtopic(topicId, subtopicIndex) {
        // Remove previous highlights
        document.querySelectorAll('.subtopic-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add highlight to current selection
        const subtopicItems = document.querySelectorAll(`#subtopics-${topicId} .subtopic-item`);
        if (subtopicItems[subtopicIndex]) {
            subtopicItems[subtopicIndex].classList.add('selected');
        }
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded, initializing Topic Navigation App...');
    window.app = new HypothesisApp();
});

