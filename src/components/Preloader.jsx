import { useEffect, useState } from 'react';

export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1500); // El preloader se ocultará después de 1.5 segundos

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="preloader"
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
    >
      <img src="/img/logo1.png" alt="E360 Logo" className="w-32 h-auto animate-pulse" />
    </div>
  );
}
