import React, { useState } from 'react';

export default function GmailFloatingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openGmail = () => {
    const recipients = 'fernando@e360.pro,arturo@e360.pro';
    const subject = 'Consulta desde E360';
    const body = 'Hola, me gustaría obtener más información sobre...';
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3">
        {!isModalOpen && (
          <div className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform -translate-x-full opacity-0 animate-fade-in-left">
            <span className="text-sm font-semibold"><strong>¿Tienes dudas?</strong> Te asesoramos</span>
          </div>
        )}
        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          className="p-4 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all duration-300"
          aria-label={isModalOpen ? "Cerrar" : "Contactar por Gmail"}
        >
          {isModalOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2l-10 7L2 6h20z"/>
            </svg>
          )}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed bottom-24 right-8 z-50 transform transition-all duration-300 ease-out animate-fade-in-up">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative overflow-hidden border border-gray-200">
            {/* Red Header Strip */}
            <div className="bg-red-100 p-4 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                  <path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2l-10 7L2 6h20z"/>
                </svg>
                <span className="font-semibold text-red-800 text-base">Estamos disponibles</span>
              </div>
              <p className="text-red-700 text-sm">Te atendemos por gmail</p>
            </div>

            {/* White Content Area */}
            <div className="p-6 text-center">
              <div
                className="flex flex-col items-center justify-center gap-5 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors duration-200 border border-gray-200"
              >
                <div className="flex items-center gap-4" onClick={openGmail}>
                  <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src="/img/logo.png" alt="E360 Logo" className="h-10 w-auto object-cover" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-gray-800 text-xl">E360</span>
                    <a href="mailto:fernando@e360.pro" className="text-blue-600 hover:underline text-base">fernando@e360.pro</a>
                    <a href="mailto:arturo@e360.pro" className="text-blue-600 hover:underline text-base">arturo@e360.pro</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Keyframes for animations */}
      <style>
        {`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fade-in-left {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
          }
          .animate-fade-in-left {
            animation: fade-in-left 0.3s ease-out forwards;
          }
        `}
      </style>
    </>
  );
}