export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      Chats: {
        Row: {
          chat_id: string;
          members: string[];
          is_direct_message: boolean;
          created_at: string;
        };
        Insert: {
          chat_id?: string;
          members?: string[];
          is_direct_message?: boolean;
          created_at?: string;
        };
        Update: {
          chat_id?: string;
          members?: string[];
          is_direct_message?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      Messages: {
        Row: {
          message_id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          time_sent: string;
          read_by: string[];
        };
        Insert: {
          message_id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          time_sent?: string;
          read_by?: string[];
        };
        Update: {
          message_id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          time_sent?: string;
          read_by?: string[];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type PublicSchema = Database['public'];

export type Tables<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Row'];

export type TablesInsert<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Update'];
