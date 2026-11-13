"""Genera siete documentos de consulta desde el contenido público. Requiere reportlab.

Uso: python scripts/generar-pdf-gobierno.py
No descarga fuentes internas ni publica archivos. El control editorial vive en docs.
"""
import hashlib
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

RAIZ = Path(__file__).resolve().parent.parent
fuente = RAIZ / 'src/datos/gobierno.json'
datos = json.loads(fuente.read_text(encoding='utf-8'))
fecha = datos['fechaEdicion']
meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
anio, mes, dia = map(int, fecha.split('-'))
fecha_texto = f'{dia} de {meses[mes - 1]} de {anio}'
azul = colors.HexColor('#1e3a5f')
gris = colors.HexColor('#475569')
estilos = {
    'titulo': ParagraphStyle('Titulo', fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=azul, spaceAfter=14),
    'intro': ParagraphStyle('Intro', fontName='Helvetica', fontSize=11, leading=16, textColor=gris, spaceAfter=16),
    'h2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=azul, spaceBefore=13, spaceAfter=7, keepWithNext=True),
    'texto': ParagraphStyle('Texto', fontName='Helvetica', fontSize=10, leading=15, textColor=gris, spaceAfter=9, alignment=TA_LEFT),
    'meta': ParagraphStyle('Meta', fontName='Helvetica', fontSize=8, leading=12, textColor=gris, spaceAfter=12),
}

def encabezado_pie(canvas, doc):
    canvas.saveState()
    ancho, alto = doc.pagesize
    canvas.setFillColor(azul)
    canvas.setFont('Helvetica-Bold', 11)
    canvas.drawString(22 * mm, alto - 17 * mm, 'E360')
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(ancho - 22 * mm, alto - 17 * mm, 'GOBIERNO DE LA FIRMA')
    canvas.setStrokeColor(colors.HexColor('#cbd5e1'))
    canvas.line(22 * mm, alto - 21 * mm, ancho - 22 * mm, alto - 21 * mm)
    canvas.line(22 * mm, 19 * mm, ancho - 22 * mm, 19 * mm)
    canvas.setFillColor(gris)
    canvas.setFont('Helvetica', 7)
    canvas.drawString(22 * mm, 14 * mm, f'Versión {datos["version"]} - Fecha de edición: {fecha}')
    canvas.drawRightString(ancho - 22 * mm, 14 * mm, f'Página {doc.page}')
    canvas.restoreState()

registros = []
for politica in datos['politicas']:
    destino = RAIZ / 'public' / politica['documento']['ruta'].lstrip('/')
    destino.parent.mkdir(parents=True, exist_ok=True)
    documento = SimpleDocTemplate(str(destino), pagesize=(210 * mm, 297 * mm), leftMargin=22 * mm, rightMargin=22 * mm,
                                 topMargin=30 * mm, bottomMargin=26 * mm, title=politica['titulo'] + ' | E360',
                                 author='E360', subject='Documento de consulta derivado del Manual institucional v1.2.', invariant=1)
    contenido = [Paragraph(escape(politica['titulo']), estilos['titulo']),
                 Paragraph(f'Versión {datos["version"]}<br/>Fecha de edición: {fecha_texto}.', estilos['meta']),
                 Paragraph(escape(politica['introduccion']), estilos['intro'])]
    for apartado in politica['apartados']:
        contenido.append(Paragraph(escape(apartado['titulo']), estilos['h2']))
        for parrafo in apartado['parrafos']:
            contenido.append(Paragraph(escape(parrafo), estilos['texto']))
    contenido.extend([Spacer(1, 10), Paragraph(escape('Fuente: ' + datos['fuente'] + '.'), estilos['meta'])])
    documento.build(contenido, onFirstPage=encabezado_pie, onLaterPages=encabezado_pie)
    registros.append({'tema': politica['slug'], 'archivo': politica['documento']['ruta'], 'version': datos['version'],
                      'fechaEdicion': fecha, 'sha256': hashlib.sha256(destino.read_bytes()).hexdigest()})
    print(destino.relative_to(RAIZ))
manifest = {'fuente': datos['fuente'], 'contenidoSha256': hashlib.sha256(fuente.read_bytes()).hexdigest(), 'documentos': registros}
(RAIZ / 'docs/gobierno-versiones.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
