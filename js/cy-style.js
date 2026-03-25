(function () {
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

  window.HSApp = window.HSApp || {};
  window.HSApp.cyStyle = {
    buildCyStyle
  };
})();
