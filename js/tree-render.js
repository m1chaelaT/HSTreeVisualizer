  /*(function () {

  const DEFAULT_LAYOUT = {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 20,
    edgeSep: 50,
    rankSep: 100,
    padding: 10
  };*/
  
  
  /*
  const DEFAULT_LAYOUT = {
  name: "breadthfirst",
  directed: true,
  spacingFactor: 0.7,
  padding: 10,
  animate: false,
  grid: true
  };
  
 const DEFAULT_LAYOUT = {
  name: "breadthfirst",
  directed: true,
  circle: false,
  grid: false,
  spacingFactor: 0.9,
  padding: 30,
  animate: false,
  fit: true,
  avoidOverlap: true,
  roots: "#n0"

};*/
(function () {

  const DAGRE_LAYOUT = {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 20,
    edgeSep: 50,
    rankSep: 100,
    padding: 10
  };
  const ELK_LAYOUT = {
    name: "elk",
    fit: true,
    padding: 30,
    animate: false,
    nodeDimensionsIncludeLabels: true,
    elk: {
      algorithm: "mrtree",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "30",
      "elk.layered.spacing.nodeNodeBetweenLayers": "150"
    }
  };
  const LAYOUT_NODE_THRESHOLD = 50;
  function getLayoutForTree(tree) {
    const nodeCount = Array.isArray(tree?.nodes) ? tree.nodes.length : 0;

    if (nodeCount <= LAYOUT_NODE_THRESHOLD) {
      return DAGRE_LAYOUT;
    }

    return ELK_LAYOUT;
  }

    const DEFAULT_LAYOUT = {
    name: "elk",
    fit: true,
    padding: 30,
    animate: false,
    nodeDimensionsIncludeLabels: true,
    elk: {
      algorithm: "mrtree",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "30",
      "elk.layered.spacing.nodeNodeBetweenLayers": "150"
    }
  };

  function getState() {
    return window.HSApp.state;
  }

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

    function isNodeAllowedByDepth(nodeData, maxDepth) {
    if (maxDepth === null || maxDepth === undefined) return true;

    const depth = Number(nodeData.depth ?? 0);

    // root nech je vždy viditeľný
    if (nodeData.id === 0) return true;

    return depth <= maxDepth;
  }

  function createCy(elements, layoutConfig) {
    const state = getState();

    if (state.cy) state.cy.destroy();

    state.cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: window.HSApp.cyStyle.buildCyStyle(),
      layout: layoutConfig
    });

    return state.cy;
  }

  function rerunLayout() {
    const state = getState();
    if (!state.cy) return;

    state.cy.layout({
      ...DEFAULT_LAYOUT
    }).run();
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

  function getExplanationPathIdsFromTree(tree) {
    const included = new Set();
    const parentByChild = new Map();

    tree.edges.forEach(e => {
      if (e.child !== null && e.child !== undefined) {
        parentByChild.set(e.child, e.parent);
      }
    });

    tree.nodes.forEach(node => {
      if (!readExplanationValue(node.isExplanation)) return;

      let current = node.id;
      while (current !== null && current !== undefined && !included.has(current)) {
        included.add(current);
        current = parentByChild.get(current);
      }
    });

    return included;
  }

  function buildTreeElementsForCurrentState(tree) {
    const state = getState();

    let elements = buildTreeElements(tree, null);

    const explanationPathIds = state.explanationFilterActive
      ? getExplanationPathIdsFromTree(tree)
      : null;

    if (
      state.explanationFilterActive ||
      !state.showingPruned ||
      !state.showingInitialMxpNodes ||
      state.showingIndex ||
      state.maxVisibleDepth !== null
    ) {
      const filtered = [];
      const keptNodeIds = new Set();

      elements.forEach(el => {
        const data = el.data || {};
        const classes = (el.classes || "").split(" ").filter(Boolean);
        const isNode = data.id && !data.source && !data.target;

        if (!isNode) return;

        const isPruned = classes.includes("pruned");
        const isInitialMxp = classes.includes("initial-mxp");
        const originalId = data.originalId;
        const maxDepth = state.maxVisibleDepth;

                if (!isPruned && !isNodeAllowedByDepth({ id: originalId, depth: data.depth }, maxDepth)) {
          return;
        }

        if (!state.showingPruned && isPruned) return;
        if (!state.showingInitialMxpNodes && isInitialMxp) return;

        if (
          state.explanationFilterActive &&
          !isPruned &&
          originalId !== undefined &&
          !explanationPathIds.has(originalId)
        ) {
          return;
        }

        const cloned = {
          ...el,
          data: {
            ...data,
            label:
              state.showingIndex &&
              !isPruned &&
              data.isExplanation !== true &&
              !isInitialMxp
                ? data.id
                : data.originalLabel ?? data.label
          }
        };

        filtered.push(cloned);
        keptNodeIds.add(data.id);
      });

      elements.forEach(el => {
        const data = el.data || {};
        const isEdge = data.source && data.target;

        if (!isEdge) return;
        if (!keptNodeIds.has(data.source) || !keptNodeIds.has(data.target)) return;

        filtered.push(el);
      });

      elements = filtered;
    }

    return elements;
  }

  function rebuildTreeFromState() {
    const state = getState();
    if (!state.currentTree) return;

    const elements = buildTreeElementsForCurrentState(state.currentTree);
    const layoutToUse = getLayoutForTree(state.currentTree);
    createCy(elements, layoutToUse);
    bindTreeInteractions();
    window.HSApp.ui.setOntologyContent(state.currentTree);
  }

  function renderNodeInfo(n) {
    const state = getState();

    if (n.hasClass("pruned")) {
      let html =
        `<h3>Pruned Node Information</h3>` +
        `<b>ID:</b> ${n.id()}<br>` +
        `<b>Edge label:</b><br> ${n.data("edgeLabel") || "-"}<br>` +
        `<b>Reason:</b> ${n.data("pruned") || "-"}<br>`;

      if (n.data("parentId") !== undefined) {
        html += `<b>Parent:</b> n${n.data("parentId")}<br>`;
      }

      window.HSApp.ui.setInfoPanelHtml(html);
      return;
    }

    let html =
      `<h3>Node Information</h3>` +
      `<b>ID:</b>${n.id()}<br>` +
      `<b>Label:</b>${String(n.data("originalLabel") || "").replace(/\n/g, "<br>")}<br>` +
      `<b>Closed:</b>${n.data("closedFinal") === true ? "true" : "false"}<br>` +
      `<b>Explanation:</b> ${n.data("isExplanationFinal") === true ? "true" : "false"}<br>` +
      `<b>Depth:</b>${n.data("depth")}<br>`;

    const path = n.data("path");
    if (Array.isArray(path) && path.length > 0) {
      html += `<br><b>Path:</b><br>${path.join("<br>")}<br>`;
    }

    if (isVisualRootNode(n) && state.currentTree?.algorithm === "MHS_MXP") {
      const mxpNodes = getInitialMxpExplanationNodes(state.currentTree);

      if (mxpNodes.length > 0) {
        html += `<br><h4>Initial MXP possible explanations</h4>`;
        mxpNodes.forEach(node => {
          const lbl = Array.isArray(node.label) ? node.label.join(", ") : String(node.label ?? "");
          html += `• ${lbl}<br>`;
        });
      }
    }

    window.HSApp.ui.setInfoPanelHtml(html);
  }

  function bindCommonRightClick() {
    const state = getState();

    state.cy.on("cxttap", "node", evt => {
      renderNodeInfo(evt.target);
    });
  }

  function bindTreeInteractions() {
    const state = getState();

    bindCommonRightClick();

    state.cy.on("tap", "node", evt => {
      if (state.explanationFilterActive) return;
      if (evt.target.hasClass("pruned")) return;
      toggleChildren(evt.target);
    });
  }

  function bindStepInteractions() {
    bindCommonRightClick();
  }

  function drawTree(tree) {
    const state = getState();
    state.currentTree = tree;

    state.explanationFilterActive = false;
    state.showingInitialMxpNodes = true;
    state.showingPruned = true;
    state.showingIndex = false;

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

    rebuildTreeFromState();
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
    const state = getState();
    if (!state.cy) return;

    if (!state.showingPruned) {
      state.cy.nodes(".pruned").forEach(node => {
        node.addClass("hidden");
        node.connectedEdges().addClass("hidden");
      });
    }

    if (!state.showingInitialMxpNodes) {
      state.cy.nodes(".initial-mxp").forEach(node => {
        node.addClass("hidden");
        node.connectedEdges().addClass("hidden");
      });
    }
  }

  function showExplanations() {
    const state = getState();
    if (!state.currentTree) return;

    state.explanationFilterActive = true;
    rebuildTreeFromState();
  }

  function showFullTree() {
    const state = getState();
    if (!state.currentTree) return;

    state.explanationFilterActive = false;
    rebuildTreeFromState();
  }

  function toggleInitialMxpExplanations() {
    const state = getState();
    if (!state.currentTree) return;

    const mxpBtn = document.getElementById("MXPExplenationsBtn");

    state.showingInitialMxpNodes = !state.showingInitialMxpNodes;

    if (mxpBtn) {
      mxpBtn.textContent = state.showingInitialMxpNodes
        ? "Hide initial MXP explenations"
        : "Show initial MXP explenations";
    }

    rebuildTreeFromState();
  }

  function togglePrunedNodes() {
    const state = getState();
    if (!state.currentTree) return;

    const prunedBtn = document.getElementById("prunnedUpdBtn");

    state.showingPruned = !state.showingPruned;

    if (prunedBtn) {
      prunedBtn.textContent = state.showingPruned
        ? "Hide pruned nodes"
        : "Show pruned nodes";
    }

    rebuildTreeFromState();
  }

  function toggleLabels() {
    const state = getState();
    if (!state.currentTree) return;

    const labelBtn = document.getElementById("labelUpdtBtn");

    state.showingIndex = !state.showingIndex;

    if (labelBtn) {
      labelBtn.textContent = state.showingIndex ? "Show Labels" : "Hide Labels";
    }

    rebuildTreeFromState();
  }

  function centerCanvas() {
    const state = getState();
    if (state.cy) state.cy.center();
  }

  function zoomIn() {
    const state = getState();
    if (state.cy) {
      state.cy.zoom(state.cy.zoom() * 1.2);
      state.cy.center();
    }
  }

  function zoomOut() {
    const state = getState();
    if (state.cy) {
      state.cy.zoom(state.cy.zoom() / 1.2);
      state.cy.center();
    }
  }

  window.HSApp = window.HSApp || {};
  window.HSApp.treeRender = {
    DAGRE_LAYOUT,
    ELK_LAYOUT,
    getLayoutForTree,
    getInitialMxpExplanationNodes,
    isVisualRootNode,
    readExplanationValue,
    readClosedValue,
    readPrunedText,
    readStepValue,
    readTypeValue,
    getNodeLabelText,
    createCy,
    rerunLayout,
    buildTreeElements,
    buildTreeElementsForCurrentState,
    rebuildTreeFromState,
    renderNodeInfo,
    bindTreeInteractions,
    bindStepInteractions,
    drawTree,
    showExplanations,
    showFullTree,
    toggleInitialMxpExplanations,
    togglePrunedNodes,
    toggleLabels,
    centerCanvas,
    zoomIn,
    zoomOut
  };
})();