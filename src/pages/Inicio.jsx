import React from 'react';
import HeroBanner from '../components/HeroBanner';
import KeyDifferentiators from '../components/KeyDifferentiators';
import ImpactMetrics from '../components/ImpactMetrics';
import MapaPresencia from '../components/MapaPresencia';
import CallToAction from '../components/CallToAction';

function Inicio() {
  return (
    <>
      <HeroBanner />
      <CallToAction />
      <KeyDifferentiators />
      <MapaPresencia />
      <ImpactMetrics />
    </>
  );
}

export default Inicio;
