'use strict';

// ===========================================================================
// CONSTANTS
// ===========================================================================
const STORAGE_KEY = 'solped-eem-state-v3';
const ROLES = {
  admin:       { label: 'Admin',       icon: '👁', canCreateSolped: true,  canCreateReembolso: true,  canApprove: true,  canSeeAll: true  },
  coordinador: { label: 'Coordinador', icon: '👥', canCreateSolped: true,  canCreateReembolso: true,  canApprove: false, canSeeAll: false },
  asistente:   { label: 'Asistente',   icon: '📋', canCreateSolped: true,  canCreateReembolso: true,  canApprove: false, canSeeAll: false },
  trabajador:  { label: 'Trabajador',  icon: '🧑', canCreateSolped: false, canCreateReembolso: true,  canApprove: false, canSeeAll: false }
};

const ESTADOS = {
  borrador:   { label: 'Borrador',   className: 'badge-pending' },
  enviada:    { label: 'Pendiente',  className: 'badge-pending' },
  aprobada:   { label: 'Aprobada',   className: 'badge-approved' },
  pagada:     { label: 'Pagada',     className: 'badge-paid' },
  sin_boleta: { label: 'Sin boleta', className: 'badge-noboleta' },
  acreditada: { label: 'Acreditada', className: 'badge-acred' },
  conciliada: { label: 'Conciliada', className: 'badge-conc' },
  rechazada:  { label: 'Rechazada',  className: 'badge-rejected' }
};

const CATEGORIAS = [
  'Insumos y materiales',
  'Insumos de oficina',
  'Frutas y snacks saludables',
  'Papelería y lápices',
  'Artículos de librería',
  'Artículos de aseo y limpieza',
  'Servicios externos',
  'Logística y transporte',
  'Honorarios',
  'Combustible y peajes',
  'Otros'
];

// ===========================================================================
// STATE
// ===========================================================================
let state = {};
let currentScreen = 'dashboard';
let currentParams = {};
let selectedSolicitudId = null;
let modalOpen = null;
let solicitudTipoBuilder = 'SOLPED';

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e) { console.error('Save failed', e); }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { state = JSON.parse(raw); return true; }
  } catch(e) { console.error('Load failed', e); }
  return false;
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  seedState();
  saveState();
  render();
  toast('Datos demo recargados', 'success');
}

// ===========================================================================
// SEED DATA
// ===========================================================================
function uid() { return Math.random().toString(36).slice(2, 11); }

function seedState() {
  const today = new Date('2026-05-07');
  function daysAgo(n) { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString(); }

  state = {
    currentRole: 'admin',
    currentUserId: 'u-christian',
    nextSolpedNum: 130,
    nextReembolsoNum: 43,
    users: [
      { id: 'u-christian', nombre: 'Christian Fuentes', email: 'cfuentes@eem.cl', rol: 'admin', topeMensual: null, datosBancarios: null },
      { id: 'u-carolina',  nombre: 'Carolina Martínez', email: 'cmartinez@eem.cl', rol: 'coordinador', topeMensual: 3500000, datosBancarios: 'Bco Chile · 11122334' },
      { id: 'u-javiera',   nombre: 'Javiera Rojas',     email: 'jrojas@eem.cl',    rol: 'coordinador', topeMensual: 2500000, datosBancarios: 'Santander · 99887765' },
      { id: 'u-patricia',  nombre: 'Patricia Soto',     email: 'psoto@eem.cl',     rol: 'asistente',   topeMensual: 2000000, datosBancarios: 'BCI · 44556677' },
      { id: 'u-daniela',   nombre: 'Daniela Pérez',     email: 'dperez@eem.cl',    rol: 'trabajador',  topeMensual: 200000,  datosBancarios: 'Bco Estado · 12345678' },
      { id: 'u-andres',    nombre: 'Andrés Vásquez',    email: 'avasquez@eem.cl',  rol: 'trabajador',  topeMensual: 200000,  datosBancarios: 'Bco Chile · 87654321' },
      { id: 'u-mauricio',  nombre: 'Mauricio Tapia',    email: 'mtapia@eem.cl',    rol: 'trabajador',  topeMensual: 200000,  datosBancarios: 'BCI · 11223344' }
    ],
    proveedores: [
      { id: 'p-sodimac',     rut: '76.585.000-7', razon: 'Sodimac S.A.',         banco: 'Bco Chile · 0011223', categoriaHabitual: 'Insumos y materiales' },
      { id: 'p-easy',        rut: '96.789.012-3', razon: 'Easy Retail S.A.',      banco: 'Bco Chile · 0078900', categoriaHabitual: 'Artículos de aseo y limpieza' },
      { id: 'p-tecno',       rut: '76.123.456-7', razon: 'Tecno-Service Ltda.',  banco: 'Bco Chile · 0089012', categoriaHabitual: 'Servicios externos' },
      { id: 'p-eventos',     rut: '77.456.789-K', razon: 'Eventos Andinos',      banco: 'Santander · 0067890', categoriaHabitual: 'Servicios externos' },
      { id: 'p-llanos',      rut: '76.987.654-3', razon: 'Transp. Llanos S.A.',  banco: 'BCI · 0033445',       categoriaHabitual: 'Logística y transporte' },
      { id: 'p-imprenta',    rut: '76.234.567-8', razon: 'Imprenta Sur',          banco: 'Bco Chile · 0078901', categoriaHabitual: 'Papelería y lápices' },
      { id: 'p-vega',        rut: '60.123.000-1', razon: 'Vega Central',          banco: 'Bco Estado · 0099887', categoriaHabitual: 'Frutas y snacks saludables' },
      { id: 'p-office',      rut: '76.998.123-5', razon: 'Office Depot Chile',    banco: 'Bco Chile · 0066123', categoriaHabitual: 'Insumos de oficina' },
      { id: 'p-lipigas',     rut: '92.011.000-3', razon: 'Lipigas',              banco: 'Bco Chile · 0011001', categoriaHabitual: 'Servicios externos' },
      { id: 'p-movistar',    rut: '78.703.410-1', razon: 'Telefónica / Movistar', banco: 'Bco Chile · 0001122', categoriaHabitual: 'Servicios externos' }
    ],
    clientes: [
      { id: 'c-watts',     nombre: 'Watts S.A.',          rut: '90.301.000-3' },
      { id: 'c-falabella', nombre: 'Falabella Retail',    rut: '90.749.000-9' },
      { id: 'c-cencosud',  nombre: 'Cencosud',            rut: '93.834.000-5' },
      { id: 'c-codelco',   nombre: 'Codelco',             rut: '61.704.000-K' },
      { id: 'c-interno',   nombre: '(Uso interno · oficina)', rut: '' }
    ],
    cuentasBancarias: [
      { id: 'cb-chile', banco: 'Banco de Chile', numero: '0019234',  titular: 'EEM Servicios SpA', activa: true },
      { id: 'cb-edw',   banco: 'Banco Edwards',  numero: '0019234E', titular: 'EEM Servicios SpA', activa: true },
      { id: 'cb-sant',  banco: 'Santander',      numero: '4456012',  titular: 'EEM Servicios SpA', activa: true }
    ],
    solicitudes: [
      // Pendientes (esperando aprobación admin)
      { id: 's-128', codigo: 'SOL-2026-00128', tipo: 'SOLPED', solicitanteId: 'u-carolina', monto: 245000, motivo: 'Compra materiales mantención oficina principal: ampolletas LED, papel toalla, jabón y dispensadores de inox.', categoria: 'Insumos de oficina', proveedorId: 'p-sodimac', clienteId: 'c-interno', estado: 'enviada', prioridad: 'alta', fechaCreacion: daysAgo(0), fechaRequerida: '2026-05-09', adjuntos: [], historial: [{ fecha: daysAgo(0), usuarioId: 'u-carolina', accion: 'Solicitud creada', detalle: '' }] },
      { id: 's-129', codigo: 'SOL-2026-00129', tipo: 'SOLPED', solicitanteId: 'u-patricia', monto: 128500, motivo: 'Frutas y snacks saludables para evento Watts en planta.', categoria: 'Frutas y snacks saludables', proveedorId: 'p-vega', clienteId: 'c-watts', estado: 'enviada', prioridad: 'alta', fechaCreacion: daysAgo(0), fechaRequerida: '2026-05-08', adjuntos: [], historial: [{ fecha: daysAgo(0), usuarioId: 'u-patricia', accion: 'Solicitud creada', detalle: '' }] },
      { id: 'r-042', codigo: 'REE-2026-00042', tipo: 'REEMBOLSO', solicitanteId: 'u-daniela', monto: 28500, motivo: 'Bencina visita cliente Las Condes (35 km).', categoria: 'Combustible y peajes', proveedorId: null, clienteId: 'c-falabella', estado: 'enviada', prioridad: 'normal', fechaCreacion: daysAgo(0), fechaRequerida: '2026-05-08', adjuntos: [], historial: [{ fecha: daysAgo(0), usuarioId: 'u-daniela', accion: 'Reembolso enviado', detalle: '' }] },
      // Aprobadas (esperando voucher)
      { id: 's-124', codigo: 'SOL-2026-00124', tipo: 'SOLPED', solicitanteId: 'u-patricia', monto: 520000, motivo: 'Honorarios diseñador gráfico — proyecto rebrand interno.', categoria: 'Honorarios', proveedorId: null, clienteId: 'c-interno', estado: 'aprobada', prioridad: 'normal', fechaCreacion: daysAgo(3), fechaRequerida: '2026-05-06', adjuntos: [], historial: [{ fecha: daysAgo(3), usuarioId: 'u-patricia', accion: 'Solicitud creada' }, { fecha: daysAgo(2), usuarioId: 'u-christian', accion: 'Aprobada' }] },
      // Pagadas (esperando boleta)
      { id: 's-127', codigo: 'SOL-2026-00127', tipo: 'SOLPED', solicitanteId: 'u-patricia', monto: 89000,  motivo: 'Servicio técnico impresora oficina central.', categoria: 'Servicios externos',          proveedorId: 'p-tecno',    clienteId: 'c-interno',   estado: 'sin_boleta', prioridad: 'normal', fechaCreacion: daysAgo(1), fechaRequerida: '2026-05-07', transferenciaId: 't-127', adjuntos: [], historial: [{ fecha: daysAgo(1), usuarioId: 'u-patricia', accion: 'Solicitud creada' }, { fecha: daysAgo(1), usuarioId: 'u-christian', accion: 'Aprobada' }, { fecha: daysAgo(1), usuarioId: 'u-christian', accion: 'Voucher cargado · transferencia ejecutada' }] },
      { id: 's-126', codigo: 'SOL-2026-00126', tipo: 'SOLPED', solicitanteId: 'u-javiera',  monto: 1420000, motivo: 'Materiales para evento Watts: producción y montaje.',     categoria: 'Servicios externos',          proveedorId: 'p-eventos',  clienteId: 'c-watts',     estado: 'sin_boleta', prioridad: 'alta',   fechaCreacion: daysAgo(2), fechaRequerida: '2026-05-06', transferenciaId: 't-126', adjuntos: [], historial: [{ fecha: daysAgo(2), usuarioId: 'u-javiera', accion: 'Solicitud creada' }, { fecha: daysAgo(2), usuarioId: 'u-christian', accion: 'Aprobada' }, { fecha: daysAgo(2), usuarioId: 'u-christian', accion: 'Voucher cargado · transferencia ejecutada' }] },
      { id: 's-122', codigo: 'SOL-2026-00122', tipo: 'SOLPED', solicitanteId: 'u-carolina', monto: 176500, motivo: 'Productos de aseo y limpieza para servicio mensual.',     categoria: 'Artículos de aseo y limpieza', proveedorId: 'p-easy',     clienteId: 'c-interno',   estado: 'pagada', prioridad: 'normal', fechaCreacion: daysAgo(5), fechaRequerida: '2026-05-03', transferenciaId: 't-122', adjuntos: [], historial: [] },
      { id: 's-121', codigo: 'SOL-2026-00121', tipo: 'SOLPED', solicitanteId: 'u-patricia', monto: 95000,  motivo: 'Insumos de oficina varios — Office Depot.',              categoria: 'Insumos de oficina',          proveedorId: 'p-office',   clienteId: 'c-interno',   estado: 'sin_boleta', prioridad: 'baja',   fechaCreacion: daysAgo(7), fechaRequerida: '2026-05-01', transferenciaId: 't-121', adjuntos: [], historial: [] },
      // Acreditadas / Conciliadas (terminadas)
      { id: 's-125', codigo: 'SOL-2026-00125', tipo: 'SOLPED', solicitanteId: 'u-carolina', monto: 680000, motivo: 'Pago proveedor logística para entrega.', categoria: 'Logística y transporte', proveedorId: 'p-llanos', clienteId: 'c-cencosud', estado: 'conciliada', prioridad: 'normal', fechaCreacion: daysAgo(2), fechaRequerida: '2026-05-05', transferenciaId: 't-125', boletaId: 'b-125', adjuntos: [], historial: [] },
      { id: 's-123', codigo: 'SOL-2026-00123', tipo: 'SOLPED', solicitanteId: 'u-javiera',  monto: 340000, motivo: 'Impresión carpetas corporativas + libretas.', categoria: 'Papelería y lápices', proveedorId: 'p-imprenta', clienteId: 'c-interno', estado: 'conciliada', prioridad: 'normal', fechaCreacion: daysAgo(4), fechaRequerida: '2026-05-03', transferenciaId: 't-123', boletaId: 'b-123', adjuntos: [], historial: [] },
      { id: 's-120', codigo: 'SOL-2026-00120', tipo: 'SOLPED', solicitanteId: 'u-javiera',  monto: 58000,  motivo: 'Recarga gas oficina.',                       categoria: 'Servicios externos',  proveedorId: 'p-lipigas',   clienteId: 'c-interno', estado: 'conciliada', prioridad: 'baja',   fechaCreacion: daysAgo(7), fechaRequerida: '2026-04-30', transferenciaId: 't-120', boletaId: 'b-120', adjuntos: [], historial: [] },
      { id: 's-119', codigo: 'SOL-2026-00119', tipo: 'SOLPED', solicitanteId: 'u-carolina', monto: 76890,  motivo: 'Cuenta Movistar mensual.',                    categoria: 'Servicios externos',  proveedorId: 'p-movistar',  clienteId: 'c-interno', estado: 'conciliada', prioridad: 'normal', fechaCreacion: daysAgo(8), fechaRequerida: '2026-04-29', transferenciaId: 't-119', boletaId: 'b-119', adjuntos: [], historial: [] },
      // Reembolsos
      { id: 'r-041', codigo: 'REE-2026-00041', tipo: 'REEMBOLSO', solicitanteId: 'u-andres',   monto: 12400, motivo: 'Estacionamiento + peaje TAG visita Vitacura.', categoria: 'Combustible y peajes', proveedorId: null, clienteId: 'c-cencosud',  estado: 'pagada',     prioridad: 'normal', fechaCreacion: daysAgo(2), fechaRequerida: '2026-05-05', transferenciaId: 't-r041', boletaId: 'b-r041', adjuntos: [], historial: [] },
      { id: 'r-040', codigo: 'REE-2026-00040', tipo: 'REEMBOLSO', solicitanteId: 'u-carolina', monto: 67300, motivo: 'Compra urgente Vega Central — cliente Watts.',  categoria: 'Frutas y snacks saludables', proveedorId: 'p-vega', clienteId: 'c-watts',     estado: 'conciliada', prioridad: 'normal', fechaCreacion: daysAgo(3), fechaRequerida: '2026-05-04', transferenciaId: 't-r040', boletaId: 'b-r040', adjuntos: [], historial: [] },
      { id: 'r-039', codigo: 'REE-2026-00039', tipo: 'REEMBOLSO', solicitanteId: 'u-mauricio', monto: 18900, motivo: 'Almuerzo cliente terreno Codelco.',             categoria: 'Otros',                proveedorId: null, clienteId: 'c-codelco', estado: 'pagada',     prioridad: 'normal', fechaCreacion: daysAgo(4), fechaRequerida: '2026-05-03', transferenciaId: 't-r039', boletaId: 'b-r039', adjuntos: [], historial: [] },
      { id: 'r-038', codigo: 'REE-2026-00038', tipo: 'REEMBOLSO', solicitanteId: 'u-daniela',  monto: 24500, motivo: 'Insumos botiquín terreno.',                       categoria: 'Otros',                proveedorId: null, clienteId: 'c-watts',     estado: 'conciliada', prioridad: 'normal', fechaCreacion: daysAgo(5), fechaRequerida: '2026-05-02', transferenciaId: 't-r038', boletaId: 'b-r038', adjuntos: [], historial: [] }
    ],
    transferencias: [
      { id: 't-127', solicitudIds: ['s-127'], monto: 89000,  fecha: daysAgo(1), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 89000  },
      { id: 't-126', solicitudIds: ['s-126'], monto: 1420000,fecha: daysAgo(2), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 1420000 },
      { id: 't-125', solicitudIds: ['s-125'], monto: 680000, fecha: daysAgo(2), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 680000 },
      { id: 't-122', solicitudIds: ['s-122'], monto: 176500, fecha: daysAgo(5), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 176500 },
      { id: 't-121', solicitudIds: ['s-121'], monto: 95000,  fecha: daysAgo(7), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 95000  },
      { id: 't-123', solicitudIds: ['s-123'], monto: 340000, fecha: daysAgo(4), cuentaOrigenId: 'cb-sant', voucher: null, ocrMonto: 340000 },
      { id: 't-120', solicitudIds: ['s-120'], monto: 58000,  fecha: daysAgo(7), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 58000  },
      { id: 't-119', solicitudIds: ['s-119'], monto: 76890,  fecha: daysAgo(8), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 76890  },
      { id: 't-r041',solicitudIds: ['r-041'], monto: 12400,  fecha: daysAgo(2), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 12400  },
      { id: 't-r040',solicitudIds: ['r-040'], monto: 67300,  fecha: daysAgo(3), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 67300  },
      { id: 't-r039',solicitudIds: ['r-039'], monto: 18900,  fecha: daysAgo(4), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 18900  },
      { id: 't-r038',solicitudIds: ['r-038'], monto: 24500,  fecha: daysAgo(5), cuentaOrigenId: 'cb-chile', voucher: null, ocrMonto: 24500  }
    ],
    boletas: [
      { id: 'b-125', solicitudId: 's-125', archivo: null, ocr: { rut: '76.987.654-3', fecha: '05-05-2026', folio: '0009912', neto: 571429, iva: 108571, monto: 680000 }, validada: true },
      { id: 'b-123', solicitudId: 's-123', archivo: null, ocr: { rut: '76.234.567-8', fecha: '03-05-2026', folio: '0001144', neto: 285714, iva: 54286,  monto: 340000 }, validada: true },
      { id: 'b-120', solicitudId: 's-120', archivo: null, ocr: { rut: '92.011.000-3', fecha: '30-04-2026', folio: '0998123', neto: 48739,  iva: 9261,   monto: 58000  }, validada: true },
      { id: 'b-119', solicitudId: 's-119', archivo: null, ocr: { rut: '78.703.410-1', fecha: '29-04-2026', folio: '0556789', neto: 64613,  iva: 12277,  monto: 76890  }, validada: true },
      { id: 'b-r041',solicitudId: 'r-041', archivo: null, ocr: { rut: '99.000.000-1', fecha: '04-05-2026', folio: '0009990', neto: 10420,  iva: 1980,   monto: 12400  }, validada: true },
      { id: 'b-r040',solicitudId: 'r-040', archivo: null, ocr: { rut: '60.123.000-1', fecha: '04-05-2026', folio: '0008812', neto: 56555,  iva: 10745,  monto: 67300  }, validada: true },
      { id: 'b-r039',solicitudId: 'r-039', archivo: null, ocr: { rut: '99.999.000-1', fecha: '03-05-2026', folio: '0001234', neto: 15882,  iva: 3018,   monto: 18900  }, validada: true },
      { id: 'b-r038',solicitudId: 'r-038', archivo: null, ocr: { rut: '76.000.111-2', fecha: '02-05-2026', folio: '0007777', neto: 20588,  iva: 3912,   monto: 24500  }, validada: true }
    ],
    movimientosBancarios: [
      { id: 'mb-1', cuentaId: 'cb-chile', fecha: daysAgo(1), monto: 89000,  tipo: 'cargo', descripcion: 'TRANSF. TECNO-SERVICE LTDA', transferenciaId: 't-127', conciliado: true },
      { id: 'mb-2', cuentaId: 'cb-chile', fecha: daysAgo(2), monto: 1420000,tipo: 'cargo', descripcion: 'TRANSF. EVENTOS ANDINOS',  transferenciaId: 't-126', conciliado: true },
      { id: 'mb-3', cuentaId: 'cb-chile', fecha: daysAgo(2), monto: 680000, tipo: 'cargo', descripcion: 'TRANSF. TRANSP. LLANOS',   transferenciaId: 't-125', conciliado: true },
      { id: 'mb-4', cuentaId: 'cb-chile', fecha: daysAgo(5), monto: 176500, tipo: 'cargo', descripcion: 'TRANSF. EASY RETAIL',      transferenciaId: 't-122', conciliado: true },
      { id: 'mb-5', cuentaId: 'cb-chile', fecha: daysAgo(7), monto: 95000,  tipo: 'cargo', descripcion: 'TRANSF. OFFICE DEPOT',     transferenciaId: 't-121', conciliado: true },
      { id: 'mb-6', cuentaId: 'cb-sant',  fecha: daysAgo(4), monto: 340000, tipo: 'cargo', descripcion: 'TRANSF. IMPRENTA SUR',     transferenciaId: 't-123', conciliado: true },
      { id: 'mb-7', cuentaId: 'cb-chile', fecha: daysAgo(7), monto: 58000,  tipo: 'cargo', descripcion: 'TRANSF. LIPIGAS',          transferenciaId: 't-120', conciliado: true },
      { id: 'mb-8', cuentaId: 'cb-chile', fecha: daysAgo(8), monto: 76890,  tipo: 'cargo', descripcion: 'TRANSF. MOVISTAR',         transferenciaId: 't-119', conciliado: true },
      { id: 'mb-9', cuentaId: 'cb-chile', fecha: daysAgo(8), monto: 240000, tipo: 'cargo', descripcion: 'PAGO DESCONOCIDO REF 9981',transferenciaId: null,    conciliado: false },
      { id: 'mb-10',cuentaId: 'cb-chile', fecha: daysAgo(9), monto: 4500,   tipo: 'cargo', descripcion: 'COMISIÓN MANTENCIÓN CTA',  transferenciaId: null,    conciliado: false },
      { id: 'mb-11',cuentaId: 'cb-chile', fecha: daysAgo(2), monto: 12400,  tipo: 'cargo', descripcion: 'TRANSF. ANDRES VASQUEZ',   transferenciaId: 't-r041',conciliado: true },
      { id: 'mb-12',cuentaId: 'cb-chile', fecha: daysAgo(3), monto: 67300,  tipo: 'cargo', descripcion: 'TRANSF. CAROLINA MARTINEZ',transferenciaId: 't-r040',conciliado: true },
      { id: 'mb-13',cuentaId: 'cb-chile', fecha: daysAgo(4), monto: 18900,  tipo: 'cargo', descripcion: 'TRANSF. MAURICIO TAPIA',   transferenciaId: 't-r039',conciliado: true },
      { id: 'mb-14',cuentaId: 'cb-chile', fecha: daysAgo(5), monto: 24500,  tipo: 'cargo', descripcion: 'TRANSF. DANIELA PEREZ',    transferenciaId: 't-r038',conciliado: true }
    ],
    notificaciones: [],
    bitacora: []
  };
}

// ===========================================================================
// HELPERS
// ===========================================================================
function fmt(n) { if (n == null) return '—'; return '$' + Math.round(n).toLocaleString('es-CL'); }
function fmtShort(n) { if (n >= 1000000) return '$' + (n/1000000).toFixed(1) + 'M'; if (n >= 1000) return '$' + Math.round(n/1000) + 'K'; return fmt(n); }
function fmtDate(iso) { const d = new Date(iso); const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']; return d.getDate().toString().padStart(2,'0') + '-' + meses[d.getMonth()]; }
function fmtDateLong(iso) { const d = new Date(iso); return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }); }
function fmtRelTime(iso) { const diff = Date.now() - new Date(iso).getTime(); const min = Math.floor(diff/60000); const hr = Math.floor(diff/3600000); const day = Math.floor(diff/86400000); if (day > 0) return 'hace ' + day + 'd'; if (hr > 0) return 'hace ' + hr + ' h'; if (min > 0) return 'hace ' + min + ' min'; return 'recién'; }
function escHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function getUser(id) { return state.users.find(u => u.id === id); }
function getProveedor(id) { return state.proveedores.find(p => p.id === id); }
function getCliente(id) { return state.clientes.find(c => c.id === id); }
function getSolicitud(id) { return state.solicitudes.find(s => s.id === id); }
function getTransferencia(id) { return state.transferencias.find(t => t.id === id); }
function getBoleta(id) { return state.boletas.find(b => b.id === id); }
function currentUser() { return state.users.find(u => u.id === state.currentUserId) || state.users[0]; }
function currentRole() { return ROLES[state.currentRole]; }
function nextSolpedCode() { return 'SOL-2026-' + String(state.nextSolpedNum++).padStart(5, '0'); }
function nextReembolsoCode() { return 'REE-2026-' + String(state.nextReembolsoNum++).padStart(5, '0'); }

function bitacoraAdd(accion, detalle) {
  state.bitacora.unshift({ id: uid(), fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion, detalle });
  if (state.bitacora.length > 200) state.bitacora.length = 200;
}

function visibleSolicitudes() {
  const u = currentUser();
  const r = currentRole();
  if (r.canSeeAll) return state.solicitudes;
  return state.solicitudes.filter(s => s.solicitanteId === u.id);
}

function pendientesAprobacion() {
  return state.solicitudes.filter(s => s.estado === 'enviada');
}

function solicitudesPagadasSinBoleta() {
  return state.solicitudes.filter(s => s.estado === 'sin_boleta' || (s.estado === 'pagada' && !s.boletaId));
}

function gastoMes(mes, año) {
  return state.solicitudes.filter(s => {
    const d = new Date(s.fechaCreacion);
    return d.getMonth() === mes && d.getFullYear() === año && ['pagada','sin_boleta','acreditada','conciliada'].includes(s.estado);
  }).reduce((sum, s) => sum + s.monto, 0);
}

function categoriaIcon(cat) {
  const map = { 'Insumos y materiales': '🛠', 'Insumos de oficina': '📎', 'Frutas y snacks saludables': '🍎', 'Papelería y lápices': '📝', 'Artículos de librería': '📚', 'Artículos de aseo y limpieza': '🧽', 'Servicios externos': '🔧', 'Logística y transporte': '🚚', 'Honorarios': '💼', 'Combustible y peajes': '⛽', 'Otros': '📦' };
  return map[cat] || '📦';
}

// ===========================================================================
// ACTIONS
// ===========================================================================
function setRole(rol) {
  state.currentRole = rol;
  // Set a sample user for that role
  const userMap = { admin: 'u-christian', coordinador: 'u-carolina', asistente: 'u-patricia', trabajador: 'u-daniela' };
  state.currentUserId = userMap[rol];
  saveState();
  navigate('dashboard');
}

function navigate(screen, params) {
  currentScreen = screen;
  currentParams = params || {};
  selectedSolicitudId = null;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aceptarSolicitud(id) {
  const s = getSolicitud(id);
  if (!s) return;
  s.estado = 'aprobada';
  s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Aprobada', detalle: '' });
  bitacoraAdd('Aprobó solicitud', s.codigo);
  saveState();
  toast('✓ ' + s.codigo + ' aprobada. Lista para transferir.', 'success');
  render();
}

function rechazarSolicitud(id, comentario) {
  const s = getSolicitud(id);
  if (!s) return;
  s.estado = 'rechazada';
  s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Rechazada', detalle: comentario });
  bitacoraAdd('Rechazó solicitud', s.codigo + ' · ' + comentario);
  saveState();
  toast('Solicitud rechazada. Notificación enviada al solicitante.', 'success');
  closeModal();
  render();
}

function pedirInfo(id, comentario) {
  const s = getSolicitud(id);
  if (!s) return;
  s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Pidió más información', detalle: comentario });
  bitacoraAdd('Pidió más info', s.codigo + ' · ' + comentario);
  saveState();
  toast('Mensaje enviado al solicitante.', 'success');
  closeModal();
  render();
}

function crearSolicitud(data) {
  const tipo = data.tipo;
  const codigo = tipo === 'SOLPED' ? nextSolpedCode() : nextReembolsoCode();
  const id = (tipo === 'SOLPED' ? 's-' : 'r-') + uid();
  const sol = {
    id, codigo, tipo, solicitanteId: state.currentUserId,
    monto: data.monto, motivo: data.motivo, categoria: data.categoria,
    proveedorId: data.proveedorId, clienteId: data.clienteId,
    estado: 'enviada', prioridad: data.prioridad,
    fechaCreacion: new Date().toISOString(),
    fechaRequerida: data.fechaRequerida,
    adjuntos: data.adjuntos || [],
    historial: [{ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Solicitud creada', detalle: '' }]
  };
  if (tipo === 'REEMBOLSO' && data.boletaArchivo) {
    const boletaId = 'b-' + uid();
    state.boletas.push({ id: boletaId, solicitudId: id, archivo: data.boletaArchivo, ocr: data.ocrSimulado, validada: true });
    sol.boletaId = boletaId;
  }
  state.solicitudes.unshift(sol);
  bitacoraAdd('Creó ' + tipo, codigo);
  saveState();
  toast('✓ ' + codigo + ' creada. Notificación enviada al Administrador.', 'success');
  navigate('mis_solicitudes');
}

function cargarVoucher(solicitudId, dataUrl) {
  const s = getSolicitud(solicitudId);
  if (!s) return;
  let trans = s.transferenciaId ? getTransferencia(s.transferenciaId) : null;
  if (!trans) {
    const transId = 't-' + uid();
    trans = { id: transId, solicitudIds: [solicitudId], monto: s.monto, fecha: new Date().toISOString(), cuentaOrigenId: 'cb-chile', voucher: dataUrl, ocrMonto: s.monto };
    state.transferencias.push(trans);
    s.transferenciaId = transId;
  } else {
    trans.voucher = dataUrl;
    trans.ocrMonto = s.monto;
    trans.fecha = new Date().toISOString();
  }
  s.estado = 'sin_boleta';
  s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Voucher cargado · OCR detectó ' + fmt(s.monto), detalle: '' });
  bitacoraAdd('Cargó voucher', s.codigo);
  saveState();
  toast('✓ Voucher cargado. OCR confirmó ' + fmt(s.monto) + '. Notificación enviada al solicitante.', 'success');
  render();
}

function subirBoletaSolicitud(solicitudId, dataUrl, ocrSimulado) {
  const s = getSolicitud(solicitudId);
  if (!s) return;
  const boletaId = 'b-' + uid();
  state.boletas.push({ id: boletaId, solicitudId, archivo: dataUrl, ocr: ocrSimulado, validada: true });
  s.boletaId = boletaId;
  s.estado = 'acreditada';
  s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Boleta cargada · OCR ' + fmt(ocrSimulado.monto), detalle: '' });
  bitacoraAdd('Cargó boleta', s.codigo);
  saveState();
  toast('✓ Boleta cargada. ' + s.codigo + ' está acreditada.', 'success');
  render();
}

function ejecutarConciliacion() {
  let cuenta = 0;
  state.movimientosBancarios.forEach(m => {
    if (m.conciliado) return;
    // try to find SOLPED with matching monto + recent transferencia
    const transAct = state.transferencias.find(t => t.monto === m.monto && !state.movimientosBancarios.some(mm => mm.transferenciaId === t.id));
    if (transAct) {
      m.transferenciaId = transAct.id;
      m.conciliado = true;
      cuenta++;
      transAct.solicitudIds.forEach(sid => {
        const s = getSolicitud(sid);
        if (s && (s.estado === 'sin_boleta' || s.estado === 'acreditada')) {
          s.estado = 'conciliada';
          s.historial.push({ fecha: new Date().toISOString(), usuarioId: state.currentUserId, accion: 'Conciliada con cartola bancaria', detalle: '' });
        }
      });
    }
  });
  saveState();
  toast(cuenta > 0 ? '✓ Se conciliaron ' + cuenta + ' movimientos automáticamente.' : 'No se encontraron nuevos matches automáticos.', 'success');
  render();
}

// ===========================================================================
// MODAL & TOAST
// ===========================================================================
function openModal(content) {
  modalOpen = content;
  render();
}
function closeModal() {
  modalOpen = null;
  render();
}
function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.innerHTML = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===========================================================================
// RENDER
// ===========================================================================
function render() {
  const app = document.getElementById('app');
  app.innerHTML = renderShell();
  attachEvents();
  if (modalOpen) renderModal();
}

function renderShell() {
  return `
    <div class="app">
      ${renderSidebar()}
      <main class="main">
        ${renderTopbar()}
        <div class="content">
          ${renderScreen()}
        </div>
      </main>
    </div>
  `;
}

function renderSidebar() {
  const r = currentRole();
  const isAdmin = state.currentRole === 'admin';
  const isTrab = state.currentRole === 'trabajador';
  const pendCount = pendientesAprobacion().length;

  let nav = '';
  if (isAdmin) {
    nav = `
      <div class="nav-section-title">Principal</div>
      <ul class="nav">
        <li><a data-nav="dashboard" class="${currentScreen==='dashboard'?'active':''}"><span class="ico">▦</span> Inicio</a></li>
        <li><a data-nav="inbox"     class="${currentScreen==='inbox'?'active':''}"><span class="ico">📬</span> Bandeja aprobación ${pendCount?`<span class="pill">${pendCount}</span>`:''}</a></li>
      </ul>
      <div class="nav-section-title">Solicitudes</div>
      <ul class="nav">
        <li><a data-nav="solicitudes" data-tipo="SOLPED"     class="${currentScreen==='solicitudes' && currentParams.tipo==='SOLPED'?'active':''}"><span class="ico">📝</span> SOLPED (compras)</a></li>
        <li><a data-nav="solicitudes" data-tipo="REEMBOLSO"  class="${currentScreen==='solicitudes' && currentParams.tipo==='REEMBOLSO'?'active':''}"><span class="ico">💸</span> Reembolsos</a></li>
        <li><a data-nav="nueva" class="${currentScreen==='nueva'?'active':''}"><span class="ico">＋</span> Nueva solicitud</a></li>
      </ul>
      <div class="nav-section-title">Tesorería</div>
      <ul class="nav">
        <li><a data-nav="transferencias" class="${currentScreen==='transferencias'?'active':''}"><span class="ico">⇄</span> Transferencias</a></li>
        <li><a data-nav="boletas"        class="${currentScreen==='boletas'?'active':''}"><span class="ico">🧾</span> Boletas</a></li>
        <li><a data-nav="conciliacion"   class="${currentScreen==='conciliacion'?'active':''}"><span class="ico">⚖</span> Conciliación</a></li>
      </ul>
      <div class="nav-section-title">Análisis</div>
      <ul class="nav">
        <li><a data-nav="reportes"    class="${currentScreen==='reportes'?'active':''}"><span class="ico">📊</span> Reportes</a></li>
        <li><a data-nav="proveedores" class="${currentScreen==='proveedores'?'active':''}"><span class="ico">🏢</span> Proveedores</a></li>
        <li><a data-nav="config"      class="${currentScreen==='config'?'active':''}"><span class="ico">⚙</span> Configuración</a></li>
      </ul>
    `;
  } else if (isTrab) {
    nav = `
      <div class="nav-section-title">Mi cuenta</div>
      <ul class="nav">
        <li><a data-nav="dashboard"        class="${currentScreen==='dashboard'?'active':''}"><span class="ico">▦</span> Inicio</a></li>
        <li><a data-nav="mis_solicitudes"  class="${currentScreen==='mis_solicitudes'?'active':''}"><span class="ico">💸</span> Mis reembolsos</a></li>
        <li><a data-nav="nueva"            class="${currentScreen==='nueva'?'active':''}"><span class="ico">＋</span> Nuevo reembolso</a></li>
      </ul>
    `;
  } else {
    nav = `
      <div class="nav-section-title">Mi cuenta</div>
      <ul class="nav">
        <li><a data-nav="dashboard"        class="${currentScreen==='dashboard'?'active':''}"><span class="ico">▦</span> Inicio</a></li>
        <li><a data-nav="mis_solicitudes"  class="${currentScreen==='mis_solicitudes'?'active':''}"><span class="ico">📝</span> Mis solicitudes</a></li>
        <li><a data-nav="nueva"            class="${currentScreen==='nueva'?'active':''}"><span class="ico">＋</span> Nueva solicitud</a></li>
        <li><a data-nav="por_subir_boleta" class="${currentScreen==='por_subir_boleta'?'active':''}"><span class="ico">📷</span> Por subir boleta ${(state.solicitudes.filter(s=>s.solicitanteId===state.currentUserId && s.estado==='sin_boleta').length)?`<span class="pill">${state.solicitudes.filter(s=>s.solicitanteId===state.currentUserId && s.estado==='sin_boleta').length}</span>`:''}</a></li>
      </ul>
    `;
  }

  return `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-mark">eem</div>
        <div class="logo-text">SOLPED EEM</div>
      </div>
      ${nav}
      <div class="sidebar-foot" data-action="reset">↻ Restablecer datos demo</div>
    </aside>
  `;
}

function renderTopbar() {
  const u = currentUser();
  const titles = { dashboard:'Inicio', inbox:'Bandeja de aprobación', solicitudes: currentParams.tipo==='REEMBOLSO'?'Reembolsos':'SOLPED (compras)', nueva:'Nueva solicitud', transferencias:'Transferencias', boletas:'Boletas', conciliacion:'Conciliación bancaria', reportes:'Reportes', proveedores:'Proveedores', config:'Configuración', mis_solicitudes: state.currentRole==='trabajador'?'Mis reembolsos':'Mis solicitudes', por_subir_boleta:'Por subir boleta', detalle:'Detalle de solicitud' };
  const switcherHtml = Object.entries(ROLES).map(([key, r]) => `<span class="role-pill ${state.currentRole===key?'active':''}" data-role="${key}">${r.icon} ${r.label}</span>`).join('');

  return `
    <div class="topbar">
      <div class="topbar-title">${escHtml(titles[currentScreen] || 'Inicio')}</div>
      <div class="topbar-right">
        <div class="role-switch">${switcherHtml}</div>
        <div class="bell">🔔${pendientesAprobacion().length>0 && state.currentRole==='admin' ? '<span class="bell-dot"></span>' : ''}</div>
        <div class="user">${escHtml(u.nombre)}</div>
      </div>
    </div>
  `;
}

function renderScreen() {
  switch (currentScreen) {
    case 'dashboard':        return renderDashboard();
    case 'inbox':            return renderInbox();
    case 'solicitudes':      return renderSolicitudesList();
    case 'mis_solicitudes':  return renderMisSolicitudes();
    case 'por_subir_boleta': return renderPorSubirBoleta();
    case 'nueva':            return renderNueva();
    case 'transferencias':   return renderTransferencias();
    case 'boletas':          return renderBoletas();
    case 'conciliacion':     return renderConciliacion();
    case 'reportes':         return renderReportes();
    case 'proveedores':      return renderProveedores();
    case 'config':           return renderConfig();
    case 'detalle':          return renderDetalleSolicitud();
    default:                 return renderDashboard();
  }
}

// ===========================================================================
// SCREEN: DASHBOARD
// ===========================================================================
function renderDashboard() {
  const r = state.currentRole;
  const u = currentUser();
  if (r === 'admin')      return renderDashboardAdmin();
  if (r === 'trabajador') return renderDashboardTrabajador();
  return renderDashboardSolicitante();
}

function renderDashboardAdmin() {
  const today = new Date('2026-05-07');
  const fechaStr = today.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const pendSol = state.solicitudes.filter(s => s.estado==='enviada' && s.tipo==='SOLPED').length;
  const pendRee = state.solicitudes.filter(s => s.estado==='enviada' && s.tipo==='REEMBOLSO').length;
  const sinBoleta = solicitudesPagadasSinBoleta();
  const sinBoletaMonto = sinBoleta.reduce((s,x)=>s+x.monto,0);
  const sinConciliar = state.movimientosBancarios.filter(m=>!m.conciliado).length;
  const gastoMay = gastoMes(4, 2026);
  const gastoAbr = 20100000;

  const heroSub = `${pendSol+pendRee} solicitudes esperando tu aprobación · ${sinBoleta.length} sin boleta · ${fmt(gastoMay)} gastado en mayo`;

  const pendList = pendientesAprobacion().slice(0, 5);

  return `
    <div class="hero">
      <div class="hero-date">📅 ${fechaStr}</div>
      <div class="hero-title">Torre de control — Administración</div>
      <div class="hero-sub">${heroSub}</div>
    </div>

    <div class="kpi-row">
      <div class="kpi"><div class="kpi-text"><div class="lbl">SOLPED por aprobar</div><div class="val" style="color:var(--p-blue);">${pendSol}</div><div class="sub">Compras anticipadas</div></div><div class="kpi-icon ico-blue">📋</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Reembolsos por aprobar</div><div class="val" style="color:var(--p-cyan);">${pendRee}</div><div class="sub">Gastos ya realizados</div></div><div class="kpi-icon ico-cyan">💸</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Pagadas sin boleta</div><div class="val" style="color:var(--p-red);">${sinBoleta.length}</div><div class="sub down">${fmt(sinBoletaMonto)} sin respaldo</div></div><div class="kpi-icon ico-red">⚠</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Gasto del mes</div><div class="val" style="color:var(--p-purple);">${fmtShort(gastoMay)}</div><div class="sub up">↓ ${Math.round((gastoAbr-gastoMay)/gastoAbr*100)}% vs Abril</div></div><div class="kpi-icon ico-purple">💳</div></div>
    </div>

    <div class="card" style="margin-bottom:22px;">
      <div class="card-head">
        <h3>Esperando tu acción</h3>
        <button class="btn-link" data-nav="inbox">Ir a bandeja →</button>
      </div>
      ${pendList.length === 0 ? `<div class="empty-state"><div class="ico-empty">✓</div>No hay solicitudes pendientes. Estás al día.</div>` : `
      <table class="data">
        <thead><tr><th>Tipo</th><th>Código</th><th>Solicitante</th><th>Motivo</th><th>Monto</th><th>Acciones</th></tr></thead>
        <tbody>
          ${pendList.map(s => {
            const u = getUser(s.solicitanteId);
            return `<tr>
              <td><span class="badge ${s.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}">${s.tipo}</span></td>
              <td class="mono">${s.codigo}</td>
              <td>${escHtml(u.nombre)} <span style="color:var(--muted);font-size:11px;">· ${ROLES[u.rol].label}</span></td>
              <td>${escHtml(s.motivo.slice(0,60))}${s.motivo.length>60?'…':''}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td>
                <button class="btn btn-success btn-sm" data-action="aceptar" data-id="${s.id}">✓ Aceptar</button>
                <button class="btn btn-danger btn-sm" data-action="rechazar" data-id="${s.id}">✕ Rechazar</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>

    <div class="card">
      <div class="card-head"><h3>Solicitudes recientes</h3><button class="btn-link" data-nav="solicitudes" data-tipo="SOLPED">Ver todas →</button></div>
      <table class="data">
        <thead><tr><th>Tipo</th><th>Código</th><th>Solicitante</th><th>Categoría</th><th>Monto</th><th>Estado</th></tr></thead>
        <tbody>
          ${state.solicitudes.filter(s=>s.estado!=='enviada').slice(0,8).map(s => {
            const u = getUser(s.solicitanteId);
            const e = ESTADOS[s.estado] || ESTADOS.borrador;
            return `<tr style="cursor:pointer" data-action="abrir-detalle" data-id="${s.id}">
              <td><span class="badge ${s.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}">${s.tipo}</span></td>
              <td class="mono">${s.codigo}</td>
              <td>${escHtml(u.nombre)}</td>
              <td>${escHtml(s.categoria)}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDashboardSolicitante() {
  const u = currentUser();
  const today = new Date('2026-05-07');
  const fechaStr = today.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const mias = state.solicitudes.filter(s => s.solicitanteId === u.id);
  const enviadas = mias.filter(s=>s.estado==='enviada').length;
  const aprobadas = mias.filter(s=>s.estado==='aprobada').length;
  const sinBoleta = mias.filter(s=>s.estado==='sin_boleta').length;
  const pagadasMes = mias.filter(s=>['pagada','sin_boleta','acreditada','conciliada'].includes(s.estado)).reduce((sum,s)=>sum+s.monto,0);

  return `
    <div class="hero">
      <div class="hero-date">📅 ${fechaStr}</div>
      <div class="hero-title">Hola, ${escHtml(u.nombre.split(' ')[0])}</div>
      <div class="hero-sub">${enviadas} pendientes de aprobación · ${sinBoleta} esperando tu boleta · ${fmt(pagadasMes)} gestionado en mayo</div>
    </div>

    <div class="kpi-row">
      <div class="kpi"><div class="kpi-text"><div class="lbl">Esperando aprobación</div><div class="val" style="color:var(--p-amber);">${enviadas}</div></div><div class="kpi-icon ico-amber">⏳</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Aprobadas (sin transferir)</div><div class="val" style="color:var(--p-blue);">${aprobadas}</div></div><div class="kpi-icon ico-blue">✓</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Por subir boleta</div><div class="val" style="color:var(--p-red);">${sinBoleta}</div><div class="sub down">¡Carga la boleta!</div></div><div class="kpi-icon ico-red">📷</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Total gestionado</div><div class="val" style="color:var(--p-purple);">${fmtShort(pagadasMes)}</div><div class="sub">Mayo 2026</div></div><div class="kpi-icon ico-purple">💳</div></div>
    </div>

    ${sinBoleta > 0 ? `
    <div class="card" style="margin-bottom:22px;border-left:4px solid var(--brand-accent);">
      <div class="card-head">
        <h3>Acciones requeridas — sube tu boleta</h3>
        <button class="btn btn-primary btn-sm" data-nav="por_subir_boleta">Ver todas</button>
      </div>
      <table class="data">
        <thead><tr><th>Código</th><th>Proveedor</th><th>Categoría</th><th>Monto</th><th></th></tr></thead>
        <tbody>
          ${mias.filter(s=>s.estado==='sin_boleta').slice(0,3).map(s => {
            const p = getProveedor(s.proveedorId);
            return `<tr><td class="mono">${s.codigo}</td><td>${escHtml(p?p.razon:'—')}</td><td>${escHtml(s.categoria)}</td><td><strong>${fmt(s.monto)}</strong></td><td><button class="btn btn-primary btn-sm" data-action="subir-boleta" data-id="${s.id}">📷 Subir boleta</button></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="card">
      <div class="card-head">
        <h3>Mis solicitudes recientes</h3>
        <button class="btn btn-primary btn-sm" data-nav="nueva">＋ Nueva solicitud</button>
      </div>
      ${mias.length === 0 ? `<div class="empty-state"><div class="ico-empty">📝</div>Aún no has creado solicitudes. Crea la primera con el botón "Nueva solicitud".</div>` : `
      <table class="data">
        <thead><tr><th>Tipo</th><th>Código</th><th>Categoría</th><th>Monto</th><th>Estado</th></tr></thead>
        <tbody>
          ${mias.slice(0, 8).map(s => {
            const e = ESTADOS[s.estado] || ESTADOS.borrador;
            return `<tr style="cursor:pointer" data-action="abrir-detalle" data-id="${s.id}">
              <td><span class="badge ${s.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}">${s.tipo}</span></td>
              <td class="mono">${s.codigo}</td>
              <td>${escHtml(s.categoria)}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function renderDashboardTrabajador() {
  const u = currentUser();
  const today = new Date('2026-05-07');
  const fechaStr = today.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const mios = state.solicitudes.filter(s => s.solicitanteId === u.id && s.tipo === 'REEMBOLSO');
  const pendientes = mios.filter(s=>s.estado==='enviada').length;
  const totalMes = mios.filter(s=>['pagada','sin_boleta','conciliada'].includes(s.estado)).reduce((sum,s)=>sum+s.monto,0);

  return `
    <div class="hero">
      <div class="hero-date">📅 ${fechaStr}</div>
      <div class="hero-title">Hola, ${escHtml(u.nombre.split(' ')[0])}</div>
      <div class="hero-sub">${pendientes} reembolsos pendientes · ${fmt(totalMes)} reembolsado este mes</div>
    </div>

    <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="kpi"><div class="kpi-text"><div class="lbl">Reembolsos pendientes</div><div class="val" style="color:var(--p-amber);">${pendientes}</div></div><div class="kpi-icon ico-amber">⏳</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Pagados este mes</div><div class="val" style="color:var(--p-green);">${mios.filter(s=>['pagada','conciliada'].includes(s.estado)).length}</div></div><div class="kpi-icon ico-green">✓</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Total reembolsado</div><div class="val" style="color:var(--p-purple);">${fmtShort(totalMes)}</div><div class="sub">Mayo 2026</div></div><div class="kpi-icon ico-purple">💳</div></div>
    </div>

    <div style="background:var(--p-cyan-bg);color:#0e7490;padding:14px 18px;border-radius:12px;margin-bottom:16px;font-size:13.5px;">
      <strong>💡 ¿Cómo funciona un reembolso?</strong> Si gastaste plata de tu bolsillo (bencina, peaje, almuerzo cliente, etc.), súbela aquí con foto de la boleta y te transferimos. Generalmente se aprueba el mismo día.
    </div>

    <div style="display:flex;gap:12px;margin-bottom:22px;">
      <button class="btn btn-primary btn-big" data-nav="nueva">＋  Nuevo reembolso</button>
      <button class="btn btn-ghost btn-big" data-nav="mis_solicitudes">Ver mis reembolsos</button>
    </div>

    <div class="card">
      <div class="card-head"><h3>Mis reembolsos recientes</h3></div>
      ${mios.length === 0 ? `<div class="empty-state"><div class="ico-empty">💸</div>Aún no has solicitado reembolsos. Cuando hagas un gasto, súbelo aquí.</div>` : `
      <table class="data">
        <thead><tr><th>Código</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th></tr></thead>
        <tbody>
          ${mios.slice(0,8).map(s => {
            const e = ESTADOS[s.estado] || ESTADOS.borrador;
            return `<tr style="cursor:pointer" data-action="abrir-detalle" data-id="${s.id}">
              <td class="mono">${s.codigo}</td>
              <td>${fmtDate(s.fechaCreacion)}</td>
              <td>${escHtml(s.motivo.slice(0,50))}${s.motivo.length>50?'…':''}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

// ===========================================================================
// SCREEN: INBOX (BANDEJA APROBACIÓN - ADMIN)
// ===========================================================================
function renderInbox() {
  const list = pendientesAprobacion();
  if (list.length === 0) {
    return `
      <div class="pageHead"><div><div class="crumb">Inicio · Bandeja de aprobación</div><h2>Bandeja de aprobación</h2></div></div>
      <div class="card"><div class="empty-state"><div class="ico-empty">✓</div><div style="font-weight:600;color:var(--brand-dark);font-size:16px;">No hay solicitudes pendientes</div><div style="margin-top:6px;">Estás al día. Vuelve cuando lleguen nuevas solicitudes.</div></div></div>
    `;
  }
  const sel = selectedSolicitudId && list.find(s=>s.id===selectedSolicitudId) ? selectedSolicitudId : list[0].id;
  const s = getSolicitud(sel);
  const u = getUser(s.solicitanteId);
  const p = getProveedor(s.proveedorId);
  const c = getCliente(s.clienteId);

  return `
    <div class="pageHead"><div><div class="crumb">Inicio · Bandeja de aprobación</div><h2>Bandeja de aprobación <span style="color:var(--brand-accent);">(${list.length})</span></h2></div></div>

    <div class="inbox-grid">
      <div class="inbox-list">
        ${list.map(item => {
          const usr = getUser(item.solicitanteId);
          return `<div class="inbox-item ${item.id===sel?'active':''}" data-action="select-inbox" data-id="${item.id}">
            <div class="inbox-item-head"><span class="inbox-item-name">${escHtml(usr.nombre)}</span><span class="inbox-item-time">${fmtRelTime(item.fechaCreacion)}</span></div>
            <div class="inbox-item-detail"><span class="badge ${item.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}" style="margin-right:6px;">${item.tipo}</span>${escHtml(item.categoria)}</div>
            <div class="inbox-item-amount">${fmt(item.monto)}</div>
          </div>`;
        }).join('')}
      </div>

      <div class="inbox-detail">
        <div class="id-head">
          <div>
            <div style="font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${s.tipo} · Pendiente de aprobación</div>
            <div style="font-size:22px;font-weight:700;color:var(--brand-dark);margin-top:4px;">${s.codigo}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Monto solicitado</div>
            <div style="font-size:28px;font-weight:700;color:var(--brand-dark);">${fmt(s.monto)}</div>
          </div>
        </div>

        <div class="id-meta-grid">
          <div class="id-meta"><div class="lab">Solicitante</div><div class="v">${escHtml(u.nombre)} · ${ROLES[u.rol].label}</div></div>
          <div class="id-meta"><div class="lab">Fecha solicitud</div><div class="v">${fmtDateLong(s.fechaCreacion)}</div></div>
          <div class="id-meta"><div class="lab">Categoría</div><div class="v">${categoriaIcon(s.categoria)} ${escHtml(s.categoria)}</div></div>
          <div class="id-meta"><div class="lab">Proveedor</div><div class="v">${p ? escHtml(p.razon) : '—'}</div></div>
          <div class="id-meta"><div class="lab">Cliente / proyecto</div><div class="v">${c ? escHtml(c.nombre) : '—'}</div></div>
          <div class="id-meta"><div class="lab">Prioridad</div><div class="v" style="${s.prioridad==='alta'?'color:var(--brand-accent);':''}">${s.prioridad === 'alta' ? 'Alta — Urgente' : s.prioridad === 'baja' ? 'Baja' : 'Normal'}</div></div>
        </div>

        <div style="background:#fafbfc;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
          <div style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalle del gasto</div>
          <div style="margin-top:6px;font-size:13.5px;line-height:1.6;color:#374151;">${escHtml(s.motivo)}</div>
        </div>

        ${u.topeMensual ? `<div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Tope mensual del solicitante: ${fmt(u.topeMensual)}</div>` : ''}

        <div class="id-actions">
          <button class="btn btn-success btn-big" data-action="aceptar" data-id="${s.id}">✓  Aceptar y proceder a transferir</button>
          <button class="btn btn-danger btn-big" data-action="rechazar" data-id="${s.id}">✕  Rechazar</button>
          <button class="btn btn-ghost" data-action="pedir-info" data-id="${s.id}" style="margin-left:auto;">💬 Pedir más info</button>
        </div>
      </div>
    </div>
  `;
}

// ===========================================================================
// SCREEN: SOLICITUDES (LIST - ADMIN)
// ===========================================================================
function renderSolicitudesList() {
  const tipoFilter = currentParams.tipo || 'SOLPED';
  const list = state.solicitudes.filter(s => s.tipo === tipoFilter);
  const tituloPagina = tipoFilter === 'SOLPED' ? 'Solicitudes de pedido (SOLPED)' : 'Reembolsos';

  return `
    <div class="pageHead">
      <div>
        <div class="crumb">Inicio · ${tipoFilter==='SOLPED'?'SOLPED':'Reembolsos'}</div>
        <h2>${tituloPagina}</h2>
      </div>
      <button class="btn btn-primary" data-nav="nueva" data-tipo="${tipoFilter}">＋ ${tipoFilter==='SOLPED'?'Nueva SOLPED':'Nuevo reembolso'}</button>
    </div>

    ${tipoFilter === 'REEMBOLSO' ? `<div style="background:var(--p-cyan-bg);color:#0e7490;padding:14px 18px;border-radius:12px;margin-bottom:16px;font-size:13.5px;"><strong>💡 Diferencia clave:</strong> Un reembolso es un gasto que ya fue realizado (de bolsillo del solicitante) y necesita ser devuelto. La boleta se adjunta al momento de solicitar.</div>` : ''}

    <div class="filter-bar">
      <input type="text" placeholder="Buscar por código, motivo o solicitante…" style="flex:1;max-width:380px;" id="search-sol" />
      <select id="filter-estado">
        <option value="">Todos los estados</option>
        ${Object.entries(ESTADOS).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}
      </select>
      <select id="filter-solicitante">
        <option value="">Todos los solicitantes</option>
        ${state.users.map(u => `<option value="${u.id}">${escHtml(u.nombre)}</option>`).join('')}
      </select>
      <button class="btn btn-ghost right">Exportar</button>
    </div>

    <div class="card">
      ${list.length === 0 ? `<div class="empty-state"><div class="ico-empty">📝</div>No hay ${tipoFilter==='SOLPED'?'SOLPED':'reembolsos'} aún.</div>` : `
      <table class="data">
        <thead><tr><th>Código</th><th>Fecha</th><th>Solicitante</th><th>Categoría</th><th>${tipoFilter==='SOLPED'?'Proveedor':'Concepto'}</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${list.map(s => {
            const u = getUser(s.solicitanteId);
            const p = getProveedor(s.proveedorId);
            const e = ESTADOS[s.estado] || ESTADOS.borrador;
            return `<tr style="cursor:pointer" data-action="abrir-detalle" data-id="${s.id}">
              <td class="mono">${s.codigo}</td>
              <td>${fmtDate(s.fechaCreacion)}</td>
              <td>${escHtml(u.nombre)}</td>
              <td>${escHtml(s.categoria)}</td>
              <td>${tipoFilter==='SOLPED' ? escHtml(p?p.razon:'—') : escHtml(s.motivo.slice(0,40))+(s.motivo.length>40?'…':'')}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
              <td><button class="btn-link" data-action="abrir-detalle" data-id="${s.id}">Ver</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

// ===========================================================================
// SCREEN: MIS SOLICITUDES
// ===========================================================================
function renderMisSolicitudes() {
  const u = currentUser();
  const isTrab = state.currentRole === 'trabajador';
  const list = state.solicitudes.filter(s => s.solicitanteId === u.id && (!isTrab || s.tipo === 'REEMBOLSO'));
  const titulo = isTrab ? 'Mis reembolsos' : 'Mis solicitudes';

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · ${titulo}</div><h2>${titulo}</h2></div>
      <button class="btn btn-primary" data-nav="nueva">＋ ${isTrab?'Nuevo reembolso':'Nueva solicitud'}</button>
    </div>

    <div class="card">
      ${list.length === 0 ? `<div class="empty-state"><div class="ico-empty">📝</div>Aún no has creado ${isTrab?'reembolsos':'solicitudes'}. Crea ${isTrab?'el primero':'la primera'} con el botón de arriba.</div>` : `
      <table class="data">
        <thead><tr><th>Tipo</th><th>Código</th><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${list.map(s => {
            const e = ESTADOS[s.estado] || ESTADOS.borrador;
            return `<tr style="cursor:pointer" data-action="abrir-detalle" data-id="${s.id}">
              <td><span class="badge ${s.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}">${s.tipo}</span></td>
              <td class="mono">${s.codigo}</td>
              <td>${fmtDate(s.fechaCreacion)}</td>
              <td>${escHtml(s.motivo.slice(0,50))}${s.motivo.length>50?'…':''}</td>
              <td><strong>${fmt(s.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
              <td>${s.estado === 'sin_boleta' ? `<button class="btn btn-primary btn-sm" data-action="subir-boleta" data-id="${s.id}">📷 Boleta</button>` : `<button class="btn-link" data-action="abrir-detalle" data-id="${s.id}">Ver</button>`}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    </div>
  `;
}

function renderPorSubirBoleta() {
  const u = currentUser();
  const list = state.solicitudes.filter(s => s.solicitanteId === u.id && s.estado === 'sin_boleta');
  return `
    <div class="pageHead"><div><div class="crumb">Inicio · Por subir boleta</div><h2>Solicitudes esperando tu boleta</h2></div></div>
    ${list.length === 0 ? `<div class="card"><div class="empty-state"><div class="ico-empty">✓</div><div style="font-weight:600;color:var(--brand-dark);font-size:16px;">¡Estás al día!</div><div style="margin-top:6px;">No tienes boletas pendientes de cargar.</div></div></div>` : `
    <div class="card">
      <table class="data">
        <thead><tr><th>Código</th><th>Proveedor</th><th>Categoría</th><th>Monto a respaldar</th><th>Días desde transferencia</th><th></th></tr></thead>
        <tbody>
          ${list.map(s => {
            const p = getProveedor(s.proveedorId);
            const dias = Math.floor((Date.now() - new Date(s.fechaCreacion).getTime()) / 86400000);
            return `<tr><td class="mono">${s.codigo}</td><td>${escHtml(p?p.razon:'—')}</td><td>${escHtml(s.categoria)}</td><td><strong>${fmt(s.monto)}</strong></td><td style="${dias>5?'color:var(--brand-accent);font-weight:600;':''}">${dias} días</td><td><button class="btn btn-primary btn-sm" data-action="subir-boleta" data-id="${s.id}">📷 Subir boleta</button></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  `;
}

// ===========================================================================
// SCREEN: NUEVA SOLICITUD
// ===========================================================================
function renderNueva() {
  const r = currentRole();
  const isTrab = state.currentRole === 'trabajador';
  if (isTrab) solicitudTipoBuilder = 'REEMBOLSO';
  if (currentParams.tipo) solicitudTipoBuilder = currentParams.tipo;

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Nueva solicitud</div><h2>Nueva solicitud</h2></div>
      <div>
        <button class="btn btn-ghost" data-nav="${isTrab?'mis_solicitudes':'mis_solicitudes'}">Cancelar</button>
        <button class="btn btn-primary" id="btn-enviar-solicitud">Enviar solicitud</button>
      </div>
    </div>

    <div class="card" style="padding:24px;">
      ${!isTrab ? `
      <div style="margin-bottom:22px;">
        <label style="font-size:12px;font-weight:700;color:var(--brand-dark);text-transform:uppercase;letter-spacing:0.4px;display:block;margin-bottom:10px;">¿Qué tipo de solicitud quieres crear?</label>
        <div class="type-toggle">
          <div class="type-option ${solicitudTipoBuilder==='SOLPED'?'selected':''}" data-action="set-tipo" data-tipo="SOLPED">
            <div class="t-icon ico-blue">📝</div>
            <div><div class="t-title">SOLPED — Pedido de dinero</div><div class="t-sub">Necesito plata para hacer una compra. Subo la boleta después.</div></div>
          </div>
          <div class="type-option ${solicitudTipoBuilder==='REEMBOLSO'?'selected':''}" data-action="set-tipo" data-tipo="REEMBOLSO">
            <div class="t-icon ico-cyan">💸</div>
            <div><div class="t-title">Reembolso — Ya gasté</div><div class="t-sub">Pagué de mi bolsillo y necesito que me devuelvan. Adjunto boleta ahora.</div></div>
          </div>
        </div>
      </div>` : `
      <div style="background:var(--p-cyan-bg);color:#0e7490;padding:14px 18px;border-radius:12px;margin-bottom:22px;font-size:13.5px;"><strong>💡 Reembolso:</strong> Adjunta la boleta del gasto que ya hiciste. Te transferimos al aprobar.</div>
      `}

      <form id="form-nueva">
        <div class="form-grid">
          <div class="form-group">
            <label>Monto ${solicitudTipoBuilder==='SOLPED'?'solicitado':'gastado'}</label>
            <input type="number" name="monto" required placeholder="245000" />
            <span class="hint">Indica el monto en pesos sin puntos.</span>
          </div>
          <div class="form-group">
            <label>${solicitudTipoBuilder==='SOLPED'?'Fecha requerida':'Fecha del gasto'}</label>
            <input type="date" name="fechaRequerida" required value="2026-05-08" />
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select name="categoria" required>
              ${CATEGORIAS.map(c => `<option value="${c}">${categoriaIcon(c)} ${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Proveedor</label>
            <select name="proveedorId">
              <option value="">— Selecciona —</option>
              ${state.proveedores.map(p => `<option value="${p.id}">${escHtml(p.razon)}</option>`).join('')}
            </select>
            <span class="hint">Opcional para reembolsos pequeños.</span>
          </div>
          <div class="form-group">
            <label>Cliente / proyecto asociado</label>
            <select name="clienteId">
              <option value="">— Selecciona —</option>
              ${state.clientes.map(c => `<option value="${c.id}">${escHtml(c.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select name="prioridad">
              <option value="normal">Normal</option>
              <option value="alta">Alta — Urgente</option>
              <option value="baja">Baja — Puede esperar</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Detalle / motivo</label>
            <textarea name="motivo" rows="3" required placeholder="Describe qué vas a comprar y por qué…"></textarea>
          </div>
          ${solicitudTipoBuilder==='REEMBOLSO' ? `
          <div class="form-group full">
            <label>Boleta o factura del gasto (obligatorio)</label>
            <div class="dropzone" id="dz-boleta-reem">
              <div class="dropzone-icon">⬆</div>
              <div class="dropzone-text">Arrastra la boleta aquí o haz clic para subir</div>
              <div class="dropzone-sub">PDF, JPG, PNG · máx. 10 MB</div>
              <input type="file" id="file-boleta-reem" style="display:none;" accept="image/*,.pdf" />
            </div>
            <div id="boleta-preview"></div>
          </div>
          ` : `
          <div class="form-group full">
            <label>Adjuntos (cotización, mail, etc.) — opcional</label>
            <div class="dropzone">
              <div class="dropzone-icon">⬆</div>
              <div class="dropzone-text">Arrastra archivos aquí o haz clic para subir</div>
              <div class="dropzone-sub">PDF, JPG, PNG · máx. 10 MB</div>
            </div>
          </div>
          `}
        </div>

        <div style="margin-top:18px;background:var(--p-amber-bg);padding:12px 16px;border-radius:10px;font-size:12.5px;color:#92400e;">
          ℹ️  Al enviar, el Administrador (Christian Fuentes) recibirá una notificación con botones para aceptar o rechazar tu solicitud.
        </div>
      </form>
    </div>
  `;
}

// ===========================================================================
// SCREEN: TRANSFERENCIAS
// ===========================================================================
function renderTransferencias() {
  const aprobadas = state.solicitudes.filter(s => s.estado === 'aprobada');
  const pendienteVoucher = aprobadas[0];

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Transferencias</div><h2>Transferencias y voucher</h2></div>
    </div>

    ${pendienteVoucher ? `
    <div class="card" style="margin-bottom:22px;">
      <div class="card-head">
        <h3>${pendienteVoucher.codigo} · Aprobada — esperando voucher de transferencia</h3>
        <span class="badge badge-approved">Aprobada</span>
      </div>
      <div style="padding:22px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;">
          <div class="id-meta"><div class="lab">Solicitante</div><div class="v">${escHtml(getUser(pendienteVoucher.solicitanteId).nombre)}</div></div>
          <div class="id-meta"><div class="lab">Monto a transferir</div><div class="v">${fmt(pendienteVoucher.monto)}</div></div>
          <div class="id-meta"><div class="lab">Destinatario</div><div class="v">${getProveedor(pendienteVoucher.proveedorId)?escHtml(getProveedor(pendienteVoucher.proveedorId).razon):'—'}</div></div>
          <div class="id-meta"><div class="lab">Banco destino</div><div class="v">${getProveedor(pendienteVoucher.proveedorId)?escHtml(getProveedor(pendienteVoucher.proveedorId).banco):'—'}</div></div>
        </div>

        <div style="background:var(--p-blue-bg);border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:13px;color:#1d4ed8;">
          <strong>1.</strong> Realiza la transferencia desde tu banca en línea.<br/>
          <strong>2.</strong> Captura el voucher con <span class="kbd">Cmd</span>+<span class="kbd">Shift</span>+<span class="kbd">4</span> (Mac) o <span class="kbd">Win</span>+<span class="kbd">Shift</span>+<span class="kbd">S</span> (Win).<br/>
          <strong>3.</strong> Pégalo aquí abajo con <span class="kbd">Ctrl</span>+<span class="kbd">V</span>. El sistema detecta el monto y lo vincula automáticamente.
        </div>

        <div class="voucher-zone" tabindex="0" id="voucher-zone" data-solicitud-id="${pendienteVoucher.id}">
          <div class="vbig">📋</div>
          <div class="vt">Pega el voucher aquí</div>
          <div class="vh">Haz clic para activar y luego presiona <span class="kbd">Ctrl</span>+<span class="kbd">V</span> · o sube un archivo</div>
          <div style="margin-top:14px;display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-primary" data-action="simulate-paste" data-id="${pendienteVoucher.id}">📋 Simular pegado de voucher</button>
            <button class="btn btn-ghost" data-action="upload-voucher" data-id="${pendienteVoucher.id}">📷 Subir archivo</button>
          </div>
          <input type="file" id="voucher-file" style="display:none;" accept="image/*,.pdf" />
        </div>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-head"><h3>Transferencias del mes</h3></div>
      <table class="data">
        <thead><tr><th>Fecha</th><th>Cta. origen</th><th>Destinatario</th><th>SOLPED/REE</th><th>Voucher</th><th>Monto</th><th>Estado</th></tr></thead>
        <tbody>
          ${state.transferencias.slice(0,12).map(t => {
            const cta = state.cuentasBancarias.find(c => c.id === t.cuentaOrigenId);
            const sols = t.solicitudIds.map(sid => getSolicitud(sid)).filter(Boolean);
            const dest = sols[0] && sols[0].proveedorId ? getProveedor(sols[0].proveedorId) : null;
            const destName = dest ? dest.razon : (sols[0] ? getUser(sols[0].solicitanteId).nombre + ' (reembolso)' : '—');
            const estadoSol = sols[0] ? sols[0].estado : 'pagada';
            const e = ESTADOS[estadoSol] || ESTADOS.pagada;
            return `<tr>
              <td>${fmtDate(t.fecha)}</td>
              <td>${cta ? escHtml(cta.banco)+' · '+cta.numero : '—'}</td>
              <td>${escHtml(destName)}</td>
              <td class="mono">${sols.map(s=>s.codigo.split('-').slice(-1)[0]).join(', ')}</td>
              <td>${t.voucher ? '📎 sí' : '<span style="color:var(--p-red);">⚠ falta</span>'}</td>
              <td><strong>${fmt(t.monto)}</strong></td>
              <td><span class="badge ${e.className}">${e.label}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===========================================================================
// SCREEN: BOLETAS
// ===========================================================================
function renderBoletas() {
  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Boletas</div><h2>Boletas validadas</h2></div>
    </div>
    <div class="card">
      <table class="data">
        <thead><tr><th>SOLPED</th><th>Folio</th><th>Proveedor (RUT OCR)</th><th>Fecha boleta</th><th>Neto</th><th>IVA</th><th>Total</th></tr></thead>
        <tbody>
          ${state.boletas.map(b => {
            const s = getSolicitud(b.solicitudId);
            return `<tr>
              <td class="mono">${s ? s.codigo : '—'}</td>
              <td class="mono">${escHtml(b.ocr.folio)}</td>
              <td class="mono">${escHtml(b.ocr.rut)}</td>
              <td>${escHtml(b.ocr.fecha)}</td>
              <td>${fmt(b.ocr.neto)}</td>
              <td>${fmt(b.ocr.iva)}</td>
              <td><strong>${fmt(b.ocr.monto)}</strong></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===========================================================================
// SCREEN: CONCILIACIÓN
// ===========================================================================
function renderConciliacion() {
  const totalMov = state.movimientosBancarios.length;
  const conciliados = state.movimientosBancarios.filter(m=>m.conciliado).length;
  const huerfanos = state.movimientosBancarios.filter(m=>!m.conciliado).length;
  const movsList = [...state.movimientosBancarios].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  const transList = [...state.transferencias].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Conciliación bancaria</div><h2>Conciliación bancaria</h2></div>
      <div>
        <button class="btn btn-ghost">Importar cartola</button>
        <button class="btn btn-primary" data-action="ejecutar-conciliacion">Ejecutar matching</button>
      </div>
    </div>

    <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="kpi"><div class="kpi-text"><div class="lbl">Conciliados (auto)</div><div class="val" style="color:var(--p-green);">${conciliados} / ${totalMov}</div><div class="sub up">${Math.round(conciliados/totalMov*100)}% match automático</div></div><div class="kpi-icon ico-green">✓</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Por conciliar</div><div class="val" style="color:var(--p-amber);">${huerfanos}</div><div class="sub">Diferencia menor en monto/fecha</div></div><div class="kpi-icon ico-amber">⚙</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Movimientos huérfanos</div><div class="val" style="color:var(--p-red);">${state.movimientosBancarios.filter(m=>!m.conciliado).length}</div><div class="sub down">Sin SOLPED asociada</div></div><div class="kpi-icon ico-red">⚠</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px;">
      <div class="card">
        <div class="card-head"><h3>Cartola Banco · Mayo 2026</h3></div>
        ${movsList.slice(0,12).map(m => {
          const cls = m.conciliado ? 'background:var(--p-green-bg);' : 'background:var(--brand-accent-soft);';
          return `<div style="padding:13px 16px;border-bottom:1px solid var(--border);${cls}display:flex;justify-content:space-between;">
            <div><strong>${fmtDate(m.fecha)} · ${m.tipo.toUpperCase()}</strong><div style="font-size:11.5px;color:var(--muted);margin-top:2px;">${escHtml(m.descripcion)}</div></div>
            <div class="mono"><strong>-${fmt(m.monto)}</strong></div>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <div class="card-head"><h3>Transferencias registradas</h3></div>
        ${transList.slice(0,12).map(t => {
          const sol = getSolicitud(t.solicitudIds[0]);
          const u = sol ? getUser(sol.solicitanteId) : null;
          const isMatched = state.movimientosBancarios.some(m => m.transferenciaId === t.id);
          const cls = isMatched ? 'background:var(--p-green-bg);' : 'background:var(--p-amber-bg);';
          return `<div style="padding:13px 16px;border-bottom:1px solid var(--border);${cls}display:flex;justify-content:space-between;">
            <div><strong>${sol?sol.codigo:'—'}</strong><div style="font-size:11.5px;color:var(--muted);margin-top:2px;">${fmtDate(t.fecha)} · ${u?escHtml(u.nombre):'—'}</div></div>
            <div class="mono"><strong>${fmt(t.monto)}</strong></div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ===========================================================================
// SCREEN: REPORTES
// ===========================================================================
function renderReportes() {
  // Compute aggregates
  const porCategoria = {};
  const porSolicitante = {};
  const porCliente = {};
  state.solicitudes.filter(s => ['pagada','sin_boleta','acreditada','conciliada'].includes(s.estado)).forEach(s => {
    porCategoria[s.categoria] = (porCategoria[s.categoria] || 0) + s.monto;
    const u = getUser(s.solicitanteId);
    porSolicitante[u.nombre] = (porSolicitante[u.nombre] || 0) + s.monto;
    const c = getCliente(s.clienteId);
    if (c) porCliente[c.nombre] = (porCliente[c.nombre] || 0) + s.monto;
  });
  const totalGasto = Object.values(porCategoria).reduce((a,b)=>a+b,0);
  const sortedCat = Object.entries(porCategoria).sort((a,b)=>b[1]-a[1]);

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Reportes</div><h2>Reportes y análisis</h2></div>
    </div>

    <div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="kpi"><div class="kpi-text"><div class="lbl">Total gastado Mayo</div><div class="val" style="color:var(--p-purple);">${fmtShort(totalGasto)}</div></div><div class="kpi-icon ico-purple">💳</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">Solicitudes acreditadas</div><div class="val" style="color:var(--p-green);">${state.solicitudes.filter(s=>['acreditada','conciliada'].includes(s.estado)).length}</div></div><div class="kpi-icon ico-green">✓</div></div>
      <div class="kpi"><div class="kpi-text"><div class="lbl">% conciliado</div><div class="val" style="color:var(--p-blue);">${Math.round(state.movimientosBancarios.filter(m=>m.conciliado).length / state.movimientosBancarios.length * 100)}%</div></div><div class="kpi-icon ico-blue">⚖</div></div>
    </div>

    <div class="card" style="margin-bottom:22px;">
      <div class="card-head"><h3>Gasto por categoría · Mayo 2026</h3></div>
      <div style="padding:22px;">
        ${sortedCat.map(([cat, monto]) => {
          const pct = Math.round(monto/totalGasto*100);
          return `<div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span><strong>${categoriaIcon(cat)} ${escHtml(cat)}</strong></span><span class="mono">${fmt(monto)} · ${pct}%</span></div>
            <div style="height:8px;background:var(--brand-gray);border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--brand-accent);"></div></div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      <div class="card">
        <div class="card-head"><h3>Por solicitante</h3></div>
        <table class="data">
          <thead><tr><th>Solicitante</th><th>Total Mayo</th></tr></thead>
          <tbody>${Object.entries(porSolicitante).sort((a,b)=>b[1]-a[1]).map(([n,m]) => `<tr><td>${escHtml(n)}</td><td><strong>${fmt(m)}</strong></td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="card">
        <div class="card-head"><h3>Por cliente / proyecto</h3></div>
        <table class="data">
          <thead><tr><th>Cliente</th><th>Total Mayo</th></tr></thead>
          <tbody>${Object.entries(porCliente).sort((a,b)=>b[1]-a[1]).map(([n,m]) => `<tr><td>${escHtml(n)}</td><td><strong>${fmt(m)}</strong></td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:22px;">
      <div class="card" style="padding:18px;"><div class="kpi-icon ico-purple" style="margin-bottom:10px;">📊</div><h3 style="margin:0 0 4px;font-size:14px;">Gastos del período</h3><p style="color:var(--muted);font-size:12px;margin:0 0 10px;">Resumen consolidado por categoría.</p><button class="btn btn-primary btn-sm">Excel</button></div>
      <div class="card" style="padding:18px;"><div class="kpi-icon ico-blue" style="margin-bottom:10px;">📄</div><h3 style="margin:0 0 4px;font-size:14px;">Libro de boletas</h3><p style="color:var(--muted);font-size:12px;margin:0 0 10px;">Para entregar al contador.</p><button class="btn btn-primary btn-sm">Excel</button></div>
      <div class="card" style="padding:18px;"><div class="kpi-icon ico-cyan" style="margin-bottom:10px;">💸</div><h3 style="margin:0 0 4px;font-size:14px;">Reembolsos por trabajador</h3><p style="color:var(--muted);font-size:12px;margin:0 0 10px;">Acumulado por persona y mes.</p><button class="btn btn-primary btn-sm">Excel</button></div>
    </div>
  `;
}

// ===========================================================================
// SCREEN: PROVEEDORES
// ===========================================================================
function renderProveedores() {
  const totalsByProv = {};
  state.solicitudes.forEach(s => {
    if (!s.proveedorId) return;
    if (['pagada','sin_boleta','acreditada','conciliada'].includes(s.estado)) {
      totalsByProv[s.proveedorId] = (totalsByProv[s.proveedorId] || 0) + s.monto;
    }
  });

  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Proveedores</div><h2>Catálogo de proveedores</h2></div>
      <button class="btn btn-primary">＋ Agregar proveedor</button>
    </div>
    <div class="card">
      <table class="data">
        <thead><tr><th>RUT</th><th>Razón social</th><th>Categoría</th><th>Banco</th><th>Total Mayo</th></tr></thead>
        <tbody>
          ${state.proveedores.map(p => `<tr><td class="mono">${p.rut}</td><td>${escHtml(p.razon)}</td><td>${escHtml(p.categoriaHabitual)}</td><td>${escHtml(p.banco)}</td><td><strong>${fmt(totalsByProv[p.id]||0)}</strong></td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===========================================================================
// SCREEN: CONFIG
// ===========================================================================
function renderConfig() {
  return `
    <div class="pageHead">
      <div><div class="crumb">Inicio · Configuración</div><h2>Administración</h2></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      <div class="card">
        <div class="card-head"><h3>Usuarios y roles</h3><button class="btn-link">＋ Agregar</button></div>
        <table class="data">
          <thead><tr><th>Nombre</th><th>Rol</th><th>Puede crear</th><th>Tope mensual</th></tr></thead>
          <tbody>
            ${state.users.map(u => {
              const r = ROLES[u.rol];
              const puede = u.rol === 'trabajador' ? 'Solo Reembolsos' : (u.rol === 'admin' ? 'Todo' : 'SOLPED + Reembolsos');
              const badgeClass = {admin:'badge-approved', coordinador:'badge-paid', asistente:'badge-acred', trabajador:'badge-pending'}[u.rol];
              return `<tr><td>${escHtml(u.nombre)}</td><td><span class="badge ${badgeClass}">${r.label}</span></td><td style="font-size:12px;">${puede}</td><td class="mono">${u.topeMensual ? fmt(u.topeMensual) : 'Sin límite'}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-head"><h3>Cuentas bancarias propias</h3><button class="btn-link">＋ Agregar</button></div>
        <table class="data">
          <thead><tr><th>Banco</th><th>Cuenta</th><th>Estado</th></tr></thead>
          <tbody>
            ${state.cuentasBancarias.map(c => `<tr><td>${escHtml(c.banco)}</td><td class="mono">${c.numero}</td><td><span class="badge ${c.activa?'badge-paid':'badge-pending'}">${c.activa?'Activa':'Inactiva'}</span></td></tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-head"><h3>Categorías de gasto</h3><button class="btn-link">＋ Agregar</button></div>
        <div style="padding:18px;display:flex;flex-wrap:wrap;gap:8px;">
          ${CATEGORIAS.map(c => `<span style="background:var(--brand-accent-soft);color:var(--brand-accent);padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;">${categoriaIcon(c)} ${escHtml(c)}</span>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Clientes / proyectos</h3><button class="btn-link">＋ Agregar</button></div>
        <table class="data">
          <thead><tr><th>Nombre</th><th>RUT</th></tr></thead>
          <tbody>${state.clientes.map(c => `<tr><td>${escHtml(c.nombre)}</td><td class="mono">${escHtml(c.rut||'—')}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ===========================================================================
// SCREEN: DETALLE SOLICITUD
// ===========================================================================
function renderDetalleSolicitud() {
  const s = getSolicitud(currentParams.id);
  if (!s) return `<div class="card"><div class="empty-state"><div class="ico-empty">❓</div>Solicitud no encontrada.</div></div>`;
  const u = getUser(s.solicitanteId);
  const p = s.proveedorId ? getProveedor(s.proveedorId) : null;
  const c = s.clienteId ? getCliente(s.clienteId) : null;
  const trans = s.transferenciaId ? getTransferencia(s.transferenciaId) : null;
  const boleta = s.boletaId ? getBoleta(s.boletaId) : null;
  const e = ESTADOS[s.estado] || ESTADOS.borrador;

  // Timeline calculation
  const steps = [
    { key: 'enviada',     label: 'Solicitud enviada',                     done: true,                                                    current: false },
    { key: 'aprobada',    label: 'Aprobada por Christian',                done: ['aprobada','pagada','sin_boleta','acreditada','conciliada'].includes(s.estado), current: false },
    { key: 'pagada',      label: 'Transferencia realizada (voucher)',      done: ['pagada','sin_boleta','acreditada','conciliada'].includes(s.estado), current: false },
    { key: 'sin_boleta',  label: s.tipo==='SOLPED'?'Subir boleta o factura':'Boleta cargada al solicitar', done: ['acreditada','conciliada'].includes(s.estado) || (s.tipo==='REEMBOLSO'), current: false },
    { key: 'conciliada',  label: 'Conciliación bancaria',                  done: s.estado === 'conciliada',                                current: false }
  ];
  const firstNotDone = steps.findIndex(st => !st.done);
  if (firstNotDone >= 0) steps[firstNotDone].current = true;

  return `
    <div class="pageHead">
      <div><div class="crumb"><a href="#" data-nav="${state.currentRole==='admin'?'solicitudes':'mis_solicitudes'}" data-tipo="${s.tipo}" style="color:var(--brand-accent);text-decoration:none;">← Volver</a> · ${s.codigo}</div><h2>${s.codigo} <span class="badge ${e.className}" style="margin-left:8px;font-size:12px;">${e.label}</span></h2></div>
      <div>
        ${state.currentRole==='admin' && s.estado==='enviada' ? `
          <button class="btn btn-success" data-action="aceptar" data-id="${s.id}">✓ Aceptar</button>
          <button class="btn btn-danger" data-action="rechazar" data-id="${s.id}">✕ Rechazar</button>
        ` : ''}
        ${state.currentRole==='admin' && s.estado==='aprobada' ? `<button class="btn btn-primary" data-nav="transferencias">Cargar voucher →</button>` : ''}
        ${s.solicitanteId === currentUser().id && s.estado==='sin_boleta' ? `<button class="btn btn-primary" data-action="subir-boleta" data-id="${s.id}">📷 Subir boleta</button>` : ''}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:18px;">
      <div>
        <div class="card" style="margin-bottom:16px;">
          <div class="card-head"><h3>Información</h3></div>
          <div style="padding:22px;">
            <div class="id-meta-grid">
              <div class="id-meta"><div class="lab">Tipo</div><div class="v"><span class="badge ${s.tipo==='SOLPED'?'badge-type-solped':'badge-type-reembolso'}">${s.tipo}</span></div></div>
              <div class="id-meta"><div class="lab">Monto</div><div class="v" style="font-size:18px;">${fmt(s.monto)}</div></div>
              <div class="id-meta"><div class="lab">Solicitante</div><div class="v">${escHtml(u.nombre)} · ${ROLES[u.rol].label}</div></div>
              <div class="id-meta"><div class="lab">Fecha solicitud</div><div class="v">${fmtDateLong(s.fechaCreacion)}</div></div>
              <div class="id-meta"><div class="lab">Fecha requerida</div><div class="v">${s.fechaRequerida || '—'}</div></div>
              <div class="id-meta"><div class="lab">Prioridad</div><div class="v" style="${s.prioridad==='alta'?'color:var(--brand-accent);':''}">${s.prioridad==='alta'?'Alta':s.prioridad==='baja'?'Baja':'Normal'}</div></div>
              <div class="id-meta"><div class="lab">Categoría</div><div class="v">${categoriaIcon(s.categoria)} ${escHtml(s.categoria)}</div></div>
              <div class="id-meta"><div class="lab">Proveedor</div><div class="v">${p?escHtml(p.razon):'—'}</div></div>
              <div class="id-meta"><div class="lab">Cliente / proyecto</div><div class="v">${c?escHtml(c.nombre):'—'}</div></div>
              <div class="id-meta"><div class="lab">Código</div><div class="v mono">${s.codigo}</div></div>
            </div>
            <div style="background:#fafbfc;border-radius:10px;padding:14px 16px;margin-top:16px;">
              <div style="font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Detalle del gasto</div>
              <div style="margin-top:6px;font-size:13.5px;line-height:1.6;color:#374151;">${escHtml(s.motivo)}</div>
            </div>
          </div>
        </div>

        ${trans && trans.voucher !== null ? `
        <div class="card" style="margin-bottom:16px;">
          <div class="card-head"><h3>Comprobante de transferencia</h3></div>
          <div style="padding:22px;">
            <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">Cargado el ${fmtDateLong(trans.fecha)} · Monto OCR detectado: ${fmt(trans.ocrMonto)}</div>
            ${typeof trans.voucher === 'string' && trans.voucher.startsWith('data:image') ? `<img src="${trans.voucher}" style="max-width:100%;border-radius:8px;border:1px solid var(--border);" />` : `
            <div class="voucher-doc">
              <div class="voucher-doc-head">BANCO DE CHILE · COMPROBANTE</div>
              <div>FECHA: ${fmtDateLong(trans.fecha)}</div>
              <div>OPER. N°: ${Math.floor(Math.random()*900000000+100000000)}</div>
              <hr/>
              <div>ORIGEN: Cta Cte 0019234</div>
              <div>DESTINO: ${p?escHtml(p.razon):escHtml(u.nombre)}</div>
              ${p?`<div>RUT: ${p.rut}</div>`:''}
              ${p?`<div>BANCO: ${p.banco.split('·')[0].trim()}</div>`:''}
              <hr/>
              <div><strong>MONTO: ${fmt(trans.monto)}</strong></div>
              <hr/>
              <div style="text-align:center;font-size:9px;">Operación exitosa</div>
            </div>`}
          </div>
        </div>` : ''}

        ${boleta ? `
        <div class="card" style="margin-bottom:16px;">
          <div class="card-head"><h3>Boleta / Factura validada</h3></div>
          <div style="padding:22px;">
            <div class="id-meta-grid">
              <div class="id-meta"><div class="lab">Folio</div><div class="v mono">${escHtml(boleta.ocr.folio)}</div></div>
              <div class="id-meta"><div class="lab">RUT proveedor</div><div class="v mono">${escHtml(boleta.ocr.rut)}</div></div>
              <div class="id-meta"><div class="lab">Fecha</div><div class="v">${escHtml(boleta.ocr.fecha)}</div></div>
              <div class="id-meta"><div class="lab">Neto</div><div class="v">${fmt(boleta.ocr.neto)}</div></div>
              <div class="id-meta"><div class="lab">IVA</div><div class="v">${fmt(boleta.ocr.iva)}</div></div>
              <div class="id-meta"><div class="lab">Total</div><div class="v" style="font-size:16px;color:var(--p-green);">${fmt(boleta.ocr.monto)}</div></div>
            </div>
            ${boleta.archivo && typeof boleta.archivo === 'string' && boleta.archivo.startsWith('data:image') ? `<div style="margin-top:14px;"><img src="${boleta.archivo}" style="max-width:100%;border-radius:8px;border:1px solid var(--border);" /></div>` : ''}
          </div>
        </div>` : ''}
      </div>

      <div>
        <div class="card" style="margin-bottom:16px;">
          <div class="card-head"><h3>Estado del proceso</h3></div>
          <div style="padding:18px;">
            <div class="timeline">
              ${steps.map((st, i) => `
                <div class="tl-item ${st.done?'':st.current?'current':'pending'}">
                  <div class="tl-dot">${st.done?'✓':st.current?'●':(i+1)}</div>
                  <div class="tl-text"><strong>${st.label}</strong></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        ${s.historial && s.historial.length > 0 ? `
        <div class="card">
          <div class="card-head"><h3>Historial de actividad</h3></div>
          <div style="padding:14px 18px;max-height:300px;overflow-y:auto;">
            ${[...s.historial].reverse().map(h => {
              const usr = getUser(h.usuarioId);
              return `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
                <div style="font-weight:600;color:var(--brand-dark);">${escHtml(h.accion)}</div>
                <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">${usr?escHtml(usr.nombre):'?'} · ${fmtRelTime(h.fecha)}</div>
                ${h.detalle ? `<div style="font-size:12px;color:#4b5563;margin-top:4px;font-style:italic;">"${escHtml(h.detalle)}"</div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>
  `;
}

// ===========================================================================
// MODAL RENDERING
// ===========================================================================
function renderModal() {
  if (!modalOpen) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal">${modalOpen}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function modalRechazar(id) {
  const s = getSolicitud(id);
  if (!s) return;
  openModal(`
    <div class="modal-head"><h3>Rechazar ${s.codigo}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="margin:0 0 12px;color:var(--muted);font-size:13.5px;">Indica el motivo del rechazo. Será visible para ${escHtml(getUser(s.solicitanteId).nombre)}.</p>
      <textarea id="modal-comentario" rows="4" style="width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;" placeholder="Ej: Esta compra está fuera del presupuesto del cliente. Reemplaza el proveedor o ajusta el monto."></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger" onclick="(function(){var c=document.getElementById('modal-comentario').value.trim(); if(!c){alert('Ingresa un comentario.');return;} rechazarSolicitud('${s.id}', c);})()">Confirmar rechazo</button>
    </div>
  `);
}

function modalPedirInfo(id) {
  const s = getSolicitud(id);
  if (!s) return;
  openModal(`
    <div class="modal-head"><h3>Pedir más información</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="margin:0 0 12px;color:var(--muted);font-size:13.5px;">Pregunta lo que necesites a ${escHtml(getUser(s.solicitanteId).nombre)}.</p>
      <textarea id="modal-comentario" rows="4" style="width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:10px;font-size:14px;font-family:inherit;" placeholder="Ej: ¿Tienes la cotización del proveedor? ¿Es para qué cliente exactamente?"></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="(function(){var c=document.getElementById('modal-comentario').value.trim(); if(!c){alert('Ingresa un mensaje.');return;} pedirInfo('${s.id}', c);})()">Enviar</button>
    </div>
  `);
}

function modalSubirBoleta(id) {
  const s = getSolicitud(id);
  if (!s) return;
  openModal(`
    <div class="modal-head"><h3>Subir boleta de ${s.codigo}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <p style="margin:0 0 14px;color:var(--muted);font-size:13.5px;">Sube la foto o PDF de la boleta o factura. El sistema extraerá los datos por OCR.</p>
      <p style="margin:0 0 12px;font-size:13px;"><strong>Monto esperado:</strong> ${fmt(s.monto)}</p>
      <div class="dropzone" id="modal-dz">
        <div class="dropzone-icon">⬆</div>
        <div class="dropzone-text">Arrastra o haz clic para subir</div>
        <div class="dropzone-sub">JPG, PNG, PDF</div>
        <input type="file" id="modal-file-input" style="display:none;" accept="image/*,.pdf" />
      </div>
      <div id="modal-preview"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="(function(){
        var fi = document.getElementById('modal-file-input');
        if (!fi.files || !fi.files[0]) {
          // Simulate without file
          var p = getProveedor('${s.proveedorId||''}');
          var ocrSim = { rut: p?p.rut:'76.000.000-0', fecha: new Date().toLocaleDateString('es-CL'), folio: String(Math.floor(Math.random()*9000000+1000000)), neto: Math.round(${s.monto}/1.19), iva: Math.round(${s.monto} - ${s.monto}/1.19), monto: ${s.monto} };
          subirBoletaSolicitud('${s.id}', null, ocrSim);
          closeModal();
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e){
          var p = getProveedor('${s.proveedorId||''}');
          var ocrSim = { rut: p?p.rut:'76.000.000-0', fecha: new Date().toLocaleDateString('es-CL'), folio: String(Math.floor(Math.random()*9000000+1000000)), neto: Math.round(${s.monto}/1.19), iva: Math.round(${s.monto} - ${s.monto}/1.19), monto: ${s.monto} };
          subirBoletaSolicitud('${s.id}', e.target.result, ocrSim);
          closeModal();
        };
        reader.readAsDataURL(fi.files[0]);
      })()">Cargar y validar</button>
    </div>
    <script>
      (function(){
        var dz = document.getElementById('modal-dz');
        var fi = document.getElementById('modal-file-input');
        dz.addEventListener('click', function(){ fi.click(); });
        fi.addEventListener('change', function(){
          if (!fi.files[0]) return;
          var reader = new FileReader();
          reader.onload = function(e){ document.getElementById('modal-preview').innerHTML = '<img src="'+e.target.result+'" style="max-width:100%;margin-top:12px;border-radius:8px;" />'; };
          reader.readAsDataURL(fi.files[0]);
        });
      })();
    </script>
  `);
}

// ===========================================================================
// EVENT BINDING
// ===========================================================================
function attachEvents() {
  // Navigation
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav, { tipo: el.dataset.tipo });
    });
  });
  // Role switcher
  document.querySelectorAll('[data-role]').forEach(el => {
    el.addEventListener('click', () => setRole(el.dataset.role));
  });
  // Reset
  document.querySelectorAll('[data-action="reset"]').forEach(el => {
    el.addEventListener('click', () => { if (confirm('¿Restablecer todos los datos demo? Se perderán los cambios.')) resetState(); });
  });

  // Inbox selection
  document.querySelectorAll('[data-action="select-inbox"]').forEach(el => {
    el.addEventListener('click', () => { selectedSolicitudId = el.dataset.id; render(); });
  });
  // Aceptar/Rechazar/Pedir info
  document.querySelectorAll('[data-action="aceptar"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); aceptarSolicitud(el.dataset.id); }));
  document.querySelectorAll('[data-action="rechazar"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); modalRechazar(el.dataset.id); }));
  document.querySelectorAll('[data-action="pedir-info"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); modalPedirInfo(el.dataset.id); }));

  // Detalle
  document.querySelectorAll('[data-action="abrir-detalle"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); navigate('detalle', { id: el.dataset.id }); }));

  // Subir boleta
  document.querySelectorAll('[data-action="subir-boleta"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); modalSubirBoleta(el.dataset.id); }));

  // Conciliación
  document.querySelectorAll('[data-action="ejecutar-conciliacion"]').forEach(el => el.addEventListener('click', () => ejecutarConciliacion()));

  // Set tipo (nueva)
  document.querySelectorAll('[data-action="set-tipo"]').forEach(el => el.addEventListener('click', () => { solicitudTipoBuilder = el.dataset.tipo; render(); }));

  // Voucher upload
  const vz = document.getElementById('voucher-zone');
  if (vz) {
    vz.addEventListener('click', () => vz.focus());
    document.addEventListener('paste', handleVoucherPaste);
  }
  document.querySelectorAll('[data-action="simulate-paste"]').forEach(el => el.addEventListener('click', () => {
    // Simulate by generating a fake voucher SVG
    const sid = el.dataset.id;
    const s = getSolicitud(sid);
    if (!s) return;
    const svg = generateFakeVoucherSVG(s);
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    cargarVoucher(sid, dataUrl);
  }));
  document.querySelectorAll('[data-action="upload-voucher"]').forEach(el => el.addEventListener('click', (e) => {
    const sid = el.dataset.id;
    const fi = document.getElementById('voucher-file');
    fi.click();
    fi.onchange = () => {
      if (!fi.files[0]) return;
      const reader = new FileReader();
      reader.onload = (ev) => cargarVoucher(sid, ev.target.result);
      reader.readAsDataURL(fi.files[0]);
    };
  }));

  // Form nueva solicitud
  const btnEnviar = document.getElementById('btn-enviar-solicitud');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
      const form = document.getElementById('form-nueva');
      const data = new FormData(form);
      const monto = parseInt(data.get('monto'), 10);
      if (!monto || monto <= 0) { toast('Ingresa un monto válido.', 'error'); return; }
      const motivo = (data.get('motivo')||'').trim();
      if (!motivo) { toast('Ingresa el detalle del gasto.', 'error'); return; }
      const obj = {
        tipo: solicitudTipoBuilder,
        monto, motivo,
        categoria: data.get('categoria'),
        proveedorId: data.get('proveedorId') || null,
        clienteId: data.get('clienteId') || null,
        prioridad: data.get('prioridad'),
        fechaRequerida: data.get('fechaRequerida'),
        adjuntos: []
      };
      if (solicitudTipoBuilder === 'REEMBOLSO') {
        obj.boletaArchivo = window._boletaReemUrl || null;
        obj.ocrSimulado = { rut: '76.000.000-0', fecha: data.get('fechaRequerida'), folio: String(Math.floor(Math.random()*9000000+1000000)), neto: Math.round(monto/1.19), iva: monto - Math.round(monto/1.19), monto };
      }
      crearSolicitud(obj);
    });

    // Boleta dropzone (reembolso)
    const dz = document.getElementById('dz-boleta-reem');
    const fi = document.getElementById('file-boleta-reem');
    if (dz && fi) {
      dz.addEventListener('click', () => fi.click());
      dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
      dz.addEventListener('drop', (e) => {
        e.preventDefault(); dz.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleBoletaReemFile(e.dataTransfer.files[0]);
      });
      fi.addEventListener('change', () => { if (fi.files[0]) handleBoletaReemFile(fi.files[0]); });
    }
  }
}

function handleBoletaReemFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    window._boletaReemUrl = e.target.result;
    const prev = document.getElementById('boleta-preview');
    if (prev) prev.innerHTML = '<div style="margin-top:12px;font-size:12.5px;color:var(--p-green);font-weight:600;">✓ ' + file.name + ' cargada · OCR procesará al enviar</div>' + (file.type.startsWith('image') ? '<img src="'+e.target.result+'" style="max-width:200px;margin-top:8px;border-radius:8px;border:1px solid var(--border);" />' : '');
  };
  reader.readAsDataURL(file);
}

function handleVoucherPaste(ev) {
  const items = (ev.clipboardData || {}).items;
  if (!items) return;
  for (const item of items) {
    if (item.type && item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      const reader = new FileReader();
      const vz = document.getElementById('voucher-zone');
      const sid = vz ? vz.dataset.solicitudId : null;
      if (!sid) return;
      reader.onload = (e) => cargarVoucher(sid, e.target.result);
      reader.readAsDataURL(blob);
      ev.preventDefault();
      return;
    }
  }
}

function generateFakeVoucherSVG(s) {
  const u = getUser(s.solicitanteId);
  const p = getProveedor(s.proveedorId);
  const opNum = Math.floor(Math.random()*900000000+100000000);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="540" viewBox="0 0 500 540">
      <rect width="500" height="540" fill="#ffffff" stroke="#cbcfcf" stroke-width="2" rx="12"/>
      <rect x="0" y="0" width="500" height="60" fill="#252424" rx="12"/>
      <text x="250" y="38" font-family="Arial" font-size="20" font-weight="bold" fill="white" text-anchor="middle">BANCO DE CHILE</text>
      <text x="250" y="90" font-family="Arial" font-size="14" fill="#252424" text-anchor="middle">COMPROBANTE DE TRANSFERENCIA</text>
      <line x1="40" y1="115" x2="460" y2="115" stroke="#cbcfcf" stroke-dasharray="3 3"/>
      <text x="40" y="145" font-family="Arial" font-size="11" fill="#6b7280">FECHA</text>
      <text x="40" y="165" font-family="monospace" font-size="13" fill="#252424">${new Date().toLocaleString('es-CL')}</text>
      <text x="40" y="195" font-family="Arial" font-size="11" fill="#6b7280">N° OPERACIÓN</text>
      <text x="40" y="215" font-family="monospace" font-size="13" fill="#252424">${opNum}</text>
      <line x1="40" y1="235" x2="460" y2="235" stroke="#cbcfcf" stroke-dasharray="3 3"/>
      <text x="40" y="265" font-family="Arial" font-size="11" fill="#6b7280">ORIGEN</text>
      <text x="40" y="285" font-family="monospace" font-size="13" fill="#252424">EEM Servicios SpA · Cta Cte 0019234</text>
      <text x="40" y="315" font-family="Arial" font-size="11" fill="#6b7280">DESTINO</text>
      <text x="40" y="335" font-family="Arial" font-size="14" font-weight="bold" fill="#252424">${p?p.razon:u.nombre}</text>
      ${p?`<text x="40" y="355" font-family="monospace" font-size="11" fill="#6b7280">RUT ${p.rut} · ${p.banco}</text>`:''}
      <line x1="40" y1="380" x2="460" y2="380" stroke="#cbcfcf" stroke-dasharray="3 3"/>
      <text x="40" y="415" font-family="Arial" font-size="11" fill="#6b7280">MONTO TRANSFERIDO</text>
      <text x="40" y="450" font-family="Arial" font-size="28" font-weight="bold" fill="#ff5757">${fmt(s.monto)}</text>
      <line x1="40" y1="475" x2="460" y2="475" stroke="#cbcfcf" stroke-dasharray="3 3"/>
      <text x="250" y="505" font-family="Arial" font-size="12" fill="#22c55e" text-anchor="middle">✓ Operación exitosa</text>
      <text x="250" y="525" font-family="Arial" font-size="10" fill="#9ca3af" text-anchor="middle">Glosa: ${s.codigo}</text>
    </svg>`;
}

// ===========================================================================
// BOOT
// ===========================================================================
if (!loadState()) seedState();
saveState();
render();
