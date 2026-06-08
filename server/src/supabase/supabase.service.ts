// supabase/supabase.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    console.log("supabase url ", this.configService.get<string>('SUPABASE_URL')!)
        console.log("supabase url ", this.configService.get<string>('SUPABASE_KEY')!)

    this.client = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_KEY')!,
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}