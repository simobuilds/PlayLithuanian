/**
 * UTILITY FUNCTIONS
 */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * APP STATE MANAGEMENT
 */
let state = {
    view: 'landing', // landing, roadmap, game, review, profile
    sectionIdx: 0,
    levelIdx: 0,
    currentQuestionIdx: 0,
    dictionary: null,
    answers: [], // Track results for end of lesson review
    progress: JSON.parse(localStorage.getItem('lt_progress')) || {},
    currentQuestion: null, // Store current question for sorting validation
    user: {
        name: localStorage.getItem('userName') || 'Learner',
        streak: parseInt(localStorage.getItem('userStreak')) || 0,
        totalLessons: parseInt(localStorage.getItem('totalLessons')) || 0
    }
};

// Initialize App
async function init() {
    try {
        const res = await fetch('/api/dictionary');
        if (!res.ok) throw new Error('Failed to fetch dictionary');
        state.dictionary = await res.json();
        render();
    } catch (error) {
        document.getElementById('app-viewport').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error loading app</h4>
                <p>${error.message}. Please refresh the page.</p>
            </div>
        `;
    }
}

/**
 * ROUTER / RENDERER
 */
function render() {
    const viewport = document.getElementById('app-viewport');
    if (!viewport) return;

    // Scroll to top on view change
    window.scrollTo(0, 0);
    
    if (state.view === 'landing') {
        renderLanding(viewport);
    } else if (state.view === 'roadmap') {
        renderRoadmap(viewport);
    } else if (state.view === 'game') {
        renderGame(viewport);
    } else if (state.view === 'review') {
        renderReview(viewport);
    } else if (state.view === 'profile') {
        renderProfile(viewport);
    }
}

/**
 * Navigation helper
 */
function navigateTo(view) {
    state.view = view;
    render();
}

/**
 * LANDING PAGE
 */
function renderLanding(container) {
    const completedLevels = Object.keys(state.progress).filter(k => state.progress[k]).length;
    const totalLevels = state.dictionary ? 
        state.dictionary.sections.reduce((sum, sec) => sum + (sec.levels ? sec.levels.length : 0), 0) : 0;
    
    container.innerHTML = `
        <div class="text-center py-5">
            <h1 class="display-3 mb-4 fw-bold text-primary">Labas! 🇱🇹</h1>
            <p class="lead mb-4">Welcome to Lithuanian Language Learning</p>
            <p class="text-muted mb-5">Start your journey to master Lithuanian with interactive lessons and fun games.</p>
            
            <div class="row g-4 mb-5">
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="display-4 mb-3">📚</div>
                            <h5 class="card-title">Structured Learning</h5>
                            <p class="card-text text-muted">Follow a curated path from basics to advanced topics</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="display-4 mb-3">🎮</div>
                            <h5 class="card-title">Interactive Games</h5>
                            <p class="card-text text-muted">Learn through fun completion and sorting exercises</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="display-4 mb-3">📊</div>
                            <h5 class="card-title">Track Progress</h5>
                            <p class="card-text text-muted">Monitor your learning journey and achievements</p>
                        </div>
                    </div>
                </div>
            </div>
            
            ${completedLevels > 0 ? `
                <div class="alert alert-info mb-4">
                    <h5>Your Progress</h5>
                    <p class="mb-2">You've completed <strong>${completedLevels}</strong> out of <strong>${totalLevels}</strong> levels!</p>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar bg-info" style="width: ${totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0}%">
                            ${totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0}%
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="d-flex gap-3 justify-content-center mt-5">
                <button class="btn btn-primary btn-lg px-5" onclick="navigateTo('roadmap')">
                    ${completedLevels > 0 ? 'Continue Learning' : 'Start Learning'}
                </button>
                <button class="btn btn-outline-secondary btn-lg px-5" onclick="navigateTo('profile')">
                    View Profile
                </button>
            </div>
        </div>
    `;
}

/**
 * PROFILE PAGE
 */
function renderProfile(container) {
    const completedLevels = Object.keys(state.progress).filter(k => state.progress[k]).length;
    const totalLevels = state.dictionary ? 
        state.dictionary.sections.reduce((sum, sec) => sum + (sec.levels ? sec.levels.length : 0), 0) : 0;
    const progressPercentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
    
    // Calculate stats per section
    let sectionStats = '';
    if (state.dictionary) {
        state.dictionary.sections.forEach((sec, sIdx) => {
            if (sec.levels && sec.levels.length > 0) {
                const sectionCompleted = sec.levels.filter((_, lIdx) => state.progress[`${sIdx}-${lIdx}`]).length;
                const sectionTotal = sec.levels.length;
                sectionStats += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="fw-bold">${escapeHtml(sec.topic)}</span>
                            <span class="text-muted">${sectionCompleted}/${sectionTotal}</span>
                        </div>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${sectionCompleted === sectionTotal ? 'bg-success' : 'bg-info'}" 
                                 style="width: ${(sectionCompleted / sectionTotal) * 100}%"></div>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    container.innerHTML = `
        <div class="py-4">
            <h2 class="mb-4 fw-bold">Your Profile</h2>
            
            <div class="row g-4 mb-5">
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <h5 class="card-title mb-4">📊 Statistics</h5>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Total Progress</span>
                                    <span class="fw-bold">${completedLevels}/${totalLevels}</span>
                                </div>
                                <div class="progress" style="height: 30px;">
                                    <div class="progress-bar bg-success" style="width: ${progressPercentage}%">
                                        ${progressPercentage}%
                                    </div>
                                </div>
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between mb-2">
                                <span>🔥 Streak</span>
                                <span class="fw-bold text-warning">${state.user.streak} days</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                                <span>📚 Lessons Completed</span>
                                <span class="fw-bold">${state.user.totalLessons}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>✅ Levels Completed</span>
                                <span class="fw-bold">${completedLevels}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <h5 class="card-title mb-4">👤 Profile Settings</h5>
                            <div class="mb-3">
                                <label class="form-label">Your Name</label>
                                <input type="text" class="form-control" id="userNameInput" 
                                       value="${escapeHtml(state.user.name)}" 
                                       placeholder="Enter your name">
                            </div>
                            <button class="btn btn-primary" onclick="updateUserName()">Update Name</button>
                            <hr>
                            <button class="btn btn-outline-danger btn-sm" onclick="resetProgress()">
                                Reset All Progress
                            </button>
                            <small class="text-muted d-block mt-2">This will clear all your progress and start fresh</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body p-4">
                    <h5 class="card-title mb-4">📈 Progress by Section</h5>
                    ${sectionStats || '<p class="text-muted">No progress data available yet.</p>'}
                </div>
            </div>
            
            <div class="text-center mt-4">
                <button class="btn btn-outline-secondary" onclick="navigateTo('roadmap')">
                    ← Back to Learning
                </button>
            </div>
        </div>
    `;
}

/**
 * Profile helper functions
 */
function updateUserName() {
    const nameInput = document.getElementById('userNameInput');
    if (nameInput) {
        const newName = nameInput.value.trim() || 'Learner';
        state.user.name = newName;
        localStorage.setItem('userName', newName);
        alert('Name updated successfully!');
        renderProfile(document.getElementById('app-viewport'));
    }
}

function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        state.progress = {};
        state.user.streak = 0;
        state.user.totalLessons = 0;
        localStorage.removeItem('lt_progress');
        localStorage.removeItem('userStreak');
        localStorage.setItem('totalLessons', '0');
        alert('Progress has been reset!');
        navigateTo('landing');
    }
}

/**
 * ROADMAP VIEW
 */
function renderRoadmap(container) {
    let html = `<h4 class="mb-4">Your Learning Path</h4>`;
    state.dictionary.sections.forEach((sec, sIdx) => {
        html += `<div class="mb-4">
            <h6 class="text-muted">Section ${sec.sectionId}: ${sec.topic}</h6>
            <div class="d-flex gap-3 flex-wrap">`;
        
        if (!sec.levels || sec.levels.length === 0) {
            html += `<span class="text-muted small">Coming soon...</span>`;
        } else {
            sec.levels.forEach((lvl, lIdx) => {
                // FORCE UNLOCK ALL
                const isLocked = false;
                const progressKey = `${sIdx}-${lIdx}`;
                const isDone = state.progress[progressKey];
                const hasContent = lvl.sentences && lvl.sentences.length > 0;
                
                html += `
                    <button class="btn ${isDone ? 'btn-success' : hasContent ? 'btn-outline-primary' : 'btn-outline-secondary'} rounded-pill px-4" 
                            onclick="startLevel(${sIdx}, ${lIdx})" 
                            ${!hasContent ? 'disabled' : ''}
                            title="${!hasContent ? 'No content yet' : lvl.title || 'Level'}">
                        Lvl ${lvl.levelId || lIdx + 1}${lvl.title ? ': ' + lvl.title : ''}
                    </button>`;
            });
        }
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

/**
 * GAME ENGINE
 */
function startLevel(sIdx, lIdx) {
    const level = state.dictionary.sections[sIdx].levels[lIdx];
    
    if (!level.sentences || level.sentences.length === 0) {
        alert('This level has no content yet. Please choose another level.');
        return;
    }
    
    state.sectionIdx = sIdx;
    state.levelIdx = lIdx;
    state.currentQuestionIdx = 0;
    state.answers = [];
    state.currentQuestion = null;
    currentSort = [];
    state.view = 'game';
    render();
}

function renderGame(container) {
    const level = state.dictionary.sections[state.sectionIdx].levels[state.levelIdx];
    
    if (!level.sentences || level.sentences.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h4>${escapeHtml(level.title || 'Level')}</h4>
                <p class="text-muted">This level has no content yet.</p>
                <button class="btn btn-primary mt-3" onclick="state.view='roadmap'; render();">Back to Roadmap</button>
            </div>
        `;
        return;
    }
    
    const question = level.sentences[state.currentQuestionIdx];
    state.currentQuestion = question; // Store for sorting validation
    currentSort = []; // Reset sorting array

    let gameHtml = `
        <div class="d-flex justify-content-between mb-3 align-items-center">
            <span class="fw-bold">${escapeHtml(level.title || 'Level')}</span>
            <span class="badge bg-info">Question ${state.currentQuestionIdx + 1}/${level.sentences.length}</span>
        </div>
        <div class="progress mb-4" style="height: 12px; border-radius: 6px;">
            <div class="progress-bar bg-warning progress-bar-striped" 
                 style="width: ${((state.currentQuestionIdx + 1) / level.sentences.length) * 100}%"></div>
        </div>
        <button class="btn btn-sm btn-outline-secondary mb-3" onclick="state.view='roadmap'; render();">← Back</button>
    `;

    if (question.type === 'completion') {
        const displayText = escapeHtml(question.text.replace(/_______/g, '_____'));
        const translation = escapeHtml(question.translation || '');
        gameHtml += `
            <div class="text-center py-5">
                <h3 class="mb-4 fw-bold">${displayText}</h3>
                <p class="text-muted fst-italic fs-5 mb-4">"${translation}"</p>
                <div class="d-grid gap-2 d-sm-block">
                    ${question.options.map(opt => {
                        const escapedOpt = escapeHtml(opt);
                        const escapedMissing = escapeHtml(question.missing);
                        return \`<button class="btn btn-lg btn-white border shadow-sm m-2 px-5 word-pill" 
                                      onclick="handleAnswer('\${escapedOpt}', '\${escapedMissing}')">\${escapedOpt}</button>\`;
                    }).join('')}
                </div>
            </div>
        `;
    } else if (question.type === 'sorting') {
        const translation = escapeHtml(question.translation || '');
        const shuffled = [...(question.scrambled || [])].sort(() => Math.random() - 0.5); // Shuffle on render
        gameHtml += `
            <div class="text-center py-5">
                <p class="text-muted mb-2">Translate to Lithuanian:</p>
                <h4 class="mb-4 fw-bold">"\${translation}"</h4>
                <div id="sort-workspace" class="border rounded p-4 mb-4 min-vh-10 d-flex justify-content-center flex-wrap gap-2 bg-light" 
                     style="min-height: 80px;">
                    <span class="text-muted align-self-center">Tap words below to build your answer</span>
                </div>
                <div id="sort-options" class="d-flex justify-content-center flex-wrap gap-2 mb-4">
                    \${shuffled.map(word => {
                        const escapedWord = escapeHtml(word);
                        return \`<button class="btn btn-primary word-pill px-4 py-2" 
                                       onclick="addToSort('\${escapedWord}')">\${escapedWord}</button>\`;
                    }).join('')}
                </div>
                <div>
                    <button class="btn btn-outline-danger btn-sm me-2" onclick="resetSort()">Reset</button>
                    <button class="btn btn-dark btn-lg px-5" onclick="checkSortOrder()">Check Answer</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = gameHtml;
}

/**
 * LOGIC HANDLERS
 */
let currentSort = [];

function addToSort(word) {
    const workspace = document.getElementById('sort-workspace');
    if (!workspace) return;
    
    currentSort.push(word);
    
    // Remove word from options
    const options = document.getElementById('sort-options');
    if (options) {
        const buttons = Array.from(options.querySelectorAll('button'));
        const btnToRemove = buttons.find(btn => btn.textContent.trim() === word);
        if (btnToRemove) {
            btnToRemove.style.display = 'none';
        }
    }
    
    // Update workspace
    workspace.innerHTML = currentSort.map(w => 
        \`<span class="badge bg-warning text-dark p-3 fs-6 me-2 word-pill" style="cursor: pointer;" onclick="removeFromSort('\${escapeHtml(w)}')">\${escapeHtml(w)}</span>\`
    ).join('');
}

function removeFromSort(word) {
    currentSort = currentSort.filter(w => w !== word);
    
    // Restore button in options
    const options = document.getElementById('sort-options');
    if (options) {
        const buttons = Array.from(options.querySelectorAll('button'));
        const btnToRestore = buttons.find(btn => btn.textContent.trim() === word && btn.style.display === 'none');
        if (btnToRestore) {
            btnToRestore.style.display = '';
        }
    }
    
    // Update workspace
    const workspace = document.getElementById('sort-workspace');
    if (workspace) {
        if (currentSort.length === 0) {
            workspace.innerHTML = '<span class="text-muted align-self-center">Tap words below to build your answer</span>';
        } else {
            workspace.innerHTML = currentSort.map(w => 
                \`<span class="badge bg-warning text-dark p-3 fs-6 me-2 word-pill" style="cursor: pointer;" onclick="removeFromSort('\${escapeHtml(w)}')">\${escapeHtml(w)}</span>\`
            ).join('');
        }
    }
}

function resetSort() {
    const question = state.currentQuestion;
    if (!question || question.type !== 'sorting') return;
    
    currentSort = [];
    
    // Restore all buttons
    const options = document.getElementById('sort-options');
    if (options) {
        options.querySelectorAll('button').forEach(btn => {
            btn.style.display = '';
        });
    }
    
    // Reset workspace
    const workspace = document.getElementById('sort-workspace');
    if (workspace) {
        workspace.innerHTML = '<span class="text-muted align-self-center">Tap words below to build your answer</span>';
    }
}

function checkSortOrder() {
    const question = state.currentQuestion;
    if (!question || question.type !== 'sorting') return;
    
    const correctOrder = question.correctOrder || [];
    const isCorrect = currentSort.length === correctOrder.length && 
                     currentSort.every((word, idx) => word === correctOrder[idx]);
    
    state.answers.push(isCorrect);
    
    // Show feedback
    const overlay = document.createElement('div');
    overlay.className = \`fixed-top vh-100 d-flex align-items-center justify-content-center \${isCorrect ? 'bg-success' : 'bg-danger'} text-white\`;
    overlay.style.opacity = '0.9';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = \`
        <div class="text-center">
            <h1 class="display-1 mb-3">\${isCorrect ? 'Correct! ✓' : 'Incorrect ✗'}</h1>
            \${!isCorrect ? \`<p class="fs-4">Correct order: \${escapeHtml(correctOrder.join(' '))}</p>\` : ''}
        </div>
    \`;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
        nextQuestion();
    }, isCorrect ? 1500 : 2500);
}

function handleAnswer(selected, correct) {
    const isCorrect = selected === correct;
    state.answers.push(isCorrect);
    
    // Feedback overlay
    const overlay = document.createElement('div');
    overlay.className = \`fixed-top vh-100 d-flex align-items-center justify-content-center \${isCorrect ? 'bg-success' : 'bg-danger'} text-white\`;
    overlay.style.opacity = '0.9';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = \`
        <div class="text-center">
            <h1 class="display-1">\${isCorrect ? 'Correct! ✓' : 'Oops! ✗'}</h1>
            \${!isCorrect ? \`<p class="fs-4 mt-3">Correct answer: \${escapeHtml(correct)}</p>\` : ''}
        </div>
    \`;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
        nextQuestion();
    }, isCorrect ? 1500 : 2500);
}

function nextQuestion() {
    const level = state.dictionary.sections[state.sectionIdx].levels[state.levelIdx];
    if (state.currentQuestionIdx < level.sentences.length - 1) {
        state.currentQuestionIdx++;
        currentSort = [];
        state.currentQuestion = null;
        render();
    } else {
        completeLevel();
    }
}

function completeLevel() {
    const progressKey = \`\${state.sectionIdx}-\${state.levelIdx}\`;
    state.progress[progressKey] = true;
    state.user.totalLessons += 1;
    localStorage.setItem('lt_progress', JSON.stringify(state.progress));
    localStorage.setItem('totalLessons', state.user.totalLessons.toString());
    state.view = 'review';
    render();
}

function renderReview(container) {
    const score = state.answers.filter(a => a).length;
    const total = state.answers.length;
    const percentage = Math.round((score / total) * 100);
    const level = state.dictionary.sections[state.sectionIdx].levels[state.levelIdx];
    
    let message = '';
    let messageClass = 'text-info';
    if (percentage === 100) {
        message = 'Perfect! 🌟';
        messageClass = 'text-success';
    } else if (percentage >= 80) {
        message = 'Great job! 👏';
        messageClass = 'text-success';
    } else if (percentage >= 60) {
        message = 'Good effort! 💪';
        messageClass = 'text-warning';
    } else {
        message = 'Keep practicing! 📚';
        messageClass = 'text-danger';
    }
    
    container.innerHTML = \`
        <div class="text-center py-5">
            <h2 class="display-4 mb-3">\${escapeHtml(level.title || 'Lesson')} Complete!</h2>
            <p class="\${messageClass} fs-3 mb-4">\${message}</p>
            <div class="mb-4">
                <h3 class="display-6">\${score} / \${total}</h3>
                <div class="progress mx-auto" style="max-width: 300px; height: 30px;">
                    <div class="progress-bar \${percentage === 100 ? 'bg-success' : percentage >= 60 ? 'bg-warning' : 'bg-danger'}" 
                         style="width: \${percentage}%">
                        \${percentage}%
                    </div>
                </div>
            </div>
            <div class="d-flex gap-3 justify-content-center mt-4">
                <button class="btn btn-outline-secondary btn-lg" onclick="state.view='roadmap'; render();">Return to Roadmap</button>
                \${state.currentQuestionIdx < (state.dictionary.sections[state.sectionIdx].levels[state.levelIdx].sentences.length - 1) ? 
                    \`<button class="btn btn-primary btn-lg" onclick="startLevel(\${state.sectionIdx}, \${state.levelIdx});">Retry Level</button>\` : ''}
            </div>
        </div>
    \`;
}

async function getTranslation(textToTranslate, lang = 'ES') {
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: textToTranslate,
            targetLang: lang // 'DE', 'FR', 'ES', etc.
        })
    });
    
    const data = await response.json();
    console.log("Translated Text:", data.translated);
    return data.translated;
}

// Initial Call
init();
