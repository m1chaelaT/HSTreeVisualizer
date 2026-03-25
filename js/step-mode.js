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

  function initStepMode(treeData) {
    const state = window.HSApp.state;
    state.stepData = treeData;
    state.currentStep = 0;
    state.maxStep = findMaxStep(treeData);

    renderCurrentStep();
  }

  function renderCurrentStep() {
    const state = window.HSApp.state;
    if (!state.stepData) return;

    const elements = window.HSApp.treeRender.buildTreeElements(state.stepData, state.currentStep);

    window.HSApp.treeRender.createCy(elements, window.HSApp.treeRender.DEFAULT_LAYOUT);
    window.HSApp.treeRender.bindStepInteractions();
    window.HSApp.ui.setOntologyContent(state.stepData);
    updateStepCounter();
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
    renderCurrentStep,
    stepForward,
    stepBack,
    updateStepCounter,
    bindStepEvents
  };
})();
