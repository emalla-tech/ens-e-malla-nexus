export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          role?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          status: 'Planning' | 'Active' | 'At Risk' | 'Completed';
          progress: number;
          total_tasks: number;
          completed_tasks: number;
          due_date: string;
          owner: string;
          client: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['projects']['Row']> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          priority: 'Critical' | 'High' | 'Medium' | 'Low';
          status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
          due_date: string;
          project_id: string | null;
          assignee: string;
          schedule: 'Morning' | 'Afternoon' | 'Evening';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tasks']['Row']> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          company: string;
          email: string;
          phone: string;
          status: 'Lead' | 'Prospect' | 'Active' | 'At Risk' | 'Dormant';
          health: 'Healthy' | 'Watch' | 'Risk';
          owner: string;
          value: number;
          last_contact: string;
          next_follow_up: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['customers']['Row']> & {
          user_id: string;
          company: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          customer: string;
          note: string;
          due_date: string;
          priority: 'Critical' | 'High' | 'Medium' | 'Low';
          status: 'Open' | 'Scheduled' | 'Completed' | 'Waiting';
          owner: string;
          channel: 'Email' | 'Call' | 'Meeting' | 'WhatsApp';
          next_step: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['follow_ups']['Row']> & {
          user_id: string;
          customer_id: string;
          customer: string;
          note: string;
        };
        Update: Partial<Database['public']['Tables']['follow_ups']['Row']>;
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notes']['Row']> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['notes']['Row']>;
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          time: string;
          attendees: string[];
          location: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['meetings']['Row']> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['meetings']['Row']>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          progress: number;
          owner: string;
          horizon: 'Weekly' | 'Monthly' | 'Quarterly';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['goals']['Row']> & {
          user_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['goals']['Row']>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          timezone: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['push_subscriptions']['Row']> & {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
