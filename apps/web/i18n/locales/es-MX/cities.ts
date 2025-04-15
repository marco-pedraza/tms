export default {
  title: 'Ciudades',
  description:
    'Administra información de ciudades para el Sistema de Inventario de Autobuses',
  actions: {
    create: 'Crear Ciudad',
    update: 'Actualizar Ciudad',
    backToList: 'Volver a ciudades',
  },
  fields: {
    state: 'Estado',
    timezone: 'Zona Horaria',
    coordinates: 'Coordenadas',
    latitude: 'Latitud',
    longitude: 'Longitud',
  },
  form: {
    title: 'Información de la ciudad',
    placeholders: {
      name: 'Ej: Guadalajara',
      code: 'Ej: GDL',
      state: 'Selecciona un estado',
      timezone: 'Ej: America/Mexico_City',
    },
    codeHelp: 'Usa un código de 2-5 letras para identificar la ciudad',
    timezoneHelp: 'Usa el formato IANA (Ej: America/Mexico_City)',
    state: 'Estado',
    timezone: 'Zona Horaria',
  },
  details: {
    description: 'Detalles de la ciudad',
  },
  new: {
    title: 'Crear Ciudad',
    description: 'Agrega una nueva ciudad al sistema',
  },
  edit: {
    title: 'Editar Ciudad',
    description: 'Actualiza la información de la ciudad',
  },
  errors: {
    notFound: {
      title: 'Ciudad no encontrada',
      description:
        'No pudimos encontrar la ciudad que buscas. Es posible que haya sido eliminada o que no exista.',
    },
  },
  messages: {
    create: {
      loading: 'Creando ciudad...',
      success: 'Ciudad creada correctamente',
      error: 'No pudimos crear la ciudad',
    },
    update: {
      loading: 'Actualizando ciudad...',
      success: 'Ciudad actualizada correctamente',
      error: 'No pudimos actualizar la ciudad',
    },
    delete: {
      loading: 'Eliminando ciudad...',
      success: 'Ciudad eliminada correctamente',
      error: 'No pudimos eliminar la ciudad',
    },
  },
} as const;
