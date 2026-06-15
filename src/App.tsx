import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Client, CustomPoint } from "./types";
import Mannequin3D from "./components/Mannequin3D";
import {
  initGoogleTokenClient,
  findAtelierFileInDrive,
  downloadAtelierFileFromDrive,
  uploadAtelierFileToDrive,
} from "./utils/googleDrive";
import {
  Scissors,
  Plus,
  Search,
  Users,
  Eye,
  Trash2,
  Save,
  Compass,
  FileDown,
  FileUp,
  Sparkles,
  CloudLightning,
  CheckCircle,
  HelpCircle,
  Menu,
} from "lucide-react";

// List of expected standard measurements for sewing validation
const FEMALE_STANDARDS = [
  { key: "hauteur", label: "Hauteur totale (cm)", labelEn: "Total Height (cm)" },
  { key: "epaules", label: "Carrure épaules (cm)", labelEn: "Shoulder breadth (cm)" },
  { key: "poitrine", label: "Tour de poitrine (cm)", labelEn: "Bust chest (cm)" },
  { key: "sous_poit", label: "Tour sous-poitrine (cm)", labelEn: "Underbust line (cm)" },
  { key: "lg_dos", label: "Longueur dos (cm)", labelEn: "Center back length (cm)" },
  { key: "taille", label: "Tour de taille (cm)", labelEn: "Waist line (cm)" },
  { key: "hanches", label: "Tour de hanches (cm)", labelEn: "Hip line (cm)" },
  { key: "bassin", label: "Tour de bassin (cm)", labelEn: "Full seat (cm)" },
  { key: "entrejambe", label: "Montant / Entrejambe (cm)", labelEn: "Inseam length (cm)" },
  { key: "cuisse", label: "Tour de cuisse (cm)", labelEn: "Thigh width (cm)" },
  { key: "lg_bras", label: "Longueur bras (cm)", labelEn: "Arm length (cm)" },
  { key: "tour_bras", label: "Tour de bras (cm)", labelEn: "Bicep girth (cm)" },
];

const MALE_STANDARDS = [
  { key: "hauteur", label: "Hauteur totale (cm)", labelEn: "Total Height (cm)" },
  { key: "epaules", label: "Carrure épaules (cm)", labelEn: "Shoulder breadth (cm)" },
  { key: "poitrine", label: "Tour de poitrine (cm)", labelEn: "Chest width (cm)" },
  { key: "cou", label: "Tour de cou (cm)", labelEn: "Neck circumference (cm)" },
  { key: "lg_dos", label: "Longueur dos (cm)", labelEn: "Center back length (cm)" },
  { key: "taille", label: "Tour de taille (cm)", labelEn: "Waist line (cm)" },
  { key: "hanches", label: "Tour de hanches (cm)", labelEn: "Hip line (cm)" },
  { key: "bassin", label: "Tour de bassin (cm)", labelEn: "Full seat (cm)" },
  { key: "entrejambe", label: "Montant / Entrejambe (cm)", labelEn: "Inseam length (cm)" },
  { key: "cuisse", label: "Tour de cuisse (cm)", labelEn: "Thigh width (cm)" },
  { key: "lg_bras", label: "Longueur bras (cm)", labelEn: "Arm length (cm)" },
  { key: "tour_bras", label: "Tour de bras (cm)", labelEn: "Bicep girth (cm)" },
];

const THEMES = {
  ecru: {
    name: "Atelier Écru",
    nameEn: "Atelier Ecru",
    bg: "#f5f5f4",       // Stone 50
    panelBg: "#ffffff",
    border: "#e7e5e4",
    text: "#1c1917",     // Stone 900
    textMuted: "#78716c", // Stone 500
    accent: "#0f766e",   // Teal 700
    accentText: "#ffffff",
    headerBg: "#ffffff",
    badgeBg: "#1c1917",
    cardBgSelected: "#1c1917",
    cardTextSelected: "#ffffff",
    buttonBg: "#1c1917",
    buttonText: "#ffffff",
    accentHover: "#115e59",
  },
  sombre: {
    name: "Couture Sombre",
    nameEn: "Dark Couture",
    bg: "#0c0a09",       // Deep charcoal
    panelBg: "#1c1917",  // Stone 900
    border: "#2e2a24",
    text: "#f5f5f4",
    textMuted: "#a8a29e",
    accent: "#cca050",   // Warm Gold
    accentText: "#1c1917",
    headerBg: "#1c1917",
    badgeBg: "#cca050",
    cardBgSelected: "#cca050",
    cardTextSelected: "#1c1917",
    buttonBg: "#cca050",
    buttonText: "#1c1917",
    accentHover: "#b88f3e",
  },
  rose: {
    name: "Rose Poudré",
    nameEn: "Powder Pink",
    bg: "#faf5f5",       // Soft pale pink neutral
    panelBg: "#fff5f5",  // Light peach blush
    border: "#f3dadb",
    text: "#5c2a2b",     // Deep wine
    textMuted: "#a07275",
    accent: "#bd4c54",   // Soft crimson red
    accentText: "#ffffff",
    headerBg: "#fff0f0",
    badgeBg: "#bd4c54",
    cardBgSelected: "#bd4c54",
    cardTextSelected: "#ffffff",
    buttonBg: "#bd4c54",
    buttonText: "#ffffff",
    accentHover: "#a23c44",
  },
  emeraude: {
    name: "Émeraude Royal",
    nameEn: "Royal Emerald",
    bg: "#f4f7f5",       // Soft jade green backdrop
    panelBg: "#ffffff",
    border: "#d1dfd6",
    text: "#064e3b",     // Deep forest emerald
    textMuted: "#4d7c5e",
    accent: "#065f46",
    accentText: "#ffffff",
    headerBg: "#e6f0ea",
    badgeBg: "#064e3b",
    cardBgSelected: "#064e3b",
    cardTextSelected: "#ffffff",
    buttonBg: "#064e3b",
    buttonText: "#ffffff",
    accentHover: "#044e39",
  },
  denim: {
    name: "Indigo Denim",
    nameEn: "Indigo Denim",
    bg: "#f0f4f8",       // Cold blue slate
    panelBg: "#ffffff",
    border: "#ccd8e5",
    text: "#1e3a5f",     // Heavy denim dark indigo
    textMuted: "#6b879c",
    accent: "#2563eb",
    accentText: "#ffffff",
    headerBg: "#e1eaf4",
    badgeBg: "#1e3a5f",
    cardBgSelected: "#1e3a5f",
    cardTextSelected: "#ffffff",
    buttonBg: "#1e3a5f",
    buttonText: "#ffffff",
    accentHover: "#1d4ed8",
  },
};

const translations = {
  FR: {
    title: "Atelier Sur Mesure",
    subTitle: "v4.6 • Gestionnaire d'Atelier Couture",
    clientele: "Clientèle",
    createFiche: "Créer une fiche",
    searchPlaceholder: "Nom ou annotations...",
    morphology: "Morphologie",
    style: "Style",
    all: "Tous",
    female: "Femme",
    male: "Homme",
    noFiche: "Aucune fiche correspondante.",
    styleShort: "Style",
    notesPlaceholder: "Pas d'instructions de couture enregistrées.",
    gabaritTitle: "Mannequin Dynamique d'Atelier : ",
    gabaritSub: "Mesures et tranches d'ajustements visualisées",
    guideHeader: "Atelier Guide • Stylisme Morphologique",
    guideA: "Type A (Triangle) : Les hanches prédominent sur la carrure d'épaules. Élargissez les épaules (épaulettes, manches raglan/ballon). Évitez les pantalons carottes.",
    guideH: "Type H (Rectangle) : Épaules et hanches alignées. Recréez du relief par des pinces décoratives décalées, ceintures lâches ou basques asymétriques.",
    guideX: "Type X (Sablier) : Proportions de sablier idéales. Cirez les hanches, ajustez avec des pinces droites et un boutonnage cintré ou croisé.",
    guideY: "Type Y (Squelette/Inversé) : Carrure athlétique et hanches étroites. Donnez du volume au bas avec des plissés évasés ou des basques chargées.",
    guideO: "Type O (Rondeur) : Silhouette galbée. Préférez la taille empire et les étoffes fluides coupées dans le biais d'encolures fuyantes ou de décolletés en V.",
    welcomeTitle: "Bienvenue à votre Atelier Couture",
    welcomeSub: "Sélectionnez un client à gauche ou créez-en un nouveau pour charger son mannequin anthropométrique 3D interactif et configurer son drapé.",
    ficheMesures: "📐 Fiche & Mesures",
    assistantIA: "✨ Assistant IA",
    paramMorpho: "Paramètres Morphologiques",
    genre: "Genre",
    corpulence: "Taille de patron",
    mince: "Mince (T34-T38)",
    moyen: "Moyen (T40-T44)",
    forte: "Forte (T46-T50)",
    notesLabel: "Notes & Instructions de Style",
    notesTextareaPlaceholder: "Ex: Tissu léger d'origine, ourlet à revers, empiècements...",
    mesuresStandardTitle: "MESURES STANDARDS (CM)",
    mesureAjustTitle: "REPERES ET PINCES DU MANNEQUIN 3D",
    noRepere: "Aucun point d'ajustement ou repère couture personnalisé n'a encore été placé. Cliquez n'importe où sur le mannequin 3D pour poser une aiguille.",
    deleteRepere: "Retirer l'aiguille",
    validerFiche: "Enregistrer la fiche",
    genererPDF: "Générer le PDF",
    chatPlaceholder: "Comment ajuster ou cintrer cette longueur de dos ?",
    chatPoser: "Poser la question",
    chatAssistantIntro: "Bonjour ! Je suis votre conseiller IA de l'atelier couture. Je peux vous guider sur les pinces de taille, le tombé de veste ou les patrons de coupe adaptés à la morphologie de vos fiches clients.",
    chatSelectingBtn: "L'assistant analyse les lignes de coupe...",
    newGabaritTitle: "Nouveau Gabarit - Client couture",
    nomPrenom: "Nom complet du Client",
    genreMannequin: "Genre de Mannequin",
    createAndDrape: "Créer et Drapé",
    cancel: "Annuler",
    errorInputGoogle: "Veuillez saisir votre ID de client Google dans le panneau.",
    authSuccess: "Authentification Google réussie ! Recherche des fichiers...",
    fileDetected: "Fichier 'atelier-clients.json' détecté ! Prêt pour la synchronisation.",
    noFileDetected: "Aucun fichier existant détecté dans Drive. Prêt à en créer un nouveau.",
    errorOAuth: "Erreur de connexion Drive: ",
    emptyFormMsg: "Aucune fiche chargée à droite.",
    warningTitle: "Mesures Manquantes détectées",
    warningSubtext: "Avant d'archiver la fiche de {name}, vérifiez le gabarit de couture. Les mesures standard suivantes ne sont pas encore renseignées:",
    completeFirst: "Compléter la fiche d'abord",
    saveAnyway: "Enregistrer quand même",
    driveCloudTitle: "Espace Cloud - Persistance Google Drive API v3",
    driveCloudText: "Pour lier votre atelier de couture avec un fichier d'enregistrement unique atelier-clients.json dans votre Google Drive, configurer l'ID client ci-dessous :",
    googleClientIdTitle: "Clé ID Google Client d'authentification",
    activateOAuth: "Activer OAuth 2.0",
    gDriveLoad: "Télécharger du Drive",
    gDriveSave: "Envoyer vers l'espace Drive",
    localStorePill: "Stockage Local Actif",
    cloudPill: "Drive Cloud Connecté",
    syncTimeText: "Synchro : ",
    helpGoogleTitle: "Comment obtenir votre Google Client ID ? (Compte personnel gratuit)",
    alertSuccess: "Fiche de gabarits mise à jour avec succès.",
    downloadingAlert: "Génération de la fiche PDF en cours...",
    mignonne: "Style",
  },
  EN: {
    title: "Bespoke Atelier",
    subTitle: "v4.6 • Sewing Workshop Manager",
    clientele: "Clients database",
    createFiche: "New Profile",
    searchPlaceholder: "Search names or notes...",
    morphology: "Morphology",
    style: "Style",
    all: "All",
    female: "Female",
    male: "Male",
    noFiche: "No matching client profiles.",
    styleShort: "Style",
    notesPlaceholder: "No design instructions saved yet.",
    gabaritTitle: "Dynamic Dress Form: ",
    gabaritSub: "Measurements & adjustment zones overview",
    guideHeader: "Atelier Guide • Morphological Styling",
    guideA: "Type A (Triangle): Hips are wider than the shoulders. Broaden the shoulders (shoulder pads, balloon sleeves) and avoid tapered pants.",
    guideH: "Type H (Rectangle): Shoulders and hips are aligned. Recreate curves using loose belts or asymmetric flared peplums.",
    guideX: "Type X (Hourglass): Ideal proportions with a well-defined waist. Highlight this! Opt for cinched seams, wraps and fitted buttoning.",
    guideY: "Type Y (Inverted Triangle): Broad shoulders and narrower hips. Distribute volume down using flared pleats, details or patch pockets on hips.",
    guideO: "Type O (Round/Oval): Soft curves. Avoid hard horizontal seams. Opt for Empire waistlines, fluid silks and long elegant V-necklines.",
    welcomeTitle: "Welcome to your Bespoke Atelier",
    welcomeSub: "Select any client from the left pane or click Create to customize their 3D interactive mannequin. Lay down pins, custom remarks and design lines.",
    ficheMesures: "📐 Specs & Measures",
    assistantIA: "✨ AI Assistant",
    paramMorpho: "Morphological Settings",
    genre: "Gender",
    corpulence: "Sizing Pattern",
    mince: "Slim (T34-T38)",
    moyen: "Medium (T40-T44)",
    forte: "Full (T46-T50)",
    notesLabel: "Design Notes & Instructions",
    notesTextareaPlaceholder: "e.g., Light flowy silk, double cuffed hem, lining details...",
    mesuresStandardTitle: "STANDARD MEASUREMENTS (CM)",
    mesureAjustTitle: "3D MANNEQUIN PINS & PLACEMENTS",
    noRepere: "No custom measurement pin has been placed on the 3D model yet. Click anywhere on the mannequin to insert a custom ruler (e.g. Neck, Wrist).",
    deleteRepere: "Remove pin",
    validerFiche: "Save Profile",
    genererPDF: "Generate PDF",
    chatPlaceholder: "How can I adjust this center-back height/fit?",
    chatPoser: "Ask Assistant",
    chatAssistantIntro: "Hello! I am your AI tailoring assistant. I can guide you on waist pin placement, jacket drapes, or sleeve patterns tailored to your customer's unique body shape.",
    chatSelectingBtn: "Analyzing cut files and drapes...",
    newGabaritTitle: "Create Client Profile",
    nomPrenom: "Customer Full Name",
    genreMannequin: "Dress Form Gender",
    createAndDrape: "Create & Drape",
    cancel: "Cancel",
    errorInputGoogle: "Please enter your Google Client ID first.",
    authSuccess: "Google Authentication successful! Finding files...",
    fileDetected: "File 'atelier-clients.json' identified in your Drive! Ready to sync.",
    noFileDetected: "No existing JSON file in Drive. Ready to build a new one.",
    errorOAuth: "Drive sync error: ",
    emptyFormMsg: "No profile loaded on the right.",
    warningTitle: "Missing Measurements Found",
    warningSubtext: "Before archiving {name}, check your tailoring specifications. The following measurements are blank:",
    completeFirst: "Go back and complete",
    saveAnyway: "Save Profile anyway",
    driveCloudTitle: "Cloud Storage - Google Drive API v3",
    driveCloudText: "To link your tailoring workshop with a single backup file atelier-clients.json in your Google Drive, enter your Google Client ID below:",
    googleClientIdTitle: "Google OAuth Client ID key",
    activateOAuth: "Enable OAuth 2.0",
    gDriveLoad: "Pull files from Drive",
    gDriveSave: "Push files to Drive",
    localStorePill: "Offline Local Storage",
    cloudPill: "Drive Sync Active",
    syncTimeText: "Last Synced: ",
    helpGoogleTitle: "How to get your Google Client ID? (Free Personal Workspace)",
    alertSuccess: "Profile saved successfully.",
    downloadingAlert: "Assembling PDF document...",
    mignonne: "Style",
  }
};

const getStandardLabel = (item: { key: string; label: string; labelEn?: string } | undefined, lang: "FR" | "EN") => {
  if (!item) return "";
  return lang === "EN" ? item.labelEn || item.label : item.label;
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<"ecru" | "sombre" | "rose" | "emeraude" | "denim">(() => {
    return (localStorage.getItem("atelier_theme") as any) || "ecru";
  });

  // Language state
  const [lang, setLang] = useState<"FR" | "EN">(() => {
    return (localStorage.getItem("atelier_lang") as "FR" | "EN") || "FR";
  });

  // State variables for tailoring clients database
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [morphologyFilter, setMorphologyFilter] = useState<string>("All");
  const [genderFilter, setGenderFilter] = useState<string>("All");

  // Selected Pin ID on Mannequin
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Right sidebar Tab Selection: "form" for measures, "ai" for integrated chat
  const [activeTab, setActiveTab] = useState<"form" | "ai">("form");

  // Google OAuth / Drive State
  const [googleClientId, setGoogleClientId] = useState(() => {
    return localStorage.getItem("atelier_google_client_id") || "";
  });
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [lastSyncPath, setLastSyncPath] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);

  // Form Creation State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientGender, setNewClientGender] = useState<"F" | "M">("F");
  const [newClientMorphology, setNewClientMorphology] = useState<"A" | "H" | "X" | "Y" | "O">("X");
  const [newClientSize, setNewClientSize] = useState<number>(1);

  // Validation Warnings modal
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [blankFields, setBlankFields] = useState<{ key: string; label: string }[]>([]);

  // AI assistant integration Chat history
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Bonjour Chrystelle ! Je suis votre conseiller IA de l'atelier couture. Je peux vous guider sur les pinces de taille, le tombé de veste ou les patrons de coupe adaptés à la morphologie de vos fiches clients.",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Temporary client edits before saving
  const [editName, setEditName] = useState("");
  const [editGender, setEditGender] = useState<"F" | "M">("F");
  const [editMorphology, setEditMorphology] = useState<"A" | "H" | "X" | "Y" | "O">("X");
  const [editSize, setEditSize] = useState<number>(1);
  const [editNotes, setEditNotes] = useState("");
  const [editMeasurements, setEditMeasurements] = useState<Record<string, string>>({});

  // Fetch the selected client
  const activeClient = clients.find((c) => c.id === selectedClientId);

  // Load clients initially from localStorage
  useEffect(() => {
    const local = localStorage.getItem("atelier_clients");
    if (local) {
      try {
        setClients(JSON.parse(local));
      } catch (err) {
        console.error("Format de stockage local corrompu.");
      }
    } else {
      // Seed initial mock data for workshop styling playground
      const mockClients: Client[] = [
        {
          id: "seed-elena",
          name: "Elena Rostova",
          gender: "F",
          morphology: "X",
          size: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: "Demande un tailleur croisé cintré pour mariage fin juillet en lin lavé prune.",
          measurements: {
            hauteur: "168",
            epaules: "39",
            poitrine: "92",
            sous_poit: "78",
            lg_dos: "41",
            taille: "66",
            hanches: "94",
            bassin: "98",
            entrejambe: "78",
            cuisse: "52",
            lg_bras: "58",
            tour_bras: "26",
          },
          customPoints: [
            {
              id: "pin-collar",
              label: "Encolure haute",
              value: "36",
              x: 0.5,
              y: 0.22,
            },
            {
              id: "pin-wrist",
              label: "Tour de poignet",
              value: "16",
              x: 0.22,
              y: 0.44,
            },
          ],
        },
        {
          id: "seed-arthur",
          name: "Marc-Antoine Dumas",
          gender: "M",
          morphology: "Y",
          size: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: "Veste d'officier cintrée en drap de laine bleue. Mesures prises avec gilet fin.",
          measurements: {
            hauteur: "182",
            epaules: "46",
            poitrine: "105",
            cou: "41",
            lg_dos: "46",
            taille: "84",
            hanches: "98",
            bassin: "102",
            entrejambe: "84",
            cuisse: "58",
            lg_bras: "64",
            tour_bras: "32",
          },
          customPoints: [],
        },
      ];
      setClients(mockClients);
      localStorage.setItem("atelier_clients", JSON.stringify(mockClients));
    }
  }, []);

  // Update Edit State whenever active client changes
  useEffect(() => {
    if (activeClient) {
      setEditName(activeClient.name);
      setEditGender(activeClient.gender);
      setEditMorphology(activeClient.morphology);
      setEditSize(activeClient.size);
      setEditNotes(activeClient.notes || "");
      setEditMeasurements(activeClient.measurements as Record<string, string>);
    } else {
      setEditName("");
      setEditNotes("");
      setEditMeasurements({});
    }
  }, [selectedClientId]);

  // Sync clients collection back to local storage
  const saveToLocalStorage = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem("atelier_clients", JSON.stringify(newClients));
  };

  // Google OAuth Token Handlers
  const handleConnectDrive = () => {
    if (!googleClientId) {
      setCloudMessage("Veuillez saisir votre ID de client Google dans le panneau.");
      return;
    }
    localStorage.setItem("atelier_google_client_id", googleClientId);

    const tokenClient = initGoogleTokenClient(
      googleClientId,
      async (token) => {
        setAccessToken(token);
        setCloudMessage("Authentification Google réussie ! Recherche des fichiers...");
        try {
          const fileId = await findAtelierFileInDrive(token);
          if (fileId) {
            setDriveFileId(fileId);
            setCloudMessage("Fichier 'atelier-clients.json' détecté ! Prêt pour la synchronisation.");
          } else {
            setCloudMessage("Aucun fichier existant détecté dans Drive. Prêt à en créer un nouveau.");
          }
        } catch (err: any) {
          setCloudMessage(`Erreur de connexion Drive: ${err.message}`);
        }
      },
      (error) => {
        setCloudMessage(`Erreur Google Auth: ${JSON.stringify(error)}`);
      }
    );

    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  };

  const handleSyncFromDrive = async () => {
    if (!accessToken) {
      setCloudMessage("Veuillez d'abord connecter votre espace Google Drive.");
      return;
    }
    setIsSyncing(true);
    setCloudMessage("Téléchargement des données de couture en cours...");
    try {
      const fileId = driveFileId || (await findAtelierFileInDrive(accessToken));
      if (!fileId) {
        setCloudMessage("Aucun fichier 'atelier-clients.json' trouvé sur votre Drive.");
        setIsSyncing(false);
        return;
      }
      const driveClients = await downloadAtelierFileFromDrive(accessToken, fileId);
      if (driveClients && driveClients.length > 0) {
        saveToLocalStorage(driveClients);
        setLastSyncPath(new Date().toLocaleTimeString());
        setCloudMessage(`Données téléchargées ! ${driveClients.length} fiches synchronisées.`);
      } else {
        setCloudMessage("Le fichier Drive est vide.");
      }
    } catch (err: any) {
      setCloudMessage(`Erreur de téléchargement : ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToDrive = async () => {
    if (!accessToken) {
      setCloudMessage("Veuillez connecter votre espace Google Drive.");
      return;
    }
    setIsSyncing(true);
    setCloudMessage("Sauvegarde des fiches de l'atelier sur Google Drive...");
    try {
      const result = await uploadAtelierFileToDrive(accessToken, clients, driveFileId);
      setDriveFileId(result.fileId);
      setLastSyncPath(new Date().toLocaleTimeString());
      setCloudMessage("Fichier de mesures 'atelier-clients.json' sauvegardé sur votre Drive !");
    } catch (err: any) {
      setCloudMessage(`Erreur d'envoi Google Drive: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Create Client trigger
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: Client = {
      id: "cl-" + Math.random().toString(36).substring(2, 11),
      name: newClientName,
      gender: newClientGender,
      morphology: newClientMorphology,
      size: newClientSize,
      measurements: {},
      customPoints: [],
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newClient, ...clients];
    saveToLocalStorage(updated);
    setSelectedClientId(newClient.id);
    setNewClientName("");
    setShowCreateModal(false);
  };

  // Delete Client trigger
  const handleDeleteClient = (id: string) => {
    if (confirm("Supprimer définitivement cette fiche client de l'atelier ?")) {
      const updated = clients.filter((c) => c.id !== id);
      saveToLocalStorage(updated);
      if (selectedClientId === id) {
        setSelectedClientId(null);
      }
    }
  };

  // Handle saving edits on active client measurements with mandatory checklist warning
  const handlePreSaveVerification = () => {
    if (!activeClient) return;

    // Determine the set of standard fields to inspect
    const keysToCheck = editGender === "F" ? FEMALE_STANDARDS : MALE_STANDARDS;
    const missing = keysToCheck.filter((f) => !editMeasurements[f.key] || editMeasurements[f.key].trim() === "");

    if (missing.length > 0) {
      setBlankFields(missing);
      setShowValidationPopup(true);
    } else {
      executeSaveClientsDirectly();
    }
  };

  const executeSaveClientsDirectly = () => {
    if (!activeClient) return;

    const updatedClients = clients.map((c) => {
      if (c.id === activeClient.id) {
        return {
          ...c,
          name: editName,
          gender: editGender,
          morphology: editMorphology,
          size: editSize,
          notes: editNotes,
          measurements: editMeasurements,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    saveToLocalStorage(updatedClients);
    setShowValidationPopup(false);
    alert("Fiche mise à jour avec succès.");
  };

  // Generate and download a PDF summary of the active customer profile
  const generatePDF = () => {
    if (!activeClient) return;

    // Standard constructor format
    const doc = new jsPDF();
    
    // Header styling banner
    doc.setFillColor(28, 25, 23); // Charcoal #1c1917
    doc.rect(15, 15, 180, 8, "F");
    
    // Top Brand Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(28, 25, 23);
    doc.text("ATELIER COUTURE - GABARIT DE MESURES", 15, 38);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 113, 108); // Grey #78716c
    doc.text("FICHE TECHNIQUE CLIENT & REPERES DU MANNEQUIN 3D", 15, 46);
    
    // Separator
    doc.setDrawColor(231, 229, 228); // #e7e5e4
    doc.line(15, 52, 195, 52);
    
    // Client Meta Informations
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(28, 25, 23);
    doc.text(`Client : ${activeClient.name}`, 15, 62);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    // Decode Gender
    const genderStr = activeClient.gender === "F" ? "Femme (F)" : "Homme (M)";
    
    // Decode Morphology
    let morphStr = activeClient.morphology;
    switch (activeClient.morphology) {
      case "A": morphStr = "A (Triangle)"; break;
      case "H": morphStr = "H (Rectangle)"; break;
      case "X": morphStr = "X (Sablier)"; break;
      case "Y": morphStr = "Y (Triangle Inversé)"; break;
      case "O": morphStr = "O (Rond)"; break;
    }
    
    // Decode Size
    let sizeStr = "Moyen (T40-T44)";
    if (activeClient.size === 0) sizeStr = "Mince (T34-T38)";
    if (activeClient.size === 2) sizeStr = "Forte (T46-T50)";

    doc.text(`Genre : ${genderStr}`, 15, 70);
    doc.text(`Morphologie : ${morphStr}`, 15, 76);
    doc.text(`Corpulence : ${sizeStr}`, 15, 82);
    
    const dateStr = new Date(activeClient.updatedAt || activeClient.createdAt || new Date()).toLocaleString("fr-FR");
    doc.text(`Dernière mise à jour : ${dateStr}`, 115, 70);
    
    // Line separator
    doc.line(15, 88, 195, 88);
    
    let yPos = 96;

    // Notes Section
    if (activeClient.notes) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text("NOTES & INSTRUCTIONS DE STYLE :", 15, yPos);
      
      const splitNotes = doc.splitTextToSize(activeClient.notes, 175);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(87, 83, 78); // #57534e
      doc.text(splitNotes, 15, yPos + 6);
      yPos += 14 + (splitNotes.length * 4);
      
      // Separator
      doc.setDrawColor(231, 229, 228);
      doc.line(15, yPos - 4, 195, yPos - 4);
    }
    
    // Standard Measurements Section
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 25, 23);
    doc.text("MESURES STANDARDS (CM) :", 15, yPos);
    yPos += 8;
    
    const standards = activeClient.gender === "F" ? FEMALE_STANDARDS : MALE_STANDARDS;
    
    let col1_x = 15;
    let col2_x = 110;
    let row_height = 6;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(87, 83, 78);
    
    for (let i = 0; i < standards.length; i += 2) {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
      }
      // Column 1
      const s1 = standards[i];
      const val1 = activeClient.measurements?.[s1.key] || "-";
      doc.setFont("Helvetica", "bold");
      doc.text(`${s1.label} :`, col1_x, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(`${val1}`, col1_x + 55, yPos);
      
      // Column 2
      if (i + 1 < standards.length) {
        const s2 = standards[i + 1];
        const val2 = activeClient.measurements?.[s2.key] || "-";
        doc.setFont("Helvetica", "bold");
        doc.text(`${s2.label} :`, col2_x, yPos);
        doc.setFont("Helvetica", "normal");
        doc.text(`${val2}`, col2_x + 55, yPos);
      }
      
      yPos += row_height;
    }
    
    // Separator
    yPos += 4;
    if (yPos > 275) {
      doc.addPage();
      yPos = 20;
    }
    doc.line(15, yPos - 4, 195, yPos - 4);
    
    // Annotations & Custom Points Section (customPoints)
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(28, 25, 23);
    doc.text("ANNOTATIONS ET REPÈRES DU MANNEQUIN 3D :", 15, yPos);
    yPos += 8;
    
    const pins = activeClient.customPoints || [];
    if (pins.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120, 113, 108);
      doc.text("Aucun repère personnalisé ou annotation de couture n'a été placé sur le mannequin.", 15, yPos);
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(87, 83, 78);
      
      pins.forEach((pin, index) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("Helvetica", "bold");
        doc.text(`${index + 1}. ${pin.label || "Annotation"} :`, 15, yPos);
        doc.setFont("Helvetica", "normal");
        doc.text(`${pin.value || "-"} cm`, 100, yPos);
        yPos += 6;
      });
    }

    // Save PDF file
    const safeName = activeClient.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(`fiche_client_${safeName}.pdf`);
  };

  // Customized Custom Point handlers
  const handleAddNewCustomPoint = (pt: Omit<CustomPoint, "id">) => {
    if (!activeClient) return;
    const newPt: CustomPoint = {
      ...pt,
      id: "pt-" + Math.random().toString(36).substring(2, 11),
    };
    const updatedPoints = [...(activeClient.customPoints || []), newPt];

    const updatedClients = clients.map((c) => {
      if (c.id === activeClient.id) {
        return {
          ...c,
          customPoints: updatedPoints,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    saveToLocalStorage(updatedClients);
  };

  const handleDeleteCustomPoint = (pointId: string) => {
    if (!activeClient) return;
    const updatedPoints = (activeClient.customPoints || []).filter((p) => p.id !== pointId);

    const updatedClients = clients.map((c) => {
      if (c.id === activeClient.id) {
        return {
          ...c,
          customPoints: updatedPoints,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    saveToLocalStorage(updatedClients);
  };

  // AI Assistant trigger contacting the secure server route
  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const query = aiQuestion.trim();
    setAiQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: query }]);
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientData: activeClient
            ? {
                name: activeClient.name,
                gender: editGender,
                morphology: editMorphology,
                size: editSize,
                notes: editNotes,
                measurements: editMeasurements,
              }
            : null,
          question: query,
          history: chatHistory.slice(-6), // pass recent history
        }),
      });

      if (!response.ok) {
        throw new Error("Le serveur d'atelier n'a pas pu répondre.");
      }

      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Désolé Chrystelle, un problème technique est survenu : ${err.message}. Pouvez-vous vérifier la console ou tenter de réinstaller vos dépendances ?`,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filter clients List
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMorpho = morphologyFilter === "All" || c.morphology === morphologyFilter;
    const matchesGender = genderFilter === "All" || c.gender === genderFilter;
    return matchesSearch && matchesMorpho && matchesGender;
  });

  const activeTheme = THEMES[theme] || THEMES.ecru;

  const dynamicVariablesSheet = `
    :root {
      --app-bg: ${activeTheme.bg};
      --panel-bg: ${activeTheme.panelBg};
      --border-color: ${activeTheme.border};
      --text-color: ${activeTheme.text};
      --text-muted: ${activeTheme.textMuted};
      --accent-color: ${activeTheme.accent};
      --accent-text: ${activeTheme.accentText};
      --header-bg: ${activeTheme.headerBg};
      --badge-bg: ${activeTheme.badgeBg};
      --card-bg-selected: ${activeTheme.cardBgSelected};
      --card-text-selected: ${activeTheme.cardTextSelected};
      --button-bg: ${activeTheme.buttonBg};
      --button-text: ${activeTheme.buttonText};
      --accent-hover: ${activeTheme.accentHover};
    }
  `;

  return (
    <div style={styles.appContainer}>
      <style>{dynamicVariablesSheet}</style>
      <style>{customStyleSheet}</style>
      <style>{`
        /* Dynamic style rules that utilize CSS variables */
        select option {
          background-color: var(--panel-bg);
          color: var(--text-color);
        }
        /* Custom styled filters */
        .theme-select-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      {/* Workshop Header & Status Bar */}
      <header style={styles.header}>
        <div style={styles.headerTitleGroup}>
          <div style={{
            ...styles.logoBadge,
            backgroundColor: "var(--badge-bg)",
            color: "var(--accent-text)"
          }}>
            A
          </div>
          <div>
            <h1 style={{ ...styles.mainTitle, color: "var(--text-color)" }}>{translations[lang].title}</h1>
            <p style={{ ...styles.subTitle, color: "var(--text-muted)" }}>{translations[lang].subTitle}</p>
          </div>
        </div>

        {/* Theme, Language and Sync controls */}
        <div style={styles.headerControls}>
          {/* Theme Selector */}
          <div className="theme-select-indicator">
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)" }}>🎨 Theme:</span>
            <select
              value={theme}
              onChange={(e) => {
                const val = e.target.value as any;
                setTheme(val);
                localStorage.setItem("atelier_theme", val);
              }}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--panel-bg)",
                color: "var(--text-color)",
                fontSize: "0.75rem",
                fontWeight: "bold",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="ecru">{lang === "EN" ? THEMES.ecru.nameEn : THEMES.ecru.name} 🎨</option>
              <option value="sombre">{lang === "EN" ? THEMES.sombre.nameEn : THEMES.sombre.name} 🌙</option>
              <option value="rose">{lang === "EN" ? THEMES.rose.nameEn : THEMES.rose.name} 🌸</option>
              <option value="emeraude">{lang === "EN" ? THEMES.emeraude.nameEn : THEMES.emeraude.name} 💎</option>
              <option value="denim">{lang === "EN" ? THEMES.denim.nameEn : THEMES.denim.name} 🧵</option>
            </select>
          </div>

          {/* Language Selector */}
          <div className="theme-select-indicator">
            <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)" }}>🌐 Lang:</span>
            <select
              value={lang}
              onChange={(e) => {
                const val = e.target.value as "FR" | "EN";
                setLang(val);
                localStorage.setItem("atelier_lang", val);
              }}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--panel-bg)",
                color: "var(--text-color)",
                fontSize: "0.75rem",
                fontWeight: "bold",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="FR">Français 🇫🇷</option>
              <option value="EN">English 🇬🇧</option>
            </select>
          </div>

          <div style={styles.syncStateLine}>
            {accessToken ? (
              <span style={{
                ...styles.onlinePill,
                backgroundColor: "var(--panel-bg)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)"
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block", marginRight: "6px" }}></span>
                {translations[lang].cloudPill}
              </span>
            ) : (
              <span style={{
                ...styles.offlinePill,
                backgroundColor: "var(--panel-bg)",
                borderColor: "var(--border-color)",
                color: "var(--text-muted)"
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#a8a29e", display: "inline-block", marginRight: "6px" }}></span>
                {translations[lang].localStorePill}
              </span>
            )}
            {lastSyncPath && <span style={{ ...styles.syncTime, color: "var(--text-muted)" }}>{translations[lang].syncTimeText}{lastSyncPath}</span>}
          </div>

          <button
            onClick={() => setIsDriveConfigOpen(!isDriveConfigOpen)}
            style={{
              ...styles.driveToggleBtn,
              backgroundColor: isDriveConfigOpen ? "var(--border-color)" : "var(--button-bg)",
              color: isDriveConfigOpen ? "var(--text-color)" : "var(--button-text)",
            }}
          >
            🔌 Cloud Drive
          </button>
        </div>
      </header>

      {/* Slide-out / Expandable Google Drive config sheet */}
      {isDriveConfigOpen && (
        <section style={styles.driveSetupBar}>
          <div style={styles.driveForm}>
            <div style={styles.driveInstruct}>
              <h4>Espace Cloud - Persistance Google Drive API v3</h4>
              <p>
                Pour lier votre atelier de couture avec un fichier d'enregistrement unique{" "}
                <code>atelier-clients.json</code> dans votre Google Drive, installez vos identifiants d'API Google dans
                la console Cloud Console Google API et ajoutez le Client ID ci-dessous :
              </p>
            </div>
            
            <div style={styles.driveInputRow}>
              <input
                type="text"
                placeholder="Ex: 123456-example.apps.googleusercontent.com"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                style={styles.controlInput}
                title="Clé ID Google Client d'authentification"
              />
              <button onClick={handleConnectDrive} style={styles.actionBtnSecondary}>
                🔗 Activer OAuth 2.0
              </button>
            </div>

            {/* Guide d'aide pour compte personnel */}
            <details style={{ width: "100%", marginTop: "12px", border: "1px dashed #d1c9bc", borderRadius: "8px", backgroundColor: "#faf9f6", padding: "10px 14px", color: "#44403c" }}>
              <summary style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#57534e", cursor: "pointer", userSelect: "none", outline: "none" }}>
                💡 Comment obtenir votre Google Client ID ? (Compte personnel gratuit)
              </summary>
              <div style={{ marginTop: "10px", borderTop: "1px solid #e7e5e4", paddingTop: "10px", fontSize: "0.82rem", color: "#57534e" }}>
                <p style={{ marginBottom: "6px", fontWeight: "500" }}>Puisque vous utilisez un compte Google standard (non professionnel), suivez ces étapes gratuites :</p>
                <ol style={{ paddingLeft: "16px", margin: "8px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>
                    Rendez-vous sur la <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "#0f766e", fontWeight: "bold", textDecoration: "underline" }}>Google Cloud Console</a> et créez un projet gratuit.
                  </li>
                  <li>
                    Dans la barre de recherche du haut, cherchez <strong>"Google Drive API"</strong> puis cliquez sur <strong>Activer</strong>.
                  </li>
                  <li>
                    Allez dans l'onglet <strong>Écran de consentement OAuth</strong> dans le menu gauche :
                    <ul style={{ paddingLeft: "14px", marginTop: "4px", listStyleType: "disc" }}>
                      <li>Choisissez le type de consentement <strong>Externe</strong> (pour tous les comptes personnels).</li>
                      <li>Renseignez les champs obligatoires (nom d'application comme <em>"Atelier 3D"</em>, et votre adresse courriel).</li>
                      <li><strong>Étape obligatoire ("Utilisateurs de test") :</strong> Ajoutez bien votre propre adresse email Gmail pour vous autoriser l'accès en mode de développement. Sinon, l'authentification plantera lors de la connexion.</li>
                    </ul>
                  </li>
                  <li>
                    Allez ensuite dans l'onglet <strong>Identifiants</strong> de la colonne de gauche :
                    <ul style={{ paddingLeft: "14px", marginTop: "4px", listStyleType: "disc" }}>
                      <li>Cliquez sur <strong>+ Créer des identifiants</strong> et sélectionnez <strong>ID client OAuth</strong>.</li>
                      <li>Sélectionnez le type d'application <strong>Application Web</strong>.</li>
                      <li>Dans la section <strong>Origines JavaScript autorisées</strong>, cliquez sur "Ajouter une URI" et collez l'adresse URL complète de cette application (copiez l'URL de votre barre d'adresse de l'aperçu, par exemple <code>https://ais-dev-chpts2pix5xzjtceoom4h3-5502281590.europe-west2.run.app</code>).</li>
                    </ul>
                  </li>
                  <li>
                    Cliquez sur <strong>Créer</strong>, puis copiez la longue chaîne affichée se terminant par <code>.apps.googleusercontent.com</code> et collez-la dans la case d'ID Client ci-dessus.
                  </li>
                </ol>
              </div>
            </details>

            {accessToken && (
              <div style={styles.syncButtonCluster}>
                <button onClick={handleSyncFromDrive} disabled={isSyncing} style={styles.syncBtn}>
                  <FileDown size={14} /> Télécharger du Drive
                </button>
                <button onClick={handleSyncToDrive} disabled={isSyncing} style={styles.syncBtnOut}>
                  <FileUp size={14} /> Envoyer vers le Drive
                </button>
              </div>
            )}

            {cloudMessage && <p style={styles.cloudLog}>{cloudMessage}</p>}
          </div>
        </section>
      )}

      {/* Main Grid Workspace */}
      <main className="workspace-grid">
        
        {/* LEFT COLUMN: Clients list, creation, filters */}
        <div className="workspace-left-col">
          <div style={styles.cardHeader}>
            <span style={{ ...styles.cardTitleText, color: "var(--text-color)" }}>
              <Users size={16} style={{ marginRight: "6px" }} /> {translations[lang].clientele}
            </span>
            <button onClick={() => setShowCreateModal(true)} style={{
              ...styles.addClientBtn,
              backgroundColor: "var(--button-bg)",
              color: "var(--button-text)"
            }}>
              <Plus size={14} /> {translations[lang].createFiche}
            </button>
          </div>

          {/* Search bar */}
          <div style={{ ...styles.searchWrapper, border: "1px solid var(--border-color)", backgroundColor: "var(--app-bg)" }}>
            <Search size={14} style={{ ...styles.searchIcon, color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder={translations[lang].searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...styles.searchInput, color: "var(--text-color)" }}
            />
          </div>

          {/* Filtration Group */}
          <div style={styles.filterSection}>
            <div style={styles.filterRow}>
              <span style={{ ...styles.miniLabel, color: "var(--text-muted)" }}>Morph:</span>
              {["All", "A", "H", "X", "Y", "O"].map((morph) => (
                <button
                  key={morph}
                  onClick={() => setMorphologyFilter(morph)}
                  style={{
                    ...styles.filterTab,
                    backgroundColor: morphologyFilter === morph ? "var(--card-bg-selected)" : "var(--app-bg)",
                    color: morphologyFilter === morph ? "var(--card-text-selected)" : "var(--text-color)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {morph === "All" ? (lang === "EN" ? "All" : "Tous") : morph}
                </button>
              ))}
            </div>
            
            <div style={styles.filterRow}>
              <span style={{ ...styles.miniLabel, color: "var(--text-muted)" }}>{translations[lang].mignonne}:</span>
              <button
                onClick={() => setGenderFilter("All")}
                style={{
                  ...styles.filterTab,
                  backgroundColor: genderFilter === "All" ? "var(--card-bg-selected)" : "var(--app-bg)",
                  color: genderFilter === "All" ? "var(--card-text-selected)" : "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {translations[lang].all}
              </button>
              <button
                onClick={() => setGenderFilter("F")}
                style={{
                  ...styles.filterTab,
                  backgroundColor: genderFilter === "F" ? "var(--card-bg-selected)" : "var(--app-bg)",
                  color: genderFilter === "F" ? "var(--card-text-selected)" : "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {translations[lang].female}
              </button>
              <button
                onClick={() => setGenderFilter("M")}
                style={{
                  ...styles.filterTab,
                  backgroundColor: genderFilter === "M" ? "var(--card-bg-selected)" : "var(--app-bg)",
                  color: genderFilter === "M" ? "var(--card-text-selected)" : "var(--text-color)",
                  border: "1px solid var(--border-color)",
                }}
              >
                {translations[lang].male}
              </button>
            </div>
          </div>

          {/* Clients Cards Scrollbox */}
          <ul style={styles.clientsList} id="main-client-list">
            {filteredClients.length === 0 ? (
              <li style={{ ...styles.emptyListMsg, color: "var(--text-muted)" }}>{translations[lang].noFiche}</li>
            ) : (
              filteredClients.map((c) => {
                const isSelected = selectedClientId === c.id;
                return (
                  <li
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSelectedPinId(null);
                    }}
                    style={{
                      ...styles.clientCard,
                      border: isSelected ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                      backgroundColor: isSelected ? "var(--card-bg-selected)" : "var(--panel-bg)",
                      boxShadow: isSelected ? "0 4px 6px -1px rgba(0,0,0,0.15)" : "none",
                    }}
                    id={`client-card-${c.id}`}
                  >
                    <div style={styles.clientCardFirst}>
                      <strong style={{ color: isSelected ? "var(--card-text-selected)" : "var(--text-color)", fontSize: "0.95rem" }}>{c.name}</strong>
                      <span
                        style={{
                          ...styles.miniMorphologyBadge,
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.15)"
                            : c.morphology === "X"
                            ? "#dcfce7"
                            : c.morphology === "A"
                            ? "#fef3c7"
                            : "#f3e8ff",
                          color: isSelected
                            ? "var(--card-text-selected)"
                            : c.morphology === "X"
                            ? "#166534"
                            : c.morphology === "A"
                            ? "#92400e"
                            : "#6b21a8",
                        }}
                      >
                        Morph. {c.morphology}
                      </span>
                    </div>

                    <p style={{
                      ...styles.clientCardTruncatedNotes,
                      color: isSelected ? "rgba(255,255,255,0.75)" : "var(--text-muted)",
                      fontSize: "0.78rem"
                    }}>
                      {c.notes || translations[lang].notesPlaceholder}
                    </p>

                    <div style={styles.clientCardFooter}>
                      <span style={{
                        ...styles.cardMetaGender,
                        color: isSelected ? "rgba(255,255,255,0.6)" : "var(--text-muted)"
                      }}>
                        {translations[lang].styleShort} {c.gender === "F" ? translations[lang].female : translations[lang].male} • T{(c.size + 1) * 2 + 34}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(c.id);
                        }}
                        style={{
                          ...styles.deleteMiniBtn,
                          color: isSelected ? "rgba(255,255,255,0.6)" : "var(--text-muted)"
                        }}
                        title={lang === "EN" ? "Delete client profile" : "Supprimer la fiche client"}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* MIDDLE COLUMN: Mannequin 3D rendering with interactives */}
        <div className="workspace-center-col">
          {activeClient ? (
            <div style={styles.mannequinWrapper}>
              <div style={styles.mannequinHeader}>
                <h3>{translations[lang].gabaritTitle}{activeClient.name}</h3>
                <p>{translations[lang].gabaritSub}</p>
              </div>

              <Mannequin3D
                theme={theme}
                client={{
                  ...activeClient,
                  gender: editGender,
                  morphology: editMorphology,
                  size: editSize,
                }}
                onAddCustomPoint={handleAddNewCustomPoint}
                selectedPointId={selectedPinId}
                onSelectPoint={setSelectedPinId}
                onDeletePoint={handleDeleteCustomPoint}
              />

              {/* Dynamic Morphology tips underneath */}
              <div style={styles.morphologyExplanation}>
                <h4 style={styles.expertOpinionHeader}>
                  <Compass size={14} style={{ marginRight: "4px", color: "var(--accent-color)" }} /> {translations[lang].guideHeader}
                </h4>
                {editMorphology === "A" && (
                  <p style={styles.expertOpinionText}>
                    <strong>Type A &bull;</strong> {translations[lang].guideA}
                  </p>
                )}
                {editMorphology === "H" && (
                  <p style={styles.expertOpinionText}>
                    <strong>Type H &bull;</strong> {translations[lang].guideH}
                  </p>
                )}
                {editMorphology === "X" && (
                  <p style={styles.expertOpinionText}>
                    <strong>Type X &bull;</strong> {translations[lang].guideX}
                  </p>
                )}
                {editMorphology === "Y" && (
                  <p style={styles.expertOpinionText}>
                    <strong>Type Y &bull;</strong> {translations[lang].guideY}
                  </p>
                )}
                {editMorphology === "O" && (
                  <p style={styles.expertOpinionText}>
                    <strong>Type O &bull;</strong> {translations[lang].guideO}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={styles.welcomeContainer}>
              <div style={styles.welcomeCard}>
                <Scissors size={48} style={{ marginBottom: "16px", color: "var(--accent-color)" }} />
                <h3>{translations[lang].welcomeTitle}</h3>
                <p>
                  {translations[lang].welcomeSub}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive edit and AI advice */}
        <div className="workspace-right-col">
          {activeClient ? (
            <div style={styles.tabsPanel}>
              
              {/* Tabs selector */}
              <div style={styles.tabsHeader}>
                <button
                  onClick={() => setActiveTab("form")}
                  style={{
                    ...styles.tabLink,
                    borderBottom: activeTab === "form" ? "2px solid var(--accent-color)" : "2px solid transparent",
                    color: activeTab === "form" ? "var(--text-color)" : "var(--text-muted)",
                    fontWeight: activeTab === "form" ? "bold" : "normal",
                  }}
                >
                  {translations[lang].ficheMesures}
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  style={{
                    ...styles.tabLink,
                    borderBottom: activeTab === "ai" ? "2px solid var(--accent-color)" : "2px solid transparent",
                    color: activeTab === "ai" ? "var(--text-color)" : "var(--text-muted)",
                    fontWeight: activeTab === "ai" ? "bold" : "normal",
                  }}
                >
                  <Sparkles size={14} style={{ marginRight: "4px" }} /> {translations[lang].assistantIA}
                </button>
              </div>

              {/* TAB CONTENT: measures form */}
              {activeTab === "form" ? (
                <div style={styles.tabContentPanel}>
                  
                  {/* General settings of active client */}
                  <div style={styles.formSectionBox}>
                    <h4 style={styles.sectionHeaderTitle}>{translations[lang].paramMorpho}</h4>
                    <div style={styles.genderSizeRow}>
                      <div style={styles.inputCell}>
                        <label style={styles.smallFormLabel}>{translations[lang].genre}</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as "F" | "M")}
                          style={styles.selectBox}
                        >
                          <option value="F">{translations[lang].female} (F)</option>
                          <option value="M">Homme (M)</option>
                        </select>
                      </div>

                      <div style={styles.inputCell}>
                        <label style={styles.smallFormLabel}>Morphologie</label>
                        <select
                          value={editMorphology}
                          onChange={(e) => setEditMorphology(e.target.value as "A" | "H" | "X" | "Y" | "O")}
                          style={styles.selectBox}
                        >
                          <option value="A">Courbe A (Triangle)</option>
                          <option value="H">Courbe H (Rectangle)</option>
                          <option value="X">Courbe X (Hourglass)</option>
                          <option value="Y">Courbe Y (Inversé)</option>
                          <option value="O">Courbe O (Rond)</option>
                        </select>
                      </div>

                      <div style={styles.inputCell}>
                        <label style={styles.smallFormLabel}>Corpulence size (0→2)</label>
                        <select
                          value={editSize}
                          onChange={(e) => setEditSize(Number(e.target.value))}
                          style={styles.selectBox}
                        >
                          <option value={0}>Mince (T34-T38)</option>
                          <option value={1}>Moyen (T40-T44)</option>
                          <option value={2}>Forte (T46-T50)</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.inputCellFull}>
                      <label style={styles.smallFormLabel}>Notes & Instructions de Style</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Ex: Tissu léger d'origine, ourlet à revers, empiècements..."
                        style={styles.notesTextarea}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Standard measurements inputs grid */}
                  <div style={styles.formSectionBox}>
                    <h4 style={styles.sectionHeaderTitle}>Gabarit de Mesures Standard (cm)</h4>
                    <div style={styles.measurementsGrid}>
                      {(editGender === "F" ? FEMALE_STANDARDS : MALE_STANDARDS).map((field) => (
                        <div key={field.key} style={styles.measurementFormCell}>
                          <span style={styles.measureLabel}>{field.label}</span>
                          <input
                            type="number"
                            min="0"
                            value={editMeasurements[field.key] || ""}
                            onChange={(e) =>
                              setEditMeasurements({ ...editMeasurements, [field.key]: e.target.value })
                            }
                            style={styles.measureInput}
                            placeholder="-"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trigger Save with popup warnings and PDF download */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "16px", width: "100%" }}>
                    <button onClick={handlePreSaveVerification} style={{ ...styles.mainSaveBtn, flex: 1 }}>
                      <Save size={16} /> Enregistrer la fiche
                    </button>
                    <button
                      onClick={generatePDF}
                      style={{
                        ...styles.mainSaveBtn,
                        backgroundColor: "#0f766e",
                        flex: 1,
                      }}
                      title="Télécharger la fiche de mesures et annotations au format PDF"
                    >
                      <FileDown size={16} /> Générer le PDF
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB CONTENT: AI chat advice */
                <div style={styles.tabContentPanel}>
                  <div style={styles.chatScrollbox}>
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.chatBubble,
                          alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                          backgroundColor: msg.role === "user" ? "#1c1917" : "#f5f5f4",
                          border: msg.role === "user" ? "none" : "1px solid #e7e5e4",
                        }}
                      >
                        <div style={{
                          ...styles.bubbleHeader,
                          color: msg.role === "user" ? "#a8a29e" : "#78716c"
                        }}>
                          <strong>{msg.role === "user" ? "Styliste" : "L'Atelier IA"}</strong>
                        </div>
                        <p style={{
                          ...styles.bubbleText,
                          color: msg.role === "user" ? "#fff" : "#1c1917"
                        }}>{msg.content}</p>
                      </div>
                    ))}
                    {isAiLoading && <div style={styles.chatLoadingMini}>L'assistant sélectionne la meilleure technique...</div>}
                  </div>

                  <form onSubmit={handleAskAssistant} style={styles.chatInputRow}>
                    <input
                      type="text"
                      placeholder="Comment ajuster cette longueur de dos ?"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      style={styles.chatInput}
                    />
                    <button type="submit" disabled={isAiLoading} style={styles.chatSendBtn}>
                      Poser
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyFormMsg}>
              <HelpCircle size={28} color="#a8a29e" style={{ marginBottom: "8px" }} />
              <p>Aucun profil chargé à droite.</p>
            </div>
          )}
        </div>
      </main>

      {/* Creation Modal */}
      {showCreateModal && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogContent}>
            <h3>Nouveau Gabarit - Client couture</h3>
            <form onSubmit={handleCreateClient}>
              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Nom & Prénom</label>
                <input
                  type="text"
                  placeholder="Ex: Madame Sarah Valmy"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  style={styles.dialogInput}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Genre de Mannequin</label>
                <div style={styles.dialogBtnGroup}>
                  <button
                    type="button"
                    onClick={() => setNewClientGender("F")}
                    style={{
                      ...styles.dialogOptionBtn,
                      backgroundColor: newClientGender === "F" ? "#9e774c" : "#fff",
                      color: newClientGender === "F" ? "#fff" : "#4e3c31",
                    }}
                  >
                    🚺 Femme
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewClientGender("M")}
                    style={{
                      ...styles.dialogOptionBtn,
                      backgroundColor: newClientGender === "M" ? "#9e774c" : "#fff",
                      color: newClientGender === "M" ? "#fff" : "#4e3c31",
                    }}
                  >
                    🚹 Homme
                  </button>
                </div>
              </div>

              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Proportions & Morphologie</label>
                <select
                  value={newClientMorphology}
                  onChange={(e) => setNewClientMorphology(e.target.value as any)}
                  style={styles.dialogSelect}
                >
                  <option value="A">Silhoutte A (Hanches larges / Épaules fines)</option>
                  <option value="H">Silhouette H (Rectangle / Alignement droit)</option>
                  <option value="X">Silhouette X (Sablier / Taille marquée)</option>
                  <option value="Y">Silhouette Y (Inversée / Carrure athlétique)</option>
                  <option value="O">Silhouette O (Galbée / Rondeur équilibrée)</option>
                </select>
              </div>

              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Taille standard de patron</label>
                <select
                  value={newClientSize}
                  onChange={(e) => setNewClientSize(Number(e.target.value))}
                  style={styles.dialogSelect}
                >
                  <option value={0}>Mince (Gabarit cintre standard T36-38)</option>
                  <option value={1}>Moyen (Gabarit moyen T40-42)</option>
                  <option value={2}>Forte corpulence (Gabarit drapé fort T46-T48)</option>
                </select>
              </div>

              <div style={styles.dialogActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.dialogCancel}
                >
                  Annuler
                </button>
                <button type="submit" style={styles.dialogSubmit}>
                  Créer et Drapé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification checklist popup */}
      {showValidationPopup && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogContentWarning}>
            <div style={styles.warningTitleGroup}>
              <CloudLightning size={24} color="#cca050" style={{ marginRight: "8px" }} />
              <h3>Mesures Manquantes détectées ({blankFields.length})</h3>
            </div>
            <p style={styles.warningSubtext}>
              Avant d'archiver la fiche de {editName}, vérifiez le gabarit de couture. Les mesures standard suivantes ne sont pas encore renseignées:
            </p>

            <ul style={styles.warningFieldsList}>
              {blankFields.map((field) => (
                <li key={field.key} style={styles.warningFieldItem}>
                  • {field.label}
                </li>
              ))}
            </ul>

            <div style={styles.dialogActions}>
              <button onClick={() => setShowValidationPopup(false)} style={styles.dialogCancel}>
                Completer la fiche d'abord
              </button>
              <button onClick={executeSaveClientsDirectly} style={styles.dialogSubmitWarning}>
                Enregistrer quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Injected Raw custom stylesheet matching "pas de Tailwind, pas de CSS Modules" - Stylist Draft Palette
const customStyleSheet = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,550;1,400&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--app-bg);
  color: var(--text-color);
  line-height: 1.5;
}

/* Scrollbars customized to look like thread stitching but clean stone styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--app-bg);
}
::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

@keyframes pin-pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

/* Complete Responsive Grid and Column styles for all screen sizes */
.workspace-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  flex: 1;
  align-items: stretch;
  min-height: 0;
  width: 100%;
}

.workspace-left-col {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05);
  max-height: 400px; /* Constrain on phone so mannequin isn't pushed too far down */
  overflow: hidden;
  transition: all 0.2s ease;
}

.workspace-center-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  transition: all 0.2s ease;
}

.workspace-right-col {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  max-height: 600px; /* Constrain on phone with independent scrolling */
  transition: all 0.2s ease;
}

@media (min-width: 768px) and (max-width: 1199px) {
  .workspace-grid {
    grid-template-columns: 290px 1fr;
  }
  .workspace-left-col {
    grid-row: span 2;
    max-height: 82vh;
  }
  .workspace-center-col {
    grid-column: 2;
    grid-row: 1;
  }
  .workspace-right-col {
    grid-column: 2;
    grid-row: 2;
    max-height: 82vh;
  }
}

@media (min-width: 1200px) {
  .workspace-grid {
    grid-template-columns: 320px 1fr 390px;
  }
  .workspace-left-col {
    max-height: 82vh;
  }
  .workspace-center-col {
    grid-column: 2;
  }
  .workspace-right-col {
    max-height: 82vh;
  }
}
`;

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: "100vh",
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "16px",
    backgroundColor: "var(--app-bg)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "var(--panel-bg)",
    borderRadius: "16px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
    border: "1px solid var(--border-color)",
    marginBottom: "16px",
    flexWrap: "wrap" as const,
    gap: "12px",
  },
  headerTitleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "var(--badge-bg)",
    color: "var(--accent-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: "1.25rem",
    fontWeight: "bold",
    border: "none",
  },
  mainTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "0.875rem",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--text-color)",
  },
  subTitle: {
    fontSize: "0.75rem",
    color: "#78716c",
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  syncStateLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  onlinePill: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.75rem",
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontWeight: "500",
    border: "1px solid #bbf7d0",
  },
  offlinePill: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.75rem",
    backgroundColor: "#f5f5f4",
    color: "#78716c",
    padding: "4px 12px",
    borderRadius: "9999px",
    fontWeight: "500",
    border: "1px solid #e7e5e4",
  },
  syncTime: {
    fontSize: "0.72rem",
    color: "#78716c",
    fontFamily: "monospace",
  },
  driveToggleBtn: {
    padding: "6px 14px",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.78rem",
    fontWeight: "bold" as any,
    cursor: "pointer",
    transition: "all 0.1s ease",
  },
  driveSetupBar: {
    backgroundColor: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: "16px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
    padding: "16px",
    marginBottom: "16px",
  },
  driveForm: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  driveInstruct: {
    flex: "1 1 100%",
    marginBottom: "8px",
  },
  driveInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap" as const,
  },
  syncButtonCluster: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  syncBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    backgroundColor: "#f5f5f4",
    color: "#1c1917",
    fontSize: "0.8rem",
    fontWeight: "bold" as any,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  driveInputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  driveLabel: {
    fontSize: "0.68rem",
    fontWeight: "bold",
    color: "#78716c",
    textTransform: "uppercase" as const,
  },
  controlInput: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    fontSize: "0.82rem",
    outline: "none",
    width: "220px",
  },
  btnRow: {
    display: "flex",
    gap: "8px",
    alignSelf: "flex-end",
    marginTop: "16px",
  },
  actionBtn: {
    padding: "8px 14px",
    backgroundColor: "#1c1917",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold" as any,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  actionBtnSecondary: {
    padding: "8px 14px",
    backgroundColor: "#fff",
    color: "#1c1917",
    border: "1px solid #e7e5e4",
    borderRadius: "8px",
    fontWeight: "bold" as any,
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  syncBtnOut: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    backgroundColor: "#f5f5f4",
    color: "#1c1917",
    fontSize: "0.8rem",
    fontWeight: "bold" as any,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  cloudLog: {
    fontSize: "0.8rem",
    color: "#1c1917",
    backgroundColor: "#f5f5f4",
    padding: "6px 12px",
    borderRadius: "8px",
    borderLeft: "3.5px solid #1c1917",
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns: "320px 1fr 390px",
    gap: "16px",
    flex: "1",
    alignItems: "stretch",
    minHeight: "0",
    "@media(max-width: 1100px)": {
      gridTemplateColumns: "1fr",
    },
  },
  leftCol: {
    backgroundColor: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
    maxHeight: "82vh",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  cardTitleText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#1c1917",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
  },
  addClientBtn: {
    padding: "6px 12px",
    fontSize: "0.78rem",
    backgroundColor: "#1c1917",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "bold" as any,
  },
  searchWrapper: {
    position: "relative" as const,
    width: "100%",
    marginBottom: "16px",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#a8a29e",
  },
  searchInput: {
    width: "100%",
    padding: "8px 10px 8px 30px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    fontSize: "0.85rem",
    outline: "none",
  },
  filterSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px dashed #e7e5e4",
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap" as const,
  },
  miniLabel: {
    fontSize: "0.72rem",
    color: "#78716c",
    width: "44px",
    fontWeight: "bold" as any,
  },
  filterTab: {
    padding: "3px 8px",
    fontSize: "0.72rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold" as any,
  },
  clientsList: {
    listStyleType: "none",
    overflowY: "auto" as const,
    flex: "1",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
    paddingRight: "4px",
  },
  emptyListMsg: {
    padding: "24px 0",
    textAlign: "center" as const,
    fontSize: "0.85rem",
    color: "#78716c",
    fontStyle: "italic",
  },
  clientCard: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e7e5e4",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  clientCardFirst: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  miniMorphologyBadge: {
    fontSize: "0.7rem",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "bold" as any,
  },
  clientCardTruncatedNotes: {
    fontSize: "0.78rem",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "8px",
  },
  clientCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMetaGender: {
    fontSize: "0.72rem",
  },
  deleteMiniBtn: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px",
    transition: "color 0.1s ease",
  },
  centerCol: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  mannequinWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  mannequinHeader: {
    h3: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: "0.85rem",
      fontWeight: "bold",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "var(--text-color)",
    },
    p: {
      fontSize: "0.75rem",
      color: "var(--text-muted)",
    },
  },
  morphologyExplanation: {
    backgroundColor: "var(--panel-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
  },
  expertOpinionHeader: {
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "var(--accent-color)",
    display: "flex",
    alignItems: "center",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  },
  expertOpinionText: {
    fontSize: "0.82rem",
    color: "var(--text-muted)",
    lineHeight: "1.455",
  },
  welcomeContainer: {
    flex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "450px",
  },
  welcomeCard: {
    maxWidth: "400px",
    textAlign: "center" as const,
    padding: "40px 24px",
    backgroundColor: "var(--panel-bg)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)",
    h3: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: "1rem",
      fontWeight: "bold",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "var(--text-color)",
      marginBottom: "12px",
    },
    p: {
      fontSize: "0.85rem",
      color: "var(--text-muted)",
      lineHeight: "1.5",
    },
  },
  rightCol: {
    backgroundColor: "var(--panel-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
    maxHeight: "82vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  tabsPanel: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
  },
  tabsHeader: {
    display: "flex",
    borderBottom: "1px solid var(--border-color)",
    backgroundColor: "var(--app-bg)",
  },
  tabLink: {
    flex: 1,
    padding: "12px 0",
    textAlign: "center" as const,
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "0.88rem",
    transition: "all 0.15s ease",
  },
  tabContentPanel: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  },
  formSectionBox: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px dashed var(--border-color)",
  },
  sectionHeaderTitle: {
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "var(--text-color)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
    borderLeft: "2.5px solid var(--accent-color)",
    paddingLeft: "6px",
  },
  genderSizeRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },
  inputCell: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  inputCellFull: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    marginTop: "4px",
  },
  smallFormLabel: {
    fontSize: "0.7rem",
    fontWeight: "bold",
    color: "var(--text-muted)",
  },
  selectBox: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--panel-bg)",
    color: "var(--text-color)",
    fontSize: "0.82rem",
    outline: "none",
  },
  notesTextarea: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--panel-bg)",
    color: "var(--text-color)",
    fontSize: "0.82rem",
    resize: "none" as const,
    outline: "none",
    fontFamily: "inherit",
  },
  measurementsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  measurementFormCell: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--app-bg)",
    borderRadius: "6px",
    border: "1px solid var(--border-color)",
    padding: "6px 8px",
  },
  measureLabel: {
    fontSize: "0.72rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  measureInput: {
    width: "60px",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid var(--border-color)",
    backgroundColor: "var(--panel-bg)",
    color: "var(--text-color)",
    textAlign: "right" as const,
    fontSize: "0.82rem",
    fontFamily: "monospace",
    outline: "none",
  },
  mainSaveBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "var(--button-bg)",
    color: "var(--button-text)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: "bold" as any,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.15s ease",
  },
  emptyFormMsg: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--app-bg)",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    padding: "24px",
  },

  // AI chat styles
  chatScrollbox: {
    flex: 1,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    padding: "4px",
    minHeight: "350px",
  },
  chatBubble: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column" as const,
    position: "relative" as const,
  },
  bubbleHeader: {
    fontSize: "0.72rem",
    color: "#78716c",
    marginBottom: "4px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.02em",
  },
  bubbleText: {
    fontSize: "0.82rem",
    color: "#1c1917",
    whiteSpace: "pre-line" as const,
    lineHeight: "1.4",
  },
  chatLoadingMini: {
    fontSize: "0.75rem",
    color: "#78716c",
    fontStyle: "italic",
    padding: "4px",
    alignSelf: "flex-start",
  },
  chatInputRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  chatInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    fontSize: "0.85rem",
    outline: "none",
  },
  chatSendBtn: {
    padding: "10px 16px",
    backgroundColor: "#1c1917",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
  },

  // Dialog Overlay & Content Modals
  dialogOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(2px)",
  },
  dialogContent: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "440px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    border: "1px solid #e7e5e4",
    h3: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: "1.1rem",
      fontWeight: "bold",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "#1c1917",
      marginBottom: "16px",
    },
  },
  dialogInputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    marginBottom: "16px",
  },
  dialogLabel: {
    fontSize: "0.78rem",
    fontWeight: "bold",
    color: "#78716c",
  },
  dialogInput: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    fontSize: "0.88rem",
    outline: "none",
  },
  dialogBtnGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  dialogOptionBtn: {
    padding: "10px",
    border: "1px solid #e7e5e4",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.85rem",
    transition: "all 0.15s ease",
  },
  dialogSelect: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    backgroundColor: "#fff",
    fontSize: "0.85rem",
    outline: "none",
  },
  dialogActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  dialogCancel: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "1px solid #e7e5e4",
    backgroundColor: "#fff",
    color: "#1c1917",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  dialogSubmit: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#1c1917",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.85rem",
  },

  // Warning Popup styles
  dialogContentWarning: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "520px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    border: "1px solid #e7e5e4",
  },
  warningTitleGroup: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    h3: {
      fontSize: "1.2rem",
      color: "#1c1917",
      fontWeight: "bold",
    },
  },
  warningSubtext: {
    fontSize: "0.82rem",
    color: "#78716c",
    marginBottom: "14px",
    lineHeight: "1.4",
  },
  warningFieldsList: {
    maxHeight: "140px",
    overflowY: "auto" as const,
    backgroundColor: "#f5f5f4",
    border: "1px solid #e7e5e4",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    listStyleType: "none",
  },
  warningFieldItem: {
    fontSize: "0.78rem",
    color: "#ef4444",
    padding: "2px 0",
    fontFamily: "monospace",
  },
  dialogSubmitWarning: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
