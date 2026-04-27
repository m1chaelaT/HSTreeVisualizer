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

  function getStepEvent(step) {
    const { stepData } = window.HSApp.state;

    if (!stepData) return { type: "NO_STEP_DATA" };
    if (step === 0) return { type: "INITIAL_STATE" };

    for (const node of stepData.nodes) {
      let type = eventTypeAt(node.created, step);
      if (type) return { type, node };

      type = eventTypeAt(node.processed, step);
      if (type) return { type, node };

      type = eventTypeAt(node.closed, step);
      if (type) return { type, node };

      type = eventTypeAt(node.isExplanation, step);
      if (type) return { type, node };
    }

    for (const edge of stepData.edges) {
      let type = eventTypeAt(edge.created, step);
      if (type) return { type, edge };

      type = eventTypeAt(edge.pruned, step);
      if (type) return { type, edge };
    }

    return { type: `STEP_${step}` };
  }

  function formatStepDescription(event) {
    if (!event) return "";

    const { type, node, edge } = event;

    switch (type) {
      case "INITIAL_STATE":
        return "Start of algorithm";

      case "NODE_CREATED":
        return `CREATE NODE: ${node.label.join(", ")}`;

      case "PROCESSING_NODE":
        return `PROCESSING NODE: ${node.label.join(", ")}`;

      case "CLOSING_NODE":
        return `CLOSE NODE: ${node.label.join(", ")}`;

      case "POSSIBLE_EXPLANATION":
        return `EXPLANATION FOUND: ${node.label.join(", ")}`;

      case "EDGE_CREATED":
        return `CREATE EDGE: ${edge.label || edge.from + " → " + edge.to}`;

      case "EDGE_PRUNED":
        return `PRUNE EDGE: ${edge.label}`;
      case "NONMINIMAL_EXPLANATION":
        return `NON-MINIMAL EXPLANATION: ${edge.label}`;
      case "INCONSISTENT_EXPLANATION":
        return `INCONSISTENT EXPLANATION: ${edge.label}`;

      case "IRELEVANT_EXPLANATION":
        return `IRRELEVANT EXPLANATION: ${edge.label}`;
      default:
        return type + "not defined";
    }
  }
  

  function updateStepDescription() {
    const state = window.HSApp.state;
    const bar = document.getElementById("stepInlineDescription");

    if (!bar) return;

    const event = getStepEvent(state.currentStep);
    bar.textContent = `${formatStepDescription(event)}`;
  }

  function initStepMode(treeData) {
    const state = window.HSApp.state;
    state.stepData = treeData;
    state.currentStep = 0;
    state.maxStep = findMaxStep(treeData);

    const elements = window.HSApp.treeRender.buildTreeElements(treeData, null);

    const layoutToUse = window.HSApp.treeRender.getLayoutForTree(treeData);
    window.HSApp.treeRender.createCy(elements, layoutToUse);
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
  if (originalId === 0) return step >= 1;

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
  const createdStep = edge.data("createdStep");

  if (createdStep !== null && createdStep !== undefined) {
    return createdStep <= step;
  }

  const prunedStep = edge.data("prunedStep");
  return prunedStep !== null && prunedStep !== undefined && prunedStep <= step;
}

  function debugNodeStyle(node, label = "") {
  console.group(`DEBUG NODE ${label}: ${node.id()}`);

  console.log("classes:", node.classes());
  console.log("data label:", node.data("label"));
  console.log("originalLabel:", node.data("originalLabel"));
  console.log("is explanation:", node.hasClass("explanation"));
  console.log("is initial-mxp:", node.hasClass("initial-mxp"));
  console.log("is hidden:", node.hasClass("hidden"));
  console.log("is step-node-hidden:", node.hasClass("step-node-hidden"));

  console.log("style label:", node.style("label"));
  console.log("font-size:", node.style("font-size"));
  console.log("font-weight:", node.style("font-weight"));
  console.log("text-wrap:", node.style("text-wrap"));
  console.log("text-max-width:", node.style("text-max-width"));
  console.log("width style:", node.style("width"));
  console.log("height style:", node.style("height"));
  console.log("padding:", node.style("padding"));
  console.log("border-width:", node.style("border-width"));

  console.log("model width:", node.width());
  console.log("model height:", node.height());
  console.log("rendered width:", node.renderedWidth());
  console.log("rendered height:", node.renderedHeight());
  console.log("boundingBox:", node.boundingBox());

  console.groupEnd();
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
    /*
    const closedFinal = node.data("closedFinal") === true;
    const closedStep = node.data("closedStep");

    const closedVisible =
      closedFinal &&
      closedStep !== null &&
      closedStep !== undefined &&
      closedStep <= step;

    node.data("closed", closedVisible);
    */
    if (explanationVisible) {
      node.data("label", "✓");
      //debugNodeStyle(node, `after explanationVisible step ${step}`);
      node.style("label");      // force Cytoscape style recalculation
      node.boundingBox();
      return;
    }

    const state = window.HSApp.state;

    if (state.showingIndex) {
      node.data("label", node.id());
    } else {
      node.data("label", node.data("originalLabel"));
    }
  }

  function shouldKeepNodeAsPlaceholder(node, step) {
  if (node.hasClass("pruned")) {
    const prunedStep = node.data("prunedStep");
    if (prunedStep !== null && prunedStep !== undefined && prunedStep > step) {
      return node.incomers("edge").some(edge => isEdgeVisibleAtStep(edge, step));
    }
  }

  return node.incomers("edge").some(edge => isEdgeVisibleAtStep(edge, step));
}

  function applyStepVisibility(step) {
    const state = window.HSApp.state;
    if (!state.cy) return;

    state.cy.nodes().forEach(node => {
      const visible = isNodeVisibleAtStep(node, step);
      const placeholder = !visible && shouldKeepNodeAsPlaceholder(node, step);

      node.removeClass("hidden");
      node.removeClass("step-node-hidden");

      if (visible) {
        // normálne viditeľný node
      } else if (placeholder) {
        node.addClass("step-node-hidden");
      } else {
        node.addClass("hidden");
      }

      updateNodeStateForStep(node, step);
      if (node.hasClass("explanation")) {
  //debugNodeStyle(node, `after applyStepVisibility step ${step}`);
}
    });

    state.cy.edges().forEach(edge => {
      const sourceVisible = !edge.source().hasClass("hidden");
const targetExists = !edge.target().hasClass("hidden");
const edgeVisible = isEdgeVisibleAtStep(edge, step);

      edge.removeClass("step-edge-hidden");

      if (edgeVisible && sourceVisible && targetExists) {
  // edge zobraz
} else {
  edge.addClass("step-edge-hidden");
}
    });
  }

  function focusCurrentStep() {
    const state = window.HSApp.state;
    if (!state.cy) return;

    state.cy.elements().removeClass("current-step-highlight");

    const event = getStepEvent(state.currentStep);
    if (!event) return;

    let target = null;

    if (event.node) {
      const { type } = event;

      if (type !== "CLOSE_NODE") {
        target = state.cy.getElementById("n" + event.node.id);
      }
    } else if (event.edge) {
  if (event.edge.child !== null && event.edge.child !== undefined) {
    // klasická hrana
    target = state.cy.getElementById("e" + event.edge.parent + "_" + event.edge.child);
  } else {
    // pruned edge → máme aj pruned node
    const safeLabel = String(event.edge.label ?? "").replace(/[^a-zA-Z0-9_]/g, "_");
    const prunedStep = window.HSApp.treeRender.readStepValue(event.edge.pruned);
    const prunedNodeId = "p" + event.edge.parent + "_" + safeLabel + "_" + (prunedStep ?? "x");

    const PRUNED_EVENTS = [
      "EDGE_PRUNED",
      "INVALID_PATH",
      "INCONSISTENT_EXPLANATION",
      "IRELEVANT_EXPLANATION",
      "NONMINIMAL_EXPLANATION"
    ];

    if (PRUNED_EVENTS.includes(event.type)) {
      // highlight červený node
      target = state.cy.getElementById(prunedNodeId);
    } else {
      // EDGE_CREATED → highlight hrana
      target = state.cy.getElementById("e" + event.edge.parent + "_" + prunedNodeId);
    }
  }
}

    if (!target || target.empty()) return;

    if (event.node && target.isNode()) {
      window.HSApp.treeRender.renderNodeInfo(target, false);
    }

    target.addClass("current-step-highlight");
    target.style("label");      // force Cytoscape style recalculation
    target.boundingBox();
    state.cy.animate({
      center: { eles: target },
      duration: 300
    });
  }

  function renderCurrentStep() {
    const state = window.HSApp.state;
    if (!state.stepData || !state.cy) return;

    applyStepVisibility(state.currentStep);
    updateStepCounter();
    updateStepDescription();
    focusCurrentStep();
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
  getStepEvent,
  bindStepEvents
};
})();