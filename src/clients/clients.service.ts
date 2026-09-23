import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import type { ClientStatus, ClientView, ServiceAccess } from '../common/models.js'
import { SupabaseService } from '../services/supabase.service.js'
import type { UpdateClientDto } from './dto/update-client.dto.js'

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role: 'client'
  status: ClientStatus
  created_at: string
}

type ServiceRow = {
  id: string
  key: string
  name: string
  description: string
  default_url: string | null
}

type AccessRow = {
  client_id: string
  service_id: string
  enabled: boolean
  tool_url: string | null
}

@Injectable()
export class ClientsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listClients(): Promise<ClientView[]> {
    const { data: profiles, error: profileError } = await this.supabase.admin
      .from('profiles')
      .select('id, email, full_name, role, status, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })

    if (profileError) throw new InternalServerErrorException('Could not load clients.')
    if (!profiles?.length) return []

    const clientIds = profiles.map((profile) => profile.id as string)
    const [{ data: access, error: accessError }, { data: services, error: servicesError }] =
      await Promise.all([
        this.supabase.admin
          .from('client_service_access')
          .select('client_id, service_id, enabled, tool_url')
          .in('client_id', clientIds),
        this.supabase.admin.from('services').select('id, key, name, description, default_url'),
      ])

    if (accessError || servicesError) {
      throw new InternalServerErrorException('Could not load client service access.')
    }

    const serviceById = new Map(
      ((services ?? []) as ServiceRow[]).map((service) => [service.id, service]),
    )
    const accessByClient = new Map<string, ServiceAccess[]>()

    for (const row of (access ?? []) as AccessRow[]) {
      if (!row.enabled) continue
      const service = serviceById.get(row.service_id)
      if (!service) continue
      const current = accessByClient.get(row.client_id) ?? []
      current.push({
        key: service.key,
        name: service.name,
        description: service.description,
        url: row.tool_url ?? service.default_url,
      })
      accessByClient.set(row.client_id, current)
    }

    return (profiles as ProfileRow[]).map((profile) => ({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name ?? '',
      role: 'client',
      status: profile.status,
      createdAt: profile.created_at,
      services: accessByClient.get(profile.id) ?? [],
    }))
  }

  async updateClient(clientId: string, dto: UpdateClientDto, adminId: string) {
    const { data: client, error: clientError } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('id', clientId)
      .eq('role', 'client')
      .maybeSingle()

    if (clientError) throw new InternalServerErrorException('Could not check this client.')
    if (!client) throw new NotFoundException('Client not found.')

    const profilePatch: Record<string, string> = {}
    if (dto.fullName !== undefined) profilePatch.full_name = dto.fullName.trim()
    if (dto.status !== undefined) profilePatch.status = dto.status

    if (Object.keys(profilePatch).length) {
      const { error } = await this.supabase.admin
        .from('profiles')
        .update(profilePatch)
        .eq('id', clientId)
      if (error) throw new InternalServerErrorException('Could not update the client profile.')
    }

    if (dto.serviceKeys !== undefined) {
      await this.replaceServiceAccess(clientId, dto.serviceKeys, adminId)
    }

    const clients = await this.listClients()
    const updated = clients.find((item) => item.id === clientId)
    if (!updated) throw new NotFoundException('Updated client could not be loaded.')
    return updated
  }

  private async replaceServiceAccess(clientId: string, keys: string[], adminId: string) {
    const uniqueKeys = [...new Set(keys)]
    const { data: services, error: serviceError } = await this.supabase.admin
      .from('services')
      .select('id, key')
      .in('key', uniqueKeys.length ? uniqueKeys : ['__none__'])

    if (serviceError) throw new InternalServerErrorException('Could not validate services.')
    if ((services?.length ?? 0) !== uniqueKeys.length) {
      throw new BadRequestException('One or more service keys are invalid.')
    }

    const { error } = await this.supabase.admin.rpc('replace_client_services', {
      target_client_id: clientId,
      target_service_ids: (services ?? []).map((service) => service.id),
      actor_id: adminId,
    })

    if (error) {
      throw new InternalServerErrorException('Could not update assigned services.')
    }
  }
}
