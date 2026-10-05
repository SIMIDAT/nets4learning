// Las tareas en las que la aplicación ya sabe usar un paquete .n4l (tiene su motor). Las demás todavía usan sus clases
// de TypeScript: un paquete con solo esas tareas no se puede abrir.
export const N4L_SUPPORTED_TASKS: string[] = ['tabular-classification', 'regression', 'image-classification']
