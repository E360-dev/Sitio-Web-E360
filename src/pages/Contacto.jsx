import Seo from '../components/Seo';
import LeadForm from '../components/LeadForm';

export default function Contacto() {
  return (
    <main className="pt-20">
      <Seo
        title="Contacto | E360"
        description="Cuéntanos tu reto financiero y te respondemos con una propuesta clara. Consultoría, auditoría y financiamiento para empresas en México."
        path="/contacto"
      />
      <LeadForm />
    </main>
  );
}
