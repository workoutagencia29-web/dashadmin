import { useState } from 'react'
import { Save, Smartphone, CreditCard, Landmark, Barcode } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  Field,
  Input,
  Select,
  Button,
  ToggleRow,
  DetailRow,
  Badge,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { paymentMethods, type PaymentMethodConfig } from '../../data/gatewayData'
import { formatCurrency } from '../../lib/utils'

const METHOD_ICONS: Record<string, LucideIcon> = {
  Pix: Smartphone,
  'Cartão de Crédito': CreditCard,
  'Cartão de Débito': Landmark,
  Boleto: Barcode,
}

export default function Metodos() {
  const { toast } = useToast()
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(paymentMethods)

  function update(id: string, patch: Partial<PaymentMethodConfig>) {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  return (
    <>
      <PageHeader
        title="Métodos de Pagamento"
        subtitle="Ative e configure os meios de pagamento aceitos no checkout"
        actions={
          <Button onClick={() => toast('Métodos salvos')}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {methods.map((m) => {
            const Icon = METHOD_ICONS[m.nome] ?? CreditCard
            return (
              <SectionCard key={m.id} className={m.ativo ? '' : 'opacity-80'}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card-muted text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{m.nome}</h3>
                        <Badge tone={m.ativo ? 'success' : 'neutral'}>{m.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                      <p className="mt-1 max-w-xs text-sm text-muted">{m.descricao}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-1">
                  <ToggleRow
                    label="Aceitar este método"
                    description="Disponibiliza a opção no checkout dos sellers"
                    checked={m.ativo}
                    onChange={(v) => update(m.id, { ativo: v })}
                  />
                </div>

                <div className="mt-2">
                  <DetailRow label="Prazo de liquidação" value={m.prazoLiquidacao} />
                  <DetailRow
                    label="Faixa de valor"
                    value={`${formatCurrency(m.limiteMin)} – ${formatCurrency(m.limiteMax)}`}
                  />
                  {m.parcelasMax !== undefined && (
                    <DetailRow label="Parcelamento máximo" value={`${m.parcelasMax}x`} />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Field label="Limite mínimo (R$)">
                    <Input
                      type="number"
                      value={m.limiteMin}
                      onChange={(e) => update(m.id, { limiteMin: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  <Field label="Limite máximo (R$)">
                    <Input
                      type="number"
                      value={m.limiteMax}
                      onChange={(e) => update(m.id, { limiteMax: Number(e.target.value) || 0 })}
                    />
                  </Field>
                  {m.parcelasMax !== undefined && (
                    <Field label="Parcelas máximas" className="col-span-2">
                      <Select
                        value={String(m.parcelasMax)}
                        onChange={(e) => update(m.id, { parcelasMax: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 6, 10, 12, 18, 24].map((n) => (
                          <option key={n} value={n}>
                            {n}x
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                </div>
              </SectionCard>
            )
          })}
        </div>
      </div>
    </>
  )
}
