NATURA VIDA V8.2.8 — SUBIDA

1. Conserva un respaldo de la versión publicada.
2. Sustituye el contenido del repositorio por los 99 archivos de este paquete.
3. Confirma que GitHub Actions finalice sin errores.
4. Verifica que app-version.json indique 8.2.8.
5. En Supabase abre Edge Functions → nv-ai-assistant → Code.
6. Sustituye el código por supabase/functions/nv-ai-assistant/index.ts y pulsa Deploy.
7. No ejecutes una migración SQL nueva para esta versión.
8. Actualiza la PWA y confirma V8.2.8.
9. Prueba: “Hazme un recibo por tres aceites de 200 ml, uno de 100 ml y dos de 500 ml para Alexia Bio Mujer”.
10. Debe abrirse una revisión con cliente, productos, cantidades, tipo de venta y forma de pago editable.
11. En Más verifica el contraste de todas las fichas.
12. En Control administrativo abre Saneamiento funcional y vuelve a comprobar.
