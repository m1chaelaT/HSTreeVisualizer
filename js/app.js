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
    stepData: null
  };

  function toggleMode() {
    const state = window.HSApp.state;
    state.stepMode = !state.stepMode;

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

    document.getElementById("modeToggleBtn").addEventListener("click", toggleMode);
  });
})();
