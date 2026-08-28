import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';

// Botón de la barra de herramientas. Se marca cuando el formato está activo
// en la selección, para que el autor sepa siempre en qué estado está.
const Boton = ({ activo, onClick, titulo, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()} // no perder la selección del texto
    onClick={onClick}
    title={titulo}
    className={`px-3 py-1.5 text-sm rounded-md transition-colors border ${
      activo
        ? 'bg-[#2e527f] text-white border-[#2e527f] font-bold'
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    }`}
  >
    {children}
  </button>
);

const Separador = () => <span className="w-px h-6 bg-gray-200 mx-1" />;

/**
 * Editor visual de artículos. Devuelve HTML por onChange.
 *
 * El HTML que produce se sanea antes de guardarse (ver GestionArticulos), no
 * aquí: este componente solo se ocupa de la edición.
 */
export default function EditorArticulo({ contenido, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // el h1 lo pone la página con el título
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
    ],
    content: contenido || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-e360 min-h-[420px] max-w-none px-6 py-5 focus:outline-none',
      },
    },
  });

  // Cargar contenido cuando llega de forma asíncrona (al abrir un artículo
  // existente). Sin la comparación se reiniciaría el cursor en cada tecla.
  useEffect(() => {
    if (editor && contenido !== undefined && contenido !== editor.getHTML()) {
      editor.commands.setContent(contenido || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, contenido]);

  if (!editor) return null;

  const ponerEnlace = () => {
    const previo = editor.getAttributes('link').href;
    const url = window.prompt('Dirección del enlace:', previo || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ponerImagen = () => {
    const url = window.prompt('Dirección de la imagen:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <Boton
          activo={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          titulo="Negrita"
        >
          <strong>N</strong>
        </Boton>
        <Boton
          activo={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          titulo="Cursiva"
        >
          <em>C</em>
        </Boton>

        <Separador />

        <Boton
          activo={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          titulo="Título de sección"
        >
          Título
        </Boton>
        <Boton
          activo={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          titulo="Subtítulo"
        >
          Subtítulo
        </Boton>

        <Separador />

        <Boton
          activo={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          titulo="Lista con viñetas"
        >
          Lista
        </Boton>
        <Boton
          activo={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          titulo="Lista numerada"
        >
          Numerada
        </Boton>
        <Boton
          activo={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          titulo="Cita destacada"
        >
          Cita
        </Boton>

        <Separador />

        <Boton activo={editor.isActive('link')} onClick={ponerEnlace} titulo="Insertar enlace">
          Enlace
        </Boton>
        <Boton activo={false} onClick={ponerImagen} titulo="Insertar imagen por dirección">
          Imagen
        </Boton>

        <div className="flex-1" />

        <Boton
          activo={false}
          onClick={() => editor.chain().focus().undo().run()}
          titulo="Deshacer"
        >
          ↶
        </Boton>
        <Boton
          activo={false}
          onClick={() => editor.chain().focus().redo().run()}
          titulo="Rehacer"
        >
          ↷
        </Boton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
