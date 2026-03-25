(function () {
  function findMaxStep(treeData) {
    let max = 0;

    treeData.nodes.forEach(n => {
      max = Math.max(max, window.HSApp.treeRender.readStepValue(n.created) ?? 0);
      max = Math.max(max, window.HSApp.treeRender.readStepValue(n.processed) ?? 0);
      max = Math.max(max, window.HSApp.treeRender.readStepValue(n.closed) ?? 0);
      max = Math.max(max, window.HSApp.treeRender.readStepValue(n.isExplanation) ?? 0);
    });

    treeData.edges.forEach(e => {
      max = Math.max(max, window.HSApp.treeRender.readStepValue(e.created) ?? 0);
      max = Math.max(max, window.HSApp.treeRender.readStepValue(e.pruned) ?? 0);
    });

    return max;
  }

  function eventTypeAt(eventObj, step) {
    if (!eventObj) return null;

    const eventStep = window.HSApp.treeRender.readStepValue(eventObj);
    if (eventStep !== step) return null;

    return eventObj.type || null;
  }

  function getStepEventType(step) {
    const state = window.HSApp.state;
    const treeData = state.stepData;

    if (!treeData) return "No step data loaded";
    if (step === 0) return "INITIAL_STATE";

    for (const node of treeData.nodes) {
      const createdType = eventTypeAt(node.created, step);
      if (createdType) return createdType;

      const processedType = eventTypeAt(node.processed, step);
      if (processedType) return processedType;

      const closedType = eventTypeAt(node.closed, step);
      if (closedType) return closedType;

      const explanationType = eventTypeAt(node.isExplanation, step);
      if (explanationType) return explanationType;
    }

    for (const edge of treeData.edges) {
      const createdType = eventTypeAt(edge.created, step);
      if (createdType) return createdType;

      const prunedType = eventTypeAt(edge.pruned, step);
      if (prunedType) return prunedType;
    }

    return `STEP_${step}`;
  }

  function updateStepDescription() {
    const state = window.HSApp.state;
    const bar = document.getElementById("stepDescriptionBar");

    if (!bar) return;

    bar.textContent = getStepEventType(state.currentStep);
  }

  function initStepMode(treeData) {
    const state = window.HSApp.state;
    state.stepData = treeData;
    state.currentStep = 0;
    state.maxStep = findMaxStep(treeData);

    const elements = window.HSApp.treeRender.buildTreeElements(treeData, null);

    window.HSApp.treeRender.createCy(elements, window.HSApp.treeRender.DEFAULT_LAYOUT);
    window.HSApp.treeRender.bindStepInteractions();
    window.HSApp.ui.setOntologyContent(treeData);

    applyStepVisibility(state.currentStep);
    updateStepCounter();
    updateStepDescription();
  }

  function isNodeVisibleAtStep(node, step) {
  if (node.hasClass("pruned")) {
    const prunedStep = node.data("prunedStep");
    return prunedStep !== null && prunedStep !== undefined && prunedStep <= step;
  }

  const originalId = node.data("originalId");
  if (originalId === 0) return true;

  const createdStep = node.data("createdStep");
  if (createdStep !== null && createdStep !== undefined) {
    return createdStep <= step;
  }

  const explanationStep = node.data("explanationStep");
  if (explanationStep !== null && explanationStep !== undefined) {
    return explanationStep <= step;
  }

  const processedStep = node.data("processedStep");
  if (processedStep !== null && processedStep !== undefined) {
    return processedStep <= step;
  }

  const closedStep = node.data("closedStep");
  if (closedStep !== null && closedStep !== undefined) {
    return closedStep <= step;
  }

  return false;
}

  function isEdgeVisibleAtStep(edge, step) {
    const target = edge.target();

    if (target && target.length > 0 && target.hasClass("pruned")) {
      const prunedStep = target.data("prunedStep");
      return prunedStep !== null && prunedStep !== undefined && prunedStep <= step;
    }

    const createdStep = edge.data("createdStep");
    return createdStep !== null && createdStep !== undefined && createdStep <= step;
  }

  function updateNodeStateForStep(node, step) {
    if (node.hasClass("pruned")) return;

    const explanationFinal = node.data("isExplanationFinal") === true;
    const explanationStep = node.data("explanationStep");

    const explanationVisible =
      explanationFinal &&
      explanationStep !== null &&
      explanationStep !== undefined &&
      explanationStep <= step;

    if (explanationVisible) {
      node.addClass("explanation");
    } else {
      node.removeClass("explanation");
    }

    const isInitialMxpExplanation =
      node.data("depth") === 1 && explanationVisible === true;

    if (isInitialMxpExplanation) {
      node.addClass("initial-mxp");
    } else {
      node.removeClass("initial-mxp");
    }

    const closedFinal = node.data("closedFinal") === true;
    const closedStep = node.data("closedStep");

    const closedVisible =
      closedFinal &&
      closedStep !== null &&
      closedStep !== undefined &&
      closedStep <= step;

    node.data("closed", closedVisible);

    const state = window.HSApp.state;
    if (state.showingIndex) {
      node.data("label", node.id());
    } else {
      node.data("label", node.data("originalLabel"));
    }
  }

  function applyStepVisibility(step) {
    const state = window.HSApp.state;
    if (!state.cy) return;

    state.cy.nodes().forEach(node => {
      if (isNodeVisibleAtStep(node, step)) {
        node.removeClass("hidden");
      } else {
        node.addClass("hidden");
      }

      updateNodeStateForStep(node, step);
    });

    state.cy.edges().forEach(edge => {
      const sourceVisible = !edge.source().hasClass("hidden");
      const targetVisible = !edge.target().hasClass("hidden");
      const edgeVisible = isEdgeVisibleAtStep(edge, step);

      if (edgeVisible && sourceVisible && targetVisible) {
        edge.removeClass("hidden");
      } else {
        edge.addClass("hidden");
      }
    });
  }

  function renderCurrentStep() {
    const state = window.HSApp.state;
    if (!state.stepData || !state.cy) return;

    applyStepVisibility(state.currentStep);
    updateStepCounter();
    updateStepDescription();
  }

  function stepForward() {
    const state = window.HSApp.state;
    if (!state.stepData) return;

    if (state.currentStep < state.maxStep) {
      state.currentStep++;
      renderCurrentStep();
    }
  }

  function stepBack() {
    const state = window.HSApp.state;
    if (!state.stepData) return;

    if (state.currentStep > 0) {
      state.currentStep--;
      renderCurrentStep();
    }
  }

  function updateStepCounter() {
    const counter = document.getElementById("stepCounter");
    const state = window.HSApp.state;

    if (counter) {
      counter.textContent = `Step ${state.currentStep} / ${state.maxStep}`;
    }
  }

  function bindStepEvents() {
    const stepForwardBtn = document.getElementById("stepForward");
    const stepBackBtn = document.getElementById("stepBack");

    if (stepForwardBtn) {
      stepForwardBtn.addEventListener("click", stepForward);
    }

    if (stepBackBtn) {
      stepBackBtn.addEventListener("click", stepBack);
    }

    updateStepCounter();
  }

  window.HSApp = window.HSApp || {};
window.HSApp.stepMode = {
  findMaxStep,
  initStepMode,
  applyStepVisibility,
  renderCurrentStep,
  stepForward,
  stepBack,
  updateStepCounter,
  updateStepDescription,
  getStepEventType,
  bindStepEvents
};
})();