/**
 * AI-Powered CI/CD Log Analyzer - Frontend Client Logic
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // API Route Base URLs
    // Automatically uses local backend during development, and Render production backend when deployed
    const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
        ? "/api/v1"
        : "https://ci-cd-log-analyzer-backend.onrender.com/api/v1"; // <-- Replace this URL with your actual Render service URL!

    // Application State Variables
    let selectedFile = null;
    let activeInputTab = "upload"; // "upload", "text", or "github"
    let githubToken = sessionStorage.getItem("github_token") || null;
    
    // =========================================================================
    // DOM Element Selectors
    // =========================================================================
    
    // Status & System Health
    const systemStatusBadge = document.getElementById("system-status-badge");
    
    // Input Control Panel
    const btnTabUpload = document.getElementById("btn-tab-upload");
    const btnTabText = document.getElementById("btn-tab-text");
    const btnTabGithub = document.getElementById("btn-tab-github");
    const panelTabUpload = document.getElementById("panel-tab-upload");
    const panelTabText = document.getElementById("panel-tab-text");
    const panelTabGithub = document.getElementById("panel-tab-github");
    const platformHintsGroup = document.getElementById("platform-hints-group");
    
    const logDropzone = document.getElementById("log-dropzone");
    const logFileInput = document.getElementById("log-file-input");
    const logTextInput = document.getElementById("log-text-input");
    const platformSelect = document.getElementById("platform-select");
    const btnRunAnalysis = document.getElementById("btn-run-analysis");
    
    // GitHub Elements
    const btnGithubOauthLogin = document.getElementById("btn-github-oauth-login");
    const btnTogglePatForm = document.getElementById("btn-toggle-pat-form");
    const patForm = document.getElementById("github-pat-form");
    const githubPatInput = document.getElementById("github-pat-input");
    const btnGithubPatLogin = document.getElementById("btn-github-pat-login");
    const githubLoggedOut = document.getElementById("github-logged-out");
    const githubLoggedIn = document.getElementById("github-logged-in");
    const githubAvatar = document.getElementById("github-avatar");
    const githubUsername = document.getElementById("github-username");
    const btnGithubLogout = document.getElementById("btn-github-logout");
    const githubRepoSelect = document.getElementById("github-repo-select");
    const btnRefreshGithubRuns = document.getElementById("btn-refresh-github-runs");
    const githubRunsWrapper = document.getElementById("github-runs-wrapper");
    
    // Results Panel States
    const resultsEmptyState = document.getElementById("results-empty-state");
    const resultsLoadingState = document.getElementById("results-loading-state");
    const loadingStatusText = document.getElementById("loading-status-text");
    const analysisResultsContent = document.getElementById("analysis-results-content");
    
    // Result Data Fields
    const reportPlatform = document.getElementById("report-platform");
    const reportFailureType = document.getElementById("report-failure-type");
    const reportConfidenceText = document.getElementById("report-confidence-text");
    const reportConfidenceGauge = document.getElementById("report-confidence-gauge");
    const reportSummary = document.getElementById("report-summary");
    const reportRootCause = document.getElementById("report-root-cause");
    const reportEvidence = document.getElementById("report-evidence");
    const reportFixesGrid = document.getElementById("report-fixes-grid");
    
    // Evidence Drawer
    const btnToggleEvidence = document.getElementById("btn-toggle-evidence");
    const evidenceDrawerContent = document.getElementById("evidence-drawer-content");
    const evidenceCollapseIcon = document.getElementById("evidence-collapse-icon");

    // History Vault Panel
    const filterSearchInput = document.getElementById("filter-search-input");
    const btnRefreshHistory = document.getElementById("btn-refresh-history");
    const historyTableBody = document.getElementById("history-table-body");
    const runsHistoryCount = document.getElementById("runs-history-count");

    // =========================================================================
    // 1. SYSTEM INITIALIZATION & HEALTH CHECKER
    // =========================================================================
    
    async function checkSystemHealth() {
        try {
            const res = await fetch(`${API_BASE}/health`);
            if (!res.ok) throw new Error("Health check degraded");
            const data = await res.json();
            
            const dot = systemStatusBadge.querySelector(".status-dot");
            const label = systemStatusBadge.querySelector(".status-label");
            
            dot.className = "status-dot"; // reset
            
            if (data.status === "ok") {
                dot.classList.add("success");
                label.innerText = `Active Status: Gemini (${data.gemini_configured ? "Ready" : "Offline Mock"}), ML (Active)`;
            } else {
                dot.classList.add("degraded");
                label.innerText = "Active Status: Degraded (DB/ML missing)";
            }
        } catch (err) {
            console.error("Health check error:", err);
            const dot = systemStatusBadge.querySelector(".status-dot");
            const label = systemStatusBadge.querySelector(".status-label");
            dot.className = "status-dot degraded";
            label.innerText = "API Service Offline";
        }
    }

    // Call Health Check on start
    checkSystemHealth();

    // =========================================================================
    // 2. TABS & INPUT NAVIGATION
    // =========================================================================
    
    btnTabUpload.addEventListener("click", () => {
        activeInputTab = "upload";
        btnTabUpload.classList.add("active");
        btnTabText.classList.remove("active");
        btnTabGithub.classList.remove("active");
        panelTabUpload.classList.remove("hidden");
        panelTabText.classList.add("hidden");
        panelTabGithub.classList.add("hidden");
        platformHintsGroup.classList.remove("hidden");
        btnRunAnalysis.classList.remove("hidden");
    });

    btnTabText.addEventListener("click", () => {
        activeInputTab = "text";
        btnTabText.classList.add("active");
        btnTabUpload.classList.remove("active");
        btnTabGithub.classList.remove("active");
        panelTabText.classList.remove("hidden");
        panelTabUpload.classList.add("hidden");
        panelTabGithub.classList.add("hidden");
        platformHintsGroup.classList.remove("hidden");
        btnRunAnalysis.classList.remove("hidden");
    });

    btnTabGithub.addEventListener("click", () => {
        activeInputTab = "github";
        btnTabGithub.classList.add("active");
        btnTabUpload.classList.remove("active");
        btnTabText.classList.remove("active");
        panelTabGithub.classList.remove("hidden");
        panelTabUpload.classList.add("hidden");
        panelTabText.classList.add("hidden");
        
        // Hide standard local analyzer buttons since GitHub runs have custom row actions
        platformHintsGroup.classList.add("hidden");
        btnRunAnalysis.classList.add("hidden");
        
        // Initialize GitHub state/refresh workspace
        if (githubToken) {
            handleGitHubLoginSuccess(githubToken);
        } else {
            showLoggedInView(false);
        }
    });

    // =========================================================================
    // 3. LOG FILE UPLOAD DRAG-AND-DROP CONTROLS
    // =========================================================================
    
    logDropzone.addEventListener("click", () => {
        logFileInput.click();
    });

    logFileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    // Drag-over hover indicators
    ["dragenter", "dragover"].forEach(eventName => {
        logDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            logDropzone.classList.add("dragover");
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        logDropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            logDropzone.classList.remove("dragover");
        }, false);
    });

    // Handling file drops
    logDropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });

    function handleSelectedFile(file) {
        selectedFile = file;
        const promptText = logDropzone.querySelector(".dropzone-text");
        const limitsText = logDropzone.querySelector(".file-limits");
        const icon = logDropzone.querySelector(".upload-icon");
        
        icon.innerText = "📄";
        promptText.innerHTML = `File Loaded: <span class="highlight">${file.name}</span>`;
        limitsText.innerText = `Size: ${(file.size / 1024).toFixed(1)} KB`;
    }

    // =========================================================================
    // 4. API INTEGRATION: RUN LOG ANALYSIS
    // =========================================================================
    
    btnRunAnalysis.addEventListener("click", async () => {
        const platformHint = platformSelect.value;
        
        // Validation Checks
        if (activeInputTab === "upload" && !selectedFile) {
            alert("Please drag and drop a valid log file first.");
            return;
        }
        if (activeInputTab === "text" && !logTextInput.value.trim()) {
            alert("Raw log text area cannot be empty.");
            return;
        }

        // Trigger Loading UI Transition
        resultsEmptyState.classList.add("hidden");
        analysisResultsContent.classList.add("hidden");
        resultsLoadingState.classList.remove("hidden");
        
        // Toggle loader spin on primary submit button
        btnRunAnalysis.disabled = true;
        btnRunAnalysis.querySelector(".btn-text").innerText = "Analyzing Logs...";
        btnRunAnalysis.querySelector(".btn-loader").classList.remove("hidden");

        try {
            let res;
            
            if (activeInputTab === "upload") {
                // Form Data multipart API
                const formData = new FormData();
                formData.append("file", selectedFile);
                
                loadingStatusText.innerText = "Uploading log file...";
                
                let url = `${API_BASE}/analyze`;
                if (platformHint) {
                    url += `?platform=${platformHint}`;
                }
                
                res = await fetch(url, {
                    method: "POST",
                    body: formData
                });
            } else {
                // JSON Payload API
                loadingStatusText.innerText = "Sending log text...";
                
                res = await fetch(`${API_BASE}/analyze-text`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        log_text: logTextInput.value,
                        platform: platformHint || null
                    })
                });
            }

            loadingStatusText.innerText = "Running multi-agent diagnostics...";
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "API Log Analysis failed.");
            }
            
            const data = await res.json();
            
            if (data.success && data.report) {
                renderAnalysisReport(data.report);
                // Trigger History Refresh
                fetchHistoryList();
            } else {
                const errorsJoined = data.errors ? data.errors.join(", ") : "Unknown Error";
                throw new Error(`Log Analysis Node Failure: ${errorsJoined}`);
            }

        } catch (err) {
            console.error("Log analysis execution failure:", err);
            alert(`Analysis execution failed: ${err.message}`);
            resultsEmptyState.classList.remove("hidden");
            analysisResultsContent.classList.add("hidden");
        } finally {
            // Restore submission controls
            resultsLoadingState.classList.add("hidden");
            btnRunAnalysis.disabled = false;
            btnRunAnalysis.querySelector(".btn-text").innerText = "Analyze Pipeline Log";
            btnRunAnalysis.querySelector(".btn-loader").classList.add("hidden");
        }
    });

    // =========================================================================
    // 5. RENDERING DYNAMIC REPORT CARDS & DETAILS
    // =========================================================================
    
    function renderAnalysisReport(report) {
        // Populate core text elements
        reportPlatform.innerText = report.pipeline_platform || "General";
        reportFailureType.innerText = report.failure_type || "Unknown Failure";
        reportSummary.innerText = report.summary || "No executive summary provided.";
        reportRootCause.innerText = report.root_cause || "No detailed root cause identified.";
        
        // Evidence logging
        if (report.evidence && report.evidence.length > 0) {
            reportEvidence.innerText = report.evidence.join("\n");
        } else {
            reportEvidence.innerText = "No precise evidence traces flagged by regex parsing.";
        }

        // Circular Confidence Indicator Update
        const confidenceVal = report.classification_confidence || 0.8;
        const confidencePercent = Math.round(confidenceVal * 100);
        reportConfidenceText.innerText = `${confidencePercent}%`;
        
        // Dynamically adjust neon border gauges
        if (confidenceVal < 0.6) {
            reportConfidenceText.style.color = "var(--danger)";
            reportConfidenceGauge.style.borderColor = "var(--border-color)";
            reportConfidenceGauge.style.borderTopColor = "var(--danger)";
            reportConfidenceGauge.style.borderRightColor = "var(--danger)";
        } else if (confidenceVal < 0.8) {
            reportConfidenceText.style.color = "var(--warning)";
            reportConfidenceGauge.style.borderColor = "var(--border-color)";
            reportConfidenceGauge.style.borderTopColor = "var(--warning)";
            reportConfidenceGauge.style.borderRightColor = "var(--warning)";
        } else {
            reportConfidenceText.style.color = "var(--success)";
            reportConfidenceGauge.style.borderColor = "var(--border-color)";
            reportConfidenceGauge.style.borderTopColor = "var(--success)";
            reportConfidenceGauge.style.borderRightColor = "var(--success)";
        }

        // Render Actionable Remediation Cards
        reportFixesGrid.innerHTML = ""; // Clear existing fixes
        
        if (report.recommended_fixes && report.recommended_fixes.length > 0) {
            report.recommended_fixes.forEach(fix => {
                const card = document.createElement("div");
                const priorityClass = `priority-${(fix.priority || "medium").toLowerCase()}`;
                card.className = `remediation-card ${priorityClass}`;
                
                card.innerHTML = `
                    <div class="fix-header">
                        <span class="fix-title">🔧 ${fix.fix}</span>
                        <span class="priority-pill ${(fix.priority || "medium").toLowerCase()}">${fix.priority || "Medium"}</span>
                    </div>
                    <p class="fix-explanation">${fix.explanation || "No explanation provided."}</p>
                `;
                reportFixesGrid.appendChild(card);
            });
        } else {
            const placeholder = document.createElement("p");
            placeholder.className = "subtitle text-center";
            placeholder.innerText = "No action guidelines generated for this category.";
            reportFixesGrid.appendChild(placeholder);
        }

        // Transition views
        analysisResultsContent.classList.remove("hidden");
    }

    // =========================================================================
    // 6. COLLAPSIBLE EVIDENCE DRAWER
    // =========================================================================
    
    btnToggleEvidence.addEventListener("click", () => {
        evidenceDrawerContent.classList.toggle("collapsed");
        evidenceCollapseIcon.classList.toggle("collapsed");
        if (evidenceDrawerContent.classList.contains("collapsed")) {
            evidenceCollapseIcon.innerText = "▼";
        } else {
            evidenceCollapseIcon.innerText = "▲";
        }
    });

    // =========================================================================
    // 7. HISTORY RUNS VAULT MANAGER
    // =========================================================================
    
    async function fetchHistoryList() {
        try {
            const res = await fetch(`${API_BASE}/reports`);
            if (!res.ok) throw new Error("History fetch failed");
            const data = await res.json();
            populateHistoryTable(data.reports || []);
        } catch (err) {
            console.error("History vault error:", err);
        }
    }

    // Call history on start
    fetchHistoryList();

    btnRefreshHistory.addEventListener("click", fetchHistoryList);

    function populateHistoryTable(reports) {
        historyTableBody.innerHTML = "";
        runsHistoryCount.innerText = `${reports.length} analysis runs stored`;

        if (reports.length === 0) {
            historyTableBody.innerHTML = `
                <tr class="table-empty-row">
                    <td colspan="6" class="text-center">No past runs found. Upload a log file to begin logging history.</td>
                </tr>
            `;
            return;
        }

        reports.forEach(report => {
            const row = document.createElement("tr");
            row.id = `history-row-${report.id}`;
            row.dataset.id = report.id;
            
            // Safe format string dates
            const dateStr = new Date(report.timestamp).toLocaleString();

            row.innerHTML = `
                <td><div class="table-filename" title="${report.filename}">${report.filename}</div></td>
                <td><span class="table-platform">${report.platform || "Unknown"}</span></td>
                <td><span class="table-category">${report.failure_type}</span></td>
                <td><div class="table-summary" title="${report.summary}">${report.summary}</div></td>
                <td><span class="table-timestamp">${dateStr}</span></td>
                <td class="actions-col">
                    <button class="action-row-btn btn-view" title="Open diagnostics">👁️</button>
                    <button class="action-row-btn btn-delete" title="Delete run">🗑️</button>
                </td>
            `;

            // Action: Click row anywhere (except buttons) to load report details
            row.addEventListener("click", (e) => {
                if (e.target.closest("button")) return;
                loadReportDetails(report.id);
            });

            // Action: View Button
            row.querySelector(".btn-view").addEventListener("click", () => {
                loadReportDetails(report.id);
            });

            // Action: Delete Button
            row.querySelector(".btn-delete").addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete analysis run for: ${report.filename}?`)) {
                    deleteReportRun(report.id);
                }
            });

            historyTableBody.appendChild(row);
        });
    }

    async function loadReportDetails(reportId) {
        // Toggle view panel to loading state
        resultsEmptyState.classList.add("hidden");
        analysisResultsContent.classList.add("hidden");
        resultsLoadingState.classList.remove("hidden");
        loadingStatusText.innerText = "Retrieving archived report...";

        try {
            const res = await fetch(`${API_BASE}/reports/${reportId}`);
            if (!res.ok) throw new Error("Archived report details retrieval failed");
            const data = await res.json();
            
            // Map keys of raw report back to match FinalReport structure
            const mappedReport = {
                pipeline_platform: data.pipeline_platform,
                failure_type: data.failure_type,
                classification_confidence: 0.9, // default archive confidence
                summary: data.summary,
                root_cause: data.root_cause,
                evidence: data.evidence || [],
                recommended_fixes: data.recommended_fixes || []
            };

            renderAnalysisReport(mappedReport);
            
            // Smoothly scroll to active cards
            document.getElementById("results-card").scrollIntoView({ behavior: "smooth" });

        } catch (err) {
            alert(`Archived load failure: ${err.message}`);
            resultsEmptyState.classList.remove("hidden");
            analysisResultsContent.classList.add("hidden");
        } finally {
            resultsLoadingState.classList.add("hidden");
        }
    }

    async function deleteReportRun(reportId) {
        try {
            const res = await fetch(`${API_BASE}/reports/${reportId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Delete API call failed");
            
            // Trigger Fadeout Animation
            const row = document.getElementById(`history-row-${reportId}`);
            if (row) {
                row.classList.add("fade-out");
                setTimeout(() => {
                    row.remove();
                    // Refetch list to sync counts/empty messages
                    fetchHistoryList();
                }, 400);
            } else {
                fetchHistoryList();
            }

        } catch (err) {
            alert(`Delete failed: ${err.message}`);
        }
    }

    // =========================================================================
    // 8. VAULT DYNAMIC FRONTEND TEXT SEARCH FILTERING
    // =========================================================================
    
    filterSearchInput.addEventListener("input", (e) => {
        const val = e.target.value.toLowerCase().trim();
        const rows = historyTableBody.querySelectorAll("tr");
        
        if (rows.length === 1 && rows[0].classList.contains("table-empty-row")) return;

        rows.forEach(row => {
            const filename = row.querySelector(".table-filename").innerText.toLowerCase();
            const platform = row.querySelector(".table-platform").innerText.toLowerCase();
            const category = row.querySelector(".table-category").innerText.toLowerCase();
            const summary = row.querySelector(".table-summary").innerText.toLowerCase();

            if (filename.includes(val) || platform.includes(val) || category.includes(val) || summary.includes(val)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });

    // =========================================================================
    // 9. GITHUB ACTIONS MULTI-AGENT INGESTION PIPELINE
    // =========================================================================

    // Listen to message callbacks from OAuth popup window
    window.addEventListener("message", (event) => {
        const apiOrigin = new URL(API_BASE).origin;
        if (event.origin !== window.location.origin && event.origin !== apiOrigin) return;
        
        if (event.data && event.data.type === "GITHUB_OAUTH_SUCCESS") {
            const token = event.data.token;
            handleGitHubLoginSuccess(token);
        } else if (event.data && event.data.type === "GITHUB_OAUTH_FAILURE") {
            alert(`GitHub OAuth Connection Failed: ${event.data.error}`);
        }
    });

    // Sign in using standard GitHub OAuth popup
    btnGithubOauthLogin.addEventListener("click", () => {
        const width = 600, height = 650;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        // Open backend-configured redirect URL popup
        window.open(
            "/api/v1/auth/github/login",
            "GitHub Authorization Portal",
            `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
    });

    // Toggle Personal Access Token manual connection input form
    btnTogglePatForm.addEventListener("click", () => {
        patForm.classList.toggle("hidden");
        document.getElementById("pat-toggle-arrow").classList.toggle("active");
    });

    // PAT submit action
    btnGithubPatLogin.addEventListener("click", () => {
        const patValue = githubPatInput.value.trim();
        if (!patValue) {
            alert("Please input a valid GitHub Personal Access Token first.");
            return;
        }
        handleGitHubLoginSuccess(patValue);
    });

    // Triggered upon successful authentication (either OAuth code or direct PAT)
    async function handleGitHubLoginSuccess(token) {
        githubToken = token;
        sessionStorage.setItem("github_token", token);
        
        try {
            const userProfile = await fetchGitHubProfile(token);
            renderGitHubProfile(userProfile);
            showLoggedInView(true);
            await loadGitHubRepositories(token);
        } catch (err) {
            console.error("Failed to connect GitHub workspace:", err);
            
            // Offline/Mock mode fallback
            if (token === "mock_token" || token.startsWith("mock")) {
                const mockProfile = {
                    login: "octocat-dev",
                    name: "Octocat Developer",
                    avatar_url: "https://avatars.githubusercontent.com/u/5832347?v=4"
                };
                renderGitHubProfile(mockProfile);
                showLoggedInView(true);
                await loadGitHubRepositories("mock_token");
            } else {
                alert(`GitHub Connection Failed. Check your network or enter 'mock_token' to proceed offline.`);
                handleGitHubLogout();
            }
        }
    }

    // Disconnect connection session
    btnGithubLogout.addEventListener("click", handleGitHubLogout);

    function handleGitHubLogout() {
        githubToken = null;
        sessionStorage.removeItem("github_token");
        githubPatInput.value = "";
        showLoggedInView(false);
    }

    // Toggle panels depending on login session state
    function showLoggedInView(isLoggedIn) {
        if (isLoggedIn) {
            githubLoggedOut.classList.add("hidden");
            githubLoggedIn.classList.remove("hidden");
        } else {
            githubLoggedOut.classList.remove("hidden");
            githubLoggedIn.classList.add("hidden");
        }
    }

    // Render User profile details
    function renderGitHubProfile(profile) {
        githubAvatar.src = profile.avatar_url || "https://avatars.githubusercontent.com/u/5832347?v=4";
        githubUsername.innerText = profile.name || profile.login || "octocat-dev";
    }

    // Call REST endpoint to fetch user's repositories
    async function fetchGitHubProfile(token) {
        const res = await fetch(`${API_BASE}/github/user?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error("HTTP profile load error");
        return await res.json();
    }

    // Load user's repositories into dropdown selector
    async function loadGitHubRepositories(token) {
        githubRepoSelect.innerHTML = '<option value="">Loading repositories...</option>';
        try {
            const res = await fetch(`${API_BASE}/github/repos?token=${encodeURIComponent(token)}`);
            if (!res.ok) throw new Error("Repositories API load failure");
            const data = await res.json();
            
            const repos = data.repositories || [];
            if (repos.length === 0) {
                githubRepoSelect.innerHTML = '<option value="">No repositories found</option>';
                return;
            }
            
            githubRepoSelect.innerHTML = '<option value="">Select Repository</option>';
            repos.forEach(repo => {
                const option = document.createElement("option");
                option.value = repo.full_name;
                option.innerText = repo.full_name;
                githubRepoSelect.appendChild(option);
            });
            
            // Trigger load runs on selection change
            githubRepoSelect.onchange = (e) => {
                const selectedRepo = e.target.value;
                if (selectedRepo) {
                    fetchWorkflowRuns(githubToken, selectedRepo);
                } else {
                    githubRunsWrapper.innerHTML = '<div class="runs-empty-state">Select a repository to inspect pipeline failures.</div>';
                }
            };
        } catch (err) {
            console.error(err);
            githubRepoSelect.innerHTML = '<option value="">Failed to fetch repositories</option>';
        }
    }

    // Trigger refresh button
    btnRefreshGithubRuns.addEventListener("click", () => {
        const selectedRepo = githubRepoSelect.value;
        if (selectedRepo) {
            fetchWorkflowRuns(githubToken, selectedRepo);
        }
    });

    // Load recent workflow runs for a repository
    async function fetchWorkflowRuns(token, repoFullName) {
        const parts = repoFullName.split("/");
        const owner = parts[0];
        const repo = parts[1];
        
        githubRunsWrapper.innerHTML = '<div class="runs-empty-state">Retrieving workflow runs...</div>';
        
        try {
            const res = await fetch(`${API_BASE}/github/repos/${owner}/${repo}/runs?token=${encodeURIComponent(token)}`);
            if (!res.ok) throw new Error("Workflow runs fetch failed");
            
            const data = await res.json();
            renderWorkflowRunsList(data.runs || [], owner, repo);
        } catch (err) {
            console.error(err);
            githubRunsWrapper.innerHTML = '<div class="runs-empty-state" style="color:var(--danger);">Failed to retrieve actions runs.</div>';
        }
    }

    // Render list of run elements in the viewport list
    function renderWorkflowRunsList(runs, owner, repo) {
        githubRunsWrapper.innerHTML = "";
        
        if (runs.length === 0) {
            githubRunsWrapper.innerHTML = '<div class="runs-empty-state">No workflow runs found.</div>';
            return;
        }
        
        runs.forEach(run => {
            const runItem = document.createElement("div");
            const conclusion = run.conclusion || "unknown";
            const runStatusClass = run.status === "completed" ? `run-${conclusion}` : "run-in_progress";
            
            runItem.className = `run-item ${runStatusClass}`;
            
            const commitMsg = run.head_commit?.message || "Triggered pipeline";
            const branch = run.head_branch || "main";
            const dateStr = new Date(run.created_at).toLocaleString();
            const statusLabelText = run.status === "completed" ? (run.conclusion || "Success") : "In Progress";
            const isCompleted = run.status === "completed";
            
            runItem.innerHTML = `
                <div class="run-details">
                    <div class="run-name-commit" title="${commitMsg}">${commitMsg}</div>
                    <div class="run-meta">
                        <span class="run-branch">🌿 ${branch}</span>
                        <span class="run-badge ${isCompleted ? conclusion.toLowerCase() : 'in_progress'}">${statusLabelText}</span>
                        <span class="run-time">${dateStr}</span>
                    </div>
                </div>
                <div>
                    ${isCompleted ? `<button class="btn-analyze-run" data-run-id="${run.id}">Analyze Logs</button>` : `<span class="run-badge in_progress" style="background:none;border:none;">🔄</span>`}
                </div>
            `;
            
            if (isCompleted) {
                const btn = runItem.querySelector(".btn-analyze-run");
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    btn.disabled = true;
                    btn.innerText = "Ingesting...";
                    triggerGitHubRunAnalysis(owner, repo, run.id, btn);
                });
            }
            
            githubRunsWrapper.appendChild(runItem);
        });
    }

    // REST call to trigger log extraction, sequential merge, and AI classifications
    async function triggerGitHubRunAnalysis(owner, repo, runId, actionButton) {
        // Trigger Loading UI Transition
        resultsEmptyState.classList.add("hidden");
        analysisResultsContent.classList.add("hidden");
        resultsLoadingState.classList.remove("hidden");
        loadingStatusText.innerText = "Retrieving actions runner logs...";
        
        // Scroll to analysis results card smoothly
        document.getElementById("results-card").scrollIntoView({ behavior: "smooth" });
        
        try {
            const res = await fetch(`${API_BASE}/github/repos/${owner}/${repo}/runs/${runId}/analyze?token=${encodeURIComponent(githubToken)}`, {
                method: "POST"
            });
            
            loadingStatusText.innerText = "Invoking sequence classifiers & Gemini root cause agents...";
            
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Actions log diagnostics failed.");
            }
            
            const data = await res.json();
            
            if (data.success && data.report) {
                renderAnalysisReport(data.report);
                fetchHistoryList();
            } else {
                const errorsJoined = data.errors ? data.errors.join(", ") : "Unknown Error";
                throw new Error(`Diagnostics pipeline node failure: ${errorsJoined}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Analysis execution failed: ${err.message}`);
            resultsEmptyState.classList.remove("hidden");
            analysisResultsContent.classList.add("hidden");
        } finally {
            resultsLoadingState.classList.add("hidden");
            if (actionButton) {
                actionButton.disabled = false;
                actionButton.innerText = "Analyze Logs";
            }
        }
    }

});
