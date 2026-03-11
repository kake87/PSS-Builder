import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Type definitions
interface Project {
  id: string
  name: string
  description?: string
  device_count: number
  link_count: number
  created_at?: string
  updated_at?: string
}

interface ProjectCreateResponse {
  id: string
  name: string
  description?: string
}

interface ValidationResponse {
  errors: string[]
  warnings: string[]
  valid: boolean
}

interface EquipmentItem {
  name: string
  manufacturer?: string
  model: string
  device_type: string
  port_count?: number
  ports?: any[]
}

export interface EquipmentTypeDefinition {
  id: string
  key: string
  name: string
  required_fields: string[]
  lifecycle_status: string
  description?: string
}

export interface CatalogPortDefinition {
  name: string
  port_type: string
  speed_mbps?: number
  power_watts?: number
}

export interface EquipmentModelDefinition {
  id: string
  key: string
  type_key: string
  name: string
  manufacturer: string
  model: string
  lifecycle_status: string
  schema_version: string
  power_consumption_watts?: number
  resolution?: string
  storage_capacity_gb?: number
  bandwidth_requires_mbps?: number
  ports: CatalogPortDefinition[]
}

export interface CompatibilityRuleDefinition {
  id: string
  rule_key: string
  from_port_type: string
  to_port_type: string
  allowed_cables: string[]
  max_length_meters?: number
  lifecycle_status: string
}

export interface NormalizedCatalogResponse {
  schema_version: string
  generated_at: string
  equipment_types: EquipmentTypeDefinition[]
  equipment_models: EquipmentModelDefinition[]
  compatibility_rules: CompatibilityRuleDefinition[]
}

// Projects
export const projectsApi = {
  listProjects: (): Promise<AxiosResponse<Project[]>> => 
    api.get('/projects'),
  createProject: (data: { name: string; description: string }): Promise<AxiosResponse<ProjectCreateResponse>> =>
    api.post('/projects', data),
  getProject: (id: string): Promise<AxiosResponse<Project>> => 
    api.get(`/projects/${id}`),
  validateProject: (id: string): Promise<AxiosResponse<ValidationResponse>> => 
    api.post(`/projects/${id}/validate`),
  deleteProject: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/projects/${id}`),
}

// Devices
export const devicesApi = {
  listDevices: (projectId: string): Promise<AxiosResponse<any>> =>
    api.get(`/projects/${projectId}/devices`),
  addDevice: (projectId: string, data: any): Promise<AxiosResponse<any>> =>
    api.post(`/projects/${projectId}/devices`, data),
  addDeviceFromTemplate: (projectId: string, equipmentKey: string): Promise<AxiosResponse<any>> =>
    api.post(
      `/projects/${projectId}/devices-from-template?equipment_key=${equipmentKey}`
    ),
  getDevice: (projectId: string, deviceId: string): Promise<AxiosResponse<any>> =>
    api.get(`/projects/${projectId}/devices/${deviceId}`),
  deleteDevice: (projectId: string, deviceId: string): Promise<AxiosResponse<any>> =>
    api.delete(`/projects/${projectId}/devices/${deviceId}`),
  getEquipmentCatalog: (): Promise<AxiosResponse<Record<string, EquipmentItem>>> => 
    api.get('/equipment-catalog'),
  getEquipmentTypes: (): Promise<AxiosResponse<EquipmentTypeDefinition[]>> =>
    api.get('/equipment-catalog/types'),
  getEquipmentModels: (): Promise<AxiosResponse<EquipmentModelDefinition[]>> =>
    api.get('/equipment-catalog/models'),
  getCatalogCompatibilityRules: (): Promise<AxiosResponse<CompatibilityRuleDefinition[]>> =>
    api.get('/equipment-catalog/compatibility-rules'),
  getNormalizedEquipmentCatalog: (): Promise<AxiosResponse<NormalizedCatalogResponse>> =>
    api.get('/equipment-catalog/normalized'),
}

// Templates
export const templatesApi = {
  listTemplates: (): Promise<AxiosResponse<any>> => 
    api.get('/templates'),
  getTemplate: (id: string): Promise<AxiosResponse<any>> => 
    api.get(`/templates/${id}`),
  getTemplatesByCategory: (category: string): Promise<AxiosResponse<any>> =>
    api.get(`/templates/category/${category}`),
}

// Rules
export const rulesApi = {
  listRules: (): Promise<AxiosResponse<any>> => 
    api.get('/rules'),
  getRulesByType: (ruleType: string): Promise<AxiosResponse<any>> => 
    api.get(`/rules/${ruleType}`),
}

export default api
