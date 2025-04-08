export default {
  errors: {
    default: 'Ha ocurrido un error',
    notFound: 'No encontrado',
    unexpected: 'Error inesperado',
  },
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    more: 'Más acciones',
  },
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
  },
  fields: {
    id: 'ID',
    createdAt: 'Creado',
    updatedAt: 'Última Actualización',
    actions: 'Acciones',
  },
  states: {
    loading: 'Cargando...',
  },
} as const;
