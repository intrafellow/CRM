import { Contact, Deal } from '../domain/types'
import { DealStage, DealStatus, Tag } from '../domain/enums'

export const mockContacts: Contact[] = [
  { id: 'c1', name: 'Иван Петров', company: 'Acme LLC', title: 'Sales Manager', email: 'ivan@acme.io', phone: '+998 90 000 00 01', tags: [Tag.VIP] },
  { id: 'c2', name: 'Анна Смирнова', company: 'Globex', title: 'CEO', email: 'anna@globex.com', phone: '+998 90 000 00 02', tags: [Tag.PARTNER, Tag.NEW] },
  { id: 'c3', name: 'John Doe', company: 'Initech', title: 'CTO', email: 'john@initech.dev', phone: '+998 90 000 00 03', tags: [] }
]

export const mockDeals: Deal[] = [
  { id: 'd1', title: 'CRM внедрение', contactId: 'c1', company: 'Acme LLC', owner: 'Мария', amount: 12000, stage: DealStage.QUALIFIED, status: DealStatus.OPEN, notes: 'Демо в пятницу', createdAt: new Date().toISOString(), interactions: [] },
  { id: 'd2', title: 'Лицензии', contactId: 'c2', company: 'Globex', owner: 'Игорь', amount: 4200, stage: DealStage.PROPOSAL, status: DealStatus.OPEN, notes: '', createdAt: new Date().toISOString(), interactions: [] },
  { id: 'd3', title: 'Поддержка', contactId: 'c3', company: 'Initech', owner: 'Мария', amount: 800, stage: DealStage.WON, status: DealStatus.CLOSED, notes: 'Закрыто', createdAt: new Date().toISOString(), interactions: [] }
]
