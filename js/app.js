(function () {
  window.HSApp = window.HSApp || {};

  window.HSApp.state = {
  cy: null,
  explanationFilterActive: false,
  currentTree: null,
  showingInitialMxpNodes: true,
  showingPruned: true,
  showingIndex: false,
  stepMode: false,
  currentStep: 0,
  maxStep: 0,
  stepData: null,
  maxVisibleDepth: null
};

  function applyMode(isStepMode) {
    const state = window.HSApp.state;
    state.stepMode = isStepMode;

    window.HSApp.ui.updateModeUi();

    if (state.stepMode) {
      if (state.currentTree) {
        window.HSApp.stepMode.initStepMode(state.currentTree);
      } else if (state.cy) {
        state.cy.elements().remove();
      }
    } else if (state.currentTree) {
      window.HSApp.treeRender.drawTree(state.currentTree);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.HSApp.ui.bindUiEvents();
    window.HSApp.stepMode.bindStepEvents();

    const treeModeRadio = document.getElementById("treeModeRadio");
    const stepModeRadio = document.getElementById("stepModeRadio");

    if (treeModeRadio) {
      treeModeRadio.addEventListener("change", () => {
        if (treeModeRadio.checked) {
          applyMode(false);
        }
      });
    }

    if (stepModeRadio) {
      stepModeRadio.addEventListener("change", () => {
        if (stepModeRadio.checked) {
          applyMode(true);
        }
      });
    }

    // nastav UI podľa default checked inputu
    applyMode(stepModeRadio && stepModeRadio.checked);
  });
})();