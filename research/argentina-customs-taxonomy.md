# Argentina Customs — Regulatory & Document Taxonomy Research

> **Disclaimer:** This is a research summary compiled from official Argentine government sources (ARCA, VUCE, Código Aduanero Ley 22.415, InfoLEG) and industry references. It is not legal advice. Distinguish official facts from product interpretation below.

---

## 1. Institutional Framework & Key Actors

### 1.1 ARCA — Agencia de Recaudación y Control Aduanero (ex AFIP)
- **Former name:** Administración Federal de Ingresos Públicos (AFIP), renamed to ARCA in 2024.
- **Role:** Tax and customs authority. Controls all import/export operations, collects duties, enforces customs regulations.
- **Parent body:** Ministerio de Economía.
- **Official site:** [https://www.argentina.gob.ar/arca](https://www.argentina.gob.ar/arca) | Legacy: [https://www.afip.gob.ar](https://www.afip.gob.ar)

### 1.2 DGA — Dirección General de Aduanas
- Operational arm of ARCA that manages customs control at borders, ports, and airports.

### 1.3 Despachante de Aduana (Customs Broker)
- **Legal basis:** Código Aduanero — Ley 22.415, Art. 36–40.
- **Definition (Art. 36):** Personas de existencia visible (human individuals) who perform customs clearance procedures on behalf of others before the customs service.
- **Role:** Intermediary between importers/exporters and the Aduana. Officially authorized to present declarations ("destinaciones aduaneras") in the SIM system.
- **Key obligations:**
  - Officializar (register) import/export destinaciones electronically via SIM
  - Present all supporting documentation
  - Represent the importer/exporter before customs
  - Civil/criminal liability for errors or infractions (Art. 908)
- **Registration:** Through ARCA — must pass exams and maintain registration in CDA (Centro Despachantes de Aduana de la República Argentina).
- **Documents required for registration:** Professional degree, exam pass, fidelity bond/seguro de caución.
- **URL:** [https://www.cda.org.ar](https://www.cda.org.ar)

### 1.4 Agente de Transporte Aduanero (ATA) — Customs Transport Agent
- **Legal basis:** Código Aduanero — Ley 22.415, Art. 41–43 (formerly proper section in Título II, Capítulo II, Sección I).
- **Definition (Art. 57):** Personas de existencia visible o ideal (individuals or legal entities) who, representing carriers, handle the presentation of the transport means and its cargo before customs.
- **Role:** Files cargo manifests (manifiesto de carga) in SIM, manages arrival/departure of international transport.
- **Types:** ATAs can be consolidators or deconsolidators for groupage cargo.
- **Registration:** Required to be inscribed in the Registro de Agentes de Transporte Aduanero (maintained by DGA/ARCA).
- **Mandatory requirement:** No international transport can operate in Argentine territory without an ATA.
- **Legal references:** Arts. 57–63 of Código Aduanero; RG 5110/2021 for consolidated cargo.

### 1.5 VUCE — Ventanilla Única de Comercio Exterior Argentino (VUCEA)
- **Portal:** [https://www.argentina.gob.ar/vuce](https://www.argentina.gob.ar/vuce) | [https://www.vuce.gob.ar](https://www.vuce.gob.ar)
- **Role:** Single digital window for foreign trade procedures. Integrates multiple government agencies (SENASA, INAL, ARCA, etc.) into one point of entry.
- **Functions:** Submit applications, track procedures, receive notifications for import/export/transit operations.
- **Covers:** Organic certifications, health permits (SENASA), industry-specific licenses.
- **Notable:** Since 2023, VUCE is mandatory for certain regulated products (food, health, agriculture, chemicals).

---

## 2. Core Digital Systems

### 2.1 SIM — Sistema Informático MALVINA
- **Established by:** Resolución General AFIP 3560/2013 (Dec 2013).
- **Official site:** Access through ARCA Clave Fiscal → Servicio "Sistema Informático Malvina (SIM)".
- **Role:** The primary customs IT system for all import/export/transit declarations in Argentina.
- **Modules (as per RG 3560/2013):**
  - **MOA — Mis Operaciones Aduaneras:** Main interface for customs brokers.
  - **Registros Especiales Aduaneros:** Special customs registries.
  - **Sistema Registral AFIP:** Integrated registry system.
  - **Recaudación Electrónica:** Electronic payment of duties via banking network.
  - **Subregímenes SIM:** Specific flows for each type of destinación.
- **Process flow:**
  1. ATA transmits cargo manifest (MANI SIM) pre-arrival
  2. Despachante digitalizes the "destinación aduanera" in SIM
  3. SIM assigns a "canal de selectividad" (green/orange/red)
  4. Customs control is executed per the assigned channel
  5. Mercadería is released ("levante")

### 2.2 SEDI — Sistema Estadístico de Importaciones
- **Established by:** Resolución General Conjunta 5466/2023 (AFIP + Secretaría de Comercio).
- **Replaces:** SIRA (Sistema de Importaciones de la República Argentina), which replaced DJAI/SIMI before it.
- **Status:** Replaced SIRA as of Dec 27, 2023 (DNU 70/2023 context).
- **Role:** A statistical affidavit submitted by importers **before** the import customs declaration. It's an anticipatory electronic declaration with no approval/disapproval requirement.
- **Key changes from SIRA:**
  - Eliminated automatic and non-automatic import licenses
  - No government approval needed — purely statistical
  - Still requires payment of import duties/aranceles
  - Feeds into ARCA's risk matrix for customs selectivity
- **Process:** Importers complete DJ (declaración jurada) in AFIP/ARCA site → two automated checks → state changes from "oficializada" to "salida". If not shipped within the validity period, must be re-filed.
- **Note for product page:** This is the current import pre-declaration system — critical for compliance messaging.

### 2.3 SCOD — Sistema Informático de Certificación de Origen Digital
- Digital certificate of origin system — used for ALADI agreements and Mercosur preferences.

---

## 3. Customs Destination Types (Destinaciones Aduaneras)

The Código Aduanero (Ley 22.415) defines the following main **destinations** for merchandise:

### 3.1 Destinaciones Definitivas (Definitive)
| Type | Code (SIM) | Description |
|------|-----------|-------------|
| **Importación para consumo** | IMPO | Import for consumption — definitive import paying full duties |
| **Exportación para consumo** | EXPO | Definitive export — goods leave the customs territory permanently |

### 3.2 Destinaciones Suspensivas (Suspensive — temporary)
| Type | Code (SIM) | Description | Max Period |
|------|-----------|-------------|------------|
| **Importación Temporaria** | DIT | Goods enter temporarily for a specific purpose, same state | Typically 1 year (extendable) |
| **Exportación Temporaria** | DET | Goods exit temporarily, to return later (e.g., exhibition, repair) | Typically 1 year |
| **Admisión Temporaria para Perfeccionamiento Activo** | TPA | Temporary import for processing/manufacturing then re-export | Varies |
| **Exportación Temporaria para Perfeccionamiento Pasivo** | TPP | Temporary export for processing abroad then re-import | Varies |
| **Depósito de Almacenamiento** | IDA4 | Goods stored in fiscal warehouse pending customs decision | Up to 60 days (extendable) |
| **Tránsito de Importación** | TRA | In-transit goods crossing Argentine territory | Regulated per origin/destination |
| **Tránsito de Exportación** | TRX | Outbound transit | Regulated |

### 3.3 Regímenes Especiales
- **Zona Franca (Free Zone):** Áreas francas — areas outside the general customs territory (Ley 22.415, Art. 5, 590–609).
- **Courier/PSP (Prestador de Servicios Postales):** Simplified regime for low-value shipments (RG 2572).
- **Equipaje / Menaje:** Personal luggage and household goods moving.
- **Drawback:** Duty refund on materials used for exported goods.

---

## 4. Document Types by Stage

### 4.1 Commercial Documents (Origen: Exporter/Importer)
| Document | Spanish | Description |
|----------|---------|-------------|
| **Commercial Invoice** | Factura Comercial | Core document of the sale. Must include: seller/buyer, item description, HS code (NCM), value, Incoterms, quantity. Must be original for import. |
| **Pro Forma Invoice** | Factura Proforma | Preliminary quote invoice. Not a tax document, but used for SEDI pre-declaration. |
| **Packing List** | Lista de Empaque / Packing List | Itemized contents per package: weights (gross/net), dimensions, marks & numbers. Linked 1:1 to commercial invoice. |
| **Certificate of Origin** | Certificado de Origen | Required for tariff preference (Mercosur, ALADI, bilateral agreements). Can be digital (SCOD). Also used for trade remedy measures (anti-dumping). |
| **Insurance Certificate** | Certificado de Seguro | May be required; often part of the transport documents. |

### 4.2 Transport Documents (Origen: Carrier/ATA)
| Document | Spanish | Via | Description |
|----------|---------|-----|-------------|
| **Bill of Lading** | Conocimiento de Embarque Marítimo (B/L) | Marítimo | Title of goods. Key for customs clearance. Master B/L and House B/L for consolidated. |
| **Air Waybill** | Conocimiento de Embarque Aéreo / Guía Aérea (AWB) | Aéreo | Airway bill. Master AWB + House AWB for consolidations. |
| **Road Manifest / Carta de Porte** | Carta de Porte Internacional (CMR/CDC) | Terrestre | Road transport document for Mercosur land transit. MIC/DTA for bilateral agreements. |
| **Cargo Manifest** | Manifiesto de Carga (MANI SIM) | All | Filed by ATA in SIM. Contains all cargo on the transport means. Pre-arrival requirement. |
| **Container Yard Receipt** | Recibo de Depósito / Gate In | Marítimo | Container entry/full status document. |

### 4.3 Import-Specific Documents
| Document | Description |
|----------|-------------|
| **SEDI (Declaración Jurada Anticipada)** | Statistical affidavit — mandatory before import declaration filing |
| **Destinación de Importación (OM-2133 SIM)** | The customs declaration itself, filed by the despachante in SIM |
| **Certificados de Intervención de Organismos (VUCE)** | Health/Safety/Environmental permits via VUCE (e.g., SENASA for food, INAL for food products, ANMAT for medical/health, ENACOM for telecoms) |
| **DJCP — Declaración Jurada de Composición de Producto** | **NOTE:** Abrogated as part of DNU 70/2023 deregulation (no longer required for most products) |
| **Seguro de Caución** | Fidelity bond for temporary import or certain regimes |
| **Garantía de Admisión Temporaria** | Guarantee for temporary import duties |

### 4.4 Export-Specific Documents
| Document | Description |
|----------|-------------|
| **Destinación de Exportación (EC18 in SIM)** | The customs export declaration |
| **DJED — Declaración Jurada de Exportación** | Export affidavit for certain products |
| **Certificado de Depósito / Ingreso a Zona Primaria** | Cargo entry to primary zone (port/border) |
| **Certificado de Embarque** | Loading certificate |
| **Permiso de Embarque (P.E.)** | Historic document — now digitalized in SIM as part of the export process |

### 4.5 Regulatory & Permit Documents (via VUCE)
| Agency | Product Scope | Document Type |
|--------|---------------|---------------|
| **SENASA** | Food, agriculture, animal/plant products | Certificado Fitosanitario, Certificado Zoosanitario, LNA (Licencia No Automática) |
| **ANMAT** | Pharmaceuticals, medical devices, cosmetics, food supplements | Certificado ANMAT, Registro de Producto |
| **INAL** | Food products (specific) | Registro de Establecimiento, Registro de Producto |
| **ENACOM** | Telecommunications, electronics, radio equipment | Certificado de Homologación, Licencia de Importación |
| **INASE** | Seeds | Certificado de Importación |
| **Secretaría de Energía** | Energy products | Permisos específicos |
| **RENAR** | Firearms, explosives | Licencia de Importación/Exportación |

---

## 5. Customs Process Stages (Flujo Aduanero)

### Stage 1: Pre-arrival ("Información Anticipada")
- ATA transmits cargo manifest (MANI SIM) to ARCA electronically — **mandatory** for all modes.
- Vía aérea: IATA XFFM/XFWB messages → MANI SIM generation.
- Vía marítima: RIA (Registro de Información Anticipada) → MANI SIM.
- Vía terrestre: MIC/DTA via SIM.

### Stage 2: Arrival & Discharge ("Arribo y Descarga")
- Actual arrival of goods at the customs territory.
- ATA updates manifest status.

### Stage 3: Pre-declaration ("Declaración Anticipada" — SEDI)
- **Importer** completes and submits SEDI in ARCA portal.
- Two automated checks run:
  1. **Economic/financial viability** (existence of the importer, tax standing)
  2. **Customs risk matrix** (product profile, origin, value screening)
- If passed: status = "salida" → enables the official customs declaration.

### Stage 4: Customs Declaration ("Oficialización de la Destinación")
- **Despachante de Aduana** prepares and submits the destinación in SIM (form OM-2133 for import, EC18 for export).
- Includes: commercial invoice + packing list + transport document + certificate of origin (if applicable) + VUCE permits.
- Moment of "oficialización": SIM assigns a **Canal de Selectividad**:

### Stage 5: Selectivity Channel ("Canal de Selectividad")
| Canal | Color | What Happens |
|-------|-------|--------------|
| **Verde (Green)** | ✅ | Automatic clearance — no documentary or physical inspection. Immediate "levante" (release). |
| **Naranja (Orange)** | 🟠 | Documentary review — despachante must present physical/digital docs for verification. |
| **Rojo (Red)** | 🔴 | Full physical inspection — customs opens and verifies goods, checks documents against cargo. |
| **Celeste/Control Difuso** | 🔵 | Non-documentary targeted control (e.g., verification of origin). |

### Stage 6: Payment of Duties ("Liquidación y Pago")
- SIM calculates duties: arancel (NCM-based), IVA, PAIS tax (note: PAIS tax phase-out ongoing per 2024/2025 reforms).
- Paid via electronic banking (VEP through ARCA portal).
- Guarantees may be required for suspensive regimes.

### Stage 7: Release ("Levante")
- If all conditions met, SIM generates the "levante" (release order).
- Merchandise may physically leave customs custody.
- For red channel: physical verification must be completed first.

### Stage 8: Post-clearance ("Despacho Posterior")
- ARCA can audit within certain periods (typically 1-5 years depending on the matter).
- Rectifications or modifications may be allowed under Art. 322 of Código Aduanero.

---

## 6. Compliance Risk Language (for Product Page)

### High-Risk Triggers
- **Mismatched data** between SEDI, invoice, packing list, and SIM declaration
- **Incorrect NCM classification** (tariff code) — triggers reclassification, penalties
- **Missing or expired VUCE permits** for regulated products (food, medical, telecom, chemicals)
- **Under-valuation** — ARCA may apply "valores criterio" (reference values)
- **ATA manifest errors** — missing or incomplete MANI SIM blocks the entire clearance
- **Falsified certificate of origin** — loss of tariff preferences, fines under customs law
- **Improper temporary import guarantee** — lack of or insufficient seguro de caución

### Compliance Language Ideas (Product Page)
> "El incumplimiento en la documentación aduanera puede resultar en demoras de nacionalización, aplicación del canal rojo selectivo, multas de hasta 10 veces el valor del tributo omitido (Art. 954 CA), y suspensión del Registro de Importadores/Exportadores."

> "La responsabilidad solidaria del Despachante de Aduana está regulada en el Art. 908 del Código Aduanero: el despachante responde por infracciones salvo que pruebe haber cumplido con todas las obligaciones a su cargo."

> "Desde diciembre de 2023, el sistema SEDI reemplazó al SIRA, eliminando las licencias automáticas y no automáticas. Sin embargo, los permisos sectoriales (SENASA, ANMAT, etc.) tramitados por VUCE siguen siendo obligatorios para productos regulados."

### Quoted Official Language
- Art. 36 CA: *"Son despachantes de aduana las personas de existencia visible que, en las condiciones previstas en este código, realizan en nombre de otros ante el servicio aduanero trámites y diligencias relativos a la importación, la exportación y demás operaciones aduaneras."*
- Art. 57 CA: *"Son agentes de transporte aduanero, a los efectos de este código, las personas de existencia visible o ideal que, en representación de los transportistas, tienen a su cargo las gestiones relacionadas con la presentación del medio transportador y de sus cargas ante el servicio aduanero..."*

---

## 7. Official URLs Reference

| Resource | URL |
|----------|-----|
| ARCA (main) | [https://www.argentina.gob.ar/arca](https://www.argentina.gob.ar/arca) |
| ARCA / AFIP (legacy) | [https://www.afip.gob.ar](https://www.afip.gob.ar) |
| VUCE Portal | [https://www.argentina.gob.ar/vuce](https://www.argentina.gob.ar/vuce) |
| VUCE (alt) | [https://www.vuce.gob.ar](https://www.vuce.gob.ar) |
| Código Aduanero (Ley 22.415) | [https://www.argentina.gob.ar/normativa/nacional/ley-22415-16536/actualizacion](https://www.argentina.gob.ar/normativa/nacional/ley-22415-16536/actualizacion) |
| Código Aduanero full text | [https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16536/texact.htm](https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16536/texact.htm) |
| SIM (RG 3560/2013) | [https://www.argentina.gob.ar/normativa/nacional/resolución-3560-2013-223478/texto](https://www.argentina.gob.ar/normativa/nacional/resolución-3560-2013-223478/texto) |
| CDA — Centro Despachantes de Aduana | [https://www.cda.org.ar](https://www.cda.org.ar) |
| ARCA — Manifiestos de Carga | [https://www.arca.gob.ar/manifiestos-carga-importacion/](https://www.arca.gob.ar/manifiestos-carga-importacion/) |
| ARCA — Operadores Comercio Exterior (data) | [https://www.afip.gob.ar/operadoresComercioExterior/](https://www.afip.gob.ar/operadoresComercioExterior/) |
| ARCA — SEDI / Importaciones | [https://www.argentina.gob.ar/noticias/como-funciona-el-nuevo-sistema-de-importaciones-sedi-que-rige-desde-este-miercoles](https://www.argentina.gob.ar/noticias/como-funciona-el-nuevo-sistema-de-importaciones-sedi-que-rige-desde-este-miercoles) |
| InfoLEG (Normativa Nacional) | [https://servicios.infoleg.gob.ar](https://servicios.infoleg.gob.ar) |
| DGA (Dirección General de Aduanas) | Integrated under ARCA — no separate site |

---

## 8. Key Normative References

| Norm | Topic | Year |
|------|-------|------|
| **Ley 22.415** (Código Aduanero) | Base customs law | 1981 |
| **Decreto 1001/82** | Regulatory decree of CA | 1982 |
| **RG AFIP 3560/2013** | Creates SIM/MALVINA | 2013 |
| **RG AFIP 2793** | Officialization of import/export | 2010 |
| **RG AFIP 2572** | Courier/PSP regime | 2009 |
| **RG Conjunta 5466/2023** | Creates SEDI | 2023 |
| **RG ARCA 5744/2025** | Digital desconsolidated manifest | 2025 |
| **DNU 70/2023** | Deregulation — eliminated SIRA, DJCP, LNA/LA | 2023 |
| **RG AFIP 5110/2021** | ATA consolidated cargo regime | 2021 |

---

## 9. Product Page Messaging Caveats

- **Do NOT say** "SIRA is the current system" — it was replaced by SEDI in Dec 2023.
- **Do NOT say** "AFIP" as current name — it is now **ARCA**, though AFIP URLs still redirect.
- **Clarify** that the Despachante de Aduana is mandatory in Argentina for most formal (non-courier) customs operations — not optional.
- **Note** that ATA *and* Despachante are distinct regulated actors; they cannot substitute each other.
- **Flag** that temporary import (DIT/TPA) requires a guarantee/bond — high-risk compliance area.
- **Mention** VUCE integration for regulated products but note that not all products need VUCE.
- **Highlight** the selectivity channel system as the core risk-differentiation mechanism.
