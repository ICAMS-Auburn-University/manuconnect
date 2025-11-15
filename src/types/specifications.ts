export const SPECIFICATIONS = {
  "CORE_INFORMATION": {
    "2D_Technical_Drawing": {
      "description": "3-view orthographic projection showing all dimensions",
      "details": [
        "Top view",
        "Front view",
        "Side view",
        "Isometric view (if complex geometry)",
        "Section views (if internal features)",
        "Detail views (for small features)"
      ]
    },
    "Part_Description": {
      "description": "Written description of the part and its function",
      "details": [
        "Part name",
        "Function/purpose",
        "Assembly location",
        "Critical features",
        "Special handling requirements"
      ]
    }
  },
  "MATERIALS": {
    "Metals_Ferrous": [
      "Low Carbon Steel / Mild Steel",
      "Medium Carbon Steel",
      "High Carbon Steel",
      "Tool Steel (D2, A2, O1, S7)",
      "High Speed Steel (HSS)",
      "Stainless Steel 304",
      "Stainless Steel 316",
      "Stainless Steel 17-4 PH",
      "Stainless Steel 303",
      "Cast Iron - Grey",
      "Cast Iron - Ductile",
      "Cast Iron - White"
    ],
    "Metals_Non_Ferrous": [
      "Aluminum 6061-T6",
      "Aluminum 7075-T6",
      "Aluminum 2024-T3",
      "Aluminum 5052-H32",
      "Brass (C360, C260)",
      "Bronze (C932, C954)",
      "Copper (C110, C101)",
      "Titanium Grade 2",
      "Titanium Grade 5 (Ti-6Al-4V)",
      "Magnesium AZ31B",
      "Zinc Alloy (Zamak 3, 5)",
      "Nickel Alloy (Inconel 625, 718)",
      "Monel 400"
    ],
    "Plastics_Thermoplastic": [
      "ABS (Acrylonitrile Butadiene Styrene)",
      "Polycarbonate (PC)",
      "Nylon 6 (PA6)",
      "Nylon 66 (PA66)",
      "Acrylic (PMMA)",
      "Polypropylene (PP)",
      "Polyethylene - HDPE",
      "Polyethylene - LDPE",
      "PVC (Polyvinyl Chloride)",
      "uPVC (Unplasticized PVC)",
      "POM (Delrin/Acetal)",
      "PEEK (Polyether Ether Ketone)",
      "PTFE (Teflon)",
      "Polystyrene (PS)",
      "PET (Polyethylene Terephthalate)",
      "Ultem (PEI)"
    ],
    "Plastics_Thermoset": [
      "Epoxy Resin",
      "Phenolic (Bakelite)",
      "Polyester Resin",
      "Melamine",
      "Polyurethane"
    ],
    "Composites": [
      "Carbon Fiber Reinforced Polymer (CFRP)",
      "Glass Fiber Reinforced Polymer (GFRP)",
      "Fiberglass",
      "Kevlar Composite"
    ]
  },
  "TOLERANCES": {
    "General_Tolerances": {
      "ISO_2768_Fine": "\u00b10.05mm to \u00b10.3mm (depending on dimension range)",
      "ISO_2768_Medium": "\u00b10.1mm to \u00b10.8mm (depending on dimension range)",
      "ISO_2768_Coarse": "\u00b10.2mm to \u00b12mm (depending on dimension range)",
      "ISO_2768_Very_Coarse": "\u00b10.5mm to \u00b14mm (depending on dimension range)"
    },
    "Precision_Tolerances": {
      "IT6": "\u00b10.006mm to \u00b10.019mm (high precision)",
      "IT7": "\u00b10.01mm to \u00b10.03mm (precision)",
      "IT8": "\u00b10.014mm to \u00b10.046mm (normal precision)"
    },
    "GDT_Geometric_Controls": [
      "Flatness",
      "Straightness",
      "Circularity (Roundness)",
      "Cylindricity",
      "Parallelism",
      "Perpendicularity",
      "Angularity",
      "Position",
      "Concentricity",
      "Symmetry",
      "Profile of a Line",
      "Profile of a Surface",
      "Circular Runout",
      "Total Runout"
    ],
    "Thread_Tolerances": {
      "Metric_ISO": [
        "6H (internal, general purpose)",
        "6g (external, general purpose)",
        "4h6h (close fit)",
        "6e (loose fit)"
      ],
      "Unified_UNC_UNF": [
        "1A/1B (loose fit)",
        "2A/2B (general purpose)",
        "3A/3B (tight, precision)"
      ]
    }
  },
  "SURFACE_FINISHES": {
    "Surface_Roughness": {
      "Ra_Values_Micrometers": {
        "N12 (Ra 50)": "Very rough - As cast, flame cut",
        "N11 (Ra 25)": "Rough - Rough machining",
        "N10 (Ra 12.5)": "Coarse - Heavy cuts",
        "N9 (Ra 6.3)": "Medium - Standard machining",
        "N8 (Ra 3.2)": "Semi-fine - Good machining",
        "N7 (Ra 1.6)": "Fine - Precision machining",
        "N6 (Ra 0.8)": "Very fine - Fine turning, boring",
        "N5 (Ra 0.4)": "Extra fine - Fine grinding",
        "N4 (Ra 0.2)": "Super fine - Precision grinding",
        "N3 (Ra 0.1)": "Ultra fine - Honing, lapping",
        "N2 (Ra 0.05)": "Mirror - Superfinishing",
        "N1 (Ra 0.025)": "Super mirror - Lapping, polishing"
      },
      "Rz_Values": "Peak-to-valley measurement (typically 4-6x Ra value)"
    },
    "Coatings_Metal": [
      "Anodizing Type II (Standard)",
      "Anodizing Type III (Hard coat)",
      "Powder Coating",
      "Zinc Plating (Clear)",
      "Zinc Plating (Yellow chromate)",
      "Zinc Plating (Black chromate)",
      "Nickel Plating (Electroless)",
      "Nickel Plating (Electrolytic)",
      "Chrome Plating (Decorative)",
      "Chrome Plating (Hard/Industrial)",
      "Electropolishing",
      "Black Oxide",
      "Phosphate Coating",
      "Cerakote",
      "Teflon Coating",
      "E-coating (Electrocoating)"
    ],
    "Coatings_Paint": [
      "Powder Coat - Matte",
      "Powder Coat - Gloss",
      "Powder Coat - Textured",
      "Wet Paint - Enamel",
      "Wet Paint - Epoxy",
      "Wet Paint - Polyurethane",
      "Primer Only"
    ],
    "Surface_Treatments": [
      "Passivation (Citric acid)",
      "Passivation (Nitric acid)",
      "Bead Blasting",
      "Sand Blasting",
      "Tumbling/Vibratory Finishing",
      "Brushing (Satin finish)",
      "Polishing (Mirror finish)",
      "Chemical Etching"
    ]
  },
  "HEAT_TREATMENT": {
    "Steel_Treatments": [
      "Annealing",
      "Normalizing",
      "Hardening (Oil quench)",
      "Hardening (Water quench)",
      "Hardening (Air quench)",
      "Tempering",
      "Case Hardening (Carburizing)",
      "Case Hardening (Nitriding)",
      "Case Hardening (Carbonitriding)",
      "Induction Hardening",
      "Flame Hardening",
      "Stress Relieving"
    ],
    "Aluminum_Treatments": [
      "Annealing",
      "Solution Heat Treatment",
      "Precipitation Hardening (T4)",
      "Precipitation Hardening (T6)",
      "Natural Aging",
      "Artificial Aging"
    ],
    "Hardness_Specifications": {
      "Rockwell_C": "For hardened steels (HRC 20-70)",
      "Rockwell_B": "For softer metals (HRB 0-100)",
      "Brinell": "For general metals (HB 50-750)",
      "Vickers": "For all metals (HV 100-1000)"
    }
  },
  "MANUFACTURING_PROCESS": {
    "Primary_Processes": [
      "CNC Milling (3-axis)",
      "CNC Milling (4-axis)",
      "CNC Milling (5-axis)",
      "CNC Turning (Lathe)",
      "Swiss Screw Machining",
      "Grinding (Surface)",
      "Grinding (Cylindrical)",
      "Grinding (Centerless)",
      "EDM (Wire)",
      "EDM (Sinker)",
      "Casting (Sand)",
      "Casting (Investment/Lost wax)",
      "Casting (Die casting)",
      "Forging (Hot)",
      "Forging (Cold)",
      "Stamping",
      "Laser Cutting",
      "Waterjet Cutting",
      "3D Printing (Metal)",
      "3D Printing (Plastic)",
      "Injection Molding",
      "Extrusion"
    ],
    "Machined_vs_Non_Machined": {
      "Machined": "Part undergoes material removal processes (milling, turning, grinding, drilling)",
      "Cast": "Part is formed by pouring molten material into mold",
      "Forged": "Part is shaped by compressive forces",
      "Molded": "Part is formed in a mold (plastic injection, compression molding)",
      "Formed": "Part is shaped by bending, stamping, or rolling sheet material",
      "Additive": "Part is built layer by layer (3D printing)"
    }
  },
  "SECONDARY_OPERATIONS": {
    "Deburring_Edge_Break": [
      "Deburr all edges",
      "Break sharp edges C0.2-0.5",
      "Break sharp edges C0.01 max",
      "Break sharp edges C0.015 max",
      "Break sharp edges R0.2-0.5",
      "No deburring required",
      "Tumble deburr",
      "Manual deburr",
      "Brush deburr"
    ],
    "Drilling_Tapping": [
      "Drilling",
      "Reaming",
      "Tapping (through holes)",
      "Tapping (blind holes)",
      "Thread milling",
      "Counterboring",
      "Countersinking",
      "Spotfacing"
    ],
    "Welding": [
      "TIG Welding",
      "MIG Welding",
      "Spot Welding",
      "Laser Welding",
      "Ultrasonic Welding (plastics)",
      "Heat Staking (plastics)"
    ],
    "Assembly": [
      "Press fit",
      "Adhesive bonding",
      "Insert installation (threaded inserts)",
      "Fastener installation",
      "Bushing installation",
      "Final assembly"
    ]
  },
  "INSPECTION_QUALITY": {
    "Inspection_Methods": [
      "CMM (Coordinate Measuring Machine)",
      "Optical comparator",
      "Calipers/Micrometer",
      "Pin gauge",
      "Thread gauge",
      "Surface roughness tester",
      "Hardness tester",
      "First Article Inspection (FAI/AS9102)"
    ],
    "Non_Destructive_Testing": [
      "Visual Testing (VT)",
      "Ultrasonic Testing (UT)",
      "Radiographic Testing (RT)",
      "Magnetic Particle Testing (MT)",
      "Penetrant Testing (PT/Dye Penetrant)",
      "Eddy Current Testing (ET)",
      "Leak Testing",
      "Thermographic Testing"
    ],
    "Quality_Standards": [
      "ISO 9001 (General quality)",
      "AS9100 (Aerospace)",
      "ISO 13485 (Medical devices)",
      "IATF 16949 (Automotive)",
      "ISO 14001 (Environmental)",
      "NADCAP (Aerospace special processes)"
    ]
  },
  "COMPLIANCE_CERTIFICATIONS": {
    "Material_Compliance": [
      "RoHS Compliant",
      "REACH Compliant",
      "Material Test Certificate (MTC)",
      "Mill Test Report (MTR)",
      "Certificate of Conformance (CoC)",
      "Material Safety Data Sheet (MSDS)"
    ],
    "Process_Certifications": [
      "FAI Report (AS9102)",
      "PPAP (Production Part Approval Process)",
      "Material traceability",
      "Heat lot traceability"
    ]
  },
  "PART_MARKING_IDENTIFICATION": {
    "Marking_Methods": [
      "Laser Etching",
      "Laser Engraving",
      "Dot Peen Marking",
      "Stamping",
      "Electrochemical Etching",
      "Ink Printing",
      "Pad Printing",
      "Engraving (mechanical)",
      "No marking required"
    ],
    "Marking_Content": [
      "Part number",
      "Serial number",
      "Date code",
      "Lot/Batch number",
      "Heat number",
      "Manufacturer logo",
      "QR code",
      "Data matrix code",
      "Barcode"
    ]
  },
  "PACKAGING_SHIPPING": {
    "Packaging_Requirements": [
      "Individual wrapping (VCI paper)",
      "Foam padding",
      "Plastic bags/sealed bags",
      "Cardboard boxes",
      "Wooden crates",
      "Palletized",
      "Bulk packaging",
      "ESD protection (for electronics)",
      "Clean room packaging"
    ],
    "Preservation": [
      "Rust preventive oil",
      "VCI (Vapor Corrosion Inhibitor)",
      "Desiccant packets",
      "Vacuum sealed",
      "No preservation required"
    ]
  },
  "PRODUCTION_SPECIFICATIONS": {
    "Quantity_Information": [
      "Prototype (1-10 units)",
      "Low volume (10-100 units)",
      "Medium volume (100-1000 units)",
      "High volume (1000-10000 units)",
      "Mass production (10000+ units)"
    ],
    "Lead_Time_Considerations": [
      "Material procurement time",
      "Tooling/fixture lead time",
      "Machining/processing time",
      "Heat treatment lead time",
      "Finishing/coating lead time",
      "Inspection lead time",
      "Assembly lead time",
      "Shipping time"
    ],
    "Critical_Dimensions": [
      "Features critical to fit",
      "Features critical to function",
      "Features requiring 100% inspection",
      "Features requiring statistical process control (SPC)"
    ]
  },
  "SPECIAL_REQUIREMENTS": {
    "Thread_Specifications": [
      "Metric Coarse (M3x0.5, M4x0.7, M5x0.8, M6x1.0, M8x1.25, M10x1.5, M12x1.75)",
      "Metric Fine (M8x1.0, M10x1.25, M12x1.5)",
      "UNC - Unified Coarse (#10-24, 1/4-20, 5/16-18, 3/8-16, 1/2-13)",
      "UNF - Unified Fine (#10-32, 1/4-28, 5/16-24, 3/8-24, 1/2-20)",
      "BSP - British Standard Pipe",
      "NPT - National Pipe Thread"
    ],
    "Weld_Specifications": [
      "Fillet weld size",
      "Groove weld type",
      "Weld all around",
      "Field weld",
      "Weld symbol (AWS A2.4 standard)",
      "Weld inspection requirements"
    ],
    "Environmental_Conditions": [
      "Operating temperature range",
      "Storage temperature range",
      "Humidity resistance",
      "Corrosion resistance requirements",
      "UV resistance",
      "Chemical exposure resistance"
    ]
  }
} as const;
