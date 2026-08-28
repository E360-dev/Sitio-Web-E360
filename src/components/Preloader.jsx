import { useEffect, useState } from 'react';
import Imagen from './Imagen';

export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 600); // Suficiente para el guiño de marca sin castigar el tiempo de carga

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="preloader"
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
    >
      <Imagen src="/img/logo1.png" alt="E360 Logo" className="w-32 h-auto animate-pulse" lazy={false} width={400} height={257} />
    </div>
  );
}
