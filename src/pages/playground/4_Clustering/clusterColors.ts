/** Un color por grupo (los mismos en todas las gráficas y tablas del agrupamiento) */
export const CLUSTER_COLORS = ['#0d6efd', '#fd7e14', '#198754', '#d63384', '#6f42c1', '#20c997', '#dc3545', '#ffc107', '#0dcaf0', '#6c757d']

export const clusterColor = (cluster: number) => CLUSTER_COLORS[cluster % CLUSTER_COLORS.length]
