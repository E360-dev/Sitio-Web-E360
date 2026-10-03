import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo';
import { fondoWebp } from '../components/Imagen';
import ServiceHero from '../components/ServiceHero';
import { FaUsers, FaBullseye, FaCheckCircle } from 'react-icons/fa';
import GmailFloatingButton from '../components/GmailFloatingButton';
import { SERVICIOS_PRINCIPALES, FINANCIAMIENTO } from '../datos/servicios';

const nombre = (id) => SERVICIOS_PRINCIPALES.find((s) => s.id === id).nombre;

// --- Datos de los Servicios ---
// `description` es el resumen breve del servicio; hoy no se muestra, pero se
// mantiene al día para que no reaparezca un texto anterior si se usa.
const servicesData = [
  {
    id: 'auditoria',
    name: nombre('auditoria'),
    description: 'Confianza en tu información financiera, con independencia, rigor y conocimiento del negocio.',
    details: [
      'Damos confianza a tu información financiera con independencia, rigor técnico y conocimiento del negocio. Nuestro trabajo respalda las decisiones de socios, consejos y fondeadores, y ayuda a atender requisitos de información financiera en procesos de financiamiento.',
      'Socios involucrados, atención a los riesgos relevantes y comunicación cercana con la administración y su gobierno durante el trabajo.',
    ],
    enfoque: {
      humano: 'Socios involucrados desde el inicio.\nTrabajamos cerca de la administración y de su gobierno, con especialistas que entienden el negocio y la importancia de cada asunto.',
      estrategico: 'Rigor enfocado en los riesgos del negocio.\nCombinamos criterio profesional, metodología y apoyo tecnológico para fortalecer la calidad del trabajo y la atención a los riesgos relevantes.',
      claridad: 'Claridad durante todo el proceso.\nComunicamos hallazgos, implicaciones y asuntos pendientes para que tu equipo pueda atenderlos oportunamente.',
    },
    leader: 'Belén Arias',
  },
  {
    id: 'consultoria',
    name: nombre('consultoria'),
    description: 'Especialización financiera, contable y fiscal para resolver lo complejo y avanzar con claridad.',
    details: [
      'Resolvemos asuntos financieros, contables y fiscales que exigen experiencia especializada. Conectamos el análisis técnico con la decisión de negocio para que puedas avanzar en un cierre, un due diligence o una operación compleja.',
    ],
    areas: [
      {
        titulo: 'Financiera',
        texto: 'Entiende cómo se convierte el resultado en caja. Analizamos el flujo de efectivo y conciliamos resultado contable y caja para explicar el desempeño del negocio. Realizamos due diligence financiero para evaluar una operación y sus riesgos.',
      },
      {
        titulo: 'Contable',
        texto: 'Acercamos a tu administración la especialización que necesita en transacciones complejas: IFRS 9, instrumentos derivados, planes de acciones, valuaciones, impuestos diferidos y otros asuntos contables especializados.',
      },
      {
        titulo: 'Fiscal',
        texto: 'Fortalece el perfil de riesgo fiscal de tu empresa. Revisamos criterios y documentación de soporte para identificar y atender riesgos de la operación y de transacciones específicas.',
      },
    ],
    enfoque: {
      humano: 'Entendemos tu operación.\nEscuchamos a tu equipo y hacemos nuestras recomendaciones considerando tus prioridades y la realidad del negocio.',
      estrategico: 'Criterio técnico con visión de negocio.\nConectamos las implicaciones financieras, contables y fiscales de cada alternativa para que puedas decidir con una perspectiva más completa.',
      claridad: 'Hablamos claro.\nTraducimos el análisis técnico en recomendaciones sustentadas, con los riesgos y los siguientes pasos que tu equipo necesita conocer.',
    },
    leader: 'Fernando Vázquez',
  },
  {
    id: 'bps',
    name: nombre('bps'),
    description: 'Contabilidad, cumplimiento e información financiera útil para Dirección y Consejo.',
    lema: 'Contabilidad que cumple y te ayuda a dirigir.',
    details: [
      'Nos integramos con tu equipo para llevar la contabilidad, los cierres, la preparación de estados financieros y el cumplimiento fiscal del alcance acordado.',
      'Conectamos esa información con el desempeño del negocio: explicamos variaciones y preparamos los asuntos relevantes para Dirección y Consejo. Acordamos entregables, calendario e información necesaria para que cada cierre tenga orden y seguimiento.',
    ],
    enfoque: {
      humano: 'Un equipo cercano a tu operación.\nCoordinamos responsabilidades y damos seguimiento a la información para mantener el trabajo en marcha.',
      estrategico: 'Del cierre a la decisión.\nAnalizamos resultados y variaciones para que Dirección y Consejo entiendan el desempeño y enfoquen su atención en lo relevante.',
      claridad: 'Información con contexto.\nPresentamos resultados, pendientes y limitaciones de la información con una explicación útil para decidir.',
    },
    // Sin líder asignado: el campo se omite a propósito.
  },
];

// Servicio complementario: fuera de las pestañas, en un bloque inferior.
const financiamientoData = {
  id: FINANCIAMIENTO.id,
  name: FINANCIAMIENTO.nombre,
  description: 'Preparación financiera y acompañamiento para evaluar alternativas de fondeo.',
  details: [
    'Prepara a tu empresa para una conversación de financiamiento bien sustentada. Te acompañamos a evaluar alternativas y ordenar la información que requieren bancos e inversionistas.',
    'Conectamos las necesidades del negocio con su capacidad financiera y los riesgos que conviene considerar al avanzar.',
  ],
  enfoque: {
    humano: 'Acompañamiento cercano.\nEntendemos lo que tu empresa necesita y te acompañamos a preparar la conversación con bancos e inversionistas.',
    estrategico: 'Información sólida para evaluar alternativas.\nPonemos la capacidad financiera, las necesidades del negocio y los riesgos en una misma perspectiva.',
    claridad: 'Sabes dónde estás y qué sigue.\nHacemos visibles los puntos que requieren atención y las decisiones de cada etapa.',
  },
  leader: 'Arturo Barrios',
};

const enfoqueData = [
  { title: 'HUMANO', icon: FaUsers, key: 'humano', image: '/img/servicios1.png' },
  { title: 'ESTRATÉGICO', icon: FaBullseye, key: 'estrategico', image: '/img/servicios2.png' },
  { title: 'CLARIDAD', icon: FaCheckCircle, key: 'claridad', image: '/img/servicios3.png' },
];

const SERVICIO_INICIAL = servicesData[0].id;

// --- Encabezado, descripción y apartados de un servicio ---
function DetalleServicio({ service }) {
  return (
    <div className="w-full text-left mb-20 space-y-6">
      <h2 className="text-4xl md:text-5xl font-extrabold text-black flex items-center justify-start gap-4">
        <span className="text-black">✓</span> {service.name}
      </h2>
      {service.lema && (
        <p className="text-2xl font-bold text-[#2e527f]">{service.lema}</p>
      )}
      <div className="text-xl text-gray-600 leading-relaxed w-full space-y-4">
        {service.details.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </div>

      {service.areas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {service.areas.map((area) => (
            <div key={area.titulo} className="border-t-4 border-[#25c6e3] pt-5">
              <h3 className="text-2xl font-bold text-[#2e527f] mb-3">{area.titulo}</h3>
              <p className="text-gray-700 leading-relaxed">{area.texto}</p>
            </div>
          ))}
        </div>
      )}

      {service.leader && (
        <div className="pt-2">
          <p className="text-base font-bold text-[#2e527f] tracking-wider">
            Líder: {service.leader}
          </p>
        </div>
      )}
    </div>
  );
}

// --- Sección NUESTRO ENFOQUE ---
function Enfoque({ enfoque }) {
  return (
    <div className="mt-16">
      <div className="text-center mb-16 relative">
        {/* Línea decorativa segmentada */}
        <div className="h-1 w-full max-w-[36rem] mx-auto mb-6 flex rounded-full overflow-hidden">
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
                backgroundImage: fondoWebp(item.image),
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
                {enfoque[item.key]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Componente de Pestañas de Servicios ---
// La pestaña activa vive en el ancla de la URL (/servicios#bps), no en un
// estado aparte: así la carga directa, el refresco y el botón Atrás recuperan la
// selección, y los enlaces del one pager abren el servicio correcto.
function ServicesTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const botones = useRef({});

  const hash = location.hash.replace('#', '');
  const activeTab = servicesData.some((s) => s.id === hash) ? hash : SERVICIO_INICIAL;
  const activeService = servicesData.find((s) => s.id === activeTab);

  // Cambiar de pestaña no desplaza la vista: ScrollToAnchor respeta esta marca.
  const seleccionar = (id) => {
    if (id !== activeTab) navigate({ hash: `#${id}` }, { state: { sinDesplazar: true } });
  };

  // Navegación por teclado del patrón de pestañas: flechas, Inicio y Fin.
  const alPulsarTecla = (e) => {
    const i = servicesData.findIndex((s) => s.id === activeTab);
    const destinos = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: servicesData.length - 1 };
    if (!(e.key in destinos)) return;
    e.preventDefault();
    const siguiente = servicesData[(destinos[e.key] + servicesData.length) % servicesData.length].id;
    seleccionar(siguiente);
    botones.current[siguiente]?.focus();
  };

  return (
    <div id="services-tabs-section" className="bg-white text-gray-900 py-24 sm:py-32">
      {/* Destino del ancla del servicio activo: empieza en las pestañas. */}
      <div id={activeTab} className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Pestañas */}
        <div
          role="tablist"
          aria-label="Servicios"
          className="mb-20 flex flex-wrap justify-center gap-x-4 gap-y-2 border-b border-gray-100 pb-6"
        >
          {servicesData.map((service) => {
            const activa = activeTab === service.id;
            return (
              <button
                key={service.id}
                ref={(el) => (botones.current[service.id] = el)}
                id={`tab-${service.id}`}
                role="tab"
                aria-selected={activa}
                aria-controls={`panel-${service.id}`}
                tabIndex={activa ? 0 : -1}
                onClick={() => seleccionar(service.id)}
                onKeyDown={alPulsarTecla}
                className={`px-6 py-2 text-sm sm:text-base font-bold rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25c6e3] ${
                  activa
                    ? 'bg-[#2e527f] text-white shadow-xl shadow-[#2e527f]/20'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {service.name}
              </button>
            );
          })}
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div
          key={activeService.id}
          id={`panel-${activeService.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeService.id}`}
          className="transition-all duration-500 animate-fade-in"
        >
          <DetalleServicio service={activeService} />
          <Enfoque enfoque={activeService.enfoque} />
        </div>
      </div>
    </div>
  );
}

// --- Financiamiento: bloque complementario inferior ---
// Diseño propio y compacto (una tarjeta, enfoque en lista, sin fotos) para que
// no se lea como una pestaña más del carrusel de servicios principales.
function Financiamiento() {
  const { name, details, leader, enfoque } = financiamientoData;
  return (
    <section id={financiamientoData.id} className="bg-gray-50 text-gray-900 py-20 sm:py-24 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Servicio */}
          <div className="lg:col-span-2 bg-[#2e527f] text-white p-8 lg:p-10 flex flex-col">
            <h2 className="text-3xl font-extrabold leading-tight">{name}</h2>
            <div className="h-1 w-24 mt-5 mb-6 flex rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-black"></div>
              <div className="h-full w-1/3 bg-[#25c6e3]"></div>
              <div className="h-full w-1/3 bg-[#E91E63]"></div>
            </div>
            <div className="text-white/90 leading-relaxed space-y-4 flex-grow">
              {details.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
            <p className="mt-8 text-sm font-bold tracking-wider text-[#25c6e3]">Líder: {leader}</p>
          </div>

          {/* Enfoque en lista: primera línea como subtítulo, el resto como texto */}
          <ul className="lg:col-span-3 p-8 lg:p-10 flex flex-col justify-center gap-8">
            {enfoqueData.map((item) => {
              const [subtitulo, ...texto] = enfoque[item.key].split('\n');
              return (
                <li key={item.key} className="flex gap-5">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2e527f]/10 text-[#2e527f] flex items-center justify-center">
                    <item.icon className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-[0.2em] text-[#25c6e3]">{item.title}</p>
                    <h3 className="mt-1 text-lg font-bold text-[#2e527f]">{subtitulo}</h3>
                    <p className="mt-1 text-gray-700 leading-relaxed">{texto.join(' ')}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function Servicios() {
  return (
    <>
      <Seo
        title="Servicios | Auditoría, consultoría y BPS — E360"
        description="Auditoría, consultoría financiera, contable y fiscal, y BPS. Especialización y agilidad para resolver lo complejo y dar claridad a las decisiones de tu negocio."
        path="/servicios"
      />
      <ServiceHero />
      <div id="servicios">
        <ServicesTabs />
      </div>
      <Financiamiento />
      <GmailFloatingButton />
    </>
  );
}
