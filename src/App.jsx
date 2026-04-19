import React, { useRef } from 'react';
import { useControls, folder } from 'leva';

const Petal = ({ index, total, settings }) => {
  const { length, width, curvature, color, opacity, rotateOffset, taper } = settings;
  const rotation = (index / total) * 360 + rotateOffset;

  const pathData = `
  M 0,0 
  C ${-width},${-length * curvature} 
    ${-taper},${-length} 
    0,${-length} 
  C ${taper},${-length} 
    ${width},${-length * curvature} 
    0,0 
  Z
`;

  return (
    <path
  d={pathData}
  fill={color}
  fillOpacity={opacity}
  transform={`rotate(${rotation})`}
  style={{ mixBlendMode: 'screen' }} // Add this line
/>
  );
};

const FlowerLayer = ({ settings }) => {
  if (!settings) return null;

  return (
    <g>
      {[...Array(settings.count)].map((_, i) => (
        <Petal key={i} index={i} total={settings.count} settings={settings} />
      ))}
      <circle r={settings.coreSize} fill={settings.color} fillOpacity={settings.opacity} />
    </g>
  );
};

export default function App() {
  const svgRef = useRef(null);

  // We define 3 distinct state objects using Leva's folder structure
  const config = useControls({
    Background: '#111111',
    'Layer 1 (Bottom)': folder({
      l1_count: { label: 'count', value: 12, min: 1, max: 100, step: 1 },
      l1_length: { label: 'length', value: 200, min: 10, max: 300 },
      l1_width: { label: 'width', value: 40, min: 2, max: 150 },
      l1_curvature: { label: 'curvature', value: 0.5, min: 0, max: 1 },
      l1_taper: { label: 'taper', value: 10, min: -50, max: 50 },
      l1_rotateOffset: { label: 'rotate', value: 0, min: 0, max: 360 },
      l1_opacity: { label: 'opacity', value: 0.5, min: 0, max: 1 },
      l1_coreSize: { label: 'coreSize', value: 15, min: 0, max: 100 },
      l1_color: { label: 'color', value: '#ff0055' },
    }),
    'Layer 2 (Middle)': folder({
      l2_count: { label: 'count', value: 20, min: 1, max: 100, step: 1 },
      l2_length: { label: 'length', value: 150, min: 10, max: 300 },
      l2_width: { label: 'width', value: 20, min: 2, max: 150 },
      l2_curvature: { label: 'curvature', value: 0.8, min: 0, max: 1 },
      l2_taper: { label: 'taper', value: -10, min: -50, max: 50 },
      l2_rotateOffset: { label: 'rotate', value: 15, min: 0, max: 360 },
      l2_opacity: { label: 'opacity', value: 0.6, min: 0, max: 1 },
      l2_coreSize: { label: 'coreSize', value: 10, min: 0, max: 100 },
      l2_color: { label: 'color', value: '#0099ff' },
    }),
    'Layer 3 (Top)': folder({
      l3_count: { label: 'count', value: 5, min: 1, max: 100, step: 1 },
      l3_length: { label: 'length', value: 100, min: 10, max: 300 },
      l3_width: { label: 'width', value: 80, min: 2, max: 150 },
      l3_curvature: { label: 'curvature', value: 0.2, min: 0, max: 1 },
      l3_taper: { label: 'taper', value: 20, min: -50, max: 50 },
      l3_rotateOffset: { label: 'rotate', value: 45, min: 0, max: 360 },
      l3_opacity: { label: 'opacity', value: 0.8, min: 0, max: 1 },
      l3_coreSize: { label: 'coreSize', value: 5, min: 0, max: 100 },
      l3_color: { label: 'color', value: '#ffcc00' },
    }),
  });

  // Helper to map the prefixed keys back to clean objects for the components
  const getLayerSettings = (prefix) => ({
    count: config[`${prefix}_count`],
    length: config[`${prefix}_length`],
    width: config[`${prefix}_width`],
    curvature: config[`${prefix}_curvature`],
    taper: config[`${prefix}_taper`],
    rotateOffset: config[`${prefix}_rotateOffset`],
    opacity: config[`${prefix}_opacity`],
    coreSize: config[`${prefix}_coreSize`],
    color: config[`${prefix}_color`],
  });

  const exportPng = () => {
    const svg = svgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = (new XMLSerializer()).serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.fillStyle = config.Background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 1000, 1000);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "strange-flower.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div style={{ 
      width: '100vw', height: '100vh', 
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: config.Background,
      overflow: 'hidden'
    }}>
      <button 
        onClick={exportPng}
        style={{
          position: 'absolute', bottom: '20px', left: '20px',
          padding: '10px 20px', cursor: 'pointer', zIndex: 100,
          background: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold'
        }}
      >
        Export PNG
      </button>

      <svg ref={svgRef} viewBox="0 0 500 500" style={{ width: '90vmin', height: '90vmin' }}>
        <g transform="translate(250, 250)">
          <FlowerLayer settings={getLayerSettings('l1')} />
          <FlowerLayer settings={getLayerSettings('l2')} />
          <FlowerLayer settings={getLayerSettings('l3')} />
        </g>
      </svg>
    </div>
  );
}
