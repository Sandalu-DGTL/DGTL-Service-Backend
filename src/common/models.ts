export type AppRole = 'admin' | 'client'
export type ClientStatus = 'invited' | 'active' | 'suspended'

export type RequestUser = {
  id: string
  email: string
  fullName: string
  role: AppRole
  status: ClientStatus
  accessToken: string
}

export type ServiceAccess = {
  key: string
  name: string
  description: string
  url: string | null
}

export type ClientView = Omit<RequestUser, 'accessToken'> & {
  createdAt: string
  services: ServiceAccess[]
}
