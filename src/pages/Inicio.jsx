import React from 'react';
import Seo from '../components/Seo';
import HeroBanner from '../components/HeroBanner';
import KeyDifferentiators from '../components/KeyDifferentiators';
import E360Comunica from '../components/E360Comunica';
import ImpactMetrics from '../components/ImpactMetrics';
import MapaPresencia from '../components/MapaPresencia';
import CallToAction from '../components/CallToAction';

function Inicio() {
  return (
    <>
      <Seo
        title="E360 | Consultoría financiera, auditoría y financiamiento"
        description="Boutique estratégica con ADN Big Four y cercanía humana. Convertimos la complejidad financiera en decisiones claras: consultoría e impuestos, auditoría y estructuración de financiamiento."
        path="/"
      />
      <HeroBanner />
      <CallToAction />
      <KeyDifferentiators />
      <E360Comunica />
      <MapaPresencia />
      <ImpactMetrics />
    </>
  );
}

export default Inicio;
