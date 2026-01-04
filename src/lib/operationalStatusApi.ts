import api from "./axiosConfig";

export interface OperationalStatus {
  id: number;
  name: string;
}

const operationalStatusAPI = {
  getAll: async (): Promise<OperationalStatus[]> => {
    try {
      const res = await api.get("/operational-statuses", {
        params: { t: Date.now() },
      });
      return res.data.data || res.data || [];
    } catch (error) {
      console.error("Error fetching operational statuses:", error);
      return [];
    }
  },
};

export default operationalStatusAPI;
