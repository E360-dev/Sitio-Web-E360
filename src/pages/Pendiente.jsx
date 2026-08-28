import React from 'react';
import Imagen from '../components/Imagen';

export default function Pendiente() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center text-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Imagen className="mx-auto h-16 w-auto" src="/img/logo.png" alt="Logo E360" lazy={false} />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registro Recibido
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-gray-700">
                Gracias por registrarte. Tu cuenta ha sido creada y está pendiente de aprobación por parte de nuestro equipo.
            </p>
            <p className="mt-4 text-gray-700">
                Recibirás una notificación por correo electrónico una vez que tu cuenta sea activada.
            </p>
        </div>
      </div>
    </div>
  );
}
