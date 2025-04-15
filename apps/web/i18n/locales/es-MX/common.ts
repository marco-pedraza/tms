export default {
  errors: {
    default: 'Ha ocurrido un error',
    notFound: 'No encontrado',
    unexpected: 'Error inesperado',
    invalidId: 'ID inválido',
  },
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    view: 'Ver',
    more: 'Más acciones',
    create: 'Crear',
    update: 'Actualizar',
    backToList: 'Volver a la lista',
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
    name: 'Nombre',
    code: 'Código',
    active: 'Activo',
    status: 'Estado',
    latitude: 'Latitud',
    longitude: 'Longitud',
    slug: 'Slug',
  },
  sections: {
    basicInfo: 'Información Básica',
    systemInfo: 'Información del Sistema',
  },
  crud: {
    create: {
      loading: 'Creando...',
      success: 'Creado correctamente',
      error: 'No se pudo crear',
    },
    update: {
      loading: 'Actualizando...',
      success: 'Actualizado correctamente',
      error: 'No se pudo actualizar',
    },
    delete: {
      loading: 'Eliminando...',
      success: 'Eliminado correctamente',
      error: 'No se pudo eliminar',
      confirm: '¿Estás seguro?',
      description:
        'Esta acción no se puede deshacer. Se eliminará permanentemente el registro y todos los datos asociados.',
    },
  },
  states: {
    loading: 'Cargando...',
  },
} as const;
