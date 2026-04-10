# HS Tree Visualizer

HS Tree Visualizer is a web-based tool for visualizing HS-trees generated in abductive reasoning tasks.  
It supports both static rendering and step-by-step replay of the tree construction process.

---

## How to Use

1. Open the application in a web browser  
2. Upload a JSON file describing an HS-tree  
3. The tree is rendered automatically  

The application provides two modes:

- **Full view** – displays the complete tree  
- **Step mode** – replays the construction of the tree based on event steps  

Additional controls allow toggling labels, pruned branches, and navigating between steps.

---

## Input

The visualizer accepts a structured JSON file describing a single HS-tree.

### Required Structure

```json
{
  "algorithm": "...",
  "ontology": {
    "tbox": [],
    "observations": []
  },
  "nodes": [],
  "edges": []
}