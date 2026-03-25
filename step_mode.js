let currentStep = 0;
let maxStep = 0;
let stepData = null;

function findMaxStep(treeData) {
  let max = 0;

  treeData.nodes.forEach(n => {
    max = Math.max(max, readStepValue(n.created) ?? 0);
    max = Math.max(max, readStepValue(n.processed) ?? 0);
    max = Math.max(max, readStepValue(n.closed) ?? 0);
    max = Math.max(max, readStepValue(n.isExplanation) ?? 0);
  });

  treeData.edges.forEach(e => {
    max = Math.max(max, readStepValue(e.created) ?? 0);
    max = Math.max(max, readStepValue(e.pruned) ?? 0);
  });

  return max;
}

function initStepMode(treeData) {
  stepData = treeData;
  currentStep = 0;
  maxStep = findMaxStep(treeData);

  renderCurrentStep();
}

function renderCurrentStep() {
  if (!stepData) return;

  const elements = buildTreeElements(stepData, currentStep);

  createCy(elements, {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 50,
    edgeSep: 10,
    rankSep: 100,
    padding: 30
  });

  bindStepInteractions();
  setOntologyContent(stepData);
  updateStepCounter();
}

function stepForward() {
  if (!stepData) return;

  if (currentStep < maxStep) {
    currentStep++;
    renderCurrentStep();
  }
}

function stepBack() {
  if (!stepData) return;

  if (currentStep > 0) {
    currentStep--;
    renderCurrentStep();
  }
}

function updateStepCounter() {
  const counter = document.getElementById("stepCounter");
  if (counter) {
    counter.textContent = `Step ${currentStep} / ${maxStep}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const stepForwardBtn = document.getElementById("stepForward");
  const stepBackBtn = document.getElementById("stepBack");

  if (stepForwardBtn) {
    stepForwardBtn.addEventListener("click", stepForward);
  }

  if (stepBackBtn) {
    stepBackBtn.addEventListener("click", stepBack);
  }

  updateStepCounter();
});