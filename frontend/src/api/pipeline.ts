import { apiFetch } from './client'

export interface PipelineItem {
  id: string
  owner_id?: string
  data: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface PipelineCreate { data: Record<string, any>; owner_id?: string }
export interface PipelineUpdate { data?: Record<string, any> }
export interface PipelineImport { items: Array<Record<string, any>>; owner_id?: string }

export async function getPipeline(): Promise<PipelineItem[]> {
  return apiFetch<PipelineItem[]>(`/pipeline`)
}

export async function createPipelineItem(body: PipelineCreate): Promise<PipelineItem> {
  return apiFetch<PipelineItem>(`/pipeline`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updatePipelineItem(id: string, body: PipelineUpdate): Promise<PipelineItem> {
  return apiFetch<PipelineItem>(`/pipeline/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function deletePipelineItem(id: string): Promise<null> {
  return apiFetch<null>(`/pipeline/${id}`, { method: 'DELETE' })
}

export async function clearPipeline(): Promise<null> {
  return apiFetch<null>(`/pipeline/clear`, { method: 'DELETE' })
}

export async function importPipeline(body: PipelineImport): Promise<PipelineItem[]> {
  return apiFetch<PipelineItem[]>(`/pipeline/import`, { method: 'POST', body: JSON.stringify(body) })
}








