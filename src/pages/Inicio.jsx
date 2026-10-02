import React from 'react';
import Seo from '../components/Seo';
import HeroBanner from '../components/HeroBanner';
import KeyDifferentiators from '../components/KeyDifferentiators';
import AccesosServicios from '../components/AccesosServicios';
import TecnologiaCriterio from '../components/TecnologiaCriterio';
import E360Comunica from '../components/E360Comunica';
import ImpactMetrics from '../components/ImpactMetrics';
import MapaPresencia from '../components/MapaPresencia';
import CallToAction from '../components/CallToAction';

function Inicio() {
  return (
    <>
      <Seo
        title="E360 | Auditoría, consultoría y outsourcing contable"
        description="Auditoría, consultoría y BPS para empresas. ADN Big Four, cercanía humana y tecnología con criterio profesional para elevar la calidad y atender riesgos."
        path="/"
      />
      <HeroBanner />
      <CallToAction />
      <KeyDifferentiators />
      <AccesosServicios />
      <TecnologiaCriterio />
      <E360Comunica />
      <MapaPresencia />
      <ImpactMetrics />
    </>
  );
}

export default Inicio;
