import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  LogOut,
  Plus,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'

type Stage =
  | 'entrada'
  | 'entendimento'
  | 'levantamento'
  | 'precificacao'
  | 'proposta'
  | 'aprovacao'
  | 'envio'
type RequestRecord = {
  id: string
  title: string
  client_name: string
  source: string
  description?: string
  technical_notes?: string
  items?: string
  discount_percent?: number
  approval_notes?: string
  follow_up_at?: string
  status: Stage
  created: string
}
const stages: { id: Stage; label: string; hint: string }[] = [
  { id: 'entrada', label: 'Entrada', hint: 'Pedido e anexos' },
  { id: 'entendimento', label: 'Entendimento', hint: 'Notas técnicas' },
  { id: 'levantamento', label: 'Levantamento', hint: 'Itens e quantidades' },
  { id: 'precificacao', label: 'Precificação', hint: 'Tabela e desconto' },
  { id: 'proposta', label: 'Proposta', hint: 'Documento comercial' },
  { id: 'aprovacao', label: 'Aprovação', hint: 'Decisão do sócio' },
  { id: 'envio', label: 'Envio', hint: 'Follow-up' },
]
const blank = { title: '', client_name: '', source: 'E-mail', description: '' }
const date = (value?: string) =>
  value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value)) : '—'

export default function Index() {
  const [user, setUser] = useState(pb.authStore.record)
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [selected, setSelected] = useState<RequestRecord | null>(null)
  const [form, setForm] = useState(blank)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => pb.authStore.onChange(() => setUser(pb.authStore.record)), [])
  useEffect(() => {
    if (user) void load()
  }, [user])
  async function load() {
    try {
      setRequests(
        await pb.collection('budget_requests').getFullList<RequestRecord>({ sort: '-created' }),
      )
    } catch {
      setMessage('Não foi possível carregar os pedidos.')
    }
  }
  async function signIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await pb.collection('users').authWithPassword(login.email, login.password)
    } catch {
      setMessage('Confira e-mail e senha.')
    } finally {
      setBusy(false)
    }
  }
  async function create(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    try {
      const item = await pb
        .collection('budget_requests')
        .create<RequestRecord>({
          ...form,
          owner: user.id,
          status: 'entrada',
          created_at: new Date().toISOString(),
        })
      setRequests((all) => [item, ...all])
      setSelected(item)
      setForm(blank)
    } catch {
      setMessage('Não foi possível criar o pedido.')
    } finally {
      setBusy(false)
    }
  }
  async function update(patch: Partial<RequestRecord>) {
    if (!selected) return
    try {
      const item = await pb.collection('budget_requests').update<RequestRecord>(selected.id, patch)
      setSelected(item)
      setRequests((all) => all.map((x) => (x.id === item.id ? item : x)))
      setMessage('Alteração salva.')
    } catch {
      setMessage('Não foi possível salvar.')
    }
  }
  if (!user)
    return (
      <AuthScreen login={login} setLogin={setLogin} signIn={signIn} busy={busy} message={message} />
    )
  const counts = useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage.id,
          requests.filter((item) => item.status === stage.id).length,
        ]),
      ),
    [requests],
  )
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark small">OT</div>
          <div>
            <strong>Orçamentos Técnicos</strong>
            <small>Central de propostas</small>
          </div>
        </div>
        <div className="top-actions">
          <span className="user-chip">
            <UserRound size={15} /> {user.name || user.email}
          </span>
          <Button variant="ghost" size="sm" onClick={() => pb.authStore.clear()}>
            <LogOut size={16} /> Sair
          </Button>
        </div>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">VISÃO OPERACIONAL</p>
          <h1>Pedidos em movimento</h1>
          <p className="muted">
            Do primeiro contato à proposta enviada, sem perder o contexto técnico.
          </p>
        </div>
        <div className="metric">
          <span>Meta de resposta</span>
          <strong>2 dias</strong>
          <small>de 6 dias hoje</small>
        </div>
      </section>
      {message && (
        <div className="notice">
          <Check size={16} /> {message}
        </div>
      )}
      <section className="kanban">
        {stages.map((stage, index) => (
          <div className="stage" key={stage.id}>
            <div className="stage-heading">
              <span className="stage-index">0{index + 1}</span>
              <div>
                <h3>{stage.label}</h3>
                <small>{stage.hint}</small>
              </div>
              <b>{counts[stage.id] || 0}</b>
            </div>
            {requests
              .filter((item) => item.status === stage.id)
              .map((item) => (
                <button
                  className={`request-card ${selected?.id === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => setSelected(item)}
                >
                  <span className="card-source">{item.source}</span>
                  <strong>{item.title}</strong>
                  <small>{item.client_name}</small>
                  <span className="card-date">{date(item.created)}</span>
                </button>
              ))}
            {stage.id === 'entrada' && (
              <button
                className="new-card"
                onClick={() =>
                  document.getElementById('new-request')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <Plus size={15} /> Novo pedido
              </button>
            )}
          </div>
        ))}
      </section>
      <section className="workspace">
        <div className="panel" id="new-request">
          <div className="panel-title">
            <div>
              <p className="eyebrow">ENTRADA</p>
              <h2>Novo pedido de orçamento</h2>
            </div>
            <FileText />
          </div>
          <form onSubmit={create} className="request-form">
            <label>
              Título do pedido
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Estrutura metálica"
              />
            </label>
            <label>
              Cliente
              <Input
                required
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </label>
            <label>
              Origem
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <option>E-mail</option>
                <option>WhatsApp</option>
                <option>Indicação</option>
              </select>
            </label>
            <label className="full">
              Resumo recebido
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Pedido inicial, medidas ou contexto…"
              />
            </label>
            <Button disabled={busy} className="primary-button full">
              <Plus size={17} /> Criar pedido na entrada
            </Button>
          </form>
        </div>
        {selected ? (
          <Detail selected={selected} update={update} />
        ) : (
          <div className="panel empty-panel">
            <Sparkles size={28} />
            <h2>Selecione um pedido</h2>
            <p>Abra um cartão para trabalhar a próxima etapa.</p>
          </div>
        )}
      </section>
    </main>
  )
}

function AuthScreen({
  login,
  setLogin,
  signIn,
  busy,
  message,
}: {
  login: { email: string; password: string }
  setLogin: (value: { email: string; password: string }) => void
  signIn: (event: FormEvent) => void
  busy: boolean
  message: string
}) {
  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="brand-mark">OT</div>
        <p className="eyebrow">ORÇAMENTOS TÉCNICOS</p>
        <h1>
          Responda mais rápido.
          <br />
          <span>Decida melhor.</span>
        </h1>
        <p className="muted">Central para transformar pedidos técnicos em propostas aprovadas.</p>
        <form onSubmit={signIn} className="stack">
          <label>
            E-mail
            <Input
              required
              type="email"
              value={login.email}
              onChange={(e) => setLogin({ ...login, email: e.target.value })}
            />
          </label>
          <label>
            Senha
            <Input
              required
              type="password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
            />
          </label>
          {message && <p className="error">{message}</p>}
          <Button disabled={busy} className="primary-button">
            {busy ? 'Entrando…' : 'Entrar na central'} <ChevronRight />
          </Button>
        </form>
      </div>
    </main>
  )
}

function Detail({
  selected,
  update,
}: {
  selected: RequestRecord
  update: (patch: Partial<RequestRecord>) => Promise<void>
}) {
  const index = stages.findIndex((stage) => stage.id === selected.status)
  const next = stages[index + 1]
  const [notes, setNotes] = useState(selected.technical_notes || '')
  const [items, setItems] = useState(selected.items || '')
  const [discount, setDiscount] = useState(String(selected.discount_percent || 0))
  const [approval, setApproval] = useState(selected.approval_notes || '')
  const save = () =>
    update({
      technical_notes: notes,
      items,
      discount_percent: Number(discount),
      approval_notes: approval,
    })
  const suggest = () =>
    setNotes(
      selected.status === 'entrada'
        ? `Briefing sugerido para ${selected.client_name}: validar aplicação, dimensões, prazo e condições de uso.`
        : 'Sugestão: confirmar item, especificação, unidade, quantidade e observações da planta.',
    )
  return (
    <div className="panel detail-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">PEDIDO ATIVO</p>
          <h2>{selected.title}</h2>
          <p className="muted">
            {selected.client_name} · recebido em {date(selected.created)}
          </p>
        </div>
        <span className="status-pill">{stages[index].label}</span>
      </div>
      <div className="detail-body">
        <label>
          Notas e contexto técnico
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre a ligação e condição de uso."
          />
        </label>
        <label>
          Itens e quantidades
          <Textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder="Item — quantidade — observação"
          />
        </label>
        {selected.status === 'precificacao' && (
          <label>
            Desconto por volume (%)
            <Input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </label>
        )}
        {selected.status === 'aprovacao' && (
          <label>
            Decisão do sócio / motivo
            <Textarea value={approval} onChange={(e) => setApproval(e.target.value)} />
          </label>
        )}
        <div className="detail-actions">
          <Button variant="outline" onClick={save}>
            <Check size={16} /> Salvar trabalho
          </Button>
          {(selected.status === 'entrada' || selected.status === 'entendimento') && (
            <Button variant="secondary" onClick={suggest}>
              <Sparkles size={16} /> Gerar sugestão
            </Button>
          )}
          {next && (
            <Button className="primary-button" onClick={() => update({ status: next.id })}>
              Avançar para {next.label} <ChevronRight size={16} />
            </Button>
          )}
        </div>
        <div className="timeline">
          <div>
            <CalendarClock size={16} />
            <span>Follow-up previsto</span>
            <b>{selected.follow_up_at ? date(selected.follow_up_at) : 'A definir no envio'}</b>
          </div>
          <div>
            <Check size={16} />
            <span>Próxima saída</span>
            <b>{next ? next.hint : 'Proposta enviada'}</b>
          </div>
        </div>
      </div>
    </div>
  )
}
