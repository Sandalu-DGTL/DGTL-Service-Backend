import { Injectable, InternalServerErrorException } from '@nestjs/common'
import type { RequestUser, ServiceAccess } from '../common/models.js'
import { SupabaseService } from '../services/supabase.service.js'

type AccessRow = {
  tool_url: string | null
  services: { key: string; name: string; description: string; default_url: string | null } | null
}

@Injectable()
export class ProfileService {
  constructor(private readonly supabase: SupabaseService) {}

  async getViewer(user: RequestUser) {
    const services = user.status === 'suspended' ? [] : await this.getServices(user.id)
    const { accessToken: _accessToken, ...safeUser } = user
    return { ...safeUser, services }
  }

  private async getServices(clientId: string): Promise<ServiceAccess[]> {
    const { data, error } = await this.supabase.admin
      .from('client_service_access')
      .select('tool_url, services!inner(key, name, description, default_url)')
      .eq('client_id', clientId)
      .eq('enabled', true)

    if (error) throw new InternalServerErrorException('Could not load assigned services.')

    return ((data ?? []) as unknown as AccessRow[])
      .filter((row) => row.services)
      .map((row) => ({
        key: row.services!.key,
        name: row.services!.name,
        description: row.services!.description,
        url: row.tool_url ?? row.services!.default_url,
      }))
  }
}
