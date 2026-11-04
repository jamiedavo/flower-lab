import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { LevaPanel, useControls, useCreateStore, folder } from 'leva';
import { DEFAULT_CONFIG, FIELD_SETTINGS, PRESETS, randomizeFlower } from './flowerConfig';
import { createHistory, historyReducer } from './flowerHistory';
import './App.css';

const LAYERS = ['Layer 1 (Bottom)', 'Layer 2 (Middle)', 'Layer 3 (Top)'];
const sameFlower = (a, b) => Object.keys(DEFAULT_CONFIG).every(key => a[key] === b[key]);

function readControls(get) {
  return Object.fromEntries(Object.keys(DEFAULT_CONFIG).map(key => {
    const path = key === 'Background' ? key : `${LAYERS[Number(key[1]) - 1]}.${key}`;
    return [key, get(path)];
  }));
}

function FlowerLayer({ settings }) {
  const { count, length, width, curvature, color, opacity, rotateOffset, taper, coreSize } = settings;
  const path = `M 0,0 C ${-width},${-length * curvature} ${-taper},${-length} 0,${-length}
    C ${taper},${-length} ${width},${-length * curvature} 0,0 Z`;
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <path key={index} d={path} fill={color} fillOpacity={opacity}
          transform={`rotate(${index / count * 360 + rotateOffset})`}
          style={{ mixBlendMode: 'screen' }} />
      ))}
      <circle r={coreSize} fill={color} fillOpacity={opacity} />
    </g>
  );
}

export default function App() {
  const svgRef = useRef(null);
  const store = useCreateStore();
  const [history, dispatch] = useReducer(historyReducer, DEFAULT_CONFIG, createHistory);
  const [showControls, setShowControls] = useState(false);
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState(false);

  const finishEdit = useCallback((_value, _path, context) => {
    dispatch({ type: 'commit', value: readControls(context.get) });
  }, []);

  const [config, setConfig] = useControls(() => {
    const schema = {
      Background: { value: DEFAULT_CONFIG.Background, onEditEnd: finishEdit },
    };
    LAYERS.forEach((name, index) => {
      const prefix = `l${index + 1}_`;
      const fields = Object.fromEntries([...Object.keys(FIELD_SETTINGS), 'color'].map(field => [
        `${prefix}${field}`,
        {
          ...FIELD_SETTINGS[field],
          label: field === 'rotateOffset' ? 'rotate' : field,
          value: DEFAULT_CONFIG[`${prefix}${field}`],
          onEditEnd: finishEdit,
        },
      ]));
      schema[name] = folder(fields);
    });
    return schema;
  }, { store }, [finishEdit]);

  const pendingEdit = !sameFlower(config, history.present);
  const canUndo = pendingEdit || history.past.length > 0;
  const canRedo = !pendingEdit && history.future.length > 0;
  const preset = PRESETS.find(item => sameFlower(config, item.values));

  // Commit a live input before an action, even if it has not blurred yet.
  const applyFlower = (value, message) => {
    dispatch({ type: 'commit', value: config });
    dispatch({ type: 'commit', value });
    setConfig(value);
    setStatus(message);
  };

  const undo = useCallback(() => {
    const current = historyReducer(history, { type: 'commit', value: config });
    const previous = historyReducer(current, { type: 'undo' });
    dispatch({ type: 'commit', value: config });
    dispatch({ type: 'undo' });
    setConfig(previous.present);
    setStatus('Change undone.');
  }, [config, history, setConfig]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = historyReducer(history, { type: 'redo' });
    dispatch({ type: 'redo' });
    setConfig(next.present);
    setStatus('Change restored.');
  }, [canRedo, history, setConfig]);

  useEffect(() => {
    const onKeyDown = event => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      // Keep native text editing shortcuts inside inputs.
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
      } else if (((key === 'z' && event.shiftKey) || key === 'y') && canRedo) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const exportPng = async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    let url;
    try {
      const svg = svgRef.current.cloneNode(true);
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '1000');
      svg.setAttribute('height', '1000');
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Could not create the PNG. Please try again.'));
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1000;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('PNG export is unavailable in this browser.');
      context.fillStyle = config.Background;
      context.fillRect(0, 0, 1000, 1000);
      context.drawImage(image, 0, 0, 1000, 1000);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'strange-flower.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus('PNG exported.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      if (url) URL.revokeObjectURL(url);
      setExporting(false);
    }
  };

  return (
    <div className="app-shell" style={{ backgroundColor: config.Background }}>
      <header className="toolbar">
        <h1>Flower Lab</h1>
        <div className="toolbar-actions" aria-label="Flower actions">
          <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">Undo</button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">Redo</button>
          <button type="button" className="export-button" onClick={exportPng} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export PNG'}
          </button>
          <button type="button" className="controls-toggle" aria-expanded={showControls}
            aria-controls="flower-controls" onClick={() => setShowControls(open => !open)}>
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <div className="flower-stage">
          <svg ref={svgRef} className="flower-svg" role="img" aria-label="Generated flower"
            width="500" height="500" viewBox="0 0 500 500">
            <title>Flower Lab creation</title>
            <g transform="translate(250, 250)">
              {LAYERS.map((name, index) => (
                <FlowerLayer key={name} settings={Object.fromEntries(
                  [...Object.keys(FIELD_SETTINGS), 'color'].map(field => [field, config[`l${index + 1}_${field}`]])
                )} />
              ))}
            </g>
          </svg>
        </div>

        <aside id="flower-controls" className={`editor-panel${showControls ? ' is-open' : ''}`} aria-label="Flower controls">
          <div className="explore-controls">
            <label htmlFor="flower-preset">Start with a preset</label>
            <select id="flower-preset" value={preset?.id ?? ''} onChange={event => {
              const selected = PRESETS.find(item => item.id === event.target.value);
              if (selected) applyFlower(selected.values, `${selected.name} preset applied.`);
            }}>
              <option value="" disabled>Custom flower</option>
              {PRESETS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p>{preset?.description ?? 'Your own mix. Keep exploring, or undo to go back.'}</p>
            <div className="randomize-actions">
              <button type="button" onClick={() => applyFlower(randomizeFlower(config), 'New flower generated.')}>Randomize flower</button>
              <button type="button" onClick={() => applyFlower(randomizeFlower(config, 'colors'), 'New colors applied.')}>Randomize colors</button>
            </div>
            <small>Balanced shapes and coordinated palettes. Undo any change.</small>
          </div>
          <div className="layer-controls">
            <LevaPanel store={store} fill flat titleBar={false} hideCopyButton />
          </div>
        </aside>
      </main>
      <span className="sr-only" role="status">{status}</span>
    </div>
  );
}
