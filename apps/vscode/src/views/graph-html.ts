import type { DependencyGraphData, ArchitectureModel } from '@projectbrain/shared';

export function getGraphWebviewHtml(graphData: DependencyGraphData, archModel: ArchitectureModel): string {
  // Normalize all paths in graph data to forward slashes
  const sanitizedGraph = {
    nodes: (graphData.nodes || []).map(n => ({
      id: (n.id || '').replace(/\\/g, '/'),
      label: n.label || '',
      kind: n.kind,
      filePath: n.filePath ? n.filePath.replace(/\\/g, '/') : (n.id || '').replace('file:', '').replace(/\\/g, '')
    })),
    edges: (graphData.edges || []).map(e => ({
      id: (e.id || '').replace(/\\/g, '/'),
      sourceId: (e.sourceId || '').replace(/\\/g, '/'),
      targetId: (e.targetId || '').replace(/\\/g, '/'),
      kind: e.kind
    }))
  };

  const sanitizedArch = {
    layers: (archModel?.layers || []).map(l => ({
      type: l.type,
      name: l.name,
      files: (l.files || []).map(f => f.replace(/\\/g, '/')),
      entryPoints: (l.entryPoints || []).map(f => f.replace(/\\/g, '/'))
    }))
  };

  const serializedGraph = JSON.stringify(sanitizedGraph);
  const serializedArch = JSON.stringify(sanitizedArch);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProjectBrain Dependency Graph</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background, #1e1e2e);
      --fg: var(--vscode-editor-foreground, #cdd6f4);
      --card-bg: var(--vscode-sideBar-background, #181825);
      --border: var(--vscode-widget-border, #313244);
      --accent: var(--vscode-button-background, #89b4fa);
      --accent-fg: var(--vscode-button-foreground, #11111b);
      --font: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      --frontend-color: #38bdf8;
      --backend-color: #a855f7;
      --auth-color: #f43f5e;
      --shared-color: #10b981;
      --database-color: #f59e0b;
      --other-color: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
    }

    body {
      background: var(--bg);
      color: var(--fg);
      font-family: var(--font);
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
    }

    #graph-container {
      flex: 1;
      height: 100%;
      position: relative;
      background: radial-gradient(circle at center, rgba(137, 180, 250, 0.05) 0%, transparent 70%);
      overflow: hidden;
    }

    svg#graphSvg {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }

    svg#graphSvg:active {
      cursor: grabbing;
    }

    /* SVG Elements */
    .edge-line {
      stroke: rgba(255, 255, 255, 0.2);
      stroke-width: 1.5px;
      transition: stroke 0.2s, stroke-width 0.2s;
    }

    .edge-line.highlighted {
      stroke: #89b4fa;
      stroke-width: 3px;
    }

    .node-group {
      cursor: pointer;
      transition: transform 0.05s ease-out;
    }

    .node-circle {
      stroke: #ffffff;
      stroke-width: 2px;
      transition: r 0.2s, filter 0.2s;
    }

    .node-group:hover .node-circle {
      r: 18px;
      filter: drop-shadow(0 0 8px rgba(137, 180, 250, 0.8));
    }

    .node-group.selected .node-circle {
      r: 20px;
      stroke: #89b4fa;
      stroke-width: 3.5px;
      filter: drop-shadow(0 0 12px rgba(137, 180, 250, 0.9));
    }

    .node-label {
      fill: #cdd6f4;
      font-size: 11px;
      font-weight: 500;
      text-anchor: middle;
      pointer-events: none;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    .layer-band {
      stroke: rgba(255, 255, 255, 0.06);
      stroke-dasharray: 4 4;
      stroke-width: 1px;
    }

    .layer-title {
      fill: rgba(255, 255, 255, 0.35);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    /* Floating Toolbar */
    .toolbar {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 10;
    }

    .toolbar input {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      width: 180px;
    }

    .toolbar input:focus {
      border-color: var(--accent);
    }

    .toolbar button {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }

    .toolbar button:hover {
      background: var(--border);
    }

    .toolbar button.active {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
      font-weight: 600;
    }

    /* Legend */
    .legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 11px;
      display: flex;
      gap: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 10;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* Sidebar Inspector */
    .sidebar {
      width: 320px;
      background: var(--card-bg);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      height: 100%;
      z-index: 20;
      transition: transform 0.2s ease;
    }

    .sidebar.collapsed {
      display: none;
    }

    .sidebar-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-header h2 {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      font-size: 12px;
    }

    .info-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
    }

    .info-card h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
      margin-bottom: 8px;
    }

    .info-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 6px;
    }

    .btn-open {
      background: var(--accent);
      color: var(--accent-fg);
      border: none;
      border-radius: 6px;
      padding: 8px 14px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      text-align: center;
      margin-top: 10px;
      width: 100%;
      transition: opacity 0.15s;
    }

    .btn-open:hover {
      opacity: 0.85;
    }

    .stats-pill {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div id="graph-container">
    <svg id="graphSvg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.4)" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#89b4fa" />
        </marker>
      </defs>
      <g id="layerBands"></g>
      <g id="viewport">
        <g id="edgesGroup"></g>
        <g id="nodesGroup"></g>
      </g>
    </svg>

    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="🔍 Search modules..." />
      <button id="btnResetView" title="Reset View">🎯 Reset</button>
      <button id="btnToggleOrphans" title="Toggle Orphan Nodes" class="active">🌱 Orphans</button>
    </div>

    <div class="legend">
      <div class="legend-item"><span class="legend-dot" style="background: var(--frontend-color);"></span> Frontend</div>
      <div class="legend-item"><span class="legend-dot" style="background: var(--backend-color);"></span> Backend</div>
      <div class="legend-item"><span class="legend-dot" style="background: var(--auth-color);"></span> Security</div>
      <div class="legend-item"><span class="legend-dot" style="background: var(--shared-color);"></span> Shared</div>
    </div>
  </div>

  <div class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <h2>Node Inspector</h2>
      <span id="closeSidebar" style="cursor: pointer; opacity: 0.6; font-size: 16px;">✕</span>
    </div>
    <div class="sidebar-body" id="sidebarContent">
      <div style="text-align: center; opacity: 0.6; margin-top: 40px; line-height: 1.6;">
        Click any module circle in the graph to inspect its architecture layer, dependencies, and imports.
      </div>
    </div>
  </div>

  <script>
    try {
      const vscode = acquireVsCodeApi();
      const rawGraph = ${serializedGraph};
      const rawArch = ${serializedArch};

      const svg = document.getElementById('graphSvg');
      const viewport = document.getElementById('viewport');
      const layerBands = document.getElementById('layerBands');
      const edgesGroup = document.getElementById('edgesGroup');
      const nodesGroup = document.getElementById('nodesGroup');
      const sidebar = document.getElementById('sidebar');
      const sidebarContent = document.getElementById('sidebarContent');
      const searchInput = document.getElementById('searchInput');

      function getLayerForNode(filePath) {
        if (!filePath) return 'backend';
        for (let i = 0; i < rawArch.layers.length; i++) {
          const layer = rawArch.layers[i];
          if (layer.files && layer.files.some(f => filePath.indexOf(f) !== -1 || f.indexOf(filePath) !== -1)) {
            return layer.type;
          }
        }
        if (filePath.indexOf('apps/') !== -1 || filePath.indexOf('views') !== -1 || filePath.indexOf('components') !== -1) return 'frontend';
        if (filePath.indexOf('security') !== -1 || filePath.indexOf('auth') !== -1) return 'auth';
        if (filePath.indexOf('shared') !== -1) return 'shared';
        return 'backend';
      }

      function getLayerColor(type) {
        switch (type) {
          case 'frontend': return '#38bdf8';
          case 'backend': return '#a855f7';
          case 'auth': return '#f43f5e';
          case 'shared': return '#10b981';
          case 'database': return '#f59e0b';
          default: return '#94a3b8';
        }
      }

      // Group nodes by layer
      const layerRows = {
        frontend: { y: 130, label: 'FRONTEND / PRESENTATION', nodes: [] },
        backend: { y: 320, label: 'BACKEND / DOMAIN CORE', nodes: [] },
        auth: { y: 510, label: 'SECURITY & AUTH', nodes: [] },
        shared: { y: 690, label: 'SHARED / CONTRACTS', nodes: [] }
      };

      const nodeMap = new Map();
      const allFileNodes = [];

      (rawGraph.nodes || []).forEach(n => {
        if (n.kind === 'file' || (n.id && n.id.indexOf('file:') === 0)) {
          const filePath = n.filePath || n.id.replace('file:', '');
          const layer = getLayerForNode(filePath);
          const parts = filePath.split('/');
          const label = n.label || parts[parts.length - 1] || n.id;

          const nodeObj = {
            id: n.id,
            label: label,
            filePath: filePath,
            layer: layer,
            color: getLayerColor(layer),
            x: 0,
            y: 0,
            inDegree: 0,
            outDegree: 0
          };

          nodeMap.set(n.id, nodeObj);
          allFileNodes.push(nodeObj);
          if (layerRows[layer]) {
            layerRows[layer].nodes.push(nodeObj);
          } else {
            layerRows.backend.nodes.push(nodeObj);
          }
        }
      });

      // Layout coordinates per layer row
      const canvasWidth = Math.max(1200, window.innerWidth || 1200);
      Object.keys(layerRows).forEach(key => {
        const row = layerRows[key];
        const count = row.nodes.length;
        const spacing = canvasWidth / (count + 1);
        row.nodes.forEach((n, idx) => {
          n.x = spacing * (idx + 1);
          n.y = row.y + (idx % 2 === 0 ? -20 : 20);
        });
      });

      // Build edges
      const edgeList = [];
      (rawGraph.edges || []).forEach(e => {
        const src = nodeMap.get(e.sourceId);
        const tgt = nodeMap.get(e.targetId);
        if (src && tgt && src !== tgt) {
          src.outDegree++;
          tgt.inDegree++;
          edgeList.push({
            id: e.id,
            source: src,
            target: tgt,
            kind: e.kind
          });
        }
      });

      // Render Layer Background Bands
      Object.keys(layerRows).forEach(key => {
        const row = layerRows[key];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', row.y.toString());
        line.setAttribute('x2', (canvasWidth * 2).toString());
        line.setAttribute('y2', row.y.toString());
        line.setAttribute('class', 'layer-band');
        layerBands.appendChild(line);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '30');
        text.setAttribute('y', (row.y - 45).toString());
        text.setAttribute('class', 'layer-title');
        text.textContent = row.label;
        layerBands.appendChild(text);
      });

      // Render Edges
      const edgeElements = new Map();
      edgeList.forEach(e => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', e.source.x.toString());
        line.setAttribute('y1', e.source.y.toString());
        line.setAttribute('x2', e.target.x.toString());
        line.setAttribute('y2', e.target.y.toString());
        line.setAttribute('class', 'edge-line');
        line.setAttribute('marker-end', 'url(#arrow)');
        edgesGroup.appendChild(line);
        edgeElements.set(e, line);
      });

      // Render Nodes
      const nodeElements = new Map();
      allFileNodes.forEach(n => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node-group');
        g.setAttribute('transform', 'translate(' + n.x + ',' + n.y + ')');

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', '15');
        circle.setAttribute('fill', n.color);
        circle.setAttribute('class', 'node-circle');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '28');
        text.setAttribute('class', 'node-label');
        text.textContent = n.label;

        g.appendChild(circle);
        g.appendChild(text);
        nodesGroup.appendChild(g);
        nodeElements.set(n, g);

        // Click Node
        g.addEventListener('click', (ev) => {
          ev.stopPropagation();
          selectNode(n);
        });
      });

      let selectedNode = null;
      let showOrphans = true;

      function selectNode(n) {
        selectedNode = n;
        nodeElements.forEach((el, node) => {
          el.classList.toggle('selected', node === n);
        });

        edgeElements.forEach((line, edge) => {
          const isConnected = edge.source === n || edge.target === n;
          line.classList.toggle('highlighted', isConnected);
          line.setAttribute('marker-end', isConnected ? 'url(#arrow-active)' : 'url(#arrow)');
        });

        sidebar.classList.remove('collapsed');
        renderInspector(n);
      }

      function renderInspector(node) {
        const inEdges = edgeList.filter(e => e.target === node);
        const outEdges = edgeList.filter(e => e.source === node);

        let depsHtml = '';
        if (outEdges.length === 0) {
          depsHtml = '<div style="opacity: 0.5;">None (Leaf module)</div>';
        } else {
          depsHtml = outEdges.map(e => '<div style="padding: 2px 0;">➡️ ' + e.target.label + '</div>').join('');
        }

        let importsHtml = '';
        if (inEdges.length === 0) {
          importsHtml = '<div style="opacity: 0.5;">None (Root entry / Isolated)</div>';
        } else {
          importsHtml = inEdges.map(e => '<div style="padding: 2px 0;">⬅️ ' + e.source.label + '</div>').join('');
        }

        sidebarContent.innerHTML = 
          '<div class="info-card">' +
            '<div style="font-size: 14px; font-weight: 600; word-break: break-all;">' + node.label + '</div>' +
            '<div style="font-size: 11px; opacity: 0.6; margin-top: 4px; word-break: break-all;">' + node.filePath + '</div>' +
            '<span class="info-badge" style="background: ' + node.color + '; color: #000;">' + node.layer.toUpperCase() + ' LAYER</span>' +
            '<button class="btn-open" id="btnOpenInEditor" data-filepath="' + node.filePath + '">📄 Open in Editor</button>' +
          '</div>' +
          '<div class="info-card">' +
            '<h3>Connections</h3>' +
            '<div class="stats-pill"><span>Incoming Imports:</span> <b>' + inEdges.length + '</b></div>' +
            '<div class="stats-pill"><span>Outgoing Dependencies:</span> <b>' + outEdges.length + '</b></div>' +
          '</div>' +
          '<div class="info-card">' +
            '<h3>Dependencies (' + outEdges.length + ')</h3>' +
            depsHtml +
          '</div>' +
          '<div class="info-card">' +
            '<h3>Imported By (' + inEdges.length + ')</h3>' +
            importsHtml +
          '</div>';
      }

      sidebarContent.addEventListener('click', e => {
        const btn = e.target.closest('#btnOpenInEditor');
        if (btn && btn.dataset.filepath) {
          vscode.postMessage({
            command: 'openFile',
            filePath: btn.dataset.filepath
          });
        }
      });

      // Pan & Zoom
      let zoom = 1.0;
      let panX = 40;
      let panY = 20;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      function updateTransform() {
        viewport.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + zoom + ')');
        layerBands.setAttribute('transform', 'translate(' + panX + ',' + panY + ') scale(' + zoom + ')');
      }
      updateTransform();

      svg.addEventListener('mousedown', (e) => {
        if (e.target.closest('.node-group')) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) {
          panX = e.clientX - startX;
          panY = e.clientY - startY;
          updateTransform();
        }
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
        zoom = Math.max(0.2, Math.min(3.0, zoom * zoomFactor));
        updateTransform();
      });

      document.getElementById('btnResetView').addEventListener('click', () => {
        zoom = 1.0;
        panX = 40;
        panY = 20;
        updateTransform();
      });

      const btnToggleOrphans = document.getElementById('btnToggleOrphans');
      btnToggleOrphans.addEventListener('click', () => {
        showOrphans = !showOrphans;
        btnToggleOrphans.classList.toggle('active', showOrphans);
        allFileNodes.forEach(n => {
          const isOrphan = n.inDegree === 0 && n.outDegree === 0;
          const el = nodeElements.get(n);
          if (el) {
            el.style.display = (!showOrphans && isOrphan) ? 'none' : 'block';
          }
        });
      });

      searchInput.addEventListener('input', e => {
        const query = e.target.value.toLowerCase().trim();
        allFileNodes.forEach(n => {
          const el = nodeElements.get(n);
          if (el) {
            if (!query) {
              el.style.opacity = '1';
            } else {
              el.style.opacity = n.label.toLowerCase().indexOf(query) !== -1 ? '1' : '0.15';
            }
          }
        });
      });

      document.getElementById('closeSidebar').addEventListener('click', () => {
        sidebar.classList.add('collapsed');
      });
    } catch (err) {
      console.error('ProjectBrain Webview Error:', err);
    }
  </script>
</body>
</html>`;
}
