import api from "./axiosConfig";

export interface Location {
  id: number;
  name: string;
}

const locationAPI = {
  getAll: async (): Promise<Location[]> => {
    try {
      const res = await api.get("/locations", {
        params: { t: Date.now() },
      });
      return res.data.data || res.data || [];
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  },
};

export default locationAPI;
