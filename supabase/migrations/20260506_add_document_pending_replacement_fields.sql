alter table public.documentos
add column if not exists ruta_storage_pdf_pendiente text,
add column if not exists hash_documento_pendiente text;
