import type { DependencyGraphData, ArchitectureModel } from '@projectbrain/shared';

export function getGraphWebviewHtml(graphData: DependencyGraphData, archModel: ArchitectureModel): string {
  // Normalize all paths in graph data to forward slashes in Node/TS before JSON serialization
  const sanitizedGraph = {
    nodes: graphData.nodes.map(n => ({
      id: (n.id || '').replace(/\\/g, '/'),
      label: n.label || '',
      kind: n.kind,
      filePath: n.filePath ? n.filePath.replace(/\\/g, '/') : (n.id || '').replace('file:', '').replace(/\\/g, '/')
    })),
    edges: graphData.edges.map(e => ({
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
      background: radial-gradient(circle at center, rgba(137, 180, 250, 0.04) 0%, transparent 70%);
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
      width: 170px;
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
    <canvas id="graphCanvas"></canvas>

    <div class="toolbar">
      <input type="text" id="searchInput" placeholder="🔍 Search modules..." />
      <button id="btnResetView" title="Reset View">🎯 Reset</button>
      <button id="btnToggleOrphans" title="Toggle Orphan Nodes" class="active">🌱 Orphans</button>
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

      const canvas = document.getElementById('graphCanvas');
      const ctx = canvas.getContext('2d');
      const sidebar = document.getElementById('sidebar');
      const sidebarContent = document.getElementById('sidebarContent');
      const searchInput = document.getElementById('searchInput');

      let width = 800;
      let height = 600;

      function resize() {
        const container = canvas.parentElement;
        width = canvas.width = Math.max(400, container ? container.clientWidth : window.innerWidth);
        height = canvas.height = Math.max(300, container ? container.clientHeight : window.innerHeight);
      }
      window.addEventListener('resize', resize);
      resize();

      function getLayerForNode(filePath) {
        if (!filePath) return 'backend';
        for (const layer of rawArch.layers) {
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

      // Filter and build nodes
      const fileNodesMap = new Map();
      (rawGraph.nodes || []).forEach(n => {
        if (n.kind === 'file' || (n.id && n.id.indexOf('file:') === 0)) {
          const filePath = n.filePath || n.id.replace('file:', '');
          const layer = getLayerForNode(filePath);
          const parts = filePath.split('/');
          const label = n.label || parts[parts.length - 1] || n.id;

          fileNodesMap.set(n.id, {
            id: n.id,
            label: label,
            filePath: filePath,
            layer: layer,
            color: getLayerColor(layer),
            x: Math.random() * (width - 120) + 60,
            y: Math.random() * (height - 120) + 60,
            radius: 14,
            inDegree: 0,
            outDegree: 0
          });
        }
      });

      const edges = [];
      (rawGraph.edges || []).forEach(e => {
        const src = fileNodesMap.get(e.sourceId);
        const tgt = fileNodesMap.get(e.targetId);
        if (src && tgt && src !== tgt) {
          edges.push({
            source: src,
            target: tgt,
            kind: e.kind
          });
          tgt.inDegree++;
          src.outDegree++;
        }
      });

      const nodes = Array.from(fileNodesMap.values());

      function getLayerY(layer) {
        switch (layer) {
          case 'frontend': return height * 0.18;
          case 'backend': return height * 0.45;
          case 'auth': return height * 0.72;
          case 'shared': return height * 0.88;
          default: return height * 0.5;
        }
      }

      // Initial spread
      nodes.forEach((n, idx) => {
        n.y = getLayerY(n.layer) + (Math.random() * 40 - 20);
        n.x = (width / (nodes.length + 1)) * (idx + 1);
      });

      // View State
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
      let organizeByLayers = true;

      // Physics Simulation
      function stepSimulation() {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < 130) {
              const force = (130 - dist) / dist * 0.4;
              a.x -= dx * force * 0.1;
              a.y -= dy * force * 0.05;
              b.x += dx * force * 0.1;
              b.y += dy * force * 0.05;
            }
          }
        }

        edges.forEach(e => {
          const dx = e.target.x - e.source.x;
          const dy = e.target.y - e.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.02;
          e.source.x += dx * force;
          e.target.x -= dx * force;
        });

        nodes.forEach(n => {
          if (organizeByLayers) {
            const targetY = getLayerY(n.layer);
            n.y += (targetY - n.y) * 0.06;
          }
          n.x = Math.max(50, Math.min(width - 50, n.x));
        });
      }

      // Drawing
      function draw() {
        resize();
        ctx.clearRect(0, 0, width, height);

        if (nodes.length === 0) {
          ctx.fillStyle = '#89b4fa';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Scanning codebase... Click "Analyze Project" in ProjectBrain to build the graph.', width / 2, height / 2);
          return;
        }

        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        // Edges
        edges.forEach(e => {
          const isOrphan = (e.source.inDegree === 0 && e.source.outDegree === 0) || (e.target.inDegree === 0 && e.target.outDegree === 0);
          if (!showOrphans && isOrphan) return;

          const isHighlighted = selectedNode && (e.source === selectedNode || e.target === selectedNode);

          ctx.beginPath();
          ctx.moveTo(e.source.x, e.source.y);
          ctx.lineTo(e.target.x, e.target.y);
          ctx.strokeStyle = isHighlighted ? '#89b4fa' : 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = isHighlighted ? 2.5 : 1;
          ctx.stroke();

          // Arrow Head
          if (isHighlighted) {
            const angle = Math.atan2(e.target.y - e.source.y, e.target.x - e.source.x);
            const headLen = 9;
            const arrowX = e.target.x - Math.cos(angle) * (e.target.radius + 3);
            const arrowY = e.target.y - Math.sin(angle) * (e.target.radius + 3);

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - headLen * Math.cos(angle - Math.PI / 6), arrowY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - headLen * Math.cos(angle + Math.PI / 6), arrowY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.fillStyle = '#89b4fa';
            ctx.fill();
          }
        });

        // Nodes
        nodes.forEach(n => {
          const isOrphan = n.inDegree === 0 && n.outDegree === 0;
          if (!showOrphans && isOrphan) return;

          const isMatched = searchQuery && n.label.toLowerCase().indexOf(searchQuery) !== -1;
          const isSelected = selectedNode === n;

          if (isSelected || isMatched) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius + 7, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? 'rgba(137, 180, 250, 0.35)' : 'rgba(250, 204, 21, 0.35)';
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
          ctx.lineWidth = isSelected ? 3 : 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

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
          if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 5) {
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
          sidebar.classList.remove('collapsed');
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
        zoom = Math.max(0.2, Math.min(3.5, zoom * zoomFactor));
      });

      function renderInspector(node) {
        const inEdges = edges.filter(e => e.target === node);
        const outEdges = edges.filter(e => e.source === node);

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

      document.getElementById('btnResetView').addEventListener('click', () => {
        zoom = 1.0;
        panX = 0;
        panY = 0;
      });

      const btnToggleOrphans = document.getElementById('btnToggleOrphans');
      btnToggleOrphans.addEventListener('click', () => {
        showOrphans = !showOrphans;
        btnToggleOrphans.classList.toggle('active', showOrphans);
      });

      const btnToggleLayers = document.getElementById('btnToggleLayers');
      btnToggleLayers.addEventListener('click', () => {
        organizeByLayers = !organizeByLayers;
        btnToggleLayers.classList.toggle('active', organizeByLayers);
      });

      searchInput.addEventListener('input', e => {
        searchQuery = e.target.value.toLowerCase().trim();
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
