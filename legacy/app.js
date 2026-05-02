document.addEventListener("DOMContentLoaded", () => {
  // State Management
  const state = {
    apiKey: localStorage.getItem("resend_api_key") || "",
    logs: JSON.parse(localStorage.getItem("dispatch_logs") || "[]"),
    identities: JSON.parse(
      localStorage.getItem("verified_identities") ||
        '["onboarding@resend.dev"]',
    ),
    currentView: "dashboard",
    contentType: "html", // 'html' or 'text'
  };

  // DOM Elements
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");
  const viewTitle = document.getElementById("view-title");
  const apiStatusTag = document.getElementById("api-status-tag");
  const serverStatusTag = document.getElementById("server-status-tag");
  const toastContainer = document.getElementById("toast-container");

  // Form Elements
  const emailForm = document.getElementById("email-form");
  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const subjectInput = document.getElementById("subject");
  const htmlContent = document.getElementById("html-content");
  const previewIframe = document.getElementById("preview-iframe");
  const sendBtn = document.getElementById("send-btn");
  const typeToggles = document.querySelectorAll(".type-toggle");
  const contentLabel = document.getElementById("content-label");

  // Settings Elements
  const apiKeyInput = document.getElementById("api-key");
  const saveSettingsBtn = document.getElementById("save-settings");
  const clearDataBtn = document.getElementById("clear-data");

  // Identity Manager Elements
  const fromSelect = document.getElementById("from");
  const toggleAddIdentityBtn = document.getElementById("toggle-add-identity");
  const identitySelectWrapper = document.getElementById(
    "identity-select-wrapper",
  );
  const identityInputWrapper = document.getElementById(
    "identity-input-wrapper",
  );
  const newIdentityEmail = document.getElementById("new-identity-email");
  const saveIdentityBtn = document.getElementById("save-identity-btn");
  const cancelIdentityBtn = document.getElementById("cancel-identity-btn");

  // Stats Elements
  const statTotal = document.getElementById("stat-total");
  const statSuccess = document.getElementById("stat-success");
  const recentTableBody = document.querySelector("#recent-table tbody");
  const fullLogsTableBody = document.getElementById("logs-body");
  const clearLogsBtn = document.getElementById("clear-logs-btn");

  // Modal Elements
  const logModal = document.getElementById("log-detail-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const copyResponseBtn = document.getElementById("copy-response-btn");
  const modalTo = document.getElementById("modal-to");
  const modalTime = document.getElementById("modal-time");
  const modalSubject = document.getElementById("modal-subject");
  const modalCode = document.getElementById("modal-code");
  const modalStatusLabel = document.getElementById("modal-status-label");
  const modalResponse = document.getElementById("modal-response");
  const modalStatusIcon = document.getElementById("modal-status-icon");

  // Initialization
  function init() {
    updateAPIStatus();
    updateStats();
    renderLogs();
    renderIdentities();
    checkServerStatus(); // First check
    setInterval(checkServerStatus, 5000); // Check every 5s
    if (state.apiKey) apiKeyInput.value = state.apiKey;
    updatePreview();

    logToTerminal("Initializing MailDispatch Engine...");
    logToTerminal("Ready for transmission.");
  }

  // Navigation Logic
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetView = item.getAttribute("data-view");
      switchView(targetView);
    });
  });

  document
    .getElementById("quick-compose")
    .addEventListener("click", () => switchView("compose"));

  function switchView(viewId) {
    state.currentView = viewId;

    // Update UI
    views.forEach((v) => v.classList.remove("active"));
    document.getElementById(`view-${viewId}`).classList.add("active");

    navItems.forEach((i) => {
      if (i.getAttribute("data-view") === viewId) {
        i.classList.add("active");
      } else {
        i.classList.remove("active");
      }
    });

    // Update Title
    viewTitle.textContent = viewId.charAt(0).toUpperCase() + viewId.slice(1);

    // Refresh logs if switching to logs or dashboard
    if (viewId === "logs" || viewId === "dashboard") {
      renderLogs();
      updateStats();
    }
  }

  // Toggle logic
  typeToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.contentType = btn.getAttribute("data-type");
      typeToggles.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      contentLabel.textContent =
        state.contentType === "html" ? "HTML Content" : "Plain Text Content";
      htmlContent.placeholder =
        state.contentType === "html"
          ? "<p>Congrats on your first email!</p>"
          : "Congrats on your first email!";
      updatePreview();
    });
  });

  // Preview Logic
  htmlContent.addEventListener("input", updatePreview);

  function updatePreview() {
    const content =
      htmlContent.value ||
      '<p style="color: #71717a; text-align: center; margin-top: 50px;">Start typing to see preview...</p>';
    const doc =
      previewIframe.contentDocument || previewIframe.contentWindow.document;
    doc.open();

    if (state.contentType === "text") {
      doc.write(
        `<pre style="font-family: sans-serif; white-space: pre-wrap; padding: 20px; color: #333;">${escapeHTML(htmlContent.value || "Type something...")}</pre>`,
      );
    } else {
      doc.write(content);
    }
    doc.close();
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }

  // API & Data Logic
  async function checkServerStatus() {
    try {
      const res = await fetchWithFallback([
        `/api/status?t=${Date.now()}`,
        `/status?t=${Date.now()}`,
      ]);
      if (res.ok) {
        serverStatusTag.textContent = "ENGINE: ONLINE";
        serverStatusTag.style.background = "var(--accent-green)";
        serverStatusTag.style.color = "var(--on-surface)";
        serverStatusTag.classList.add("card-shadow");
      } else {
        throw new Error();
      }
    } catch {
      serverStatusTag.textContent = "ENGINE: OFFLINE";
      serverStatusTag.style.background = "var(--surface-container-high)";
      serverStatusTag.style.color = "var(--text-muted)";
      serverStatusTag.classList.remove("card-shadow");
    }
  }

  async function fetchWithFallback(urls, options) {
    let lastError;

    for (const url of urls) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status === 405) {
          return response;
        }
        lastError = new Error(`Request failed with status ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("All request attempts failed");
  }

  function updateAPIStatus() {
    if (!state.apiKey) {
      apiStatusTag.style.display = "inline-block";
      apiStatusTag.textContent = "No API Key";
      apiStatusTag.className = "status-badge status-error";
    } else {
      apiStatusTag.style.display = "inline-block";
      apiStatusTag.textContent = "Ready";
      apiStatusTag.className = "status-badge status-success";
    }
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon = type === "success" ? "check_circle" : "error";
    toast.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <span>${message}</span>
        `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation =
        "slide-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  saveSettingsBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      state.apiKey = key;
      localStorage.setItem("resend_api_key", key);
      updateAPIStatus();
      showToast("Settings Saved", "success");
      switchView("dashboard");
    }
  });

  clearDataBtn.addEventListener("click", clearHistory);
  if (clearLogsBtn) clearLogsBtn.addEventListener("click", clearHistory);

  function clearHistory() {
    if (
      confirm(
        "CRITICAL: Are you sure you want to permanently clear all dispatch history? This cannot be undone.",
      )
    ) {
      state.logs = [];
      localStorage.removeItem("dispatch_logs");
      renderLogs();
      updateStats();
      showToast("History Purged", "success");
      if (state.currentView !== "dashboard") switchView("dashboard");
    }
  }

  function logToTerminal(message, type = "") {
    // Switch to silent console log for production
    if (type === "error") console.error(`[MailDispatch] ${message}`);
    else console.log(`[MailDispatch] ${message}`);
  }

  // Modal Logic
  window.openLogDetails = function (index) {
    const log = state.logs[index];
    if (!log) return;

    modalTo.textContent = log.recipient;
    modalTime.textContent = new Date(log.timestamp).toLocaleString();
    modalSubject.textContent = log.subject;
    modalCode.textContent = log.code;
    modalStatusLabel.textContent = log.status;
    modalResponse.textContent = JSON.stringify(
      JSON.parse(log.response),
      null,
      4,
    );

    // Icon color
    modalStatusIcon.style.color =
      log.status === "SUCCESS" ? "var(--accent-green)" : "var(--error)";
    modalStatusIcon.textContent =
      log.status === "SUCCESS" ? "check_circle" : "error";

    logModal.style.display = "flex";
  };

  function closeLogDetails() {
    logModal.style.display = "none";
  }

  closeModalBtn.addEventListener("click", closeLogDetails);
  logModal.addEventListener("click", (e) => {
    if (e.target === logModal) closeLogDetails();
  });

  copyResponseBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(modalResponse.textContent);
    showToast("Response Copied", "success");
  });

  function generateCurl(payload, apiKey) {
    const headers = `-H 'Authorization: Bearer ${apiKey}' -H 'Content-Type: application/json'`;
    const data = `-d '${JSON.stringify(payload)}'`;
    return `curl -X POST 'https://api.resend.com/emails' ${headers} ${data}`;
  }

  // Identity Management Logic
  function renderIdentities() {
    fromSelect.innerHTML = state.identities
      .map((email) => `<option value="${email}">${email}</option>`)
      .join("");
  }

  toggleAddIdentityBtn.addEventListener("click", () => {
    identitySelectWrapper.style.display = "none";
    identityInputWrapper.style.display = "flex";
    newIdentityEmail.focus();
  });

  cancelIdentityBtn.addEventListener("click", () => {
    identitySelectWrapper.style.display = "flex";
    identityInputWrapper.style.display = "none";
    newIdentityEmail.value = "";
  });

  saveIdentityBtn.addEventListener("click", () => {
    const email = newIdentityEmail.value.trim();
    if (email && !state.identities.includes(email)) {
      state.identities.push(email);
      localStorage.setItem(
        "verified_identities",
        JSON.stringify(state.identities),
      );
      renderIdentities();
      fromSelect.value = email;
      cancelIdentityBtn.click();
      logToTerminal(`New identity added: ${email}`, "success");
      showToast("Identity Added", "success");
    }
  });

  // Test Seeder Logic
  seedTestBtn.addEventListener("click", () => {
    const testFrom = "help@dhairyadarji.me";
    const testTo = "dhairyadarji025@gmail.com";

    // Add test email to identities if not exists
    if (!state.identities.includes(testFrom)) {
      state.identities.push(testFrom);
      localStorage.setItem(
        "verified_identities",
        JSON.stringify(state.identities),
      );
      renderIdentities();
    }

    fromSelect.value = testFrom;
    toInput.value = testTo;
    subjectInput.value = "System Test Dispatch";
    htmlContent.value = `<h2>Hello Developer!</h2><p>This is an automated test dispatch from <b>MailDispatch Engine</b>.</p><p>Payload testing successful.</p>`;

    state.contentType = "html";
    typeToggles.forEach((b) => b.classList.remove("active"));
    document.querySelector('[data-type="html"]').classList.add("active");
    contentLabel.textContent = "HTML Content";

    updatePreview();
    logToTerminal("Form seeded with test data.", "success");
    showToast("Test Data Seeded", "success");
  });

  // Email Sending Logic
  emailForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!state.apiKey) {
      showToast("API Key Required", "error");
      switchView("settings");
      return;
    }

    const payload = {
      from: fromInput.value,
      to: toInput.value,
      subject: subjectInput.value,
      [state.contentType]: htmlContent.value,
    };

    setLoading(true);
    logToTerminal(`Initiating dispatch via Local Engine...`);

    try {
      // ROUTE VIA LOCAL SERVER BY DEFAULT
      const response = await fetchWithFallback(["/api/send", "/send"], {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      logToTerminal(
        `Response received [${response.status}]: ${JSON.stringify(result)}`,
        response.ok ? "success" : "error",
      );

      const logEntry = {
        timestamp: new Date().toISOString(),
        recipient: payload.to,
        subject: payload.subject,
        status: response.ok ? "SUCCESS" : "ERROR",
        code: response.status,
        response: JSON.stringify(result),
      };

      addLog(logEntry);

      if (response.ok) {
        showToast("Email Sent Successfully!", "success");
        emailForm.reset();
        updatePreview();
        switchView("dashboard");

        const logEntry = {
          timestamp: new Date().toISOString(),
          recipient: payload.to,
          subject: payload.subject,
          status: "SUCCESS",
          code: response.status,
          response: JSON.stringify(result),
        };
        addLog(logEntry);
      } else {
        showToast(result.message || "Dispatch Failed", "error");
        const logEntry = {
          timestamp: new Date().toISOString(),
          recipient: payload.to,
          subject: payload.subject,
          status: "ERROR",
          code: response.status,
          response: JSON.stringify(result),
        };
        addLog(logEntry);
      }
    } catch (error) {
      logToTerminal(`ENGINE ERROR: ${error.message}`, "error");
      const logEntry = {
        timestamp: new Date().toISOString(),
        recipient: payload.to,
        subject: payload.subject,
        status: "OFFLINE/ERROR",
        code: "FAIL",
        response: error.message,
      };
      addLog(logEntry);
      showToast("Engine Connection Failed", "error");
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    sendBtn.innerHTML = isLoading
      ? '<span class="material-symbols-outlined rotating">sync</span><span>Sending...</span>'
      : '<span class="material-symbols-outlined">send</span><span>Send Dispatch</span>';
  }

  function addLog(entry) {
    state.logs.unshift(entry);
    localStorage.setItem("dispatch_logs", JSON.stringify(state.logs));
  }

  function renderLogs() {
    // Full Logs
    fullLogsTableBody.innerHTML =
      state.logs
        .map(
          (log, index) => `
            <tr class="clickable-row" onclick="openLogDetails(${index})">
                <td class="mono" style="font-size: 0.7rem;">${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.recipient}</td>
                <td>${log.subject}</td>
                <td><span class="status-badge ${log.status === "SUCCESS" ? "status-success" : "status-error"}">${log.code} ${log.status}</span></td>
                <td class="mono" style="font-size: 0.7rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title='${log.response}'>${log.response}</td>
            </tr>
        `,
        )
        .join("") ||
      '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No dispatches yet.</td></tr>';

    // Dashboard Recent
    recentTableBody.innerHTML =
      state.logs
        .slice(0, 5)
        .map((log, index) => {
          // Find original index for modal
          const originalIndex = state.logs.indexOf(log);
          return `
                <tr class="clickable-row" onclick="openLogDetails(${originalIndex})">
                    <td class="mono">${new Date(log.timestamp).toLocaleDateString()}</td>
                    <td>${log.recipient}</td>
                    <td>${log.subject}</td>
                    <td><span class="status-badge ${log.status === "SUCCESS" ? "status-success" : "status-error"}">${log.status}</span></td>
                </tr>
            `;
        })
        .join("") ||
      '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No activity.</td></tr>';
  }

  function updateStats() {
    const total = state.logs.length;
    const success = state.logs.filter((l) => l.status === "SUCCESS").length;
    const rate = total > 0 ? Math.round((success / total) * 100) : 0;

    statTotal.textContent = total;
    statSuccess.textContent = `${rate}%`;
  }

  init();
});
