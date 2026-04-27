(function () {

  function resetAppStateForNewFile() {
  const state = window.HSApp.state;

  state.explanationFilterActive = false;
  state.showingInitialMxpNodes = true;
  state.showingPruned = true;
  state.showingIndex = false;
  state.currentStep = 0;
  state.maxStep = 0;
  state.stepData = null;
  state.maxVisibleDepth = null;

  const maxDepthInput = document.getElementById("maxDepthInput");
  if (maxDepthInput) maxDepthInput.value = "";

  const infoContent = document.getElementById("infoContent");
  if (infoContent) {
    infoContent.innerHTML =
      "<h3>Node Information</h3>Right-click on a node to see details";
  }

  const stepCounter = document.getElementById("stepCounter");
  if (stepCounter) stepCounter.textContent = "Step 0 / 0";

  const stepDescription = document.getElementById("stepInlineDescription");
  if (stepDescription) stepDescription.textContent = "Waiting for step...";
}

  function toggleInfoPanel(forceOpen = false) {
    const infoPanel = document.getElementById("infoPanel");
    if (!infoPanel) return;

    if (forceOpen) {
      infoPanel.classList.add("open");
    } else {
      infoPanel.classList.toggle("open");
    }
  }
  

function setInfoPanelHtml(html, openPanel = true) {
  const infoContent = document.getElementById("infoContent");
  if (!infoContent) return;

  infoContent.innerHTML = html;

  if (openPanel) {
    toggleInfoPanel(true);
  }
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
  const input = event.target;
  const file = input.files[0];

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

      const validationErrors = validateTreeJson(parsed);

      if (validationErrors.length > 0) {
        alert(
          "JSON file has an invalid HS-tree structure:\n\n" +
          validationErrors.join("\n")
        );
        return;
      }

      const state = window.HSApp.state;

      resetAppStateForNewFile();
      state.currentTree = parsed;

      if (state.stepMode) {
        window.HSApp.stepMode.initStepMode(parsed);
      } else {
        window.HSApp.treeRender.drawTree(parsed);
      }
    } catch (err) {
      console.error(err);
      alert("Neplatný JSON súbor");
    } finally {
      input.value = "";
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

      if (!Number.isInteger(parsed) || parsed < 1) {
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

    const fileInput = document.getElementById("fileInput");

    if (fileInput) {
      fileInput.addEventListener("click", () => {
        fileInput.value = "";
      });

      fileInput.addEventListener("change", handleFile);
    }
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

  function validateTreeJson(tree) {
  const errors = [];

  const allowedEventTypes = new Set([
    "PROCESSING_NODE",
    "NODE_CREATED",
    "CLOSING_NODE",
    "EDGE_CREATED",
    "EDGE_PRUNED",
    "INVALID_PATH",
    "POSSIBLE_EXPLANATION",
    "INCONSISTENT_EXPLANATION",
    "IRELEVANT_EXPLANATION",
    "NONMINIMAL_EXPLANATION"
  ]);

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function validateEventObject(obj, fieldName, location) {
    if (!isObject(obj)) {
      errors.push(`${location}: field '${fieldName}' must be an object.`);
      return;
    }

    if ("step" in obj && (!Number.isInteger(obj.step) || obj.step < 0)) {
      errors.push(`${location}: '${fieldName}.step' must be a non-negative integer.`);
    }

    if ("type" in obj && !allowedEventTypes.has(obj.type)) {
      errors.push(`${location}: unknown event type '${obj.type}' in '${fieldName}'.`);
    }
  }

  if (!isObject(tree)) {
    errors.push("Root JSON value must be an object.");
    return errors;
  }

  if (!Array.isArray(tree.nodes)) {
    errors.push("Missing or invalid field: 'nodes' must be an array.");
  }

  if (!Array.isArray(tree.edges)) {
    errors.push("Missing or invalid field: 'edges' must be an array.");
  }

  if (tree.ontology !== undefined) {
    if (!isObject(tree.ontology)) {
      errors.push("Field 'ontology' must be an object.");
    } else {
      if (tree.ontology.tbox !== undefined && !Array.isArray(tree.ontology.tbox)) {
        errors.push("Field 'ontology.tbox' must be an array.");
      }

      if (
        tree.ontology.observations !== undefined &&
        !Array.isArray(tree.ontology.observations)
      ) {
        errors.push("Field 'ontology.observations' must be an array.");
      }
    }
  }

  if (!Array.isArray(tree.nodes) || !Array.isArray(tree.edges)) {
    return errors;
  }

  const nodeIds = new Set();

  tree.nodes.forEach((node, index) => {
    const location = `Node at index ${index}`;

    if (!isObject(node)) {
      errors.push(`${location} must be an object.`);
      return;
    }

    if (!Number.isInteger(node.id)) {
      errors.push(`${location}: field 'id' must be an integer.`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`${location}: duplicate node id '${node.id}'.`);
    } else {
      nodeIds.add(node.id);
    }

    if (!Number.isInteger(node.depth) || node.depth < 0) {
      errors.push(`${location}: field 'depth' must be a non-negative integer.`);
    }

    if (!Array.isArray(node.path)) {
      errors.push(`${location}: field 'path' must be an array.`);
    }

    if (!Array.isArray(node.label)) {
      errors.push(`${location}: field 'label' must be an array of strings.`);
    } else {
      node.label.forEach((labelItem, labelIndex) => {
        if (typeof labelItem !== "string") {
          errors.push(`${location}: label[${labelIndex}] must be a string.`);
        }
      });
    }

    if (!("isExplanation" in node)) {
      errors.push(`${location}: missing field 'isExplanation'.`);
    } else {
      validateEventObject(node.isExplanation, "isExplanation", location);

      if (
        isObject(node.isExplanation) &&
        typeof node.isExplanation.isExplanation !== "boolean" &&
        typeof node.isExplanation.isExplenation !== "boolean"
      ) {
        errors.push(
          `${location}: 'isExplanation.isExplanation' must be a boolean.`
        );
      }
    }

    if (!("closed" in node)) {
      errors.push(`${location}: missing field 'closed'.`);
    } else {
      validateEventObject(node.closed, "closed", location);

      if (isObject(node.closed) && typeof node.closed.closed !== "boolean") {
        errors.push(`${location}: 'closed.closed' must be a boolean.`);
      }
    }

    if ("created" in node) {
      validateEventObject(node.created, "created", location);
    }

    if ("processed" in node) {
      validateEventObject(node.processed, "processed", location);
    }
  });

  tree.edges.forEach((edge, index) => {
    const location = `Edge at index ${index}`;

    if (!isObject(edge)) {
      errors.push(`${location} must be an object.`);
      return;
    }

    if (!Number.isInteger(edge.parent)) {
      errors.push(`${location}: field 'parent' must be an integer.`);
    } else if (!nodeIds.has(edge.parent)) {
      errors.push(`${location}: parent node '${edge.parent}' does not exist.`);
    }

    if (!("child" in edge)) {
      errors.push(`${location}: missing field 'child'.`);
    } else if (
      edge.child !== null &&
      (!Number.isInteger(edge.child) || !nodeIds.has(edge.child))
    ) {
      errors.push(`${location}: child node '${edge.child}' does not exist.`);
    }

    if (typeof edge.label !== "string") {
      errors.push(`${location}: field 'label' must be a string.`);
    }

    if (!("pruned" in edge)) {
      errors.push(`${location}: missing field 'pruned'.`);
    } else {
      validateEventObject(edge.pruned, "pruned", location);

      if (isObject(edge.pruned) && typeof edge.pruned.pruned !== "string") {
        errors.push(`${location}: 'pruned.pruned' must be a string.`);
      }
    }

    if ("created" in edge) {
      validateEventObject(edge.created, "created", location);
    }
  });

  return errors;
}

  window.HSApp = window.HSApp || {};
    window.HSApp.ui = {
    toggleInfoPanel,
    setInfoPanelHtml,
    setOntologyContent,
    handleFile,
    updateMaxDepth,
    bindUiEvents,
    updateModeUi,
    validateTreeJson
  };
})();
