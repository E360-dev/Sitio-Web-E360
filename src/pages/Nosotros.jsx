import AboutHero from '../components/AboutHero';
import PurposeAndValues from '../components/PurposeAndValues';
import OurTeam from '../components/OurTeam';
import AboutCTA from '../components/AboutCTA';

export default function Nosotros() {
  return (
    <>
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
