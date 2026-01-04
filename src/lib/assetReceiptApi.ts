import api from "./axiosConfig";

export interface AssetReceiptLocation {
  location_id: string;
  quantity: number;
  licence_plate?: string;
  manufacture_date?: string;
  condition_id?: string;
  operational_status_id?: string;
  remarks?: string;
  serial_numbers?: string[];
  tag_numbers?: string[];
}

export interface AssetReceipt {
  id?: number;
  asset_id: number | string;
  receipt_date: string;
  received_by: string;
  remarks?: string;
  locations: AssetReceiptLocation[];
  quantity?: number;
  tag_no?: string;
  location_id?: number;
  created_at?: string;
  updated_at?: string;
}

const assetReceiptAPI = {
  getAll: async (params = {}): Promise<AssetReceipt[]> => {
    try {
      const res = await api.get("/store-asset-receipt", { 
        params: { t: Date.now(), ...params } 
      });
      return res.data.data || res.data || [];
    } catch (error) {
      console.error("Error fetching asset receipts:", error);
      return [];
    }
  },

  create: async (data: AssetReceipt) => {
    const res = await api.post("/store-asset-receipt", data);
    return res.data;
  },

  getById: async (id: number) => 
    api.get(`/store-asset-receipt/${id}`).then((res) => res.data),

  update: async (id: number, data: Partial<AssetReceipt>) => 
    api.put(`/store-asset-receipt/${id}`, data).then((res) => res.data),

  remove: async (id: number) => 
    api.delete(`/store-asset-receipt/${id}`).then((res) => res.data),
};

export default assetReceiptAPI;
