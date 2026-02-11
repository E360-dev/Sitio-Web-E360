import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ServiceHero from '../components/ServiceHero';
import { FaBalanceScale, FaChartLine, FaLaptopCode, FaShieldAlt, FaUsers, FaBullseye, FaLightbulb, FaWhatsapp } from 'react-icons/fa';

// --- Datos de los Servicios ---
const servicesData = [
  {
    id: 'consultoria',
    name: 'Consultoría Financiera e Impuestos',
    description: 'Optimización de cierres, valuaciones y estrategias tributarias con impacto real.',
    details: 'Optimización de cierres complejos, consolidación, valuaciones, planeación fiscal y estrategias tributarias con impacto real en liquidez y rentabilidad.',
    icon: FaChartLine,
    enfoque: {
      humano: 'Asesoría personalizada que se adapta a tu realidad operativa y comercial.',
      estrategico: 'Planificación fiscal proactiva que respalda el crecimiento de la empresa.',
      claridad: 'Explicamos las implicaciones de cada estrategia de forma clara y sencilla.',
    },
    leader: 'Fernando Vázquez',
  },
  {
    id: 'financiamiento',
    name: 'Financiamiento y Estructuración',
    description: 'Preparación integral para fondeo y capital con modelos financieros robustos.',
    details: 'Preparación integral para fondeo y capital con modelos financieros robustos, expedientes bancarios y acompañamiento en negociaciones con bancos y fondos.',
    icon: FaShieldAlt,
    enfoque: {
      humano: 'Entendemos tus metas de capital y te acompañamos en cada negociación.',
      estrategico: 'Estructuramos el financiamiento que se alinea a tus objetivos a largo plazo.',
      claridad: 'Traducimos términos complejos en acuerdos favorables y comprensibles.',
    },
    leader: 'Arturo Barrios',
  },
];

const enfoqueData = [
  { title: 'Humano', icon: FaUsers, key: 'humano' },
  { title: 'Estratégico', icon: FaBullseye, key: 'estrategico' },
  { title: 'Claridad', icon: FaLightbulb, key: 'claridad' },
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
      // Opcional: Scroll a la sección de tabs
      const element = document.getElementById('services-tabs-section');
      if (element) {
        
      }
    }
  }, [location]);

  return (
    <div id="services-tabs-section" className="bg-white text-gray-900 py-24 sm:py-32"> {/* Changed background to white, text to gray-900 */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Pestañas */}
        <div className="mb-12 flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-gray-200 pb-4"> {/* Changed border color */}
          {servicesData.map((service) => (
            <button
              key={service.id}
              onClick={() => setActiveTab(service.id)}
              className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-300 ${
                activeTab === service.id
                  ? 'bg-gradient-to-r from-[#365e91] to-[#4a7ab8] text-white shadow-lg shadow-[#365e91]/30' // Applied blue gradient to active tab button
                  : 'text-gray-600 hover:bg-gray-100' // Adjusted text and hover background for inactive tab
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>

        {/* Contenido de la Pestaña Activa */}
        {activeService && (
          <div className="relative isolate bg-white border border-gray-200 rounded-3xl shadow-lg shadow-gray-200 p-8 md:p-12"> {/* Changed background to white, border and shadow */}
            <div className="flex flex-col md:flex-row items-start gap-x-8 gap-y-6 mb-8">
              <div className="flex-shrink-0 text-[#365e91]"> {/* Changed icon color */}
                <activeService.icon className="text-5xl" />
              </div>
              <div className="flex-grow">
                <h2 className="text-3xl font-bold text-gray-900 mb-3"> {/* Reverted to solid dark text color */}
                  {activeService.name}
                </h2>
                <p className="text-lg text-gray-700 mb-3"> {/* Changed text color */}
                  {activeService.details}
                </p>
                <p className="text-[#365e91] font-semibold">Líder: {activeService.leader}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-8"> {/* Changed border color */}
              <h3 className="text-xl font-semibold mb-6 text-center md:text-left text-gray-900"> {/* Changed text color */}
                Nuestro Enfoque:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {enfoqueData.map((item) => (
                  <div key={item.key} className="group relative p-8 text-center bg-gray-50 border border-gray-200 rounded-3xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"> {/* Adjusted card styles for white background */}
                     <div className="absolute top-0 left-0 w-full h-full rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent 70%)'}}> {/* Changed hover gradient to a blueish one for white background */}
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="inline-block text-gray-900 transition-transform duration-300 group-hover:scale-110 mb-3"> {/* Changed icon color */}
                        <item.icon className="text-3xl" />
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">{item.title}</h4> {/* Changed text color */}
                      <div className="h-0.5 w-12 mx-auto mt-1 bg-gradient-to-r from-[#e80554] to-[#e80554] rounded-full"></div>
                      <p className="mt-2 text-gray-600 text-sm">{activeService.enfoque[item.key]}</p> {/* Changed text color */}
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
import GmailFloatingButton from '../components/GmailFloatingButton';

export default function Servicios() {
  return (
    <>
      <ServiceHero />
      <div id="servicios">
        <ServicesTabs />
      </div>
      <GmailFloatingButton />
    </>
  );
}
