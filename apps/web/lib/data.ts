// Country type
export interface Country {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample countries data - Latin American countries only
export const countries: Country[] = [
  {
    id: "1",
    name: "México",
    code: "MX",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Argentina",
    code: "AR",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Brasil",
    code: "BR",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Chile",
    code: "CL",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Colombia",
    code: "CO",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Perú",
    code: "PE",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Ecuador",
    code: "EC",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Bolivia",
    code: "BO",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "9",
    name: "Paraguay",
    code: "PY",
    active: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "10",
    name: "Uruguay",
    code: "UY",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "11",
    name: "Venezuela",
    code: "VE",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "12",
    name: "Costa Rica",
    code: "CR",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "13",
    name: "Panamá",
    code: "PA",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "14",
    name: "Guatemala",
    code: "GT",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "15",
    name: "Honduras",
    code: "HN",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// State type
export interface State {
  id: string;
  name: string;
  code: string;
  country_id: string;
  country_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample states data - Mexican states only
export const states: State[] = [
  {
    id: "1",
    name: "Jalisco",
    code: "JAL",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Ciudad de México",
    code: "CDMX",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Nuevo León",
    code: "NL",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Guanajuato",
    code: "GTO",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Puebla",
    code: "PUE",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Querétaro",
    code: "QRO",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Veracruz",
    code: "VER",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Chihuahua",
    code: "CHIH",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "9",
    name: "Baja California",
    code: "BC",
    country_id: "1",
    country_name: "México",
    active: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "10",
    name: "Yucatán",
    code: "YUC",
    country_id: "1",
    country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// City type
export interface City {
  id: string;
  name: string;
  state_id: string;
  state_name: string;
  country_id: string;
  country_name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  active: boolean;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Sample cities data - Mexican cities only
export const cities: City[] = [
  {
    id: "1",
    name: "Guadalajara",
    state_id: "1",
    state_name: "Jalisco",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 20.6597,
      longitude: -103.3496,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "guadalajara",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Ciudad de México",
    state_id: "2",
    state_name: "Ciudad de México",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 19.4326,
      longitude: -99.1332,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "ciudad-de-mexico",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Monterrey",
    state_id: "3",
    state_name: "Nuevo León",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 25.6866,
      longitude: -100.3161,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "monterrey",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "León",
    state_id: "4",
    state_name: "Guanajuato",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 21.1167,
      longitude: -101.6833,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "leon",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Puebla",
    state_id: "5",
    state_name: "Puebla",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 19.0414,
      longitude: -98.2063,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "puebla",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Querétaro",
    state_id: "6",
    state_name: "Querétaro",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 20.5881,
      longitude: -100.3899,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "queretaro",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Veracruz",
    state_id: "7",
    state_name: "Veracruz",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 19.1738,
      longitude: -96.1342,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "veracruz",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Ciudad Juárez",
    state_id: "8",
    state_name: "Chihuahua",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 31.6904,
      longitude: -106.4245,
    },
    timezone: "America/Chihuahua",
    active: true,
    slug: "ciudad-juarez",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "9",
    name: "Tijuana",
    state_id: "9",
    state_name: "Baja California",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 32.5149,
      longitude: -117.0382,
    },
    timezone: "America/Tijuana",
    active: true,
    slug: "tijuana",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "10",
    name: "Mérida",
    state_id: "10",
    state_name: "Yucatán",
    country_id: "1",
    country_name: "México",
    coordinates: {
      latitude: 20.9674,
      longitude: -89.5926,
    },
    timezone: "America/Mexico_City",
    active: true,
    slug: "merida",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Terminal type
export interface Terminal {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  contactphone: string;
  operating_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  facilities: string[];
  code: string;
  slug: string;
  city_id: string;
  city_name: string;
  state_id: string;
  state_name: string;
  country_id: string;
  country_name: string;
  created_at: string;
  updated_at: string;
}

// Sample terminals data - Mexican terminals only
export const terminals: Terminal[] = [
  {
    id: "1",
    name: "Terminal Central de Autobuses del Norte",
    address: "Av. Lázaro Cárdenas 4367, Tlalnepantla, 54030 Ciudad de México",
    coordinates: {
      latitude: 19.4953,
      longitude: -99.1387,
    },
    contactphone: "+52-55-5587-1552",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "TCAN",
    slug: "terminal-central-autobuses-norte",
    city_id: "2",
    city_name: "Ciudad de México",
    state_id: "2",
    state_name: "Ciudad de México",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Terminal de Autobuses de Pasajeros de Oriente (TAPO)",
    address: "Calz. Ignacio Zaragoza 200, 15210 Ciudad de México",
    coordinates: {
      latitude: 19.4295,
      longitude: -99.1126,
    },
    contactphone: "+52-55-5133-5133",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
      "Tiendas",
    ],
    code: "TAPO",
    slug: "terminal-autobuses-pasajeros-oriente",
    city_id: "2",
    city_name: "Ciudad de México",
    state_id: "2",
    state_name: "Ciudad de México",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Central de Autobuses de Guadalajara",
    address: "Av. Niños Héroes 1320, Moderna, 44190 Guadalajara, Jal.",
    coordinates: {
      latitude: 20.6597,
      longitude: -103.3496,
    },
    contactphone: "+52-33-3668-1100",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "GDLC",
    slug: "central-autobuses-guadalajara",
    city_id: "1",
    city_name: "Guadalajara",
    state_id: "1",
    state_name: "Jalisco",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Central de Autobuses de Monterrey",
    address: "Av. Cristóbal Colón 855, Centro, 64000 Monterrey, N.L.",
    coordinates: {
      latitude: 25.6866,
      longitude: -100.3161,
    },
    contactphone: "+52-81-8342-0286",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "MTYA",
    slug: "central-autobuses-monterrey",
    city_id: "3",
    city_name: "Monterrey",
    state_id: "3",
    state_name: "Nuevo León",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Central de Autobuses de Puebla (CAPU)",
    address: "Blvd. Carmen Serdán 22, Amor, 72140 Puebla, Pue.",
    coordinates: {
      latitude: 19.0695,
      longitude: -98.2005,
    },
    contactphone: "+52-222-369-0900",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "CAPU",
    slug: "central-autobuses-puebla",
    city_id: "5",
    city_name: "Puebla",
    state_id: "5",
    state_name: "Puebla",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Terminal de Autobuses de Querétaro",
    address:
      "Av. Constituyentes 166, El Marqués, 76047 Santiago de Querétaro, Qro.",
    coordinates: {
      latitude: 20.5881,
      longitude: -100.3899,
    },
    contactphone: "+52-442-223-5200",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "QROA",
    slug: "terminal-autobuses-queretaro",
    city_id: "6",
    city_name: "Querétaro",
    state_id: "6",
    state_name: "Querétaro",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Central de Autobuses de Veracruz",
    address: "Blvd. Manuel Ávila Camacho s/n, Centro, 91700 Veracruz, Ver.",
    coordinates: {
      latitude: 19.1738,
      longitude: -96.1342,
    },
    contactphone: "+52-229-932-2700",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "VERA",
    slug: "central-autobuses-veracruz",
    city_id: "7",
    city_name: "Veracruz",
    state_id: "7",
    state_name: "Veracruz",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Central de Autobuses de Mérida",
    address: "Calle 70 555, Centro, 97000 Mérida, Yuc.",
    coordinates: {
      latitude: 20.9674,
      longitude: -89.5926,
    },
    contactphone: "+52-999-924-8596",
    operating_hours: {
      monday: "24 horas",
      tuesday: "24 horas",
      wednesday: "24 horas",
      thursday: "24 horas",
      friday: "24 horas",
      saturday: "24 horas",
      sunday: "24 horas",
    },
    facilities: [
      "Sala de Espera",
      "Baños",
      "Restaurantes",
      "Taquillas",
      "Almacenamiento de Equipaje",
      "WiFi",
    ],
    code: "MIDA",
    slug: "central-autobuses-merida",
    city_id: "10",
    city_name: "Mérida",
    state_id: "10",
    state_name: "Yucatán",
    country_id: "1",
    country_name: "México",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Transporter type (Grupo de transporte)
export interface Transporter {
  id: string;
  name: string;
  code: string;
  description: string;
  logo_url: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  headquarters_city_id: string;
  headquarters_city_name: string;
  headquarters_state_id: string;
  headquarters_state_name: string;
  headquarters_country_id: string;
  headquarters_country_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample transporters data
export const transporters: Transporter[] = [
  {
    id: "1",
    name: "Grupo ADO",
    code: "ADO",
    description:
      "Grupo ADO es una de las empresas de autotransporte más grandes de México, con más de 80 años de experiencia.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.ado.com.mx",
    contact_email: "contacto@ado.com.mx",
    contact_phone: "+52-55-5133-5133",
    headquarters_city_id: "2",
    headquarters_city_name: "Ciudad de México",
    headquarters_state_id: "2",
    headquarters_state_name: "Ciudad de México",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "ETN Turistar",
    code: "ETN",
    description:
      "ETN Turistar es una línea de autobuses de lujo que opera en México, conocida por su servicio de alta calidad.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.etn.com.mx",
    contact_email: "contacto@etn.com.mx",
    contact_phone: "+52-55-5588-5588",
    headquarters_city_id: "2",
    headquarters_city_name: "Ciudad de México",
    headquarters_state_id: "2",
    headquarters_state_name: "Ciudad de México",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Primera Plus",
    code: "PLUS",
    description:
      "Primera Plus es una línea de autobuses que opera principalmente en el centro de México.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.primeraplus.com.mx",
    contact_email: "contacto@primeraplus.com.mx",
    contact_phone: "+52-47-7716-0060",
    headquarters_city_id: "4",
    headquarters_city_name: "León",
    headquarters_state_id: "4",
    headquarters_state_name: "Guanajuato",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Estrella Blanca",
    code: "ESTB",
    description:
      "Grupo Estrella Blanca es uno de los consorcios de autotransporte más grandes de México.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.estrellablanca.com.mx",
    contact_email: "contacto@estrellablanca.com.mx",
    contact_phone: "+52-55-5729-0807",
    headquarters_city_id: "2",
    headquarters_city_name: "Ciudad de México",
    headquarters_state_id: "2",
    headquarters_state_name: "Ciudad de México",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Omnibus de México",
    code: "ODM",
    description:
      "Omnibus de México es una de las empresas de autotransporte más antiguas del país.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.odm.com.mx",
    contact_email: "contacto@odm.com.mx",
    contact_phone: "+52-55-5141-4300",
    headquarters_city_id: "2",
    headquarters_city_name: "Ciudad de México",
    headquarters_state_id: "2",
    headquarters_state_name: "Ciudad de México",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Autovías",
    code: "AUTV",
    description:
      "Autovías es una línea de autobuses que opera principalmente en el centro y occidente de México.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.autovias.com.mx",
    contact_email: "contacto@autovias.com.mx",
    contact_phone: "+52-47-7716-0060",
    headquarters_city_id: "4",
    headquarters_city_name: "León",
    headquarters_state_id: "4",
    headquarters_state_name: "Guanajuato",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Transportes del Norte",
    code: "TDN",
    description:
      "Transportes del Norte es una línea de autobuses que opera principalmente en el norte de México.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.tdn.com.mx",
    contact_email: "contacto@tdn.com.mx",
    contact_phone: "+52-81-8342-0286",
    headquarters_city_id: "3",
    headquarters_city_name: "Monterrey",
    headquarters_state_id: "3",
    headquarters_state_name: "Nuevo León",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Futura",
    code: "FUTR",
    description:
      "Futura es una línea de autobuses de lujo que opera en México.",
    logo_url: "/placeholder.svg?height=100&width=200",
    website: "https://www.futura.com.mx",
    contact_email: "contacto@futura.com.mx",
    contact_phone: "+52-55-5729-0807",
    headquarters_city_id: "2",
    headquarters_city_name: "Ciudad de México",
    headquarters_state_id: "2",
    headquarters_state_name: "Ciudad de México",
    headquarters_country_id: "1",
    headquarters_country_name: "México",
    active: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Bus Line type (Línea de autobus)
export interface BusLine {
  id: string;
  name: string;
  code: string;
  description: string;
  transporter_id: string;
  transporter_name: string;
  service_type: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample bus lines data
export const busLines: BusLine[] = [
  {
    id: "1",
    name: "ADO GL",
    code: "ADOGL",
    description:
      "Servicio de lujo de Grupo ADO con asientos reclinables, WiFi y entretenimiento a bordo.",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    service_type: "Lujo",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#d81e05",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "ADO Platino",
    code: "ADOPL",
    description:
      "Servicio premium de Grupo ADO con asientos tipo cama, WiFi, entretenimiento a bordo y servicios exclusivos.",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    service_type: "Premium",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#000000",
    secondary_color: "#d4af37",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "ADO",
    code: "ADO",
    description:
      "Servicio estándar de Grupo ADO con asientos cómodos y aire acondicionado.",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    service_type: "Estándar",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#d81e05",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "ETN",
    code: "ETN",
    description:
      "Servicio de lujo con asientos tipo cama, WiFi y entretenimiento a bordo.",
    transporter_id: "2",
    transporter_name: "ETN Turistar",
    service_type: "Lujo",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#003366",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Turistar Lujo",
    code: "TURLJ",
    description:
      "Servicio de lujo con asientos reclinables, WiFi y entretenimiento a bordo.",
    transporter_id: "2",
    transporter_name: "ETN Turistar",
    service_type: "Lujo",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#003366",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "6",
    name: "Primera Plus",
    code: "PLUS",
    description:
      "Servicio de primera clase con asientos cómodos, WiFi y aire acondicionado.",
    transporter_id: "3",
    transporter_name: "Primera Plus",
    service_type: "Primera Clase",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#009933",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "7",
    name: "Estrella Blanca",
    code: "ESTB",
    description: "Servicio estándar con asientos cómodos y aire acondicionado.",
    transporter_id: "4",
    transporter_name: "Estrella Blanca",
    service_type: "Estándar",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#0066cc",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "8",
    name: "Estrella de Oro",
    code: "ESTO",
    description:
      "Servicio de primera clase con asientos cómodos, WiFi y aire acondicionado.",
    transporter_id: "4",
    transporter_name: "Estrella Blanca",
    service_type: "Primera Clase",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#ffcc00",
    secondary_color: "#000000",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "9",
    name: "Omnibus de México",
    code: "ODM",
    description: "Servicio estándar con asientos cómodos y aire acondicionado.",
    transporter_id: "5",
    transporter_name: "Omnibus de México",
    service_type: "Estándar",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#cc0000",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "10",
    name: "Autovías",
    code: "AUTV",
    description:
      "Servicio de primera clase con asientos cómodos, WiFi y aire acondicionado.",
    transporter_id: "6",
    transporter_name: "Autovías",
    service_type: "Primera Clase",
    logo_url: "/placeholder.svg?height=100&width=200",
    primary_color: "#ff6600",
    secondary_color: "#ffffff",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// RouteStop type (Parada de ruta)
export interface RouteStop {
  id: string;
  order: number;
  city_id: string;
  city_name: string;
  terminal_id: string;
  terminal_name: string;
  distance: number;
  base_time: number;
  buyable: boolean;
  created_at: string;
  updated_at: string;
}

// Route type (Ruta)
export interface Route {
  id: string;
  code: string;
  origin_city_id: string;
  origin_city_name: string;
  origin_terminal_id: string;
  origin_terminal_name: string;
  destination_city_id: string;
  destination_city_name: string;
  destination_terminal_id: string;
  destination_terminal_name: string;
  transporter_id: string;
  transporter_name: string;
  bus_line_id: string;
  bus_line_name: string;
  distance: number;
  base_time: number;
  default_service_type: string;
  popular: boolean;
  active: boolean;
  buyable: boolean;
  stops: RouteStop[];
  created_at: string;
  updated_at: string;
}

// Sample routes data
export const routes: Route[] = [
  {
    id: "R001",
    code: "CDMX-GDL",
    origin_city_id: "2",
    origin_city_name: "Ciudad de México",
    origin_terminal_id: "1",
    origin_terminal_name: "Terminal Central de Autobuses del Norte",
    destination_city_id: "1",
    destination_city_name: "Guadalajara",
    destination_terminal_id: "3",
    destination_terminal_name: "Central de Autobuses de Guadalajara",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "1",
    bus_line_name: "ADO GL",
    distance: 540.2,
    base_time: 390, // 6h 30m en minutos
    default_service_type: "Lujo",
    popular: true,
    active: true,
    buyable: true,
    stops: [
      {
        id: "S001",
        order: 1,
        city_id: "6",
        city_name: "Querétaro",
        terminal_id: "6",
        terminal_name: "Terminal de Autobuses de Querétaro",
        distance: 220.8,
        base_time: 180,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
      {
        id: "S002",
        order: 2,
        city_id: "4",
        city_name: "León",
        terminal_id: "6",
        terminal_name: "Central de Autobuses de León",
        distance: 160.5,
        base_time: 120,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R002",
    code: "CDMX-MTY",
    origin_city_id: "2",
    origin_city_name: "Ciudad de México",
    origin_terminal_id: "1",
    origin_terminal_name: "Terminal Central de Autobuses del Norte",
    destination_city_id: "3",
    destination_city_name: "Monterrey",
    destination_terminal_id: "4",
    destination_terminal_name: "Central de Autobuses de Monterrey",
    transporter_id: "2",
    transporter_name: "ETN Turistar",
    bus_line_id: "4",
    bus_line_name: "ETN",
    distance: 900.5,
    base_time: 660, // 11h en minutos
    default_service_type: "Lujo",
    popular: true,
    active: true,
    buyable: true,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R003",
    code: "GDL-CDMX",
    origin_city_id: "1",
    origin_city_name: "Guadalajara",
    origin_terminal_id: "3",
    origin_terminal_name: "Central de Autobuses de Guadalajara",
    destination_city_id: "2",
    destination_city_name: "Ciudad de México",
    destination_terminal_id: "1",
    destination_terminal_name: "Terminal Central de Autobuses del Norte",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "1",
    bus_line_name: "ADO GL",
    distance: 540.2,
    base_time: 390, // 6h 30m en minutos
    default_service_type: "Lujo",
    popular: true,
    active: true,
    buyable: true,
    stops: [
      {
        id: "S003",
        order: 1,
        city_id: "4",
        city_name: "León",
        terminal_id: "6",
        terminal_name: "Central de Autobuses de León",
        distance: 220.5,
        base_time: 150,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
      {
        id: "S004",
        order: 2,
        city_id: "6",
        city_name: "Querétaro",
        terminal_id: "6",
        terminal_name: "Terminal de Autobuses de Querétaro",
        distance: 160.8,
        base_time: 120,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R004",
    code: "CDMX-PUE",
    origin_city_id: "2",
    origin_city_name: "Ciudad de México",
    origin_terminal_id: "2",
    origin_terminal_name:
      "Terminal de Autobuses de Pasajeros de Oriente (TAPO)",
    destination_city_id: "5",
    destination_city_name: "Puebla",
    destination_terminal_id: "5",
    destination_terminal_name: "Central de Autobuses de Puebla (CAPU)",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "3",
    bus_line_name: "ADO",
    distance: 130.5,
    base_time: 120, // 2h en minutos
    default_service_type: "Estándar",
    popular: true,
    active: true,
    buyable: true,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R005",
    code: "PUE-CDMX",
    origin_city_id: "5",
    origin_city_name: "Puebla",
    origin_terminal_id: "5",
    origin_terminal_name: "Central de Autobuses de Puebla (CAPU)",
    destination_city_id: "2",
    destination_city_name: "Ciudad de México",
    destination_terminal_id: "2",
    destination_terminal_name:
      "Terminal de Autobuses de Pasajeros de Oriente (TAPO)",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "3",
    bus_line_name: "ADO",
    distance: 130.5,
    base_time: 120, // 2h en minutos
    default_service_type: "Estándar",
    popular: true,
    active: true,
    buyable: true,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R006",
    code: "CDMX-QRO",
    origin_city_id: "2",
    origin_city_name: "Ciudad de México",
    origin_terminal_id: "1",
    origin_terminal_name: "Terminal Central de Autobuses del Norte",
    destination_city_id: "6",
    destination_city_name: "Querétaro",
    destination_terminal_id: "6",
    destination_terminal_name: "Terminal de Autobuses de Querétaro",
    transporter_id: "3",
    transporter_name: "Primera Plus",
    bus_line_id: "6",
    bus_line_name: "Primera Plus",
    distance: 220.8,
    base_time: 180, // 3h en minutos
    default_service_type: "Primera Clase",
    popular: true,
    active: true,
    buyable: true,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R007",
    code: "QRO-CDMX",
    origin_city_id: "6",
    origin_city_name: "Querétaro",
    origin_terminal_id: "6",
    origin_terminal_name: "Terminal de Autobuses de Querétaro",
    destination_city_id: "2",
    destination_city_name: "Ciudad de México",
    destination_terminal_id: "1",
    destination_terminal_name: "Terminal Central de Autobuses del Norte",
    transporter_id: "3",
    transporter_name: "Primera Plus",
    bus_line_id: "6",
    bus_line_name: "Primera Plus",
    distance: 220.8,
    base_time: 180, // 3h en minutos
    default_service_type: "Primera Clase",
    popular: true,
    active: true,
    buyable: true,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R008",
    code: "CDMX-VER",
    origin_city_id: "2",
    origin_city_name: "Ciudad de México",
    origin_terminal_id: "2",
    origin_terminal_name:
      "Terminal de Autobuses de Pasajeros de Oriente (TAPO)",
    destination_city_id: "7",
    destination_city_name: "Veracruz",
    destination_terminal_id: "7",
    destination_terminal_name: "Central de Autobuses de Veracruz",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "2",
    bus_line_name: "ADO Platino",
    distance: 397.6,
    base_time: 300, // 5h en minutos
    default_service_type: "Premium",
    popular: false,
    active: true,
    buyable: true,
    stops: [
      {
        id: "S005",
        order: 1,
        city_id: "5",
        city_name: "Puebla",
        terminal_id: "5",
        terminal_name: "Central de Autobuses de Puebla (CAPU)",
        distance: 130.5,
        base_time: 120,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R009",
    code: "VER-CDMX",
    origin_city_id: "7",
    origin_city_name: "Veracruz",
    origin_terminal_id: "7",
    origin_terminal_name: "Central de Autobuses de Veracruz",
    destination_city_id: "2",
    destination_city_name: "Ciudad de México",
    destination_terminal_id: "2",
    destination_terminal_name:
      "Terminal de Autobuses de Pasajeros de Oriente (TAPO)",
    transporter_id: "1",
    transporter_name: "Grupo ADO",
    bus_line_id: "2",
    bus_line_name: "ADO Platino",
    distance: 397.6,
    base_time: 300, // 5h en minutos
    default_service_type: "Premium",
    popular: false,
    active: true,
    buyable: true,
    stops: [
      {
        id: "S006",
        order: 1,
        city_id: "5",
        city_name: "Puebla",
        terminal_id: "5",
        terminal_name: "Central de Autobuses de Puebla (CAPU)",
        distance: 267.1,
        base_time: 180,
        buyable: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "R010",
    code: "GDL-MTY",
    origin_city_id: "1",
    origin_city_name: "Guadalajara",
    origin_terminal_id: "3",
    origin_terminal_name: "Terminal de Autobuses de Guadalajara",
    destination_city_id: "3",
    destination_city_name: "Monterrey",
    destination_terminal_id: "4",
    destination_terminal_name: "Terminal de Autobuses de Monterrey",
    transporter_id: "7",
    transporter_name: "Transportes del Norte",
    bus_line_id: "10",
    bus_line_name: "Autovías",
    distance: 785.3,
    base_time: 600, // 10h en minutos
    default_service_type: "Primera Clase",
    popular: false,
    active: false,
    buyable: false,
    stops: [],
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Actualizar la interfaz Bus para incluir todos los campos necesarios
export interface Bus {
  id: string;
  registration_number: string;
  model: string;
  year: number;
  capacity: number;
  current_mileage: number;
  last_maintenance_date: string;
  next_maintenance_date: string;
  current_status: string;
  fuel_type: string;
  fuel_efficiency: number;
  onboard_facilities: Record<string, boolean>;
  gps_id?: string;
  purchase_date: string;
  expected_retirement_date: string;
  active: boolean;
  maintenance_history?: MaintenanceRecord[];
  created_at: string;
  updated_at: string;
}

interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  mileage: number;
  cost: number;
}

// Actualizar los datos de muestra de autobuses
export const buses: Bus[] = [
  {
    id: "B001",
    registration_number: "ABC-123",
    model: "Volvo 9700",
    year: 2022,
    capacity: 45,
    current_mileage: 25000,
    last_maintenance_date: "2023-06-15",
    next_maintenance_date: "2023-12-15",
    current_status: "active",
    fuel_type: "diesel",
    fuel_efficiency: 3.5,
    onboard_facilities: {
      wifi: true,
      usb_ports: true,
      power_outlets: true,
      entertainment_system: true,
      air_conditioning: true,
      bathroom: true,
      reclining_seats: true,
      footrests: true,
      reading_lights: true,
      curtains: true,
      water_dispenser: false,
      snack_service: false,
    },
    gps_id: "GPS-001",
    purchase_date: "2022-01-10",
    expected_retirement_date: "2032-01-10",
    active: true,
    maintenance_history: [
      {
        date: "2023-06-15",
        type: "preventive",
        description: "Cambio de aceite y filtros",
        mileage: 25000,
        cost: 1200,
      },
      {
        date: "2023-03-10",
        type: "preventive",
        description: "Revisión general",
        mileage: 15000,
        cost: 800,
      },
      {
        date: "2022-09-05",
        type: "corrective",
        description: "Reparación de aire acondicionado",
        mileage: 8000,
        cost: 2500,
      },
    ],
    created_at: "2022-01-10T00:00:00Z",
    updated_at: "2023-06-15T00:00:00Z",
  },
  {
    id: "B002",
    registration_number: "XYZ-456",
    model: "Mercedes-Benz OC 500 RF",
    year: 2021,
    capacity: 40,
    current_mileage: 45000,
    last_maintenance_date: "2023-05-20",
    next_maintenance_date: "2023-11-20",
    current_status: "maintenance",
    fuel_type: "diesel",
    fuel_efficiency: 3.2,
    onboard_facilities: {
      wifi: true,
      usb_ports: true,
      power_outlets: true,
      entertainment_system: true,
      air_conditioning: true,
      bathroom: true,
      reclining_seats: true,
      footrests: true,
      reading_lights: true,
      curtains: true,
      water_dispenser: true,
      snack_service: false,
    },
    gps_id: "GPS-002",
    purchase_date: "2021-03-15",
    expected_retirement_date: "2031-03-15",
    active: false,
    maintenance_history: [
      {
        date: "2023-05-20",
        type: "preventive",
        description: "Cambio de aceite y filtros",
        mileage: 45000,
        cost: 1200,
      },
      {
        date: "2023-01-10",
        type: "corrective",
        description: "Reparación de frenos",
        mileage: 35000,
        cost: 3000,
      },
    ],
    created_at: "2021-03-15T00:00:00Z",
    updated_at: "2023-05-20T00:00:00Z",
  },
  {
    id: "B003",
    registration_number: "DEF-789",
    model: "Irizar i8",
    year: 2023,
    capacity: 50,
    current_mileage: 5000,
    last_maintenance_date: "2023-07-10",
    next_maintenance_date: "2024-01-10",
    current_status: "active",
    fuel_type: "diesel-electric",
    fuel_efficiency: 4.0,
    onboard_facilities: {
      wifi: true,
      usb_ports: true,
      power_outlets: true,
      entertainment_system: true,
      air_conditioning: true,
      bathroom: true,
      reclining_seats: true,
      footrests: true,
      reading_lights: true,
      curtains: true,
      water_dispenser: true,
      snack_service: true,
    },
    gps_id: "GPS-003",
    purchase_date: "2023-01-05",
    expected_retirement_date: "2033-01-05",
    active: true,
    maintenance_history: [
      {
        date: "2023-07-10",
        type: "preventive",
        description: "Primera revisión",
        mileage: 5000,
        cost: 1000,
      },
    ],
    created_at: "2023-01-05T00:00:00Z",
    updated_at: "2023-07-10T00:00:00Z",
  },
  {
    id: "B004",
    registration_number: "GHI-012",
    model: "Scania Touring",
    year: 2022,
    capacity: 42,
    current_mileage: 30000,
    last_maintenance_date: "2023-04-15",
    next_maintenance_date: "2023-10-15",
    current_status: "out_of_service",
    fuel_type: "diesel",
    fuel_efficiency: 3.3,
    onboard_facilities: {
      wifi: true,
      usb_ports: true,
      power_outlets: true,
      entertainment_system: false,
      air_conditioning: true,
      bathroom: true,
      reclining_seats: true,
      footrests: true,
      reading_lights: true,
      curtains: true,
      water_dispenser: false,
      snack_service: false,
    },
    gps_id: "GPS-004",
    purchase_date: "2022-02-20",
    expected_retirement_date: "2032-02-20",
    active: false,
    maintenance_history: [
      {
        date: "2023-04-15",
        type: "corrective",
        description: "Reparación de motor",
        mileage: 30000,
        cost: 8000,
      },
      {
        date: "2022-10-10",
        type: "preventive",
        description: "Cambio de aceite y filtros",
        mileage: 15000,
        cost: 1200,
      },
    ],
    created_at: "2022-02-20T00:00:00Z",
    updated_at: "2023-04-15T00:00:00Z",
  },
  {
    id: "B005",
    registration_number: "JKL-345",
    model: "MAN Lion's Coach",
    year: 2021,
    capacity: 44,
    current_mileage: 40000,
    last_maintenance_date: "2023-03-05",
    next_maintenance_date: "2023-09-05",
    current_status: "active",
    fuel_type: "diesel",
    fuel_efficiency: 3.4,
    onboard_facilities: {
      wifi: true,
      usb_ports: true,
      power_outlets: true,
      entertainment_system: true,
      air_conditioning: true,
      bathroom: false,
      reclining_seats: true,
      footrests: true,
      reading_lights: true,
      curtains: true,
      water_dispenser: false,
      snack_service: false,
    },
    gps_id: "GPS-005",
    purchase_date: "2021-05-10",
    expected_retirement_date: "2031-05-10",
    active: true,
    maintenance_history: [
      {
        date: "2023-03-05",
        type: "preventive",
        description: "Cambio de aceite y filtros",
        mileage: 40000,
        cost: 1200,
      },
      {
        date: "2022-09-15",
        type: "preventive",
        description: "Revisión general",
        mileage: 25000,
        cost: 800,
      },
      {
        date: "2022-01-20",
        type: "corrective",
        description: "Reparación de sistema eléctrico",
        mileage: 10000,
        cost: 1500,
      },
    ],
    created_at: "2021-05-10T00:00:00Z",
    updated_at: "2023-03-05T00:00:00Z",
  },
];

// BusModel type (Modelo de Autobus)
export interface BusModel {
  id: string;
  manufacturer: string;
  model: string;
  year: number;
  seating_capacity: number;
  seat_configuration: {
    rows: number;
    columns: number;
    has_aisle: boolean;
    deck_count: number;
  };
  engine_type: string;
  has_bathroom: boolean;
  has_wifi: boolean;
  created_at: string;
  updated_at: string;
}

// Sample bus models data
export const busModels: BusModel[] = [
  {
    id: "BM001",
    manufacturer: "Volvo",
    model: "9700",
    year: 2022,
    seating_capacity: 45,
    seat_configuration: {
      rows: 15,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM002",
    manufacturer: "Mercedes-Benz",
    model: "OC 500 RF",
    year: 2021,
    seating_capacity: 40,
    seat_configuration: {
      rows: 13,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM003",
    manufacturer: "Irizar",
    model: "i8",
    year: 2023,
    seating_capacity: 50,
    seat_configuration: {
      rows: 16,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel-Eléctrico",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM004",
    manufacturer: "Scania",
    model: "Touring",
    year: 2022,
    seating_capacity: 42,
    seat_configuration: {
      rows: 14,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM005",
    manufacturer: "MAN",
    model: "Lion's Coach",
    year: 2021,
    seating_capacity: 44,
    seat_configuration: {
      rows: 14,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM006",
    manufacturer: "Volvo",
    model: "9800 DD",
    year: 2023,
    seating_capacity: 80,
    seat_configuration: {
      rows: 20,
      columns: 4,
      has_aisle: true,
      deck_count: 2,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM007",
    manufacturer: "Mercedes-Benz",
    model: "Travego",
    year: 2020,
    seating_capacity: 48,
    seat_configuration: {
      rows: 16,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: true,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "BM008",
    manufacturer: "Irizar",
    model: "i6",
    year: 2021,
    seating_capacity: 46,
    seat_configuration: {
      rows: 15,
      columns: 3,
      has_aisle: true,
      deck_count: 1,
    },
    engine_type: "Diesel",
    has_bathroom: false,
    has_wifi: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// TripTemplate type (Servicio)
export interface TripTemplate {
  id: string;
  code: string;
  route_id: string;
  route_code: string;
  route_name: string;
  scheduled_departure_time: string;
  scheduled_arrival_time: string;
  days_of_week: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  total_seats: number;
  default_bus_id: string;
  default_bus_name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample trip templates data (Servicios)
export const tripTemplates: TripTemplate[] = [
  {
    id: "TT001",
    code: "CDMX-GDL-0800",
    route_id: "R001",
    route_code: "CDMX-GDL",
    route_name: "Ciudad de México - Guadalajara",
    scheduled_departure_time: "2023-08-01T08:00:00Z",
    scheduled_arrival_time: "2023-08-01T14:30:00Z",
    days_of_week: [1, 2, 3, 4, 5], // Lunes a Viernes
    total_seats: 45,
    default_bus_id: "B001",
    default_bus_name: "ABC-123 (Volvo 9700)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT002",
    code: "CDMX-GDL-1200",
    route_id: "R001",
    route_code: "CDMX-GDL",
    route_name: "Ciudad de México - Guadalajara",
    scheduled_departure_time: "2023-08-01T12:00:00Z",
    scheduled_arrival_time: "2023-08-01T18:30:00Z",
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // Todos los días
    total_seats: 45,
    default_bus_id: "B003",
    default_bus_name: "DEF-789 (Irizar i8)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT003",
    code: "CDMX-GDL-1600",
    route_id: "R001",
    route_code: "CDMX-GDL",
    route_name: "Ciudad de México - Guadalajara",
    scheduled_departure_time: "2023-08-01T16:00:00Z",
    scheduled_arrival_time: "2023-08-01T22:30:00Z",
    days_of_week: [1, 2, 3, 4, 5], // Lunes a Viernes
    total_seats: 40,
    default_bus_id: "B002",
    default_bus_name: "XYZ-456 (Mercedes-Benz OC 500 RF)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT004",
    code: "CDMX-GDL-2000",
    route_id: "R001",
    route_code: "CDMX-GDL",
    route_name: "Ciudad de México - Guadalajara",
    scheduled_departure_time: "2023-08-01T20:00:00Z",
    scheduled_arrival_time: "2023-08-02T02:30:00Z",
    days_of_week: [5, 6], // Viernes y Sábado
    total_seats: 50,
    default_bus_id: "B003",
    default_bus_name: "DEF-789 (Irizar i8)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT005",
    code: "GDL-CDMX-0700",
    route_id: "R003",
    route_code: "GDL-CDMX",
    route_name: "Guadalajara - Ciudad de México",
    scheduled_departure_time: "2023-08-01T07:00:00Z",
    scheduled_arrival_time: "2023-08-01T13:30:00Z",
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // Todos los días
    total_seats: 45,
    default_bus_id: "B001",
    default_bus_name: "ABC-123 (Volvo 9700)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT006",
    code: "GDL-CDMX-1500",
    route_id: "R003",
    route_code: "GDL-CDMX",
    route_name: "Guadalajara - Ciudad de México",
    scheduled_departure_time: "2023-08-01T15:00:00Z",
    scheduled_arrival_time: "2023-08-01T21:30:00Z",
    days_of_week: [1, 2, 3, 4, 5], // Lunes a Viernes
    total_seats: 45,
    default_bus_id: "B001",
    default_bus_name: "ABC-123 (Volvo 9700)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT007",
    code: "CDMX-MTY-0900",
    route_id: "R002",
    route_code: "CDMX-MTY",
    route_name: "Ciudad de México - Monterrey",
    scheduled_departure_time: "2023-08-01T09:00:00Z",
    scheduled_arrival_time: "2023-08-01T20:00:00Z",
    days_of_week: [1, 3, 5], // Lunes, Miércoles, Viernes
    total_seats: 42,
    default_bus_id: "B004",
    default_bus_name: "GHI-012 (Scania Touring)",
    active: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "TT008",
    code: "CDMX-PUE-0730",
    route_id: "R004",
    route_code: "CDMX-PUE",
    route_name: "Ciudad de México - Puebla",
    scheduled_departure_time: "2023-08-01T07:30:00Z",
    scheduled_arrival_time: "2023-08-01T09:30:00Z",
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // Todos los días
    total_seats: 44,
    default_bus_id: "B005",
    default_bus_name: "JKL-345 (MAN Lion's Coach)",
    active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Driver type (Conductor)
export interface Driver {
  id: string;
  name: string;
  last_name: string;
  license_number: string;
  license_type: string;
  license_expiration_date: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Sample drivers data
export const drivers: Driver[] = [
  {
    id: "D001",
    name: "Juan",
    last_name: "Pérez González",
    license_number: "PEGJ800523HDFRZN01",
    license_type: "A",
    license_expiration_date: "2025-05-23",
    date_of_birth: "1980-05-23",
    phone_number: "+52-55-1234-5678",
    email: "juan.perez@example.com",
    address: "Calle Reforma 123, Col. Centro, Ciudad de México",
    emergency_contact_name: "María Pérez",
    emergency_contact_phone: "+52-55-8765-4321",
    active: true,
    created_at: "2022-01-15T00:00:00Z",
    updated_at: "2022-01-15T00:00:00Z",
  },
  {
    id: "D002",
    name: "Carlos",
    last_name: "Rodríguez Martínez",
    license_number: "ROMC750812HJCDRR05",
    license_type: "A",
    license_expiration_date: "2024-08-12",
    date_of_birth: "1975-08-12",
    phone_number: "+52-33-2345-6789",
    email: "carlos.rodriguez@example.com",
    address: "Av. Chapultepec 456, Col. Moderna, Guadalajara, Jalisco",
    emergency_contact_name: "Laura Rodríguez",
    emergency_contact_phone: "+52-33-9876-5432",
    active: true,
    created_at: "2022-02-10T00:00:00Z",
    updated_at: "2022-02-10T00:00:00Z",
  },
  {
    id: "D003",
    name: "Miguel",
    last_name: "López Hernández",
    license_number: "LOHM820630HNLPRG09",
    license_type: "A",
    license_expiration_date: "2026-06-30",
    date_of_birth: "1982-06-30",
    phone_number: "+52-81-3456-7890",
    email: "miguel.lopez@example.com",
    address: "Calle Morelos 789, Col. San Nicolás, Monterrey, Nuevo León",
    emergency_contact_name: "Ana López",
    emergency_contact_phone: "+52-81-0987-6543",
    active: true,
    created_at: "2022-03-05T00:00:00Z",
    updated_at: "2022-03-05T00:00:00Z",
  },
  {
    id: "D004",
    name: "Roberto",
    last_name: "García Sánchez",
    license_number: "GASR790215HPLRNB03",
    license_type: "A",
    license_expiration_date: "2024-02-15",
    date_of_birth: "1979-02-15",
    phone_number: "+52-222-4567-8901",
    email: "roberto.garcia@example.com",
    address: "Av. Juárez 234, Col. Reforma, Puebla, Puebla",
    emergency_contact_name: "Sofía García",
    emergency_contact_phone: "+52-222-1098-7654",
    active: false,
    created_at: "2022-04-20T00:00:00Z",
    updated_at: "2022-04-20T00:00:00Z",
  },
  {
    id: "D005",
    name: "Alejandro",
    last_name: "Martínez Torres",
    license_number: "MATA840908HVZRRL07",
    license_type: "A",
    license_expiration_date: "2025-09-08",
    date_of_birth: "1984-09-08",
    phone_number: "+52-229-5678-9012",
    email: "alejandro.martinez@example.com",
    address: "Calle Independencia 567, Col. Centro, Veracruz, Veracruz",
    emergency_contact_name: "Patricia Martínez",
    emergency_contact_phone: "+52-229-2109-8765",
    active: true,
    created_at: "2022-05-15T00:00:00Z",
    updated_at: "2022-05-15T00:00:00Z",
  },
];

// Trip type (Viaje)
export interface Trip {
  id: string;
  trip_template_id: string;
  trip_template_code: string;
  route_id: string;
  route_name: string;
  departure_date: string;
  arrival_date: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  bus_id: string;
  bus_name: string;
  driver_id: string;
  driver_name: string;
  co_driver_id?: string;
  co_driver_name?: string;
  total_seats: number;
  available_seats: number;
  created_at: string;
  updated_at: string;
}
