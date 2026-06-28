import { useState } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Bell,
  Building2,
  UserCog,
  Smartphone,
  LogIn,
  UserCheck,
  Banknote,
  ShieldAlert,
  TrendingDown,
  Save,
  Globe,
  Coins,
} from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  Field,
  Input,
  Select,
  Button,
  Avatar,
  ToggleRow,
  Switch,
  Modal,
  Badge,
  SegmentTabs,
  maskPhone,
  maskCNPJ,
  maskCEP,
} from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'

export default function Configuracoes() {
  const { toast } = useToast()
  const { user } = useAuth()

  // Perfil
  const [name, setName] = useState(user?.name ?? 'Pedro Costa')
  const [email, setEmail] = useState(user?.email ?? 'admin@nummo.com')
  const [phone, setPhone] = useState('(11) 98877-6655')

  // Segurança
  const [twoFa, setTwoFa] = useState(true)
  const [twoFaWithdrawals, setTwoFaWithdrawals] = useState(true)
  const [notifyNewLogins, setNotifyNewLogins] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  // Empresa
  const [legalName, setLegalName] = useState('Nummo Pagamentos S.A.')
  const [cnpj, setCnpj] = useState(maskCNPJ('51224011000182'))
  const [address, setAddress] = useState('Av. Brigadeiro Faria Lima, 3477 — Itaim Bibi, São Paulo/SP')
  const [cep, setCep] = useState(maskCEP('04538133'))

  // Notificações
  const [notifyKyc, setNotifyKyc] = useState(true)
  const [notifyHighWithdrawals, setNotifyHighWithdrawals] = useState(true)
  const [notifyChargebacks, setNotifyChargebacks] = useState(true)
  const [notifyDeclineSpikes, setNotifyDeclineSpikes] = useState(false)

  // Preferências
  const [theme, setTheme] = useState('Escuro')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [currency, setCurrency] = useState('BRL')

  function savePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      toast('Preencha todos os campos', 'error')
      return
    }
    if (newPw !== confirmPw) {
      toast('As senhas não coincidem', 'error')
      return
    }
    if (newPw.length < 8) {
      toast('A nova senha deve ter ao menos 8 caracteres', 'error')
      return
    }
    setPwModal(false)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    toast('Senha alterada com sucesso')
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Gerencie seu perfil, segurança e as preferências da plataforma"
        actions={
          <Button onClick={() => toast('Configurações salvas')}>
            <Save className="h-4 w-4" /> Salvar tudo
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Perfil do administrador */}
        <SectionCard
          title="Perfil do administrador"
          description="Dados da sua conta de acesso ao painel"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Avatar name={name} size="lg" />
              <div>
                <p className="text-base font-bold text-foreground">{name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="info">
                    <ShieldCheck className="h-3 w-3" /> {user?.role ?? 'Super Admin'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="sm:ml-auto" onClick={() => toast('Foto atualizada', 'info')}>
              <UserCog className="h-4 w-4" /> Trocar foto
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome completo">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@nummo.com"
              />
            </Field>
            <Field label="Telefone" hint="Usado para alertas críticos e recuperação de conta">
              <Input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 90000-0000" />
            </Field>
            <Field label="Cargo">
              <Input value={user?.role ?? 'Super Admin'} disabled />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => toast('Perfil salvo')}>
              <Save className="h-4 w-4" /> Salvar perfil
            </Button>
          </div>
        </SectionCard>

        {/* Segurança */}
        <SectionCard
          title="Segurança"
          description="Proteja o acesso e as operações sensíveis"
          action={
            <Button variant="outline" size="sm" onClick={() => setPwModal(true)}>
              <KeyRound className="h-4 w-4" /> Alterar senha
            </Button>
          }
        >
          <div className="divide-y divide-border">
            <ToggleRow
              label="Autenticação em duas etapas (2FA)"
              description="Exige um código do app autenticador a cada login"
              checked={twoFa}
              onChange={setTwoFa}
              icon={<Smartphone className="h-4 w-4" />}
            />
            <ToggleRow
              label="Exigir 2FA para saques"
              description="Confirmação extra antes de aprovar qualquer saque"
              checked={twoFaWithdrawals}
              onChange={setTwoFaWithdrawals}
              icon={<Lock className="h-4 w-4" />}
            />
            <ToggleRow
              label="Notificar logins novos"
              description="Envia um e-mail quando um novo dispositivo acessa o painel"
              checked={notifyNewLogins}
              onChange={setNotifyNewLogins}
              icon={<LogIn className="h-4 w-4" />}
            />
          </div>
        </SectionCard>

        {/* Dados da plataforma / empresa */}
        <SectionCard
          title="Dados da plataforma"
          description="Informações cadastrais da empresa emissora"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Razão social" className="sm:col-span-2">
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razão social" />
            </Field>
            <Field label="CNPJ">
              <Input value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="CEP">
              <Input value={cep} onChange={(e) => setCep(maskCEP(e.target.value))} placeholder="00000-000" />
            </Field>
            <Field label="Endereço" className="sm:col-span-2">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço completo" />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => toast('Dados da empresa salvos')}>
              <Building2 className="h-4 w-4" /> Salvar dados
            </Button>
          </div>
        </SectionCard>

        {/* Notificações */}
        <SectionCard
          title="Notificações"
          description="Escolha quais eventos disparam alertas para a sua equipe"
        >
          <div className="divide-y divide-border">
            <ToggleRow
              label="Novos KYC"
              description="Quando um seller envia documentos para análise"
              checked={notifyKyc}
              onChange={setNotifyKyc}
              icon={<UserCheck className="h-4 w-4" />}
            />
            <ToggleRow
              label="Saques de alto valor"
              description="Solicitações acima de R$ 50.000 aguardando aprovação"
              checked={notifyHighWithdrawals}
              onChange={setNotifyHighWithdrawals}
              icon={<Banknote className="h-4 w-4" />}
            />
            <ToggleRow
              label="Chargebacks"
              description="Novas disputas e contestações abertas"
              checked={notifyChargebacks}
              onChange={setNotifyChargebacks}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <ToggleRow
              label="Picos de recusa"
              description="Queda anormal na taxa de aprovação de um adquirente"
              checked={notifyDeclineSpikes}
              onChange={setNotifyDeclineSpikes}
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>
        </SectionCard>

        {/* Preferências */}
        <SectionCard
          title="Preferências"
          description="Aparência e formatação do painel"
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Tema</p>
                <p className="mt-0.5 text-xs text-muted">
                  Você também pode alternar rapidamente pelo botão na barra lateral
                </p>
              </div>
              <SegmentTabs tabs={['Claro', 'Escuro', 'Sistema']} active={theme} onChange={setTheme} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fuso horário">
                <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="America/Sao_Paulo">(GMT−03:00) São Paulo</option>
                  <option value="America/Manaus">(GMT−04:00) Manaus</option>
                  <option value="America/Rio_Branco">(GMT−05:00) Rio Branco</option>
                  <option value="America/Noronha">(GMT−02:00) Fernando de Noronha</option>
                </Select>
              </Field>
              <Field label="Moeda">
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="BRL">Real brasileiro (R$)</option>
                  <option value="USD">Dólar americano (US$)</option>
                  <option value="EUR">Euro (€)</option>
                </Select>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card-muted/30 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Idioma do painel</p>
                <p className="mt-0.5 text-xs text-muted">Português (Brasil) — único idioma disponível nesta versão</p>
              </div>
              <Badge tone="neutral">
                <Coins className="h-3 w-3" /> pt-BR
              </Badge>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => toast('Preferências salvas')}>
                <Save className="h-4 w-4" /> Salvar preferências
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Modal: alterar senha */}
      <Modal
        open={pwModal}
        title="Alterar senha"
        description="Use uma senha forte com ao menos 8 caracteres"
        onClose={() => setPwModal(false)}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPwModal(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={savePassword}>
              <KeyRound className="h-4 w-4" /> Salvar senha
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Senha atual">
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Nova senha">
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Confirmar nova senha">
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card-muted/30 p-3.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-muted">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Encerrar outras sessões</p>
                <p className="mt-0.5 text-xs text-muted">Desconecta todos os outros dispositivos ativos</p>
              </div>
            </div>
            <Switch checked={notifyNewLogins} onChange={setNotifyNewLogins} />
          </div>
        </div>
      </Modal>
    </>
  )
}
