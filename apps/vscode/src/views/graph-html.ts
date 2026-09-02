import type { DependencyGraphData, ArchitectureModel } from '@projectbrain/shared';

export function getGraphWebviewHtml(graphData: DependencyGraphData, archModel: ArchitectureModel): string {
  const serializedGraph = JSON.stringify(graphData);
  const serializedArch = JSON.stringify(archModel);

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
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
      cursor: grab;
    }

    canvas:active {
      cursor: grabbing;
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
      gap: 12px;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
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
      transition: all 0.15s;
    }

    .toolbar button:hover {
      background: var(--border);
    }

    .toolbar button.active {
      background: var(--accent);
      color: var(--accent-fg);
      border-color: var(--accent);
    }

    /* Legend */
    .legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      display: flex;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
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
      transform: translateX(320px);
      margin-left: -320px;
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sidebar-header h2 {
      font-size: 14px;
      font-weight: 600;
    }

    .sidebar-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      margin-top: 4px;
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
      margin-top: 8px;
    }

    .btn-open:hover {
      opacity: 0.9;
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
    <canvas id="graphCanvas"></canvas>

    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="🔍 Search modules..." />
      <button id="btnResetView" title="Reset View">🎯 Reset</button>
      <button id="btnToggleOrphans" title="Toggle Orphan Nodes">🌱 Orphans</button>
      <button id="btnToggleLayers" title="Organize by Layers" class="active">🥞 Layers</button>
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
      <span id="closeSidebar" style="cursor: pointer; opacity: 0.6;">✕</span>
    </div>
    <div class="sidebar-body" id="sidebarContent">
      <div style="text-align: center; opacity: 0.6; margin-top: 40px;">
        Click any node in the graph to inspect its architecture layer, imports, and references.
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const rawGraph = ${serializedGraph};
    const rawArch = ${serializedArch};

    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    const sidebarContent = document.getElementById('sidebarContent');
    const searchInput = document.getElementById('searchInput');

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
      draw();
    });

    // Determine layer for a node
    function getLayerForNode(nodeId, filePath) {
      if (!filePath) filePath = nodeId.replace('file:', '');
      for (const layer of rawArch.layers) {
        if (layer.files.some(f => filePath.includes(f) || f.includes(filePath))) {
          return layer.type;
        }
      }
      if (filePath.includes('apps/') || filePath.includes('views') || filePath.includes('components')) return 'frontend';
      if (filePath.includes('security') || filePath.includes('auth')) return 'auth';
      if (filePath.includes('shared')) return 'shared';
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

    // Filter file nodes only for primary visualization
    const fileNodesMap = new Map();
    rawGraph.nodes.forEach(n => {
      if (n.kind === 'file' || n.id.startsWith('file:')) {
        const filePath = n.filePath || n.id.replace('file:', '');
        const layer = getLayerForNode(n.id, filePath);
        fileNodesMap.set(n.id, {
          id: n.id,
          label: n.label || filePath.split('/').pop(),
          filePath: filePath,
          layer: layer,
          color: getLayerColor(layer),
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0,
          radius: 14,
          inDegree: 0,
          outDegree: 0
        });
      }
    });

    const edges = [];
    rawGraph.edges.forEach(e => {
      if (fileNodesMap.has(e.sourceId) && fileNodesMap.has(e.targetId)) {
        edges.push({
          source: fileNodesMap.get(e.sourceId),
          target: fileNodesMap.get(e.targetId),
          kind: e.kind
        });
        fileNodesMap.get(e.targetId).inDegree++;
        fileNodesMap.get(e.sourceId).outDegree++;
      }
    });

    const nodes = Array.from(fileNodesMap.values());

    // Layer initial positioning
    const layerYMap = {
      frontend: height * 0.2,
      backend: height * 0.45,
      auth: height * 0.7,
      shared: height * 0.85
    };

    nodes.forEach((n, idx) => {
      n.y = layerYMap[n.layer] || height * 0.5;
      n.x = (width / (nodes.length + 1)) * (idx + 1);
    });

    // View Transform State
    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragNode = null;
    let startX = 0;
    let startY = 0;
    let selectedNode = null;
    let searchQuery = '';
    let showOrphans = true;

    // Simulation step
    function stepSimulation() {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 120) {
            const force = (120 - dist) / dist * 0.5;
            a.x -= dx * force * 0.1;
            a.y -= dy * force * 0.05;
            b.x += dx * force * 0.1;
            b.y += dy * force * 0.05;
          }
        }
      }

      // Edge spring
      edges.forEach(e => {
        const dx = e.target.x - e.source.x;
        const dy = e.target.y - e.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 90) * 0.02;
        e.source.x += dx * force;
        e.target.x -= dx * force;
      });

      // Keep within layer band
      nodes.forEach(n => {
        const targetY = layerYMap[n.layer] || height * 0.5;
        n.y += (targetY - n.y) * 0.05;
        n.x = Math.max(40, Math.min(width - 40, n.x));
      });
    }

    // Render loop
    function draw() {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Draw edges
      edges.forEach(e => {
        if (!showOrphans && (e.source.inDegree === 0 && e.source.outDegree === 0)) return;

        const isHighlighted = selectedNode && (e.source === selectedNode || e.target === selectedNode);

        ctx.beginPath();
        ctx.moveTo(e.source.x, e.source.y);
        ctx.lineTo(e.target.x, e.target.y);
        ctx.strokeStyle = isHighlighted ? '#89b4fa' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1;
        ctx.stroke();

        // Arrow head
        if (isHighlighted) {
          const angle = Math.atan2(e.target.y - e.source.y, e.target.x - e.source.x);
          const headLen = 8;
          const arrowX = e.target.x - Math.cos(angle) * (e.target.radius + 2);
          const arrowY = e.target.y - Math.sin(angle) * (e.target.radius + 2);

          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - headLen * Math.cos(angle - Math.PI / 6), arrowY - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(arrowX - headLen * Math.cos(angle + Math.PI / 6), arrowY - headLen * Math.sin(angle + Math.PI / 6));
          ctx.fillStyle = '#89b4fa';
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const isMatched = searchQuery && n.label.toLowerCase().includes(searchQuery);
        const isSelected = selectedNode === n;

        // Outer glow for selected/matched
        if (isSelected || isMatched) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(137, 180, 250, 0.3)' : 'rgba(250, 204, 21, 0.3)';
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#cdd6f4';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 14);
      });

      ctx.restore();
    }

    function animate() {
      stepSimulation();
      draw();
      requestAnimationFrame(animate);
    }
    animate();

    // Interaction Handlers
    function screenToWorld(sx, sy) {
      return {
        x: (sx - panX) / zoom,
        y: (sy - panY) / zoom
      };
    }

    function findNodeAt(worldX, worldY) {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        const dx = worldX - n.x;
        const dy = worldY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 4) {
          return n;
        }
      }
      return null;
    }

    canvas.addEventListener('mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const clicked = findNodeAt(pos.x, pos.y);

      if (clicked) {
        dragNode = clicked;
        selectedNode = clicked;
        renderInspector(clicked);
      } else {
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
      }
    });

    window.addEventListener('mousemove', e => {
      if (dragNode) {
        const rect = canvas.getBoundingClientRect();
        const pos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        dragNode.x = pos.x;
        dragNode.y = pos.y;
      } else if (isDragging) {
        panX = e.clientX - startX;
        panY = e.clientY - startY;
      }
    });

    window.addEventListener('mouseup', () => {
      dragNode = null;
      isDragging = false;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.max(0.3, Math.min(3.0, zoom * zoomFactor));
    });

    // Inspector Rendering
    function renderInspector(node) {
      const inEdges = edges.filter(e => e.target === node);
      const outEdges = edges.filter(e => e.source === node);

      sidebarContent.innerHTML = \`
        <div class="info-card">
          <div style="font-size: 14px; font-weight: 600; word-break: break-all;">\${node.label}</div>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 4px; word-break: break-all;">\${node.filePath}</div>
          <span class="info-badge" style="background: \${node.color}; color: #000;">\${node.layer.toUpperCase()} LAYER</span>
          <button class="btn-open" onclick="openNodeFile('\${node.filePath}')" style="width: 100%; margin-top: 12px;">📄 Open in Editor</button>
        </div>

        <div class="info-card">
          <h3>Connections Overview</h3>
          <div class="stats-pill"><span>Incoming Imports:</span> <b>\${inEdges.length}</b></div>
          <div class="stats-pill"><span>Outgoing Dependencies:</span> <b>\${outEdges.length}</b></div>
        </div>

        <div class="info-card">
          <h3>Dependencies (\${outEdges.length})</h3>
          \${outEdges.length === 0 ? '<div style="opacity: 0.5;">No outgoing dependencies</div>' : outEdges.map(e => \`<div style="padding: 2px 0;">➡️ \${e.target.label}</div>\`).join('')}
        </div>

        <div class="info-card">
          <h3>Imported By (\${inEdges.length})</h3>
          \${inEdges.length === 0 ? '<div style="opacity: 0.5;">No incoming imports (Isolated)</div>' : inEdges.map(e => \`<div style="padding: 2px 0;">⬅️ \${e.source.label}</div>\`).join('')}
        </div>
      \`;
    }

    window.openNodeFile = function(filePath) {
      vscode.postMessage({
        command: 'openFile',
        filePath: filePath
      });
    };

    // Controls
    document.getElementById('btnResetView').addEventListener('click', () => {
      zoom = 1.0;
      panX = 0;
      panY = 0;
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
    });

    document.getElementById('closeSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
  </script>
</body>
</html>`;
}
