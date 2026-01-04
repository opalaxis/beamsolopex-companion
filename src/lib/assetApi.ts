import api from "./axiosConfig";

export interface Asset {
  id: number;
  item_name: string;
  model_no?: string;
  unit_id?: number;
  category_id?: number;
  manufacturer_name?: string;
  specification?: string;
  weight?: number;
  weight_unit?: string;
  dimensions?: { length: number; width: number; height: number };
  unit_cost?: number;
  currency?: string;
  account_id?: number;
  vendor_id?: number;
  asset_type?: string;
  maintenance?: string;
  tag_type?: number;
  tag_prefix?: string;
  is_serialized?: number;
  asset_tag?: string;
  remarks?: string;
  is_active?: number;
  status?: number;
  purchase_date?: string;
  warranty_expiry?: string;
  accessory_ids?: number[];
  compatibility_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

const assetAPI = {
  getAll: async (params = {}): Promise<Asset[]> => {
    try {
      const res = await api.get("/assets", {
        params: { t: Date.now(), ...params },
      });
      return res.data.data || res.data || [];
    } catch (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
  },

  create: async (data: Partial<Asset>) => 
    api.post("/assets", data).then((res) => res.data),

  getById: async (id: number) => 
    api.get(`/assets/${id}`).then((res) => res.data),

  update: async (id: number, data: Partial<Asset>, config = {}) =>
    api.post(`/assets/${id}`, data, config).then((res) => res.data),

  remove: async (id: number) => 
    api.delete(`/assets/${id}`).then((res) => res.data),
};

export default assetAPI;
