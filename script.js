let cy = null;
let explanationFilterActive = false;
let currentTree = null;
let showingInitialMxpNodes = true;
let showingPruned = true;
let showingIndex = false;

function getInitialMxpExplanationNodes(tree) {
  if (tree.algorithm !== "MHS_MXP") return [];

  return tree.nodes.filter(node =>
    node.depth === 1 && node.isExplanation === true
  );
}

function isVisualRootNode(node) {
  return node.data("depth") === 1 && !node.data("isExplanation");
}

document.addEventListener("DOMContentLoaded", () => {

  const mxpBtn = document.getElementById("MXPExplenationsBtn");
  const prunedBtn = document.getElementById("prunnedUpdBtn");
  const labelBtn = document.getElementById("labelUpdtBtn");

  const infoPanel = document.getElementById("infoPanel");
  const infoContent = document.getElementById("infoContent");

  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("filterExplanations").addEventListener("click", showExplanations);
  document.getElementById("showFullTree").addEventListener("click", showFullTree);
  document.getElementById("panelToggleBtn").addEventListener("click", () => {
    infoPanel.classList.toggle("open");
  });

  mxpBtn.addEventListener("click", toggleInitialMxpExplanations);
  prunedBtn.addEventListener("click", togglePrunedNodes);
  labelBtn.addEventListener("click", toggleLabels);

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

  function toggleInfoPanel(forceOpen = false) {
    if (forceOpen) {
      infoPanel.classList.add("open");
    } else {
      infoPanel.classList.toggle("open");
    }
  }

  function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        drawTree(JSON.parse(e.target.result));
      } catch {
        alert("Neplatný JSON súbor");
      }
    };
    reader.readAsText(file);
  }

  function drawTree(tree) {
    currentTree = tree;

    explanationFilterActive = false;
    showingInitialMxpNodes = true;
    showingPruned = true;
    showingIndex = false;

    labelBtn.textContent = "Hide Labels";
    prunedBtn.textContent = "Hide pruned nodes";

    if (tree.algorithm === "MHS_MXP") {
      mxpBtn.style.display = "inline-block";
      mxpBtn.textContent = "Hide initial MXP explenations";
    } else {
      mxpBtn.style.display = "none";
    }

    const elements = [];

    tree.nodes.forEach(n => {
      const isInitialMxpExplanation =
        tree.algorithm === "MHS_MXP" &&
        n.depth === 1 &&
        n.isExplanation === true;

      let classes = [];
      if (n.isExplanation) classes.push("explanation");
      if (isInitialMxpExplanation) classes.push("initial-mxp");

      elements.push({
        data: {
          id: "n" + n.id,
          label: n.label.join("\n"),
          originalLabel: n.label.join("\n"),
          closed: n.closed,
          depth: n.depth,
          isExplanation: n.isExplanation,
          path: n.path || [],
          originalId: n.id,
          isInitialMxpExplanation: isInitialMxpExplanation
        },
        classes: classes.join(" ")
      });
    });

    tree.edges.forEach(e => {
      if (e.child !== null) {
        elements.push({
          data: {
            id: "e" + e.parent + "_" + e.child,
            source: "n" + e.parent,
            target: "n" + e.child,
            label: e.label,
            pruned: e.pruned
          }
        });
      } else {
        const prunedNodeId = "p" + e.parent + "_" + e.label;

        elements.push({
          data: {
            id: prunedNodeId,
            label: "PRUNED\n" + (e.pruned || "")
          },
          classes: "pruned"
        });

        elements.push({
          data: {
            id: "e" + e.parent + "_" + prunedNodeId,
            source: "n" + e.parent,
            target: prunedNodeId,
            label: e.label
          }
        });
      }
    });

    if (cy) cy.destroy();

    cy = cytoscape({
      container: document.getElementById("cy"),
      elements,
      style: [
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
          selector: 'node[closed="closed"]',
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
      ],
      layout: {
        name: "dagre",
        rankDir: "TB",
        nodeSep: 50,
        edgeSep: 10,
        rankSep: 100,
        padding: 30
      }
    });

    addInteractions();

    const ontologyDiv = document.getElementById("ontologyContent");
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

  function addInteractions() {
    cy.on("tap", "node", evt => {
      if (explanationFilterActive) return;
      toggleChildren(evt.target);
    });

    cy.on("cxttap", "node", evt => {
      const n = evt.target;

      let html =
        `<h3>Node Information</h3>` +
        `<b>ID:</b> ${n.id()}<br>` +
        `<b>Label:</b><br>${String(n.data("originalLabel") || n.data("label")).replace(/\n/g, "<br>")}<br><br>` +
        `<b>Closed:</b> ${n.data("closed")}<br>` +
        `<b>Explanation:</b> ${n.data("isExplanation")}<br>` +
        `<b>Depth:</b> ${n.data("depth")}<br>`;

      const path = n.data("path");
      if (path && path.length > 0) {
        html += `<br><b>Path:</b><br>${path.join("<br>")}<br>`;
      }

      if (isVisualRootNode(n) && currentTree?.algorithm === "MHS_MXP") {
        const mxpNodes = getInitialMxpExplanationNodes(currentTree);

        if (mxpNodes.length > 0) {
          html += `<br><h4>Initial MXP possible explanations</h4>`;
          mxpNodes.forEach(node => {
            html += `• ${node.label.join(", ")}<br>`;
          });
        }
      }

      infoContent.innerHTML = html;
      toggleInfoPanel(true);
    });
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
    explanationFilterActive = false;
    cy.nodes().removeClass("hidden");
    cy.edges().removeClass("hidden");

    reapplySpecialVisibility();
  }

  function toggleInitialMxpExplanations() {
    if (!cy) return;

    const mxpNodes = cy.nodes(".initial-mxp");

    if (showingInitialMxpNodes) {
      mxpNodes.forEach(node => {
        node.addClass("hidden");
        node.connectedEdges().addClass("hidden");
      });
      mxpBtn.textContent = "Show initial MXP explenations";
    } else {
      mxpNodes.forEach(node => {
        node.removeClass("hidden");
        node.connectedEdges().removeClass("hidden");
      });
      mxpBtn.textContent = "Hide initial MXP explenations";
    }

    showingInitialMxpNodes = !showingInitialMxpNodes;
  }

  function togglePrunedNodes() {
    if (!cy) return;

    const prunedNodes = cy.nodes(".pruned");

    if (showingPruned) {
      prunedNodes.forEach(node => {
        node.addClass("hidden");
        node.connectedEdges().addClass("hidden");
      });
      prunedBtn.textContent = "Show pruned nodes";
    } else {
      prunedNodes.forEach(node => {
        node.removeClass("hidden");
        node.connectedEdges().removeClass("hidden");
      });
      prunedBtn.textContent = "Hide pruned nodes";
    }

    showingPruned = !showingPruned;
  }

  function toggleLabels() {
    if (!cy) return;

    cy.nodes().forEach(node => {
      if (node.hasClass("explanation") || node.hasClass("pruned")) {
        return;
      }

      if (showingIndex) {
        node.data("label", node.data("originalLabel"));
        labelBtn.textContent = "Hide Labels";
      } else {
        node.data("label", node.data("id"));
        labelBtn.textContent = "Show Labels";
      }
    });

    showingIndex = !showingIndex;
  }
});