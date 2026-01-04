import api from "./axiosConfig";

export interface Condition {
  id: number;
  name: string;
}

const conditionAPI = {
  getAll: async (): Promise<Condition[]> => {
    try {
      const res = await api.get("/conditions", {
        params: { t: Date.now() },
      });
      return res.data.data || res.data || [];
    } catch (error) {
      console.error("Error fetching conditions:", error);
      return [];
    }
  },
};

export default conditionAPI;
