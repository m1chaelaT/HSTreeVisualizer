(function () {
  const DEFAULT_LAYOUT = {
    name: "dagre",
    rankDir: "TB",
    nodeSep: 50,
    edgeSep: 10,
    rankSep: 100,
    padding: 30
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

  function createCy(elements, layoutConfig = null) {
    const state = getState();

    if (state.cy) state.cy.destroy();

    state.cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: window.HSApp.cyStyle.buildCyStyle(),
      layout: layoutConfig || DEFAULT_LAYOUT
    });

    return state.cy;
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
    const state = getState();

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

      window.HSApp.ui.setInfoPanelHtml(html);
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

    const elements = buildTreeElements(tree, null);
    createCy(elements);
    bindTreeInteractions();
    window.HSApp.ui.setOntologyContent(tree);
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
    if (!state.cy) return;

    state.explanationFilterActive = true;

    state.cy.nodes().addClass("hidden");
    state.cy.edges().addClass("hidden");

    state.cy.nodes(".explanation").forEach(n => {
      n.removeClass("hidden");
      n.predecessors().removeClass("hidden");
      n.connectedEdges().removeClass("hidden");
    });

    reapplySpecialVisibility();
  }

  function showFullTree() {
    const state = getState();
    if (!state.cy) return;

    state.explanationFilterActive = false;
    state.cy.nodes().removeClass("hidden");
    state.cy.edges().removeClass("hidden");

    reapplySpecialVisibility();
  }

  function toggleInitialMxpExplanations() {
    const state = getState();
    if (!state.cy) return;

    const mxpBtn = document.getElementById("MXPExplenationsBtn");
    const mxpNodes = state.cy.nodes(".initial-mxp");

    if (state.showingInitialMxpNodes) {
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

    state.showingInitialMxpNodes = !state.showingInitialMxpNodes;
  }

  function togglePrunedNodes() {
    const state = getState();
    if (!state.cy) return;

    const prunedBtn = document.getElementById("prunnedUpdBtn");
    const prunedNodes = state.cy.nodes(".pruned");

    if (state.showingPruned) {
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

    state.showingPruned = !state.showingPruned;
  }

  function toggleLabels() {
    const state = getState();
    if (!state.cy) return;

    const labelBtn = document.getElementById("labelUpdtBtn");

    state.cy.nodes().forEach(node => {
      if (
        node.hasClass("pruned") ||
        node.data("isExplanation") === true ||
        node.hasClass("initial-mxp")
      ) {
        return;
      }

      if (state.showingIndex) {
        node.data("label", node.data("originalLabel"));
      } else {
        node.data("label", node.id());
      }
    });

    if (labelBtn) {
      labelBtn.textContent = state.showingIndex ? "Hide Labels" : "Show Labels";
    }

    state.showingIndex = !state.showingIndex;
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
    DEFAULT_LAYOUT,
    getInitialMxpExplanationNodes,
    isVisualRootNode,
    readExplanationValue,
    readClosedValue,
    readPrunedText,
    readStepValue,
    readTypeValue,
    getNodeLabelText,
    createCy,
    buildTreeElements,
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
