import { useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  ChevronRight,
  FileText,
  LogOut,
  Plus,
  Sparkles,
  UserRound,
  X,
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
  total_price?: number
  approval_notes?: string
  follow_up_at?: string
  status: Stage
  created: string
}

const stages: Array<{ id: Stage; label: string; hint: string }> = [
  { id: 'entrada', label: 'Entrada', hint: 'Pedido e anexos' },
  { id: 'entendimento', label: 'Entendimento', hint: 'Notas técnicas' },
  { id: 'levantamento', label: 'Levantamento', hint: 'Itens e quantidades' },
  { id: 'precificacao', label: 'Precificação', hint: 'Tabela e desconto' },
  { id: 'proposta', label: 'Proposta', hint: 'Documento comercial' },
  { id: 'aprovacao', label: 'Aprovação', hint: 'Decisão do sócio' },
  { id: 'envio', label: 'Envio', hint: 'Follow-up' },
]

const emptyForm = { title: '', client_name: '', source: 'E-mail', description: '' }

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value))
}

export default function Index() {
  const [user, setUser] = useState(pb.authStore.record)
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [selected, setSelected] = useState<RequestRecord | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => pb.authStore.onChange(() => setUser(pb.authStore.record)), [])
  useEffect(() => {
    if (user) void loadRequests()
  }, [user])

  async function loadRequests() {
    try {
      setRequests(
        await pb.collection('budget_requests').getFullList<RequestRecord>({ sort: '-created' }),
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os pedidos.')
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await pb.collection('users').authWithPassword(login.email, login.password)
    } catch {
      setMessage('Não foi possível entrar. Confira e-mail e senha.')
    } finally {
      setBusy(false)
    }
  }

  async function createRequest(event: React.FormEvent) {
    event.preventDefault()
    if (!user) return
    setBusy(true)
    setMessage('')
    try {
      const record = await pb
        .collection('budget_requests')
        .create<RequestRecord>({
          ...form,
          owner: user.id,
          status: 'entrada',
          created_at: new Date().toISOString(),
        })
      setRequests((current) => [record, ...current])
      setSelected(record)
      setForm(emptyForm)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível criar o pedido.')
    } finally {
      setBusy(false)
    }
  }

  async function updateRequest(patch: Partial<RequestRecord>) {
    if (!selected) return
    try {
      const updated = await pb
        .collection('budget_requests')
        .update<RequestRecord>(selected.id, patch)
      setSelected(updated)
      setRequests((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setMessage('Alteração salva.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar.')
    }
  }

  if (!user)
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
          <p className="muted">
            Central da equipe para transformar pedidos técnicos em propostas aprovadas.
          </p>
          <form onSubmit={signIn} className="stack">
            <label>
              E-mail
              <Input
                required
                type="email"
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
                placeholder="voce@empresa.com"
              />
            </label>
            <label>
              Senha
              <Input
                required
                type="password"
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                placeholder="••••••••"
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
          <button onClick={() => setMessage('')}>
            <X size={15} />
          </button>
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
                  <span className="card-date">{formatDate(item.created)}</span>
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
          <form onSubmit={createRequest} className="request-form">
            <label>
              Título do pedido
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Estrutura metálica para galpão"
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
                placeholder="Cole aqui o pedido inicial, medidas ou contexto…"
              />
            </label>
            <Button disabled={busy} className="primary-button full">
              <Plus size={17} /> Criar pedido na entrada
            </Button>
          </form>
        </div>
        {selected ? (
          <DetailPanel selected={selected} onUpdate={updateRequest} />
        ) : (
          <div className="panel empty-panel">
            <Sparkles size={28} />
            <h2>Selecione um pedido</h2>
            <p>Abra um cartão para trabalhar a próxima etapa do orçamento.</p>
          </div>
        )}
      </section>
    </main>
  )
}

function DetailPanel({
  selected,
  onUpdate,
}: {
  selected: RequestRecord
  onUpdate: (patch: Partial<RequestRecord>) => Promise<void>
}) {
  const currentIndex = stages.findIndex((stage) => stage.id === selected.status)
  const [notes, setNotes] = useState(selected.technical_notes || '')
  const [items, setItems] = useState(selected.items || '')
  const [discount, setDiscount] = useState(String(selected.discount_percent || 0))
  const [approval, setApproval] = useState(selected.approval_notes || '')
  const next = stages[currentIndex + 1]
  const aiAction =
    selected.status === 'entrada'
      ? 'Gerar briefing técnico'
      : selected.status === 'entendimento'
        ? 'Sugerir itens e quantidades'
        : null
  async function advance() {
    if (next) await onUpdate({ status: next.id })
  }
  return (
    <div className="panel detail-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">PEDIDO ATIVO</p>
          <h2>{selected.title}</h2>
          <p className="muted">
            {selected.client_name} · recebido em {formatDate(selected.created)}
          </p>
        </div>
        <span className="status-pill">{stages[currentIndex].label}</span>
      </div>
      <div className="detail-body">
        <label>
          Notas e contexto técnico
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre a ligação, aplicação e condição de uso."
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
            <Textarea
              value={approval}
              onChange={(e) => setApproval(e.target.value)}
              placeholder="Aprovado, ajuste solicitado ou exceção de desconto…"
            />
          </label>
        )}
        <div className="detail-actions">
          <Button
            variant="outline"
            onClick={() =>
              onUpdate({
                technical_notes: notes,
                items,
                discount_percent: Number(discount),
                approval_notes: approval,
              })
            }
          >
            <Check size={16} /> Salvar trabalho
          </Button>
          {aiAction && (
            <Button
              variant="secondary"
              onClick={() => {
                setNotes(
                  aiAction === 'Gerar briefing técnico'
                    ? `Briefing sugerido para ${selected.client_name}: validar aplicação, dimensões, prazo e condições de uso.`
                    : 'Sugestão de levantamento: confirmar item, especificação, unidade, quantidade e observações da planta.',
                )
              }}
            >
              <Sparkles size={16} /> {aiAction}
            </Button>
          )}
          {next && (
            <Button className="primary-button" onClick={advance}>
              Avançar para {next.label} <ChevronRight size={16} />
            </Button>
          )}
        </div>
        <div className="timeline">
          <div>
            <CalendarClock size={16} />
            <span>Follow-up previsto</span>
            <b>
              {selected.follow_up_at ? formatDate(selected.follow_up_at) : 'A definir no envio'}
            </b>
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
