import Seo from '../components/Seo';
import AboutHero from '../components/AboutHero';
import PurposeAndValues from '../components/PurposeAndValues';
import OurTeam from '../components/OurTeam';
import AboutCTA from '../components/AboutCTA';

export default function Nosotros() {
  return (
    <>
      <Seo
        title="Nosotros | Equipo y propósito de E360"
        description="Combinamos la experiencia técnica de firmas internacionales con la agilidad de una boutique estratégica. Conoce a los socios detrás de E360 y el ADN que impulsa nuestras decisiones."
        path="/nosotros"
      />
      <AboutHero />
      <div id="proposito">
        <PurposeAndValues />
      </div>
      <div id="equipo">
        <OurTeam />
      </div>
      <AboutCTA />
    </>
  );
}
