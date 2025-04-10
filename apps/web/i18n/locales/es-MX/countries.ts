export default {
  title: 'Países',
  description:
    'Administra información de países para el Sistema de Inventario de Autobuses',
  actions: {
    create: 'Crear País',
    update: 'Actualizar País',
    backToList: 'Volver a países',
  },
  form: {
    title: 'Información del país',
    placeholders: {
      name: 'Ej: México',
      code: 'Ej: MX',
    },
    codeHelp: 'Usa el código ISO 3166-1 alpha-2 (2 letras)',
  },
  details: {
    description: 'Detalles del país',
  },
  edit: {
    title: 'Editar País',
    description: 'Actualiza la información del país',
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
    },
  },
} as const;
