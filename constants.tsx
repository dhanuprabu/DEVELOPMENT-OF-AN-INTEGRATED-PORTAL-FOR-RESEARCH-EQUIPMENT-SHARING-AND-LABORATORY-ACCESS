
import React from 'react';
import { Equipment, EquipmentStatus, UserRole } from './types';

export const ENGINEERING_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Electronics & Communication Engineering',
  'Information Technology',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Automobile Engineering',
  'Mechatronics Engineering',
  'Nanotechnology',
  'Materials Science & Engineering'
];

export const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-001',
    name: 'Scanning Electron Microscope (SEM)',
    category: 'Microscopy',
    labName: 'Nanotechnology Research Center',
    status: EquipmentStatus.AVAILABLE,
    description: 'High-resolution imaging of surfaces using a focused beam of electrons.',
    specifications: [
      'Resolution: 1.2nm @ 30kV', 
      'Magnification: 10x to 1,000,000x', 
      'Emitter: Schottky Field Emission',
      'Detectors: SE, BSE, EDS'
    ],
    hourlyRate: 150,
    image: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 1240
  },
  {
    id: 'eq-002',
    name: 'NMR Spectrometer 400MHz',
    category: 'Spectroscopy',
    labName: 'Organic Chemistry Lab',
    status: EquipmentStatus.IN_USE,
    description: 'Analysis of molecular structure and dynamics of organic compounds.',
    specifications: [
      'Field strength: 9.4 Tesla', 
      'Probe: 5mm BBO CryoProbe', 
      'Autosampler: 24 positions',
      'Solvent suppression enabled'
    ],
    hourlyRate: 85,
    image: 'https://images.unsplash.com/photo-1579154235828-ac01e5548046?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 3500
  },
  {
    id: 'eq-003',
    name: 'Thermal Cycler (PCR)',
    category: 'Molecular Biology',
    labName: 'Genetics & Biotech Lab',
    status: EquipmentStatus.AVAILABLE,
    description: 'Rapid heating and cooling for DNA amplification via PCR.',
    specifications: [
      'Block format: 96-well 0.2ml', 
      'Max ramp rate: 6.0 °C/sec', 
      'Temperature range: 4°C - 99°C',
      'Touchscreen interface'
    ],
    hourlyRate: 20,
    image: 'https://images.unsplash.com/photo-1581093196277-9f608ed386ea?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 890
  },
  {
    id: 'eq-004',
    name: 'X-Ray Diffractometer (XRD)',
    category: 'Material Science',
    labName: 'Advanced Materials Lab',
    status: EquipmentStatus.MAINTENANCE,
    description: 'Used for phase identification of crystalline materials.',
    specifications: [
      'Anode: Copper (Cu-Kα)', 
      'Goniometer: Theta-Theta vertical', 
      'Detector: LynxEye XE-T',
      'Spinning stage available'
    ],
    hourlyRate: 120,
    image: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 1100
  },
  {
    id: 'eq-005',
    name: 'High Performance Liquid Chromatograph (HPLC)',
    category: 'Chromatography',
    labName: 'Analytical Chemistry Wing',
    status: EquipmentStatus.AVAILABLE,
    description: 'Separation, identification, and quantification of components in a mixture.',
    specifications: [
      'Pump: Quaternary Gradient', 
      'Detector: Diode Array (PDA)', 
      'Column Oven: Up to 80°C',
      'Injection vol: 0.1 to 100uL'
    ],
    hourlyRate: 45,
    image: 'https://images.unsplash.com/photo-1532187863486-abf9b3c3b0fb?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 2100
  },
  {
    id: 'eq-006',
    name: 'Confocal Laser Scanning Microscope',
    category: 'Microscopy',
    labName: 'Cell Biology Institute',
    status: EquipmentStatus.AVAILABLE,
    description: 'Advanced 3D imaging of fluorescently labeled biological samples.',
    specifications: [
      'Lasers: 405, 488, 561, 640nm', 
      'Objectives: 10x, 20x, 40x, 63x Oil', 
      'Z-stacking resolution: 50nm',
      'Incubation chamber for live cells'
    ],
    hourlyRate: 180,
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 420
  },
  {
    id: 'eq-007',
    name: 'Atomic Force Microscope (AFM)',
    category: 'Microscopy',
    labName: 'Nanofabrication Facility',
    status: EquipmentStatus.AVAILABLE,
    description: 'Nanoscale surface topography and mechanical property mapping.',
    specifications: [
      'Modes: Tapping, Contact, PeakForce', 
      'Scan range: 90um x 90um', 
      'Vertical noise floor: < 0.03nm',
      'Fluid cell compatible'
    ],
    hourlyRate: 200,
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 650
  },
  {
    id: 'eq-008',
    name: 'Mass Spectrometer (LC-MS/MS)',
    category: 'Spectroscopy',
    labName: 'Proteomics Research Lab',
    status: EquipmentStatus.IN_USE,
    description: 'High-sensitivity identification of proteins and small molecules.',
    specifications: [
      'Mass range: 50 - 6,000 m/z', 
      'Resolution: 140,000 @ m/z 200', 
      'Ion Source: Electrospray (ESI)',
      'Coupled with Nano-LC'
    ],
    hourlyRate: 250,
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 5200
  },
  {
    id: 'eq-009',
    name: 'Inductively Coupled Plasma (ICP-OES)',
    category: 'Spectroscopy',
    labName: 'Environmental Science Lab',
    status: EquipmentStatus.AVAILABLE,
    description: 'Detection of trace metals in environmental and geological samples.',
    specifications: [
      'RF Power: 750 - 1500 Watts', 
      'Plasma viewing: Dual (Axial/Radial)', 
      'Wavelength: 165 - 900nm',
      'Detection limit: ppb range'
    ],
    hourlyRate: 75,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 1800
  },
  {
    id: 'eq-010',
    name: 'Cryogenic Probe Station',
    category: 'Material Science',
    labName: 'Quantum Electronics Lab',
    status: EquipmentStatus.AVAILABLE,
    description: 'Electrical characterization of materials at cryogenic temperatures.',
    specifications: [
      'Temp Range: 4.2K to 400K', 
      'Vacuum: 10^-6 mbar', 
      'Probes: 6 micromanipulators',
      'Shielding: Radiation & EMI'
    ],
    hourlyRate: 110,
    image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&q=80&w=800',
    totalUsageHours: 320
  }
];

export const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Lab: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Stats: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};
