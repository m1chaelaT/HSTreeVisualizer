let cy = null;
let explanationFilterActive = false;

document.addEventListener("DOMContentLoaded", () => {

  const infoPanel = document.getElementById("infoPanel");
  const infoContent = document.getElementById("infoContent");

  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("filterExplanations").addEventListener("click", showExplanations);
  document.getElementById("showFullTree").addEventListener("click", showFullTree);
  document.getElementById("panelToggleBtn")
  .addEventListener("click", () => {
    infoPanel.classList.toggle("open");
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

  /* FILE processor */

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

  /* DRAW tree */

  function drawTree(tree) {
    const elements = [];

    tree.nodes.forEach(n => {
      elements.push({
        data: {
          id: "n" + n.id,
          label: n.label.join("\n"),
          closed: n.closed
        },
        classes: n.isExplanation ? "explanation" : ""
      });
    });

    tree.edges.forEach(e => {
      elements.push({
        data: {
          id: "e" + e.parent + "_" + e.child,
          source: "n" + e.parent,
          target: "n" + e.child,
          label: e.label
        }
      });
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
            "background-color": "#91dda8",
            "border-color": "#2e7d32",
            "border-width": 2,
            "font-weight": "bold"
          }
        },
        {
          selector: 'node[closed="closed"]',
          style: { "border-style": "dashed" }
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "arrow-scale": 1.2,
            "font-size": "9px"
          }
        },
        {
          selector: ".hidden",
          style: { display: "none" }
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

    explanationFilterActive = false;
    addInteractions();

    // --- ONTOLOGY DISPLAY ---
    const ontologyDiv = document.getElementById("ontologyContent");
    if (tree.ontology) {
      const tboxHTML = tree.ontology.tbox ? `<b>TBox:</b><br>${tree.ontology.tbox.join("<br>")}` : "";
      const obsHTML = tree.ontology.observations ? `<br><b>Observations:</b><br>${tree.ontology.observations.join("<br>")}` : "";
      ontologyDiv.innerHTML = tboxHTML + obsHTML;
    } else {
      ontologyDiv.innerHTML = "Žiadne dáta.";
    }
  }

  /* INTERACTIONS - left/right click */

  function addInteractions() {

    cy.on("tap", "node", evt => {
      if (explanationFilterActive) return;
      toggleChildren(evt.target);
    });

    cy.on("cxttap", "node", evt => {
      const n = evt.target;

      infoContent.innerHTML =
        `<b>ID:</b> ${n.id()}<br>` +
        `<b>Label:</b><br>${n.data("label").replace(/\n/g, "<br>")}<br><br>` +
        `<b>Closed:</b> ${n.data("closed")}<br>` +
        `<b>Explanation:</b> ${n.hasClass("explanation")}`;

      toggleInfoPanel(true);
    });
  }

  /*LOGIC functions */

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

  function showExplanations() {
    explanationFilterActive = true;

    cy.nodes().addClass("hidden");
    cy.edges().addClass("hidden");

    cy.nodes(".explanation").forEach(n => {
      n.removeClass("hidden");
      n.predecessors().removeClass("hidden");
      n.connectedEdges().removeClass("hidden");
    });
  }

  function showFullTree() {
    explanationFilterActive = false;
    cy.nodes().removeClass("hidden");
    cy.edges().removeClass("hidden");
  }

});

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