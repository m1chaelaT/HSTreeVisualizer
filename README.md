# HS Tree Visualizer

HS Tree Visualizer is a web-based tool for visualizing HS-trees generated in abductive reasoning tasks.  
It supports both static rendering and step-by-step replay of the tree construction process.
This project was developed as part of a Bachelor's thesis at the Faculty of Mathematics, Physics and Informatics, Comenius University in Bratislava.

---

## How to Use

The application is available online at:  
https://m1chaelat.github.io/HSTreeVisualizer/

1. Open the application in a web browser  
2. Upload a JSON file describing an HS-tree  
3. The tree is rendered automatically  

The application provides two modes:

- **Full view** – displays the complete tree  
- **Step mode** – replays the construction of the tree based on event steps  

Additional controls allow toggling labels, pruned branches, and navigating between steps.

---

## Input JSON file

The visualizer accepts a structured JSON file describing a HS-tree.

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
```

### Description

- **algorithm** – name of the algorithm used (e.g. `MHS`, `MHS_MXP`)  
- **ontology** – background knowledge:
  - `tbox` – list of axioms  
  - `observations` – list of observations  
- **nodes** – list of tree nodes  
- **edges** – list of edges between nodes  

Note: The `algorithm` and `ontology` fields are not required for generating the HS-tree structure. They are used only for displaying additional information in the application.

---

## Nodes

Each node represents a state in the HS-tree.

### Structure

Each node is an object with the following fields:

- `id` – unique numeric identifier  
- `depth` – level in the tree  
- `path` – array representing the path from the root  
- `label` – array of strings displayed in the node  
- `isExplanation` – structured object describing whether the node is an explanation  
- `closed` – structured object describing whether the node is closed  

### Event Fields

The following fields may also be present depending on the processed events:

- `created` – node creation event  
- `processed` – node processing event  

### Structured Fields

The fields `isExplanation` and `closed` must always be objects and must not be replaced by primitive values.

For example:

```json
"isExplanation": {
  "isExplanation": false
}
```

and not:

```json
"isExplanation": false
```

If no event information is available, the object must still be present:

```json
"closed": {
  "closed": false
}
```

### Event Objects

Event objects (`created`, `processed`, `closed`, `isExplanation`) may contain:

- `step` – integer indicating the order of the event  
- `type` – event type identifier  

Example:

```json
"isExplanation": {
  "isExplanation": true,
  "step": 16,
  "type": "POSSIBLE_EXPLANATION"
}
```

---

## Edges

Edges connect nodes and represent branching decisions.

### Structure

Each edge is an object with the following fields:

- `parent` – parent node ID  
- `child` – child node ID, or `null` for terminal branches  
- `label` – edge label  
- `pruned` – structured object describing pruning information  

### Event Fields

Edges may also contain:

- `created` – edge creation event  

### Pruning Field

The `pruned` field is always present.

It may contain:

- empty value (no pruning), or  
- pruning description with optional event metadata  

Example (non-pruned edge):

```json
"pruned": {
  "pruned": ""
}
```

Example (pruned edge):

```json
"pruned": {
  "pruned": "PRUNED PATH!",
  "step": 24,
  "type": "EDGE_PRUNED"
}
```

---

## Step Mode

Step mode reconstructs the execution of the algorithm using event metadata stored in nodes and edges.

### Event Types

The JSON export may contain the following event types:

- `PROCESSING_NODE`  
- `NODE_CREATED`  
- `CLOSING_NODE`  
- `EDGE_CREATED`  
- `EDGE_PRUNED`  
- `INVALID_PATH`
- `POSSIBLE_EXPLANATION`    
- `INCONSISTENT_EXPLANATION`  
- `IRELEVANT_EXPLANATION`  
- `NONMINIMAL_EXPLANATION`  

### Step Values

Each event may contain a `step` field:

- `step` is an integer  
- it defines the order of events during visualization  

Correct and consistent step ordering is required for proper step-by-step playback.



## Purpose

The tool is intended for:

- visualization of HS-tree algorithms  
- analysis of abduction processes  
- educational use  