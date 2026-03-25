let cy = null;
let explanationFilterActive = false;
let currentTree = null;
let showingInitialMxpNodes = true;
let showingPruned = true;
let showingIndex = false;
let stepMode = false;

function getInitialMxpExplanationNodes(tree) {
  if (tree.algorithm !== "MHS_MXP") return [];

  return tree.nodes.filter(node =>
    node.depth === 1 && readExplanationValue(node.isExplanation)
  );
}

function isVisualRootNode(node) {
  return node.data("depth") === 1 && !node.data("isExplanation");
}

function readExplanationValue(explanation) {
  if (typeof explanation === "boolean") return explanation;

  if (explanation && typeof explanation === "object") {
    if (explanation.isExplanation === true) return true;
    if (explanation.isExplenation === true) return true;
    return false;
  }

  return false;
}

function readClosedValue(closed) {
  if (typeof closed === "boolean") return closed;
  if (typeof closed === "string") return closed === "closed";

  if (closed && typeof closed === "object") {
    return closed.closed === true;
  }

  return false;
}

function readPrunedText(pruned) {
  if (typeof pruned === "string") return pruned;

  if (pruned && typeof pruned === "object") {
    return String(pruned.pruned || "");
  }

  return "";
}

function readStepValue(obj) {
  if (obj && typeof obj === "object" && obj.step !== undefined) {
    return obj.step;
  }
  return null;
}

function readTypeValue(obj) {
  if (obj && typeof obj === "object" && obj.type !== undefined) {
    return obj.type;
  }
  return null;
}

function getNodeLabelText(label) {
  return Array.isArray(label) ? label.join("\n") : String(label ?? "");
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

function buildCyStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-wrap": "wrap",
        "text-max-width": "220px",
        "text-valign": "center",
        "text-halign": "center",
        padding: "10px",
        shape: "round-rectangle",
        "background-color": "#e3f2fd",
        "border-width": 1,
        "border-color": "#555",
        "font-size": "10px",
        width: "label",
        height: "label"
      }
    },
    {
      selector: "node.explanation",
      style: {
        label: "✓",
        "text-valign": "center",
        "text-halign": "center",
        "font-size": "24px",
        "font-weight": "bold",
        color: "#2e7d32",
        width: 36,
        height: 36,
        padding: "0px",
        shape: "round-rectangle",
        "background-color": "#e8f5e9",
        "border-color": "#2e7d32",
        "border-width": 2
      }
    },
    {
      selector: "node.initial-mxp",
      style: {
        label: "initial MXP\n✓",
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "text-max-width": "70px",
        "font-size": "8px",
        "font-weight": "bold",
        color: "#2e7d32",
        width: 52,
        height: 52,
        padding: "4px",
        shape: "round-rectangle",
        "background-color": "#dff5e3",
        "border-color": "#66a870",
        "border-width": 2
      }
    },
    {
      selector: "node[closed = true]",
      style: {
        "border-style": "dashed"
      }
    },
    {
      selector: "node.pruned",
      style: {
        label: "✗",
        "text-valign": "center",
        "text-halign": "center",
        "font-size": "24px",
        "font-weight": "bold",
        color: "#c62828",
        width: 36,
        height: 36,
        padding: "0px",
        shape: "round-rectangle",
        "background-color": "#ffebee",
        "border-color": "#c62828",
        "border-width": 2
      }
    },
    {
      selector: "edge",
      style: {
        label: "data(label)",
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "arrow-scale": 1.2,
        "font-size": "9px",
        "text-background-color": "#ffffff",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
        "text-background-shape": "roundrectangle"
      }
    },
    {
      selector: ".hidden",
      style: {
        display: "none"
      }
    }
  ];
}

function createCy(elements, layoutConfig = null) {
  if (cy) cy.destroy();

  cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    style: buildCyStyle(),
    layout: layoutConfig || {
      name: "dagre",
      rankDir: "TB",
      nodeSep: 50,
      edgeSep: 10,
      rankSep: 100,
      padding: 30
    }
  });

  return cy;
}

function buildTreeElements(tree, stepLimit = null) {
  const elements = [];
  const visibleNodeIds = new Set([0]);

  if (stepLimit !== null) {
    tree.nodes.forEach(n => {
      const createdStep = readStepValue(n.created);
      if (createdStep !== null && createdStep <= stepLimit) {
        visibleNodeIds.add(n.id);
      }
    });

    tree.edges.forEach(e => {
      const createdStep = readStepValue(e.created);
      if (e.child !== null && e.child !== undefined && createdStep !== null && createdStep <= stepLimit) {
        visibleNodeIds.add(e.parent);
        visibleNodeIds.add(e.child);
      }
    });
  } else {
    tree.nodes.forEach(n => visibleNodeIds.add(n.id));
  }

  tree.nodes.forEach(n => {
    if (!visibleNodeIds.has(n.id)) return;

    const finalExplanation = readExplanationValue(n.isExplanation);
    const finalClosed = readClosedValue(n.closed);

    const explanationStep = readStepValue(n.isExplanation);
    const closedStep = readStepValue(n.closed);

    const explanationVisible =
      finalExplanation &&
      (stepLimit === null || (explanationStep !== null && explanationStep <= stepLimit));

    const closedVisible =
      finalClosed &&
      (stepLimit === null || (closedStep !== null && closedStep <= stepLimit));

    const labelText = getNodeLabelText(n.label);
    const pathValue = Array.isArray(n.path) ? n.path : [];

    const isInitialMxpExplanation =
      tree.algorithm === "MHS_MXP" &&
      n.depth === 1 &&
      explanationVisible === true;

    const classes = [];
    if (explanationVisible) classes.push("explanation");
    if (isInitialMxpExplanation) classes.push("initial-mxp");

    elements.push({
      data: {
        id: "n" + n.id,
        originalId: n.id,
        label: labelText,
        originalLabel: labelText,
        closed: closedVisible,
        closedFinal: finalClosed,
        isExplanation: explanationVisible,
        isExplanationFinal: finalExplanation,
        depth: Number(n.depth ?? 0),
        path: pathValue,

        createdStep: readStepValue(n.created),
        createdType: readTypeValue(n.created),

        processedStep: readStepValue(n.processed),
        processedType: readTypeValue(n.processed),

        explanationStep: explanationStep,
        explanationType: readTypeValue(n.isExplanation),

        closedStep: closedStep,
        closedType: readTypeValue(n.closed),

        isInitialMxpExplanation: isInitialMxpExplanation
      },
      classes: classes.join(" ")
    });
  });

  tree.edges.forEach(e => {
    const prunedText = readPrunedText(e.pruned);
    const edgeCreatedStep = readStepValue(e.created);
    const prunedStep = readStepValue(e.pruned);

    if (e.child !== null && e.child !== undefined) {
      const edgeVisible =
        stepLimit === null ||
        (edgeCreatedStep !== null && edgeCreatedStep <= stepLimit);

      if (!edgeVisible) return;
      if (!visibleNodeIds.has(e.parent) || !visibleNodeIds.has(e.child)) return;

      elements.push({
        data: {
          id: "e" + e.parent + "_" + e.child,
          source: "n" + e.parent,
          target: "n" + e.child,
          label: String(e.label ?? ""),
          pruned: prunedText,
          createdStep: edgeCreatedStep,
          createdType: readTypeValue(e.created),
          prunedStep: prunedStep,
          prunedType: readTypeValue(e.pruned)
        }
      });
    } else {
      const prunedVisible =
        stepLimit === null ||
        (prunedStep !== null && prunedStep <= stepLimit);

      if (!prunedVisible) return;
      if (!visibleNodeIds.has(e.parent)) return;

      const safeLabel = String(e.label ?? "").replace(/[^a-zA-Z0-9_]/g, "_");
      const prunedNodeId = "p" + e.parent + "_" + safeLabel + "_" + (prunedStep ?? "x");

      elements.push({
        data: {
          id: prunedNodeId,
          label: "✗",
          originalLabel: prunedText || "PRUNED",
          parentId: e.parent,
          edgeLabel: String(e.label ?? ""),
          pruned: prunedText,
          prunedStep: prunedStep,
          prunedType: readTypeValue(e.pruned)
        },
        classes: "pruned"
      });

      elements.push({
        data: {
          id: "e" + e.parent + "_" + prunedNodeId,
          source: "n" + e.parent,
          target: prunedNodeId,
          label: String(e.label ?? ""),
          pruned: prunedText,
          prunedStep: prunedStep,
          prunedType: readTypeValue(e.pruned)
        }
      });
    }
  });

  return elements;
}

function renderNodeInfo(n) {
  if (n.hasClass("pruned")) {
    let html =
      `<h3>Pruned Node Information</h3>` +
      `<b>ID:</b> ${n.id()}<br>` +
      `<b>Edge label:</b> ${n.data("edgeLabel") || "-"}<br>` +
      `<b>Reason:</b> ${n.data("pruned") || "-"}<br>`;

    if (n.data("prunedType")) {
      html += `<b>Type:</b> ${n.data("prunedType")}<br>`;
    }

    if (n.data("prunedStep") !== null && n.data("prunedStep") !== undefined) {
      html += `<b>Step:</b> ${n.data("prunedStep")}<br>`;
    }

    if (n.data("parentId") !== undefined) {
      html += `<b>Parent:</b> n${n.data("parentId")}<br>`;
    }

    setInfoPanelHtml(html);
    return;
  }

  let html =
    `<h3>Node Information</h3>` +
    `<b>ID:</b> ${n.id()}<br>` +
    `<b>Label:</b><br>${String(n.data("originalLabel") || "").replace(/\n/g, "<br>")}<br><br>` +
    `<b>Closed:</b> ${n.data("closedFinal") === true ? "true" : "false"}<br>` +
    `<b>Explanation:</b> ${n.data("isExplanationFinal") === true ? "true" : "false"}<br>` +
    `<b>Depth:</b> ${n.data("depth")}<br>`;

  const path = n.data("path");
  if (Array.isArray(path) && path.length > 0) {
    html += `<br><b>Path:</b><br>${path.join("<br>")}<br>`;
  }

  if (n.data("createdStep") !== null && n.data("createdStep") !== undefined) {
    html += `<br><b>Created:</b> step ${n.data("createdStep")}`;
    if (n.data("createdType")) html += ` (${n.data("createdType")})`;
    html += `<br>`;
  }

  if (n.data("processedStep") !== null && n.data("processedStep") !== undefined) {
    html += `<b>Processed:</b> step ${n.data("processedStep")}`;
    if (n.data("processedType")) html += ` (${n.data("processedType")})`;
    html += `<br>`;
  }

  if (n.data("explanationStep") !== null && n.data("explanationStep") !== undefined) {
    html += `<b>Explanation event:</b> step ${n.data("explanationStep")}`;
    if (n.data("explanationType")) html += ` (${n.data("explanationType")})`;
    html += `<br>`;
  }

  if (n.data("closedStep") !== null && n.data("closedStep") !== undefined) {
    html += `<b>Closed:</b> step ${n.data("closedStep")}`;
    if (n.data("closedType")) html += ` (${n.data("closedType")})`;
    html += `<br>`;
  }

  if (isVisualRootNode(n) && currentTree?.algorithm === "MHS_MXP") {
    const mxpNodes = getInitialMxpExplanationNodes(currentTree);

    if (mxpNodes.length > 0) {
      html += `<br><h4>Initial MXP possible explanations</h4>`;
      mxpNodes.forEach(node => {
        const lbl = Array.isArray(node.label) ? node.label.join(", ") : String(node.label ?? "");
        html += `• ${lbl}<br>`;
      });
    }
  }

  setInfoPanelHtml(html);
}

function bindCommonRightClick() {
  cy.on("cxttap", "node", evt => {
    renderNodeInfo(evt.target);
  });
}

function bindTreeInteractions() {
  bindCommonRightClick();

  cy.on("tap", "node", evt => {
    if (explanationFilterActive) return;
    if (evt.target.hasClass("pruned")) return;
    toggleChildren(evt.target);
  });
}

function bindStepInteractions() {
  bindCommonRightClick();
}

function drawTree(tree) {
  currentTree = tree;

  explanationFilterActive = false;
  showingInitialMxpNodes = true;
  showingPruned = true;
  showingIndex = false;

  const mxpBtn = document.getElementById("MXPExplenationsBtn");
  const prunedBtn = document.getElementById("prunnedUpdBtn");
  const labelBtn = document.getElementById("labelUpdtBtn");

  if (labelBtn) labelBtn.textContent = "Hide Labels";
  if (prunedBtn) prunedBtn.textContent = "Hide pruned nodes";

  if (mxpBtn) {
    if (tree.algorithm === "MHS_MXP") {
      mxpBtn.style.display = "inline-block";
      mxpBtn.textContent = "Hide initial MXP explenations";
    } else {
      mxpBtn.style.display = "none";
    }
  }

  const elements = buildTreeElements(tree, null);
  createCy(elements);
  bindTreeInteractions();
  setOntologyContent(tree);
}

function toggleChildren(node) {
  const children = node.outgoers("node");
  if (children.length === 0) return;

  const shouldHide = !children[0].hasClass("hidden");

  children.forEach(child => {
    toggleSubtree(child, shouldHide);
  });
}

function toggleSubtree(node, hide) {
  if (hide) {
    node.addClass("hidden");
    node.connectedEdges().addClass("hidden");
  } else {
    node.removeClass("hidden");
    node.connectedEdges().removeClass("hidden");
  }

  node.outgoers("node").forEach(child => {
    toggleSubtree(child, hide);
  });
}

function reapplySpecialVisibility() {
  if (!cy) return;

  if (!showingPruned) {
    cy.nodes(".pruned").forEach(node => {
      node.addClass("hidden");
      node.connectedEdges().addClass("hidden");
    });
  }

  if (!showingInitialMxpNodes) {
    cy.nodes(".initial-mxp").forEach(node => {
      node.addClass("hidden");
      node.connectedEdges().addClass("hidden");
    });
  }
}

function showExplanations() {
  if (!cy) return;

  explanationFilterActive = true;

  cy.nodes().addClass("hidden");
  cy.edges().addClass("hidden");

  cy.nodes(".explanation").forEach(n => {
    n.removeClass("hidden");
    n.predecessors().removeClass("hidden");
    n.connectedEdges().removeClass("hidden");
  });

  reapplySpecialVisibility();
}

function showFullTree() {
  if (!cy) return;

  explanationFilterActive = false;
  cy.nodes().removeClass("hidden");
  cy.edges().removeClass("hidden");

  reapplySpecialVisibility();
}

function toggleInitialMxpExplanations() {
  if (!cy) return;

  const mxpBtn = document.getElementById("MXPExplenationsBtn");
  const mxpNodes = cy.nodes(".initial-mxp");

  if (showingInitialMxpNodes) {
    mxpNodes.forEach(node => {
      node.addClass("hidden");
      node.connectedEdges().addClass("hidden");
    });
    if (mxpBtn) mxpBtn.textContent = "Show initial MXP explenations";
  } else {
    mxpNodes.forEach(node => {
      node.removeClass("hidden");
      node.connectedEdges().removeClass("hidden");
    });
    if (mxpBtn) mxpBtn.textContent = "Hide initial MXP explenations";
  }

  showingInitialMxpNodes = !showingInitialMxpNodes;
}

function togglePrunedNodes() {
  if (!cy) return;

  const prunedBtn = document.getElementById("prunnedUpdBtn");
  const prunedNodes = cy.nodes(".pruned");

  if (showingPruned) {
    prunedNodes.forEach(node => {
      node.addClass("hidden");
      node.connectedEdges().addClass("hidden");
    });
    if (prunedBtn) prunedBtn.textContent = "Show pruned nodes";
  } else {
    prunedNodes.forEach(node => {
      node.removeClass("hidden");
      node.connectedEdges().removeClass("hidden");
    });
    if (prunedBtn) prunedBtn.textContent = "Hide pruned nodes";
  }

  showingPruned = !showingPruned;
}

function toggleLabels() {
  if (!cy) return;

  const labelBtn = document.getElementById("labelUpdtBtn");

  cy.nodes().forEach(node => {
    if (
      node.hasClass("pruned") ||
      node.data("isExplanation") === true ||
      node.hasClass("initial-mxp")
    ) {
      return;
    }

    if (showingIndex) {
      node.data("label", node.data("originalLabel"));
    } else {
      node.data("label", node.id());
    }
  });

  if (labelBtn) {
    labelBtn.textContent = showingIndex ? "Hide Labels" : "Show Labels";
  }

  showingIndex = !showingIndex;
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      currentTree = parsed;

      if (stepMode && typeof initStepMode === "function") {
        initStepMode(parsed);
      } else {
        drawTree(parsed);
      }
    } catch {
      alert("Neplatný JSON súbor");
    }
  };

  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => {
  const mxpBtn = document.getElementById("MXPExplenationsBtn");
  const prunedBtn = document.getElementById("prunnedUpdBtn");
  const labelBtn = document.getElementById("labelUpdtBtn");

  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("filterExplanations").addEventListener("click", showExplanations);
  document.getElementById("showFullTree").addEventListener("click", showFullTree);
  document.getElementById("panelToggleBtn").addEventListener("click", () => toggleInfoPanel());

  const stepInfoBtn = document.getElementById("panelToggleBtnStep");
  if (stepInfoBtn) {
    stepInfoBtn.addEventListener("click", () => toggleInfoPanel());
  }

  if (mxpBtn) mxpBtn.addEventListener("click", toggleInitialMxpExplanations);
  if (prunedBtn) prunedBtn.addEventListener("click", togglePrunedNodes);
  if (labelBtn) labelBtn.addEventListener("click", toggleLabels);

  document.getElementById("centerCanvas").addEventListener("click", () => {
    if (cy) cy.center();
  });

  document.getElementById("zoomIn").addEventListener("click", () => {
    if (cy) {
      cy.zoom(cy.zoom() * 1.2);
      cy.center();
    }
  });

  document.getElementById("zoomOut").addEventListener("click", () => {
    if (cy) {
      cy.zoom(cy.zoom() / 1.2);
      cy.center();
    }
  });

  document.addEventListener("contextmenu", e => {
    if (e.target.closest("#cy")) e.preventDefault();
  });

  document.getElementById("modeToggleBtn").addEventListener("click", () => {
    stepMode = !stepMode;

    const treeToolbar = document.getElementById("treeToolbar");
    const stepToolbar = document.getElementById("stepToolbar");
    const btn = document.getElementById("modeToggleBtn");

    if (stepMode) {
      treeToolbar.style.display = "none";
      stepToolbar.style.display = "flex";
      btn.textContent = "Switch to Tree Mode";

      if (currentTree && typeof initStepMode === "function") {
        initStepMode(currentTree);
      } else if (cy) {
        cy.elements().remove();
      }
    } else {
      treeToolbar.style.display = "flex";
      stepToolbar.style.display = "none";
      btn.textContent = "Switch to Step Mode";

      if (currentTree) {
        drawTree(currentTree);
      }
    }
  });
});