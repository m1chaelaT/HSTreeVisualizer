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
      content += `<div><b>Algorithm:</b> ${tree.algorithm}</div><br>`;
    }

    if (tree.ontology) {
      // Observations
      if (tree.ontology.observations && tree.ontology.observations.length > 0) {
        content += `<div><b>Observations:</b></div>`;
        content += `<div>${tree.ontology.observations.join("<br>")}</div><br>`;
      }

      // TBox
      if (tree.ontology.tbox && tree.ontology.tbox.length > 0) {
        content += `<div><b>TBox:</b></div>`;
        content += `<div>` + tree.ontology.tbox.map(line => `• ${line}`).join("<br>") + `</div>`;
      }
    } else {
      content += "No data.";
    }

    ontologyDiv.innerHTML = content;
  }

  function handleFile(event) {
    const file = event.target.files[0];

    const fileName = file?.name || "No file selected";
    const fileNameSpan = document.getElementById("fileName");
    if (fileNameSpan) {
      fileNameSpan.textContent = fileName;
      fileNameSpan.title = fileName;
    }

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

    function updateMaxDepth() {
    const input = document.getElementById("maxDepthInput");
    const state = window.HSApp.state;
    if (!input) return;

    const raw = input.value.trim();

    if (raw === "") {
      state.maxVisibleDepth = null;
    } else {
      const parsed = Number(raw);

      if (!Number.isInteger(parsed) || parsed < 0) {
        input.value = state.maxVisibleDepth ?? "";
        return;
      }

      state.maxVisibleDepth = parsed;
    }

    if (state.stepMode) {
      window.HSApp.stepMode.renderCurrentStep();
    } else {
      window.HSApp.treeRender.rebuildTreeFromState();
    }
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

    const helpBtn = document.getElementById("helpBtn");

    if (helpBtn) {
      helpBtn.addEventListener("click", () => {
        window.open(
          "https://github.com/m1chaelaT/HSTreeVisualizer/blob/main/README.md",
          "_blank"
        );
      });
    }

    if (mxpBtn) mxpBtn.addEventListener("click", window.HSApp.treeRender.toggleInitialMxpExplanations);
    if (prunedBtn) prunedBtn.addEventListener("click", window.HSApp.treeRender.togglePrunedNodes);
    if (labelBtn) labelBtn.addEventListener("click", window.HSApp.treeRender.toggleLabels);

    document.getElementById("centerCanvas").addEventListener("click", window.HSApp.treeRender.centerCanvas);
    document.getElementById("zoomIn").addEventListener("click", window.HSApp.treeRender.zoomIn);
    document.getElementById("zoomOut").addEventListener("click", window.HSApp.treeRender.zoomOut);

        const maxDepthInput = document.getElementById("maxDepthInput");
    if (maxDepthInput) {
      maxDepthInput.addEventListener("change", updateMaxDepth);
    }

    document.addEventListener("contextmenu", e => {
      if (e.target.closest("#cy")) e.preventDefault();
    });
  }

  function updateModeUi() {
    const state = window.HSApp.state;
    const treeToolbar = document.getElementById("treeToolbar");
    const stepToolbar = document.getElementById("stepToolbar");
    const treeModeRadio = document.getElementById("treeModeRadio");
    const stepModeRadio = document.getElementById("stepModeRadio");

    const depthControl = document.querySelector(".depthControl");

    if (state.stepMode) {
      treeToolbar.style.display = "none";
      stepToolbar.style.display = "flex";

      if (depthControl) depthControl.style.display = "none"; 

      if (stepModeRadio) stepModeRadio.checked = true;
      if (treeModeRadio) treeModeRadio.checked = false;
    } else {
      treeToolbar.style.display = "flex";
      stepToolbar.style.display = "none";

      if (depthControl) depthControl.style.display = "flex";

      if (treeModeRadio) treeModeRadio.checked = true;
      if (stepModeRadio) stepModeRadio.checked = false;
    }
  }

  window.HSApp = window.HSApp || {};
    window.HSApp.ui = {
    toggleInfoPanel,
    setInfoPanelHtml,
    setOntologyContent,
    handleFile,
    updateMaxDepth,
    bindUiEvents,
    updateModeUi
  };
})();
