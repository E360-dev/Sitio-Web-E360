import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import ServiceHero from '../components/ServiceHero';
import { FaChartLine, FaShieldAlt, FaUsers, FaBullseye, FaCheckCircle } from 'react-icons/fa';
import GmailFloatingButton from '../components/GmailFloatingButton';

// --- Datos de los Servicios ---
const servicesData = [
  {
    id: 'consultoria',
    name: 'Consultoría Financiera e Impuestos',
    description: 'Optimización de cierres, valuaciones y estrategias tributarias con impacto real.',
    details: 'Optimizamos tu operación financiera y fiscal para mejorar liquidez, rentabilidad y toma de decisiones.\nDesde cierres complejos hasta estrategias fiscales, convertimos la complejidad en claridad accionable.',
    icon: FaChartLine,
    enfoque: {
      humano: 'Trabajamos contigo, no sobre ti.\nEntendemos tu operación y adaptamos cada solución a tu realidad financiera y comercial.',
      estrategico: 'No solo cumplimos, optimizamos.\nDiseñamos estrategias fiscales y financieras que impactan directamente en liquidez, estructura y crecimiento.',
      claridad: 'Hablamos claro.\nTraducimos lo técnico en decisiones entendibles para que avances con seguridad y sin incertidumbre.',
    },
    leader: 'Fernando Vázquez',
  },
  {
    id: 'auditoria',
    name: 'Auditoría y Aseguramiento',
    description: 'Damos certeza técnica y regulatoria para decisiones confiables.',
    details: 'Damos certeza técnica y regulatoria para que tomes decisiones confiables y accedas a financiamiento sin fricción.\nAuditorías claras, ágiles y diseñadas para generar valor, no solo cumplimiento.',
    icon: FaShieldAlt,
    enfoque: {
      humano: 'Socios involucrados desde el inicio.\nSin capas innecesarias: trabajas con especialistas que entienden el impacto real del proyecto.',
      estrategico: 'La auditoría es un medio, no el fin.\nPreparamos tu información financiera para bancos, inversionistas y decisiones clave.',
      claridad: 'Sin sorpresas al final.\nProcesos estructurados, comunicación constante y resultados que generan confianza.',
    },
    leader: 'Belén Arias',
  },
  {
    id: 'financiamiento',
    name: 'Financiamiento y Estructuración',
    description: 'Preparamos y acompañamos a tu empresa para levantar capital.',
    details: 'Preparamos y acompañamos a tu empresa para obtener financiamiento o levantar capital con éxito.\nDesde el diagnóstico hasta la negociación, estructuramos todo para que el fondeo sí suceda.',
    icon: FaShieldAlt,
    enfoque: {
      humano: 'Acompañamiento real en todo el proceso.\nNo te dejamos solo frente al banco o inversionista.',
      estrategico: 'Estructuramos para cerrar.\nModelos financieros, expedientes y vehículos diseñados para maximizar probabilidad de éxito.',
      claridad: 'Sabes dónde estás y qué sigue.\nTe damos visibilidad total del proceso, riesgos y decisiones clave en cada etapa.',
    },
    leader: 'Arturo Barrios',
  },
];

const enfoqueData = [
  { title: 'HUMANO', icon: FaUsers, key: 'humano', image: '/img/servicios1.png' },
  { title: 'ESTRATÉGICO', icon: FaBullseye, key: 'estrategico', image: '/img/servicios2.png' },
  { title: 'CLARIDAD', icon: FaCheckCircle, key: 'claridad', image: '/img/servicios3.png' },
];

// --- Componente de Pestañas de Servicios ---
function ServicesTabs() {
  const [activeTab, setActiveTab] = useState(servicesData[0].id);
  const location = useLocation();
  const activeService = servicesData.find(s => s.id === activeTab);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && servicesData.some(s => s.id === hash)) {
      setActiveTab(hash);
    }
  }, [location]);

  return (
    <div id="services-tabs-section" className="bg-white text-gray-900 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Pestañas */}
        <div className="mb-20 flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-gray-100 pb-6">
          {servicesData.map((service) => (
            <button
              key={service.id}
              onClick={() => setActiveTab(service.id)}
              className={`px-6 py-2 text-sm sm:text-base font-bold rounded-full transition-all duration-300 ${
                activeTab === service.id
                  ? 'bg-[#2e527f] text-white shadow-xl shadow-[#2e527f]/20'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>

        {/* Contenido de la Pestaña Activa */}
        {activeService && (
          <div className="transition-all duration-500 animate-fade-in">
            {/* Header del servicio alineado a la izquierda */}
            <div className="w-full text-left mb-20 space-y-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-black flex items-center justify-start gap-4">
                <span className="text-black">✓</span> {activeService.name}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed w-full">
                {activeService.details}
              </p>
              <div className="pt-2">
                <p className="text-base font-bold text-[#2e527f] tracking-wider">
                  Líder: {activeService.leader}
                </p>
              </div>
            </div>

            {/* Sección NUESTRO ENFOQUE */}
            <div className="mt-16">
              <div className="text-center mb-16 relative">
                {/* Línea decorativa segmentada */}
                <div className="h-1 w-[36rem] mx-auto mb-6 flex rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-black"></div>
                  <div className="h-full w-1/3 bg-[#25c6e3]"></div>
                  <div className="h-full w-1/3 bg-[#E91E63]"></div>
                </div>
                <h3 className="text-2xl font-black text-[#2e527f] tracking-[0.2em] uppercase">
                  Nuestro Enfoque:
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                {enfoqueData.map((item) => (
                  <div key={item.key} className="flex flex-col items-center">
                    {/* Icono superior sólido */}
                    <div className="text-[#2e527f] mb-8">
                      <item.icon className="text-6xl" />
                    </div>

                    {/* Imagen con Overlay y Título */}
                    <div 
                      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]"
                      style={{ 
                        backgroundImage: `url('${item.image}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {/* Overlay azul corporativo */}
                      <div className="absolute inset-0 bg-[#2e527f]/70 flex items-center justify-center">
                        <h4 className="text-3xl font-black text-white tracking-widest text-center px-4">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Descripción debajo */}
                    <div className="mt-8 text-center max-w-[280px]">
                      <p className="text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                        {activeService.enfoque[item.key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Servicios() {
  return (
    <>
      <Seo
        title="Servicios | Consultoría, auditoría y financiamiento — E360"
        description="Consultoría financiera e impuestos, auditoría y aseguramiento, y estructuración de financiamiento. Soluciones diseñadas para el crecimiento y la certidumbre de tu empresa."
        path="/servicios"
      />
      <ServiceHero />
      <div id="servicios">
        <ServicesTabs />
      </div>
      <GmailFloatingButton />
    </>
  );
}
