export interface CustomPoint {
  id: string;
  label: string;
  value: string;                 // cm
  x: number;                    // ratio 0-1 on the SVG/3D view
  y: number;                    // ratio 0-1
}

export interface Client {
  id: string;                    // unique id, e.g. Math.random().toString(36)
  name: string;
  gender: "F" | "M";
  morphology: "A" | "H" | "X" | "Y" | "O";
  size: number;                  // 0 (mince), 1 (moyen), 2 (forte corpulence)
  measurements: {
    // Femme standard
    hauteur?: string;            // cm
    epaules?: string;
    poitrine?: string;
    sous_poit?: string;
    lg_dos?: string;
    taille?: string;
    hanches?: string;
    bassin?: string;
    entrejambe?: string;
    cuisse?: string;
    lg_bras?: string;
    tour_bras?: string;
    // Homme supplémentaire
    cou?: string;
    // Mesures custom
    [key: string]: string | undefined;
  };
  customPoints: CustomPoint[];   // custom measurements traced on the dress form
  notes?: string;
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
}

export interface AppState {
  clients: Client[];
  selectedClientId: string | null;
  driveFileId: string | null;     // Google Drive JSON file ID override
  lastSync: string | null;        // ISO date string or null
}
