export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          kid_id: string
          message: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          kid_id: string
          message: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          kid_id?: string
          message?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_status: {
        Row: {
          id: string
          kid_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          kid_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          kid_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_status_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          created_at: string
          external_id: string | null
          gateway_transaction_id: string | null
          id: string
          kid_id: string | null
          pix_copy_paste: string | null
          pix_qrcode: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          kid_id?: string | null
          pix_copy_paste?: string | null
          pix_qrcode?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          external_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          kid_id?: string | null
          pix_copy_paste?: string | null
          pix_qrcode?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "deposits_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          inviter_user_id: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          inviter_user_id: string
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          inviter_user_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      kid_contacts: {
        Row: {
          contact_codigo: string
          contact_nome: string
          contact_type: string
          created_at: string
          id: string
          kid_id: string
        }
        Insert: {
          contact_codigo: string
          contact_nome: string
          contact_type?: string
          created_at?: string
          id?: string
          kid_id: string
        }
        Update: {
          contact_codigo?: string
          contact_nome?: string
          contact_type?: string
          created_at?: string
          id?: string
          kid_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_contacts_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_pix_contacts: {
        Row: {
          chave_pix: string
          created_at: string
          id: string
          kid_id: string
          nome: string
          tipo_chave: string
        }
        Insert: {
          chave_pix: string
          created_at?: string
          id?: string
          kid_id: string
          nome: string
          tipo_chave?: string
        }
        Update: {
          chave_pix?: string
          created_at?: string
          id?: string
          kid_id?: string
          nome?: string
          tipo_chave?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_pix_contacts_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kid_pix_requests: {
        Row: {
          chave_pix: string
          created_at: string
          descricao: string | null
          id: string
          kid_id: string
          nome_destinatario: string
          status: string
          tipo_chave: string
          updated_at: string
          valor: number
        }
        Insert: {
          chave_pix: string
          created_at?: string
          descricao?: string | null
          id?: string
          kid_id: string
          nome_destinatario: string
          status?: string
          tipo_chave?: string
          updated_at?: string
          valor: number
        }
        Update: {
          chave_pix?: string
          created_at?: string
          descricao?: string | null
          id?: string
          kid_id?: string
          nome_destinatario?: string
          status?: string
          tipo_chave?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "kid_pix_requests_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_profiles: {
        Row: {
          apelido: string | null
          aprovacao_transferencias: boolean
          bloqueio_envio: boolean
          codigo_publico: string
          created_at: string
          id: string
          idade: number
          is_frozen: boolean
          is_mini_gerente: boolean
          limite_diario: number | null
          limite_pix: number | null
          limite_transferencia: number | null
          nome: string
          pin: string
          referral_code: string | null
          saldo: number
          saldo_comissao: number
          saldo_poupanca: number
          updated_at: string
          user_responsavel: string
        }
        Insert: {
          apelido?: string | null
          aprovacao_transferencias?: boolean
          bloqueio_envio?: boolean
          codigo_publico: string
          created_at?: string
          id?: string
          idade: number
          is_frozen?: boolean
          is_mini_gerente?: boolean
          limite_diario?: number | null
          limite_pix?: number | null
          limite_transferencia?: number | null
          nome: string
          pin: string
          referral_code?: string | null
          saldo?: number
          saldo_comissao?: number
          saldo_poupanca?: number
          updated_at?: string
          user_responsavel: string
        }
        Update: {
          apelido?: string | null
          aprovacao_transferencias?: boolean
          bloqueio_envio?: boolean
          codigo_publico?: string
          created_at?: string
          id?: string
          idade?: number
          is_frozen?: boolean
          is_mini_gerente?: boolean
          limite_diario?: number | null
          limite_pix?: number | null
          limite_transferencia?: number | null
          nome?: string
          pin?: string
          referral_code?: string | null
          saldo?: number
          saldo_comissao?: number
          saldo_poupanca?: number
          updated_at?: string
          user_responsavel?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          label: string | null
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          label?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          label?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          chave_pix: string | null
          codigo_usuario: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          is_blocked: boolean
          limite_deposito: number | null
          limite_diario: number | null
          nome: string
          saldo: number
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chave_pix?: string | null
          codigo_usuario?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          is_blocked?: boolean
          limite_deposito?: number | null
          limite_diario?: number | null
          nome: string
          saldo?: number
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chave_pix?: string | null
          codigo_usuario?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          is_blocked?: boolean
          limite_deposito?: number | null
          limite_diario?: number | null
          nome?: string
          saldo?: number
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          created_at: string
          deposit_id: string | null
          id: string
          referral_id: string
          referrer_kid_id: string
          status: string
          taxa_percentual: number
          valor_comissao: number
          valor_deposito: number
        }
        Insert: {
          created_at?: string
          deposit_id?: string | null
          id?: string
          referral_id: string
          referrer_kid_id: string
          status?: string
          taxa_percentual: number
          valor_comissao: number
          valor_deposito: number
        }
        Update: {
          created_at?: string
          deposit_id?: string | null
          id?: string
          referral_id?: string
          referrer_kid_id?: string
          status?: string
          taxa_percentual?: number
          valor_comissao?: number
          valor_deposito?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_kid_id_fkey"
            columns: ["referrer_kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_codigo: string
          referred_name: string
          referred_user_id: string
          referrer_kid_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_codigo?: string
          referred_name?: string
          referred_user_id: string
          referrer_kid_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_codigo?: string
          referred_name?: string
          referred_user_id?: string
          referrer_kid_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_kid_id_fkey"
            columns: ["referrer_kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          concluido: boolean
          created_at: string
          emoji: string
          id: string
          kid_id: string
          titulo: string
          updated_at: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          emoji?: string
          id?: string
          kid_id: string
          titulo: string
          updated_at?: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          concluido?: boolean
          created_at?: string
          emoji?: string
          id?: string
          kid_id?: string
          titulo?: string
          updated_at?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      secondary_guardians: {
        Row: {
          added_by: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          parentesco: string | null
          primary_user_id: string
          secondary_user_id: string | null
          telefone: string | null
        }
        Insert: {
          added_by?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          parentesco?: string | null
          primary_user_id: string
          secondary_user_id?: string | null
          telefone?: string | null
        }
        Update: {
          added_by?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          parentesco?: string | null
          primary_user_id?: string
          secondary_user_id?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          descricao: string | null
          from_kid: string | null
          from_user: string | null
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          tipo: Database["public"]["Enums"]["transaction_type"]
          to_kid: string | null
          to_user: string | null
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          from_kid?: string | null
          from_user?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo: Database["public"]["Enums"]["transaction_type"]
          to_kid?: string | null
          to_user?: string | null
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          from_kid?: string | null
          from_user?: string | null
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo?: Database["public"]["Enums"]["transaction_type"]
          to_kid?: string | null
          to_user?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_kid_fkey"
            columns: ["from_kid"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_kid_fkey"
            columns: ["to_kid"]
            isOneToOne: false
            referencedRelation: "kids_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_fees: {
        Row: {
          created_at: string
          fee_key: string
          fee_value: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_key: string
          fee_value: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_key?: string
          fee_value?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          chave_pix: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          chave_pix: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          chave_pix?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_guardian_invite: { Args: { _token: string }; Returns: Json }
      add_secondary_guardian: {
        Args: {
          _cpf?: string
          _email: string
          _nome: string
          _parentesco?: string
          _senha?: string
          _telefone?: string
        }
        Returns: Json
      }
        admin_adjust_balance: {
          Args: { _descricao?: string; _user_id: string; _valor: number }
          Returns: Json
        }
        admin_adjust_kid_balance: {
          Args: { _descricao?: string; _kid_id: string; _valor: number }
          Returns: Json
        }
        admin_block_user: {
          Args: { _block: boolean; _user_id: string }
          Returns: Json
        }
        admin_delete_kid: { Args: { _kid_id: string }; Returns: Json }
        admin_delete_user: { Args: { _user_id: string }; Returns: Json }
        admin_get_deposit_metrics: { Args: never; Returns: Json }
        admin_get_detailed_metrics: { Args: never; Returns: Json }
        admin_get_financial_metrics: { Args: never; Returns: Json }
        admin_get_kid_transactions: {
          Args: { _kid_id: string; _limit?: number }
          Returns: Json
        }
        admin_get_kid_referrals: { Args: { _kid_id: string }; Returns: Json }
        admin_get_metrics: { Args: never; Returns: Json }
        admin_get_mini_gerentes: { Args: never; Returns: Json }
      admin_get_recent_transactions: {
        Args: { _limit?: number }
        Returns: Json
      }
      admin_get_user_full_history: {
        Args: { _limit?: number; _user_id: string }
        Returns: Json
      }
      admin_get_user_guardians: { Args: { _user_id: string }; Returns: Json }
      admin_get_user_kids: { Args: { _user_id: string }; Returns: Json }
      admin_get_user_transactions: {
        Args: { _limit?: number; _user_id: string }
        Returns: Json
      }
      admin_search_users:
        | { Args: { _query?: string }; Returns: Json }
        | {
            Args: { _limit?: number; _offset?: number; _query?: string }
            Returns: Json
          }
      admin_toggle_admin: {
        Args: { _enable: boolean; _user_id: string }
        Returns: Json
      }
      admin_toggle_freeze: {
        Args: { _freeze: boolean; _kid_id: string }
        Returns: Json
      }
      admin_toggle_mini_gerente: {
        Args: { _enable: boolean; _kid_id: string }
        Returns: Json
      }
      admin_unlink_secondary_guardian: {
        Args: { _primary_user_id: string; _secondary_user_id: string }
        Returns: Json
      }
        admin_update_kid_limits: {
          Args: {
            _kid_id: string
            _limite_diario?: number
            _limite_pix?: number
            _limite_transferencia?: number
          }
          Returns: Json
        }
        admin_update_kid_profile: {
          Args: {
            _apelido?: string
            _idade?: number
            _kid_id: string
            _nome?: string
          }
          Returns: Json
        }
      admin_update_user_limits: {
        Args: {
          _limite_deposito?: number
          _limite_diario?: number
          _user_id: string
        }
        Returns: Json
      }
      admin_update_user_profile: {
        Args: {
          _chave_pix?: string
          _cpf?: string
          _email?: string
          _nome?: string
          _telefone?: string
          _user_id: string
        }
        Returns: Json
      }
      approve_transfer: {
        Args: { _approved: boolean; _tx_id: string }
        Returns: Json
      }
      confirm_deposit_by_external_id: {
        Args: { p_external_id: string }
        Returns: undefined
      }
      delete_kid_account: { Args: { _kid_id: string }; Returns: Json }
      delete_referral: { Args: { _user_id: string }; Returns: Json }
      generate_codigo_publico: { Args: never; Returns: string }
      generate_codigo_usuario: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_email_by_cpf: { Args: { _cpf: string }; Returns: Json }
      get_guardians_for_user: { Args: never; Returns: Json }
      get_kid_goals: {
        Args: { _kid_id: string }
        Returns: {
          concluido: boolean
          emoji: string
          id: string
          titulo: string
          valor_alvo: number
          valor_atual: number
        }[]
      }
      get_kid_referral_stats: { Args: { _kid_id: string }; Returns: Json }
      get_kid_transactions: {
        Args: { _kid_id: string }
        Returns: {
          created_at: string
          descricao: string
          direction: string
          from_codigo: string
          from_name: string
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          tipo: Database["public"]["Enums"]["transaction_type"]
          to_codigo: string
          to_name: string
          valor: number
        }[]
      }
      get_my_pending_invites: { Args: never; Returns: Json }
      get_my_secondary_guardians: { Args: never; Returns: Json }
      get_user_fee: {
        Args: { _fee_key: string; _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_guardian: { Args: { _email: string }; Returns: Json }
      is_family_member: {
        Args: { _primary_user_id: string; _user_id: string }
        Returns: boolean
      }
      is_guardian: {
        Args: { _kid_id: string; _user_id: string }
        Returns: boolean
      }
      kid_delete_contact: {
        Args: { _contact_id: string; _kid_id: string }
        Returns: Json
      }
      kid_delete_pix_contact: {
        Args: { _contact_id: string; _kid_id: string }
        Returns: Json
      }
      kid_deposit_savings: {
        Args: { _kid_id: string; _pin: string; _valor: number }
        Returns: Json
      }
      kid_deposit_savings_no_pin: {
        Args: { _kid_id: string; _valor: number }
        Returns: Json
      }
      kid_get_contacts: {
        Args: { _kid_id: string }
        Returns: {
          contact_codigo: string
          contact_nome: string
          contact_type: string
          id: string
        }[]
      }
      kid_get_pix_contacts: {
        Args: { _kid_id: string }
        Returns: {
          chave_pix: string
          id: string
          nome: string
          tipo_chave: string
        }[]
      }
      kid_login: {
        Args: { _codigo: string; _pin: string }
        Returns: {
          apelido: string
          aprovacao_transferencias: boolean
          bloqueio_envio: boolean
          codigo_publico: string
          id: string
          idade: number
          is_frozen: boolean
          is_mini_gerente: boolean
          limite_diario: number
          nome: string
          referral_code: string
          saldo: number
          saldo_comissao: number
          saldo_poupanca: number
        }[]
      }
      kid_register_referral: {
        Args: { _kid_id: string; _pin: string; _referral_code: string }
        Returns: Json
      }
      kid_request_pix_payment: {
        Args: {
          _chave_pix: string
          _descricao?: string
          _kid_id: string
          _nome_destinatario: string
          _pin: string
          _tipo_chave: string
          _valor: number
        }
        Returns: Json
      }
      kid_request_pix_payment_no_pin: {
        Args: {
          _chave_pix: string
          _descricao?: string
          _kid_id: string
          _nome_destinatario: string
          _tipo_chave: string
          _valor: number
        }
        Returns: Json
      }
      kid_save_contact: {
        Args: {
          _contact_codigo: string
          _contact_nome: string
          _contact_type?: string
          _kid_id: string
          _pin: string
        }
        Returns: Json
      }
      kid_save_contact_no_pin: {
        Args: {
          _contact_codigo: string
          _contact_nome: string
          _contact_type?: string
          _kid_id: string
        }
        Returns: Json
      }
      kid_save_pix_contact: {
        Args: {
          _chave_pix: string
          _kid_id: string
          _nome: string
          _pin: string
          _tipo_chave?: string
        }
        Returns: Json
      }
      kid_save_pix_contact_no_pin: {
        Args: {
          _chave_pix: string
          _kid_id: string
          _nome: string
          _tipo_chave?: string
        }
        Returns: Json
      }
      kid_send_message: {
        Args: { _kid_id: string; _message: string }
        Returns: Json
      }
      kid_transfer: {
        Args: {
          _descricao?: string
          _from_kid_id: string
          _to_codigo: string
          _valor: number
        }
        Returns: Json
      }
      kid_transfer_with_pin:
        | {
            Args: {
              _descricao?: string
              _from_kid_id: string
              _pin: string
              _to_codigo: string
              _valor: number
            }
            Returns: Json
          }
        | {
            Args: {
              _descricao?: string
              _from_kid_id: string
              _pin: string
              _to_codigo: string
              _valor: number
            }
            Returns: Json
          }
      kid_update_pix_contact_name: {
        Args: { _contact_id: string; _kid_id: string; _new_nome: string }
        Returns: Json
      }
      kid_withdraw_commission: {
        Args: { _kid_id: string; _pin: string; _valor: number }
        Returns: Json
      }
      kid_withdraw_commission_no_pin: {
        Args: { _kid_id: string; _valor: number }
        Returns: Json
      }
      kid_withdraw_savings: {
        Args: { _kid_id: string; _pin: string; _valor: number }
        Returns: Json
      }
      kid_withdraw_savings_no_pin: {
        Args: { _kid_id: string; _valor: number }
        Returns: Json
      }
      lookup_by_code: { Args: { _codigo: string }; Returns: Json }
      process_referral_commission: {
        Args: { _deposit_id: string; _user_id: string; _valor: number }
        Returns: undefined
      }
      register_referral: {
        Args: { _referral_code: string; _referred_user_id: string }
        Returns: Json
      }
      remove_secondary_guardian: { Args: { _link_id: string }; Returns: Json }
      request_withdrawal: { Args: { _valor: number }; Returns: Json }
      rescue_allowance: {
        Args: { _descricao?: string; _kid_id: string; _valor: number }
        Returns: Json
      }
      send_allowance_from_balance: {
        Args: { _descricao?: string; _kid_id: string; _valor: number }
        Returns: Json
      }
      toggle_mini_gerente: {
        Args: { _enable: boolean; _kid_id: string }
        Returns: Json
      }
      update_referral: {
        Args: { _new_referral_code: string; _referred_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      transaction_status: "pendente" | "aprovado" | "recusado"
      transaction_type: "mesada" | "transferencia" | "pagamento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      transaction_status: ["pendente", "aprovado", "recusado"],
      transaction_type: ["mesada", "transferencia", "pagamento"],
    },
  },
} as const
