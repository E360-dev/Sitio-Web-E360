// src/components/ImpactMetrics.jsx
export default function ImpactMetrics() {
  const metrics = [
    {
      label: 'Activos Auditados',
      value: '$8 mil millones',
      detail: 'en diversas industrias de alto impacto'
    },
    {
      label: 'Mejora en EBITDA',
      value: '+18%',
      detail: 'tras implementación de estrategias E360'
    },
    {
      label: 'Clientes Atendidos',
      value: '+80',
      detail: 'en México y Latinoamérica'
    }
  ]

  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-8 text-[#2e527f]">Nuestro Impacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 shadow-md">
              <div className="text-4xl font-extrabold mb-2">{metric.value}</div>
              <div className="text-[#7fa1c7] font-semibold mb-1">{metric.label}</div>
              <p className="text-sm text-gray-300">{metric.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
