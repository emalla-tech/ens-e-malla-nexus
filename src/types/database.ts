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
      workspaces: {
        Row: { id: string; name: string; slug: string; type: 'Personal' | 'Company'; owner_id: string; currency: string; timezone: string; country: string; industry: string; enabled_modules: string[]; plan: 'Personal' | 'Business' | 'Professional'; onboarding_complete: boolean; trial_ends_at: string; created_at: string; updated_at: string };
        Insert: Partial<Database['public']['Tables']['workspaces']['Row']> & { name: string; slug: string; owner_id: string };
        Update: Partial<Database['public']['Tables']['workspaces']['Row']>;
        Relationships: [];
      };
      workspace_members: {
        Row: { id: string; workspace_id: string; user_id: string; role: 'Owner' | 'Admin' | 'Member'; status: 'Active' | 'Suspended'; joined_at: string };
        Insert: Partial<Database['public']['Tables']['workspace_members']['Row']> & { workspace_id: string; user_id: string };
        Update: Partial<Database['public']['Tables']['workspace_members']['Row']>;
        Relationships: [];
      };
      workspace_invitations: {
        Row: { id: string; workspace_id: string; email: string; role: 'Admin' | 'Member'; status: 'Pending' | 'Accepted' | 'Revoked'; invited_by: string; created_at: string; expires_at: string };
        Insert: Partial<Database['public']['Tables']['workspace_invitations']['Row']> & { workspace_id: string; email: string; invited_by: string };
        Update: Partial<Database['public']['Tables']['workspace_invitations']['Row']>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
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
          workspace_id?: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
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
          workspace_id?: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
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
          workspace_id?: string;
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
          workspace_id?: string;
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
          workspace_id?: string;
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
          workspace_id?: string;
          title: string;
          body: string;
          folder: string;
          tags: string[];
          pinned: boolean;
          linked_type: 'None' | 'Project' | 'Customer';
          linked_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notes']['Row']> & {
          user_id: string;
          workspace_id?: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['notes']['Row']>;
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
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
          workspace_id?: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['meetings']['Row']>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
          title: string;
          progress: number;
          owner: string;
          horizon: 'Weekly' | 'Monthly' | 'Quarterly';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['goals']['Row']> & {
          user_id: string;
          workspace_id?: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['goals']['Row']>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
          title: string;
          notes: string;
          category: 'Personal' | 'Business' | 'Customer' | 'Payment' | 'Call';
          priority: 'Critical' | 'High' | 'Medium' | 'Low';
          reminder_date: string;
          reminder_time: string;
          repeat_interval: 'Once' | 'Daily' | 'Weekly' | 'Monthly';
          status: 'Active' | 'Completed';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['reminders']['Row']> & {
          user_id: string;
          workspace_id?: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['reminders']['Row']>;
        Relationships: [];
      };
      finance_transactions: {
        Row: { id: string; user_id: string; workspace_id?: string; type: 'Income' | 'Expense'; description: string; category: string; amount: number; transaction_date: string; payment_method: 'Cash' | 'Bank' | 'Mobile Money' | 'Card' | 'Other'; reference: string; created_at: string; updated_at: string };
        Insert: Partial<Database['public']['Tables']['finance_transactions']['Row']> & { user_id: string; description: string; amount: number };
        Update: Partial<Database['public']['Tables']['finance_transactions']['Row']>;
        Relationships: [];
      };
      invoices: {
        Row: { id: string; user_id: string; workspace_id?: string; invoice_number: string; customer_id: string | null; customer_name: string; description: string; amount: number; issue_date: string; due_date: string; status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'; created_at: string; updated_at: string };
        Insert: Partial<Database['public']['Tables']['invoices']['Row']> & { user_id: string; invoice_number: string; customer_name: string; amount: number };
        Update: Partial<Database['public']['Tables']['invoices']['Row']>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          workspace_id?: string;
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
          workspace_id?: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Row']>;
        Relationships: [];
      };
    };
    Views: {
      workspace_member_directory: {
        Row: { id: string; workspace_id: string; user_id: string; full_name: string; email: string; role: 'Owner' | 'Admin' | 'Member'; joined_at: string };
        Relationships: [];
      };
    };
    Functions: {
      claim_workspace_invitations: { Args: Record<PropertyKey, never>; Returns: number };
      create_workspace: { Args: { workspace_name: string; workspace_type: string; workspace_country: string; workspace_currency: string; workspace_timezone: string; workspace_industry: string; workspace_modules: string[]; workspace_plan: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
