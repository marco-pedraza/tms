export default {
  title: 'Países',
  description:
    'Administra información de países para el Sistema de Inventario de Autobuses',
  actions: {
    create: 'Crear País',
    backToList: 'Volver a países',
  },
  form: {
    title: 'Información del país',
    name: 'Nombre',
    code: 'Código',
    active: 'Activo',
    status: 'Estado',
    placeholders: {
      name: 'Ej: México',
      code: 'Ej: MX',
    },
    codeHelp: 'Usa el código ISO 3166-1 alpha-2 (2 letras)',
  },
  details: {
    description: 'Detalles del país',
    basicInfo: 'Información Básica',
    systemInfo: 'Información del Sistema',
  },
  errors: {
    notFound: {
      title: 'País no encontrado',
      description:
        'No pudimos encontrar el país que buscas. Es posible que haya sido eliminado o que no exista.',
    },
  },
  messages: {
    create: {
      loading: 'Creando país...',
      success: 'País creado correctamente',
      error: 'No pudimos crear el país',
    },
    update: {
      loading: 'Actualizando país...',
      success: 'País actualizado correctamente',
      error: 'No pudimos actualizar el país',
    },
    delete: {
      loading: 'Eliminando país...',
      success: 'País eliminado correctamente',
      error: 'No pudimos eliminar el país',
      confirm: '¿Estás seguro?',
      description:
        'Esta acción no se puede deshacer. Se eliminará permanentemente el país y todos los datos asociados.',
    },
  },
} as const;
