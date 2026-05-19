import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SandboxManager } from '../services/sandbox/SandboxManager.js';

const router = Router();
const sandboxManager = new SandboxManager();

const projects = new Map<string, any>();

router.get('/', (req, res) => {
  const projectList = Array.from(projects.values()).map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
  res.json({ projects: projectList });
});

router.post('/', async (req, res) => {
  const { name, template } = req.body;
  
  const project = {
    id: uuidv4(),
    name: name || 'Untitled Project',
    files: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  if (template) {
    const defaultFiles = getTemplateFiles(template);
    defaultFiles.forEach((content, path) => {
      project.files.set(path, {
        path,
        name: path.split('/').pop() || path,
        content,
        language: getLanguage(path),
        size: content.length,
      });
    });
  }
  
  projects.set(project.id, project);
  
  res.json({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
  });
});

router.get('/:id', (req, res) => {
  const project = projects.get(req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json({
    id: project.id,
    name: project.name,
    files: Array.from(project.files.values()),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
});

router.get('/:id/files', (req, res) => {
  const project = projects.get(req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json({ files: Array.from(project.files.values()) });
});

router.put('/:id/files', async (req, res) => {
  const project = projects.get(req.params.id);
  const { path, content } = req.body;
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const fileInfo = {
    path,
    name: path.split('/').pop() || path,
    content,
    language: getLanguage(path),
    size: content.length,
  };
  
  project.files.set(path, fileInfo);
  project.updatedAt = new Date();
  
  res.json({ file: fileInfo });
});

router.post('/:id/sandbox', async (req, res) => {
  const project = projects.get(req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  try {
    const sandboxId = await sandboxManager.create();
    const previewUrl = sandboxManager.getPreviewUrl(sandboxId);
    
    project.sandboxId = sandboxId;
    project.previewUrl = previewUrl;
    
    for (const [path, file] of project.files) {
      await sandboxManager.writeFile(sandboxId, path, file.content);
    }
    
    res.json({ sandboxId, previewUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/execute', async (req, res) => {
  const project = projects.get(req.params.id);
  const { command } = req.body;
  
  if (!project || !project.sandboxId) {
    return res.status(404).json({ error: 'Sandbox not found' });
  }
  
  try {
    const result = await sandboxManager.executeCommand(project.sandboxId, command);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function getTemplateFiles(template: string): Map<string, string> {
  const files = new Map();
  
  if (template === 'html') {
    files.set('index.html', `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>Welcome to your new app!</p>
</body>
</html>`);
  } else if (template === 'react') {
    files.set('index.html', `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`);
    files.set('src/main.jsx', `import React from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';

function App() {
  return (
    React.createElement('div', { style: { fontFamily: 'system-ui', padding: '20px' } },
      React.createElement('h1', null, 'Hello React!'),
      React.createElement('p', null, 'Welcome to your React app.')
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
`);
  }
  
  return files;
}

function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    html: 'html',
    htm: 'html',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    css: 'css',
    json: 'json',
    md: 'markdown',
  };
  return langMap[ext || ''] || 'plaintext';
}

export { router as projectRouter, projects };
