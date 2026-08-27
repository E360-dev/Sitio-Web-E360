import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <title>Página no encontrada | E360</title>
      <meta name="robots" content="noindex, nofollow" />
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
      <p className="text-center text-gray-500 mb-8">
        Lo sentimos, la página que estás buscando no existe o se ha movido.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
      >
        Ir a la página de inicio
      </button>
      <button
        onClick={() => navigate(-1)}
        className="mt-4 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition duration-300"
      >
        Regresar
      </button>
    </div>
  );
};

export default NotFoundPage;
