import { FaFileAlt, FaBookOpen, FaChartBar, FaBriefcase } from 'react-icons/fa';

const learningAreas = [
  {
    type: 'Análisis Estratégico',
    title: 'Dominio de Indicadores Clave para la Salud Financiera',
    link: '#',
    icon: <FaChartBar />,
  },
  {
    type: 'Control y Cumplimiento',
    title: 'Implementación de Sistemas de Control Interno Eficaces',
    link: '#',
    icon: <FaBookOpen />,
  },
  {
    type: 'Optimización Fiscal',
    title: 'Estrategias Fiscales para el Crecimiento Empresarial',
    link: '#',
    icon: <FaBriefcase />,
  },
  {
    type: 'Tecnología Financiera',
    title: 'Tendencias de Inversión y Automatización en el Sector Tech',
    link: '#',
    icon: <FaFileAlt />,
  },
];

export default function ResourceLibrary() {
  return (
    <section id="recursos" className="bg-gray-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold sm:text-5xl text-white">
            Lo que Aprenderás con Nosotros
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
            Estas son algunas de las áreas de dominio que desarrollarás como parte de nuestro equipo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {learningAreas.map((resource, i) => (
            <a
              key={i}
              href={resource.link}
              className="bg-gray-800 p-8 rounded-xl shadow-lg flex items-start space-x-6 transition-all duration-300 hover:bg-gray-700 hover:shadow-2xl transform hover:-translate-y-2"
            >
              <div className="text-3xl text-[#7fa1c7] mt-1">
                {resource.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#7fa1c7] uppercase mb-2">{resource.type}</p>
                <h3 className="text-xl font-bold text-white">
                  {resource.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
