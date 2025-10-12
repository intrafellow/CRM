import { DealStage, DealStatus, Tag } from './enums'

export type Contact = {
  id: string
  name: string
  company?: string
  title?: string
  email?: string
  phone?: string
  tags: Tag[]
}

export type Deal = {
  id: string
  title: string
  contactId?: string
  company?: string
  owner?: string
  amount?: number
  stage: DealStage
  status: DealStatus
  notes?: string
  createdAt: string
  updatedAt?: string
  interactions: Array<{ id: string; at: string; note: string }>
}
