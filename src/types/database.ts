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
      gallery_items: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          kind: Database["public"]["Enums"]["gallery_kind"];
          title: string;
          type: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url: string;
          kind: Database["public"]["Enums"]["gallery_kind"];
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          kind?: Database["public"]["Enums"]["gallery_kind"];
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          is_active: boolean;
          name: string;
          price: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          name: string;
          price: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_url?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      count_gallery_items: {
        Args: {
          p_kind: Database["public"]["Enums"]["gallery_kind"];
          p_q?: string;
        };
        Returns: number;
      };
      count_products: {
        Args: { p_active_only?: boolean; p_q?: string };
        Returns: number;
      };
      list_gallery_items: {
        Args: {
          p_kind: Database["public"]["Enums"]["gallery_kind"];
          p_limit?: number;
          p_offset?: number;
          p_q?: string;
        };
        Returns: {
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          kind: Database["public"]["Enums"]["gallery_kind"];
          title: string;
          type: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "gallery_items";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      list_products: {
        Args: {
          p_active_only?: boolean;
          p_limit?: number;
          p_offset?: number;
          p_q?: string;
        };
        Returns: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          is_active: boolean;
          name: string;
          price: number;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "products";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      rate_limit_hit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: {
          allowed: boolean;
          retry_after_seconds: number;
        }[];
      };
      rate_limit_reset: { Args: { p_key: string }; Returns: undefined };
      update_gallery_item: {
        Args: {
          p_id: string;
          p_kind: Database["public"]["Enums"]["gallery_kind"];
          p_patch: Json;
        };
        Returns: {
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          kind: Database["public"]["Enums"]["gallery_kind"];
          previous_image_url: string;
          title: string;
          type: string;
          updated_at: string;
        }[];
      };
      update_product: {
        Args: { p_id: string; p_patch: Json };
        Returns: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_url: string;
          is_active: boolean;
          name: string;
          previous_image_url: string;
          price: number;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      gallery_kind: "portfolio" | "pattern";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      gallery_kind: ["portfolio", "pattern"],
    },
  },
} as const;
