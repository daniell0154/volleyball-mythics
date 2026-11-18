import { lazy, Suspense, useEffect, useState } from "react";
import { attributeKeys, createAdminServices, type AdminServices, type Draft, type Published, type RosterPayload } from "./services.js";
import { editAppearance, HAIR_STYLES, parseAppearance, SKIN_TONES, visualKey } from "../scene/avatarAppearance.js";
import type { HairThumbnails } from "../scene/CharacterPreview.js";
import "./admin.css";

const Preview = lazy(() => import("../scene/CharacterPreview.js").then(module => ({ default: module.CharacterPreview })));
const attributes = { serve: "Saque", receive: "Recepção", set: "Levantamento", attack: "Ataque", block: "Bloqueio", speed: "Velocidade", jump: "Salto" };
const skinNames = { peach: "Clara", warm: "Dourada", bronze: "Bronze", deep: "Escura" };
const hairNames = {
  short: "Curto", swept: "Volume", back: "Alongado atrás", "short-long": "Curto com cauda",
  "swept-long": "Volume com cauda", "back-long": "Longo", bald: "Raspado", curly: "Cacheado",
};
const models = [
  { rig: "athletic", gender: "male", name: "Articulado masculino" },
  { rig: "athletic", gender: "female", name: "Articulado feminino" },
  { rig: "classic", gender: "male", name: "Clássico masculino" },
  { rig: "classic", gender: "female", name: "Clássico feminino" },
] as const;
const blank = (): RosterPayload => ({
  name: "", attributes: { serve: 50, receive: 50, set: 50, attack: 50, block: 50, speed: 50, jump: 50 },
  abilityId: "teammate_rant", assetKey: "procedural:athletic-v2:male:1",
});
type CatalogPage = Awaited<ReturnType<AdminServices["list"]>>;

function overall(payload: RosterPayload) {
  const values = attributeKeys.map(key => payload.attributes[key]);
  if (values.some(value => !Number.isInteger(value) || value < 1 || value > 100)) return "—";
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function groupRoster(items: CatalogPage) {
  const byId = new Map<string, { id: string; draft?: Draft; versions: Published[] }>();
  for (const draft of items.drafts) byId.set(draft.id, { id: draft.id, draft, versions: [] });
  for (const version of items.published) {
    let entry = byId.get(version.id);
    if (!entry) {
      entry = { id: version.id, versions: [] };
      byId.set(version.id, entry);
    }
    entry.versions.push(version);
  }
  return [...byId.values()];
}

export function Admin({ services }: { services?: AdminServices }) {
  const [backend] = useState(() => {
    try { return services ?? createAdminServices(); } catch { return null; }
  });
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<CatalogPage>({ drafts: [], published: [] });
  const [draft, setDraft] = useState<Draft>({ id: "", revision: 0, payload: blank() });
  const [dirty, setDirty] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState("");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState<HairThumbnails>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function report(cause: unknown) {
    const code = typeof cause === "object" && cause !== null && "code" in cause ? String(cause.code) : "";
    setError(code === "40001"
      ? "Este rascunho mudou. Recarregue a lista e abra a versão atual antes de tentar novamente."
      : "Não foi possível concluir. Confira sua permissão e conexão e tente novamente.");
  }

  async function load() {
    if (backend) setItems(await backend.list(page));
  }

  useEffect(() => {
    let active = true;
    if (!backend) { setChecking(false); return; }
    void backend.authorized().then(value => { if (active) setAuthorized(value); })
      .catch(cause => { if (active) report(cause); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [backend]);

  useEffect(() => {
    if (!backend || !authorized) return;
    let active = true;
    setLoading(true);
    void backend.list(page).then(value => { if (active) setItems(value); })
      .catch(cause => { if (active) report(cause); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authorized, backend, page]);

  async function run(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try { await task(); } catch (cause) { report(cause); }
    finally { setBusy(false); }
  }

  function edit(payload: RosterPayload) {
    setDraft(current => ({ ...current, payload }));
    setDirty(true);
  }

  function open(next: Draft, selection: string, unsaved = false) {
    if (dirty && !confirm("Descartar as alterações não salvas? Selecione Cancelar para manter a edição.")) return;
    setDraft(structuredClone(next));
    setSelectedEntry(selection);
    setDirty(unsaved);
    setError("");
    setNotice("");
  }

  function openVersion(version: Published, current?: Draft) {
    open({ id: version.id, revision: current?.revision ?? 0, payload: version.payload },
      version.id + ":" + version.version, !!current);
  }

  async function save() {
    const saved = await backend!.write("save", draft.id, draft.revision, draft.payload);
    setDraft(saved);
    setSelectedEntry(saved.id);
    setDirty(false);
    await load();
    setNotice("Rascunho salvo. Publique para disponibilizar no jogo.");
  }

  async function publish() {
    setDraft(await backend!.write("publish", draft.id, draft.revision));
    await load();
    setNotice("Nova revisão publicada. Disponível para novas seleções no jogo.");
  }

  async function disable() {
    setDraft(await backend!.write("disable", draft.id, draft.revision));
    await load();
    setNotice("Personagem desativado. Partidas em andamento preservadas.");
  }

  const { payload } = draft;
  const look = parseAppearance(payload.assetKey);
  const model = models.find(option => option.rig === look?.rig && option.gender === look.gender);
  const score = overall(payload);
  function changeLook(selection: Parameters<typeof editAppearance>[1]) {
    const assetKey = editAppearance(payload.assetKey, selection);
    if (assetKey !== payload.assetKey) edit({ ...payload, assetKey });
  }
  const editAttribute = (key: typeof attributeKeys[number], value: number) =>
    edit({ ...payload, attributes: { ...payload.attributes, [key]: value } });

  if (checking) return <main className="app-shell"><p role="status">Verificando acesso administrativo…</p></main>;

  return <main className="app-shell admin-shell">
    <header className="admin-header">
      <h1>Admin do elenco</h1>
      <nav aria-label="Administração">
        <a href="/">Voltar ao jogo</a>
        {authorized && <button disabled={busy} onClick={() => void run(async () => {
          await backend!.logout();
          setAuthorized(false);
          setItems({ drafts: [], published: [] });
          setDraft({ id: "", revision: 0, payload: blank() });
          setDirty(false);
          setSelectedEntry("");
          setPage(0);
        })}>Sair do admin</button>}
      </nav>
    </header>
    {!backend && <p role="alert" className="notice error">Configure a URL e a chave pública do Supabase para acessar o admin.</p>}
    {error && <p role="alert" className="notice error">{error}</p>}
    {notice && <p role="status" className="notice">{notice}</p>}
    {!authorized ? <form className="panel entry-form admin-login" onSubmit={event => {
      event.preventDefault();
      void run(async () => {
        if (!backend) throw new Error("Admin indisponível");
        await backend.login(email, password);
        setPassword("");
        setAuthorized(true);
      });
    }}>
      <h2>Acesso do administrador</h2>
      <p>Use a conta autorizada pelo proprietário. A sessão do jogo fica separada.</p>
      <label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button className="primary" disabled={busy || !backend}>Entrar no admin</button>
    </form> : <div className="admin-layout">
      <section className="panel admin-roster" aria-labelledby="admin-roster-title">
        <div className="admin-panel-header">
          <h2 id="admin-roster-title">Elenco</h2>
          <button className="primary" disabled={busy} onClick={() => {
            const id = crypto.randomUUID();
            open({ id, revision: 0, payload: blank() }, id);
          }}>Novo personagem</button>
        </div>
        <button type="button" className="admin-roster-toggle" aria-expanded={rosterOpen} aria-controls="admin-roster-items"
          onClick={() => setRosterOpen(value => !value)}>{rosterOpen ? "Recolher elenco" : "Mostrar elenco"}</button>
        <div id="admin-roster-items" data-expanded={rosterOpen}>
          <ul className="admin-roster-list">
            {groupRoster(items).map(({ id, draft: saved, versions }) => {
              const active = versions.find(version => version.enabled);
              const latest = active ?? versions[0];
              const rosterPayload = saved?.payload ?? latest!.payload;
              const state = [saved ? "Rascunho" : "", active ? "Publicado" : latest ? "Inativo" : ""].filter(Boolean).join(" · ");
              return <li key={id}>
                <button className="admin-roster-entry" aria-pressed={selectedEntry === (saved ? id : id + ":" + latest!.version)}
                  disabled={busy || loading} onClick={() => saved ? open(saved, id) : openVersion(latest!)}>
                  <span><strong>{rosterPayload.name}</strong><small>{state}</small></span>
                  <span className="admin-roster-score" aria-label={`Overall ${overall(rosterPayload)}`}>{overall(rosterPayload)}</span>
                </button>
                {versions.length > 0 && <details className="admin-history">
                  <summary>Histórico de {rosterPayload.name}</summary>
                  {versions.map(version => <button key={version.version} type="button" disabled={busy || loading}
                    aria-pressed={selectedEntry === id + ":" + version.version}
                    onClick={() => openVersion(version, saved)}>
                    v{version.version} · {version.enabled ? "Publicado" : "Inativo"} · {overall(version.payload)}
                  </button>)}
                </details>}
              </li>;
            })}
          </ul>
          {items.drafts.length === 0 && items.published.length === 0 && !loading && <p>Nenhum atleta nesta página.</p>}
          <div className="admin-pagination" aria-label="Paginação do elenco">
            <button disabled={page === 0 || busy || loading} onClick={() => setPage(value => value - 1)}>Anterior</button>
            <span>Página {page + 1}</span>
            <button disabled={busy || loading || (items.drafts.length < 50 && items.published.length < 50)}
              onClick={() => setPage(value => value + 1)}>Próxima</button>
          </div>
          <button className="admin-reload" disabled={busy || loading} onClick={() => void run(load)}>Recarregar lista</button>
        </div>
      </section>

      <section className="panel admin-sheet" aria-labelledby="admin-sheet-title">
        <div className="admin-panel-header">
          <h2 id="admin-sheet-title">Ficha do atleta</h2>
          {draft.id && <div className="admin-overall"><span>Overall</span><output aria-label="Overall">{score}</output></div>}
        </div>
        {!draft.id ? <p>Abra uma ficha no elenco ou crie um personagem.</p> : <form onSubmit={event => {
          event.preventDefault();
          void run(save);
        }}>
          <fieldset className="admin-fields" disabled={busy}>
            <legend>{draft.revision ? `Rascunho · revisão ${draft.revision}` : "Ficha sem rascunho salvo"}</legend>
            <label className="admin-display-name">Nome
              <input required maxLength={64} placeholder="Nome exibido no jogo" value={payload.name}
                onChange={event => edit({ ...payload, name: event.target.value })} />
            </label>
            <div className="admin-attributes" role="group" aria-label="Atributos">
              {attributeKeys.map(key => {
                const value = payload.attributes[key];
                return <div className="admin-attribute" key={key}>
                  <label htmlFor={`admin-${key}`}>{attributes[key]}</label>
                  <input type="range" min={1} max={100} step={1} value={Number.isNaN(value) ? 50 : value}
                    aria-label={`Ajustar ${attributes[key].toLowerCase()}`} onChange={event => editAttribute(key, event.target.valueAsNumber)} />
                  <input id={`admin-${key}`} type="number" required min={1} max={100} step={1}
                    value={Number.isNaN(value) ? "" : value} onChange={event => editAttribute(key, event.target.valueAsNumber)} />
                </div>;
              })}
            </div>
            <label>Habilidade<select value={payload.abilityId} onChange={event => edit({ ...payload, abilityId: event.target.value })}>
              <option value="teammate_rant">Bronca no Parceiro</option>
              <option value="free_point_out">Foi Sem Querer</option>
            </select></label>
            {look ? <div className="admin-appearance">
              <div className="admin-panel-header"><h3>Aparência</h3><a className="admin-preview-link" href="#admin-preview">Ir à prévia</a></div>
              <label>Modelo<select aria-label="Modelo" value={look.rig + ":" + look.gender} onChange={event => {
                const selected = models.find(option => option.rig + ":" + option.gender === event.target.value);
                if (selected) changeLook({ rig: selected.rig, gender: selected.gender });
              }}>
                {models.map(option => <option key={option.rig + option.gender} value={option.rig + ":" + option.gender}>{option.name}</option>)}
              </select></label>
              <div role="group" aria-label="Tom de pele" className="admin-skin">
                {(Object.keys(SKIN_TONES) as (keyof typeof SKIN_TONES)[]).map(skinId => <button type="button" key={skinId}
                  aria-pressed={look.skinId === skinId} onClick={() => changeLook({ skinId })}>
                  <span className="admin-swatch" style={{ background: SKIN_TONES[skinId] }} />{skinNames[skinId]}
                </button>)}
              </div>
              <div role="group" aria-label="Penteados" className="admin-hair">
                {(Object.keys(HAIR_STYLES) as (keyof typeof HAIR_STYLES)[]).map(hairId => <button type="button" key={hairId}
                  aria-pressed={look.hairId === hairId} onClick={() => changeLook({ hairId })}>
                  {thumbnails[hairId] && <img src={thumbnails[hairId]} alt="" />}{hairNames[hairId]}
                </button>)}
              </div>
            </div> : <p className="notice error">O visual desta ficha está indisponível.</p>}
            <button type="submit" className="primary" disabled={!look || score === "—"}>Salvar rascunho</button>
          </fieldset>
          <div className="admin-commands">
            <button type="button" disabled={busy || dirty || draft.revision === 0} onClick={() => void run(publish)}>Publicar revisão</button>
            <button type="button" disabled={busy || dirty || draft.revision === 0} onClick={() => {
              if (confirm("Desativar este personagem para novas partidas?")) void run(disable);
            }}>Desativar personagem</button>
          </div>
          {dirty && <p className="helper">Salve as alterações antes de publicar ou desativar.</p>}
        </form>}
      </section>

      <section className="panel admin-preview" id="admin-preview" tabIndex={-1} aria-labelledby="admin-preview-title">
        <h2 id="admin-preview-title">Pré-visualização</h2>
        {draft.id && look && model ? <>
          <Suspense fallback={<p>Preparando prévia…</p>}>
            <Preview assetKey={payload.assetKey} team="A" interactive
              galleryKey={visualKey({ ...look, hairId: "short" })} onGallery={setThumbnails}
              summary={`${model.name}, pele ${skinNames[look.skinId].toLowerCase()}, cabelo ${hairNames[look.hairId].toLowerCase()}.`} />
          </Suspense>
        </> : <p>Selecione um atleta para ver o modelo.</p>}
      </section>
    </div>}
  </main>;
}
