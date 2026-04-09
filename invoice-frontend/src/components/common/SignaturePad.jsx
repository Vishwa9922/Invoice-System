import { useRef, useState, useEffect } from 'react';
import Button from './Button';

const SignaturePad = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [drawing,  setDrawing]  = useState(false);
  const [hasSign,  setHasSign]  = useState(false);

  // ── Canvas ko proper size set karo ─────────────────────────────
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Device pixel ratio ke liye multiply karo
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  };

  // ── Exact coordinates — DPR aur scroll consider karo ──────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSign(true);
  };

  const stopDraw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    setDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); // reset path
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr    = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  setHasSign(false);
  };

  const saveSignature = () => {
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white"
        style={{ height: '160px', position: 'relative' }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width:  '100%',
            height: '100%',
            touchAction: 'none',
            cursor: 'crosshair',
            display: 'block',
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasSign && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: '#D1D5DB',
              fontSize: '13px',
            }}
          >
            
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center">
        Draw your signature above
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={clearPad}>
          🗑️ Clear
        </Button>
        <Button size="sm" disabled={!hasSign} onClick={saveSignature}>
          ✓ Use Signature
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;