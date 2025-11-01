export enum OrderStatus {
  OrderCreated = 'Order Created',
  ManufacturerOffer = 'Manufacturer Offer',
  OrderAccepted = 'Order Accepted',
  MachineSetup = 'Machine Setup',
  StartedManufacturing = 'Started Manufacturing',
  QualityCheck = 'Quality Check',
  Shipped = 'Shipping',
  Completed = 'Completed',
}

export enum ProcessTag {
  CncMachining = 'cnc_machining',
  ThreeDPrinting = '3d_printing',
  InjectionMolding = 'injection_molding',
  SheetMetalFabrication = 'sheet_metal_fabrication',
  Casting = 'casting',
  Forging = 'forging',
  Welding = 'welding',
  LaserCutting = 'laser_cutting',
  WaterjetCutting = 'waterjet_cutting',
  PlasmaCutting = 'plasma_cutting',
  Extrusion = 'extrusion',
  SurfaceFinishing = 'surface_finishing',
  Anodizing = 'anodizing',
  PowderCoating = 'powder_coating',
}

export const ProcessTagLabels: Record<ProcessTag, string> = {
  [ProcessTag.CncMachining]: 'CNC Machining',
  [ProcessTag.ThreeDPrinting]: '3D Printing',
  [ProcessTag.InjectionMolding]: 'Injection Molding',
  [ProcessTag.SheetMetalFabrication]: 'Sheet Metal Fabrication',
  [ProcessTag.Casting]: 'Casting',
  [ProcessTag.Forging]: 'Forging',
  [ProcessTag.Welding]: 'Welding',
  [ProcessTag.LaserCutting]: 'Laser Cutting',
  [ProcessTag.WaterjetCutting]: 'Waterjet Cutting',
  [ProcessTag.PlasmaCutting]: 'Plasma Cutting',
  [ProcessTag.Extrusion]: 'Extrusion',
  [ProcessTag.SurfaceFinishing]: 'Surface Finishing',
  [ProcessTag.Anodizing]: 'Anodizing',
  [ProcessTag.PowderCoating]: 'Powder Coating',
};

export enum MaterialTag {
  Metal = 'metal',
  Plastic = 'plastic',
  Composite = 'composite',
  Ceramic = 'ceramic',
  Wood = 'wood',
  Glass = 'glass',
  Rubber = 'rubber',
  CarbonFiber = 'carbon_fiber',
}

export const MaterialTagLabels: Record<MaterialTag, string> = {
  [MaterialTag.Metal]: 'Metal',
  [MaterialTag.Plastic]: 'Plastic',
  [MaterialTag.Composite]: 'Composite',
  [MaterialTag.Ceramic]: 'Ceramic',
  [MaterialTag.Wood]: 'Wood',
  [MaterialTag.Glass]: 'Glass',
  [MaterialTag.Rubber]: 'Rubber',
  [MaterialTag.CarbonFiber]: 'Carbon Fiber',
};

export enum MiscTag {
  MassProduction = 'mass_production',
  LowVolumeProduction = 'low_volume_production',
  HighVolumeProduction = 'high_volume_production',
}

export const MiscTagLabels: Record<MiscTag, string> = {
  [MiscTag.MassProduction]: 'Mass Production',
  [MiscTag.LowVolumeProduction]: 'Low Volume Production',
  [MiscTag.HighVolumeProduction]: 'High Volume Production',
};

export enum AccountType {
  Creator = 'creator',
  Manufacturer = 'manufacturer',
  Admin = 'admin',
}

export enum EventType {
  ORDER = 'order',
  USER = 'user',
  SYSTEM = 'system',
  ERROR = 'error',
  SUCCESS = 'success',
  SHIPMENT = 'shipment',
  OFFER = 'offer',
}

export enum CompanyType {
  SP = 'SP', // Sole Proprietorship
  GP = 'GP', // General Partnership
  LP = 'LP', // Limited Partnership
  LLP = 'LLP', // Limited Liability Partnership
  LLC = 'LLC', // Limited Liability Company
  CORP = 'CORP', // Corporation (general)
  INC = 'INC', // Incorporated (same as CORP, but common suffix)
  SCORP = 'S-CORP', // S Corporation
  NONPROFIT = 'NONPROFIT', // Nonprofit Corporation
  COOP = 'COOP', // Cooperative
  OTHER = 'OTHER', // For entity types not listed
}
