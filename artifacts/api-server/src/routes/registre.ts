import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, fichesTable, plaquesTable, auditTable } from "@workspace/db";
import {
  CheckFicheDuplicateQueryParams,
  CreateFicheBody,
  DecideFicheBody,
  DecideFicheParams,
  GeneratePlaqueParams,
  GetFicheParams,
  ListFichesQueryParams,
  ListPlaquesQueryParams,
  MarkPlaquePrintedParams,
  UpdateFicheBody,
  UpdateFicheParams,
} from "@workspace/api-zod";
import { decrypt, encrypt } from "../lib/crypto";
import { plaqueSvg } from "../lib/plaque-svg";

const router: IRouter = Router();
const COMMUNES = ["Bandalungwa","Barumbu","Bumbu","Gombe","Kalamu","Kasa-Vubu","Kimbanseke","Kinshasa","Kintambo","Kisenso","Lemba","Limete","Lingwala","Makala","Maluku","Masina","Matete","Mont-Ngafula","N'Djili","N'Sele","Ngaba","Ngaliema","Ngiri-Ngiri","Selembao"];
const code = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();

function userId(req: Parameters<typeof getAuth>[0]) {
  return getAuth(req).userId;
}
function requireUser(req: any, res: any, next: any) {
  if (!userId(req)) { res.status(401).json({ error: "Authentification requise" }); return; }
  next();
}
function publicFiche(row: typeof fichesTable.$inferSelect) {
  return { ...row, proprietaireNom: decrypt(row.proprietaireNom), telephone: decrypt(row.telephone), superficie: row.superficie, createdAt: row.createdAt.toISOString() };
}
router.get("/communes", (_req, res) => res.json(COMMUNES.map((nom) => ({ code: code(nom), nom }))));
router.use(requireUser);

router.get("/fiches", async (req, res): Promise<void> => {
  const parsed = ListFichesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const p = parsed.data;
  const filters = [
    p.commune ? eq(fichesTable.commune, p.commune) : undefined,
    p.statut ? eq(fichesTable.statutFiche, p.statut as any) : undefined,
    p.recherche ? or(ilike(fichesTable.ficheNo, `%${p.recherche}%`), ilike(fichesTable.avenue, `%${p.recherche}%`), ilike(fichesTable.parcelleNo, `%${p.recherche}%`)) : undefined,
  ].filter(Boolean) as any[];
  const rows = await db.select().from(fichesTable).where(filters.length ? and(...filters) : undefined).orderBy(desc(fichesTable.createdAt));
  res.json(rows.map(publicFiche));
});

router.get("/fiches/check-duplicate", async (req, res): Promise<void> => {
  const p = CheckFicheDuplicateQueryParams.safeParse(req.query);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(fichesTable).where(and(eq(fichesTable.commune,p.data.commune),eq(fichesTable.quartier,p.data.quartier),eq(fichesTable.avenue,p.data.avenue),eq(fichesTable.parcelleNo,p.data.parcelleNo))).limit(1);
  res.json({ duplicate: !!row, fiche: row ? publicFiche(row) : null });
});

router.post("/fiches", async (req, res): Promise<void> => {
  const body = CreateFicheBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  const d = body.data;
  const [duplicate] = await db.select().from(fichesTable).where(and(eq(fichesTable.commune,d.commune),eq(fichesTable.quartier,d.quartier),eq(fichesTable.avenue,d.avenue),eq(fichesTable.parcelleNo,d.parcelleNo))).limit(1);
  if (duplicate) { res.status(409).json({ error: "Cette parcelle existe déjà", ficheId: duplicate.id }); return; }
  const count = await db.select({ count: sql<number>`count(*)` }).from(fichesTable);
  const ficheNo = `KIN-${code(d.commune)}-${new Date().getFullYear()}-${String(Number(count[0]?.count ?? 0)+1).padStart(5,"0")}`;
  const [created] = await db.insert(fichesTable).values({ ...d, dateProspection: d.dateProspection.toISOString().slice(0, 10), superficie: d.superficie ? Math.round(d.superficie) : null, proprietaireNom: encrypt(d.proprietaireNom), telephone: encrypt(d.telephone), ficheNo, agentId: userId(req)! }).returning();
  await db.insert(auditTable).values({ utilisateurId: userId(req)!, action: "CREATION_FICHE", ficheId: created.id, donneesApres: { ficheNo, commune: d.commune } });
  res.status(201).json(publicFiche(created));
});

router.get("/fiches/:id", async (req, res): Promise<void> => {
  const p = GetFicheParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }
  const [row] = await db.select().from(fichesTable).where(eq(fichesTable.id,p.data.id));
  if (!row) { res.status(404).json({ error: "Fiche introuvable" }); return; }
  res.json(publicFiche(row));
});

router.patch("/fiches/:id", async (req, res): Promise<void> => {
  const p = UpdateFicheParams.safeParse(req.params); const b = UpdateFicheBody.safeParse(req.body);
  if (!p.success || !b.success) { res.status(400).json({ error: "Données invalides" }); return; }
  const [before] = await db.select().from(fichesTable).where(eq(fichesTable.id,p.data.id));
  if (!before) { res.status(404).json({ error: "Fiche introuvable" }); return; }
  const [row] = await db.update(fichesTable).set({ ...b.data, dateProspection: b.data.dateProspection.toISOString().slice(0, 10), superficie: b.data.superficie ? Math.round(b.data.superficie) : null, proprietaireNom: encrypt(b.data.proprietaireNom), telephone: encrypt(b.data.telephone), statutPlaque: before.statutPlaque === "generee" || before.statutPlaque === "imprimee" ? "a_reimprimer" : before.statutPlaque }).where(eq(fichesTable.id,p.data.id)).returning();
  await db.insert(auditTable).values({ utilisateurId:userId(req)!,action:"MODIFICATION_FICHE",ficheId:row.id,donneesAvant:{ficheNo:before.ficheNo},donneesApres:{ficheNo:row.ficheNo} });
  res.json(publicFiche(row));
});

router.post("/fiches/:id/decision", async (req, res): Promise<void> => {
  const p=DecideFicheParams.safeParse(req.params); const b=DecideFicheBody.safeParse(req.body);
  if(!p.success||!b.success){res.status(400).json({error:"Décision invalide"});return;}
  const [row]=await db.update(fichesTable).set({statutFiche:b.data.decision}).where(eq(fichesTable.id,p.data.id)).returning();
  if(!row){res.status(404).json({error:"Fiche introuvable"});return;}
  await db.insert(auditTable).values({utilisateurId:userId(req)!,action:`FICHE_${b.data.decision.toUpperCase()}`,ficheId:row.id,donneesApres:{motif:b.data.motif}});
  res.json(publicFiche(row));
});

router.post("/fiches/:id/plaque", async (req,res):Promise<void>=>{
  const p=GeneratePlaqueParams.safeParse(req.params); if(!p.success){res.status(400).json({error:"Identifiant invalide"});return;}
  const [f]=await db.select().from(fichesTable).where(eq(fichesTable.id,p.data.id));
  if(!f){res.status(404).json({error:"Fiche introuvable"});return;}
  if(f.statutFiche!=="validee"){res.status(409).json({error:"La fiche doit être validée"});return;}
  const existing=await db.select().from(plaquesTable).where(eq(plaquesTable.ficheId,f.id)).orderBy(desc(plaquesTable.version));
  if(existing.length&&["generee","a_reimprimer"].includes(f.statutPlaque)&&existing[0].svg.includes('id="plaque-layout-v3"')){res.status(409).json({error:"Plaque déjà générée"});return;}
  const version=(existing[0]?.version??0)+1; const plaqueNo=f.plaqueNo??`${code(f.commune)}-${f.parcelleNo}`;
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const host = domain || req.get("host");
  if (!host) { res.status(503).json({error:"Domaine de la fiche indisponible"}); return; }
  const origin = host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
  const ficheUrl = new URL(`/fiches/${encodeURIComponent(f.id)}`, origin).toString();
  const svg=plaqueSvg(f,plaqueNo,ficheUrl); const [plaque]=await db.insert(plaquesTable).values({ficheId:f.id,version,svg}).returning();
  const statut=existing.length?"a_reimprimer":"generee"; await db.update(fichesTable).set({plaqueNo,statutPlaque:statut}).where(eq(fichesTable.id,f.id));
  res.status(201).json({id:plaque.id,ficheId:f.id,ficheNo:f.ficheNo,commune:f.commune,quartier:f.quartier,avenue:f.avenue,plaqueNo,version,statut,svg,genereLe:plaque.genereLe.toISOString(),imprimeLe:null});
});

router.get("/plaques", async (req,res):Promise<void>=>{
  const p=ListPlaquesQueryParams.safeParse(req.query); if(!p.success){res.status(400).json({error:p.error.message});return;}
  const rows=await db.select({p:plaquesTable,f:fichesTable}).from(plaquesTable).innerJoin(fichesTable,eq(plaquesTable.ficheId,fichesTable.id)).where(p.data.commune?eq(fichesTable.commune,p.data.commune):undefined).orderBy(desc(plaquesTable.genereLe));
  res.json(rows.filter(({f})=>!p.data.statut||f.statutPlaque===p.data.statut).map(({p,f})=>({id:p.id,ficheId:f.id,ficheNo:f.ficheNo,commune:f.commune,quartier:f.quartier,avenue:f.avenue,plaqueNo:f.plaqueNo!,version:p.version,statut:f.statutPlaque,svg:p.svg,genereLe:p.genereLe.toISOString(),imprimeLe:p.imprimeLe?.toISOString()??null})));
});

router.post("/plaques/:id/imprimer",async(req,res):Promise<void>=>{
  const p=MarkPlaquePrintedParams.safeParse(req.params);if(!p.success){res.status(400).json({error:"Identifiant invalide"});return;}
  const [plaque]=await db.update(plaquesTable).set({imprimeLe:new Date()}).where(eq(plaquesTable.id,p.data.id)).returning();
  if(!plaque){res.status(404).json({error:"Plaque introuvable"});return;}
  const [f]=await db.update(fichesTable).set({statutPlaque:"imprimee"}).where(eq(fichesTable.id,plaque.ficheId)).returning();
  res.json({id:plaque.id,ficheId:f.id,ficheNo:f.ficheNo,commune:f.commune,quartier:f.quartier,avenue:f.avenue,plaqueNo:f.plaqueNo!,version:plaque.version,statut:"imprimee",svg:plaque.svg,genereLe:plaque.genereLe.toISOString(),imprimeLe:plaque.imprimeLe!.toISOString()});
});

router.get("/dashboard",async(req,res):Promise<void>=>{
  const commune=typeof req.query.commune==="string"?req.query.commune:undefined;
  const rows=await db.select().from(fichesTable).where(commune?eq(fichesTable.commune,commune):undefined);
  const groups=new Map<string,number>(); rows.forEach(f=>groups.set(f.commune,(groups.get(f.commune)??0)+1));
  const activity=await db.select().from(auditTable).orderBy(desc(auditTable.horodatage)).limit(6);
  res.json({totalFiches:rows.length,enAttente:rows.filter(f=>f.statutFiche==="soumise").length,validees:rows.filter(f=>f.statutFiche==="validee").length,plaquesAImprimer:rows.filter(f=>f.statutPlaque==="generee"||f.statutPlaque==="a_reimprimer").length,repartitionCommunes:[...groups].map(([commune,total])=>({commune,total})),activiteRecente:activity.map(a=>({id:a.id,action:a.action,ficheNo:rows.find(f=>f.id===a.ficheId)?.ficheNo??"—",horodatage:a.horodatage.toISOString()}))});
});

export default router;