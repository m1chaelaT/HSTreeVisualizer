(function () {
  function toggleInfoPanel(forceOpen = false) {
    const infoPanel = document.getElementById("infoPanel");
    if (!infoPanel) return;

    if (forceOpen) {
      infoPanel.classList.add("open");
    } else {
      infoPanel.classList.toggle("open");
    }
  }

  function setInfoPanelHtml(html) {
    const infoContent = document.getElementById("infoContent");
    if (!infoContent) return;
    infoContent.innerHTML = html;
    toggleInfoPanel(true);
  }

  function setOntologyContent(tree) {
    const ontologyDiv = document.getElementById("ontologyContent");
    if (!ontologyDiv) return;

    let content = `<h3>Ontology</h3>`;

    if (tree.algorithm) {
      content += `<b>Algorithm:</b> ${tree.algorithm}<br><br>`;
    }

    if (tree.ontology) {
      const obsHTML = tree.ontology.observations && tree.ontology.observations.length > 0
        ? `<b>Observations:</b><br>${tree.ontology.observations.join("<br>")}<br><br>`
        : "";

      const tboxHTML = tree.ontology.tbox && tree.ontology.tbox.length > 0
        ? `<b>TBox:</b><br>` + tree.ontology.tbox.map(line => `• ${line}`).join("<br>")
        : "";

      content += obsHTML + tboxHTML;
    } else {
      content += "No data.";
    }

    ontologyDiv.innerHTML = content;
  }

  function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        const state = window.HSApp.state;
        state.currentTree = parsed;

        if (state.stepMode) {
          window.HSApp.stepMode.initStepMode(parsed);
        } else {
          window.HSApp.treeRender.drawTree(parsed);
        }
      } catch {
        alert("Neplatný JSON súbor");
      }
    };

    reader.readAsText(file);
  }

  function bindUiEvents() {
    const mxpBtn = document.getElementById("MXPExplenationsBtn");
    const prunedBtn = document.getElementById("prunnedUpdBtn");
    const labelBtn = document.getElementById("labelUpdtBtn");

    document.getElementById("fileInput").addEventListener("change", handleFile);
    document.getElementById("filterExplanations").addEventListener("click", window.HSApp.treeRender.showExplanations);
    document.getElementById("showFullTree").addEventListener("click", window.HSApp.treeRender.showFullTree);
    document.getElementById("panelToggleBtn").addEventListener("click", () => toggleInfoPanel());

    const stepInfoBtn = document.getElementById("panelToggleBtnStep");
    if (stepInfoBtn) {
      stepInfoBtn.addEventListener("click", () => toggleInfoPanel());
    }

    if (mxpBtn) mxpBtn.addEventListener("click", window.HSApp.treeRender.toggleInitialMxpExplanations);
    if (prunedBtn) prunedBtn.addEventListener("click", window.HSApp.treeRender.togglePrunedNodes);
    if (labelBtn) labelBtn.addEventListener("click", window.HSApp.treeRender.toggleLabels);

    document.getElementById("centerCanvas").addEventListener("click", window.HSApp.treeRender.centerCanvas);
    document.getElementById("zoomIn").addEventListener("click", window.HSApp.treeRender.zoomIn);
    document.getElementById("zoomOut").addEventListener("click", window.HSApp.treeRender.zoomOut);

    document.addEventListener("contextmenu", e => {
      if (e.target.closest("#cy")) e.preventDefault();
    });
  }

  function updateModeUi() {
    const state = window.HSApp.state;
    const treeToolbar = document.getElementById("treeToolbar");
    const stepToolbar = document.getElementById("stepToolbar");
    const btn = document.getElementById("modeToggleBtn");

    if (state.stepMode) {
      treeToolbar.style.display = "none";
      stepToolbar.style.display = "flex";
      btn.textContent = "Switch to Tree Mode";
    } else {
      treeToolbar.style.display = "flex";
      stepToolbar.style.display = "none";
      btn.textContent = "Switch to Step Mode";
    }
  }

  window.HSApp = window.HSApp || {};
  window.HSApp.ui = {
    toggleInfoPanel,
    setInfoPanelHtml,
    setOntologyContent,
    handleFile,
    bindUiEvents,
    updateModeUi
  };
})();
